// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * SPIKE-2 measurement analysis — REQ-NFR-1, REQ-NFR-2, §8.1.
 *
 * ## What this is for
 *
 * `probe.c` writes one line per audio callback. This module turns that stream of
 * timestamps into the numbers that decide the backend choice, and it lives in
 * JavaScript rather than in the probe for two reasons:
 *
 * 1. **The audio callback must not do statistics.** REQ-NFR-1 forbids allocation,
 *    locks, logging and I/O on the audio thread. The probe stores a timestamp in a
 *    preallocated array and nothing else; all arithmetic happens here, afterwards,
 *    off the real-time path.
 * 2. **Statistics are easy to get quietly wrong**, and this half is testable today
 *    on a machine with no audio toolchain at all. A p99 computed the wrong way still
 *    looks like a plausible number, and nothing about the number reveals it.
 *
 * ## The measurement that matters
 *
 * Mean latency is close to useless for audio. A backend that averages 5 ms but
 * stalls for 40 ms once a second produces an audible glitch every second, and the
 * mean conceals it entirely. The decisive figures are **p99, maximum and xrun
 * count** — the tail, not the middle.
 *
 * `jitter` here means each callback interval's deviation from the nominal period
 * implied by buffer size and sample rate. A backend whose callbacks arrive at
 * varying intervals cannot hold a small buffer, whatever its average says.
 */

/** Callbacks ignored while the stream primes. */
export const WARMUP_CALLBACKS = 50;

/** §8.1: the audio callback budget. */
export const CALLBACK_BUDGET_MS = 10;

/** Below this, a p99 is not a p99 — it is one unlucky sample. */
export const MIN_CALLBACKS = 1000;

/**
 * Proportion of late callbacks tolerated before a run is called unstable.
 *
 * Set from measurement rather than taste. See the comment in `verdict()`.
 */
export const LATE_CALLBACK_TOLERANCE = 0.01;

/**
 * Nearest-rank percentile on an already-sorted array.
 *
 * Stated explicitly because several definitions are defensible and mixing them
 * across runs produces comparisons that are not comparisons. Nearest-rank never
 * interpolates, so every value it reports actually occurred — which is what you
 * want when the question is "how bad did it really get".
 *
 * @param {number[]} sorted ascending
 * @param {number} p 0..100
 */
export function percentile(sorted, p) {
  if (sorted.length === 0) return NaN;
  if (p <= 0) return sorted[0];
  if (p >= 100) return sorted[sorted.length - 1];
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(rank, sorted.length) - 1];
}

/** @param {number[]} values */
export function summarise(values) {
  if (values.length === 0) {
    return { n: 0, min: NaN, mean: NaN, p50: NaN, p95: NaN, p99: NaN, max: NaN, stddev: NaN };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const variance = sorted.reduce((a, v) => a + (v - mean) ** 2, 0) / n;

  return {
    n,
    min: sorted[0],
    mean,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    max: sorted[n - 1],
    stddev: Math.sqrt(variance)
  };
}

/**
 * Parse the probe's output.
 *
 * The format is deliberately dull — `# key=value` metadata, then one CSV line per
 * callback — so the probe's writer stays trivial and cannot become a source of
 * timing noise itself.
 *
 * `callback_index,timestamp_ns,frames,xrun_flag`
 *
 * @param {string} text
 */
export function parseProbeOutput(text) {
  const meta = {};
  const samples = [];

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("#")) {
      const m = /^#\s*([\w.]+)\s*=\s*(.+)$/.exec(trimmed);
      if (m) meta[m[1]] = /^-?\d+(\.\d+)?$/.test(m[2]) ? Number(m[2]) : m[2];
      continue;
    }

    const parts = trimmed.split(",");
    if (parts.length < 3) continue;
    const [index, ts, frames, xrun] = parts;
    if (!Number.isFinite(Number(ts))) continue;

    samples.push({
      index: Number(index),
      timestampNs: Number(ts),
      frames: Number(frames),
      xrun: xrun !== undefined && Number(xrun) !== 0
    });
  }

  return { meta, samples };
}

/**
 * Turn raw callbacks into the figures §8.1 is written in.
 *
 * @param {{meta: object, samples: Array<{index: number, timestampNs: number, frames: number, xrun: boolean}>}} parsed
 */
export function analyse(parsed) {
  const { meta, samples } = parsed;
  const sampleRate = meta.sample_rate ?? 48000;
  const bufferFrames = meta.buffer_frames ?? samples[0]?.frames ?? 128;

  const nominalMs = (bufferFrames / sampleRate) * 1000;

  const intervalsMs = [];
  const jitterMs = [];
  for (let i = 1; i < samples.length; i++) {
    const dt = (samples[i].timestampNs - samples[i - 1].timestampNs) / 1e6;
    intervalsMs.push(dt);
    jitterMs.push(Math.abs(dt - nominalMs));
  }

  const xruns = samples.filter((s) => s.xrun).length;

  // The first callbacks after stream start are routinely late while buffers prime.
  // Including them makes every backend look worse than it is in steady state, so
  // they are discarded — but the count is reported rather than silently dropped,
  // because a discard nobody can see is a thumb on the scale.
  const warmup = Math.min(WARMUP_CALLBACKS, Math.floor(intervalsMs.length / 10));
  const steadyIntervals = intervalsMs.slice(warmup);
  const steadyJitter = jitterMs.slice(warmup);

  const durationSec = samples.length
    ? (samples[samples.length - 1].timestampNs - samples[0].timestampNs) / 1e9
    : 0;

  return {
    backend: meta.backend ?? "unknown",
    api: meta.api ?? "unknown",
    sampleRate,
    bufferFrames,
    nominalPeriodMs: nominalMs,
    callbacks: samples.length,
    warmupDiscarded: warmup,
    durationSec,
    xruns,
    xrunRatePerMinute: durationSec > 0 ? xruns / (durationSec / 60) : 0,
    interval: summarise(steadyIntervals),
    jitter: summarise(steadyJitter)
  };
}

/**
 * Does this run meet the §8.1 audio-callback budget?
 *
 * The budget reads "< 10 ms deterministic", and *deterministic* is the operative
 * word: a backend that meets 10 ms on average but not at p99 has not met it,
 * because the misses are what the room hears.
 *
 * @param {ReturnType<typeof analyse>} result
 */
export function verdict(result) {
  const failures = [];

  if (result.callbacks < MIN_CALLBACKS) {
    failures.push(
      `only ${result.callbacks} callbacks captured; ${MIN_CALLBACKS}+ are needed before a p99 means anything`
    );
  }
  // `xruns` here is a proxy, not a true underrun count: miniaudio does not expose
  // underruns portably, so the probe flags any gap over twice the nominal period.
  // A late callback is not automatically an audible glitch — with two periods of
  // buffering there is roughly one period of slack — so this is judged as a rate
  // rather than "any at all". Measurement drove the threshold: on commodity laptop
  // hardware WASAPI shared produced 0.14% late callbacks while exclusive produced
  // 17%, so 1% separates them without being a coin toss.
  const lateRate = result.callbacks > 0 ? result.xruns / result.callbacks : 0;
  if (lateRate > LATE_CALLBACK_TOLERANCE) {
    failures.push(
      `${result.xruns} late callbacks (${(lateRate * 100).toFixed(2)}% of ${result.callbacks}) — ` +
        `over the ${(LATE_CALLBACK_TOLERANCE * 100).toFixed(1)}% tolerance, so this is not ordinary jitter`
    );
  }
  if (result.interval.p99 > CALLBACK_BUDGET_MS) {
    failures.push(
      `callback interval p99 is ${result.interval.p99.toFixed(2)} ms, over the ${CALLBACK_BUDGET_MS} ms budget`
    );
  }
  // A worst case several periods late means the stream stalled, even if the
  // percentile passes — percentiles can hide a single bad second in a long run.
  if (Number.isFinite(result.jitter.max) && result.jitter.max > result.nominalPeriodMs * 2) {
    failures.push(
      `worst-case jitter ${result.jitter.max.toFixed(2)} ms exceeds two nominal periods ` +
        `(${(result.nominalPeriodMs * 2).toFixed(2)} ms) — the stream stalled at least once`
    );
  }

  return { pass: failures.length === 0, failures };
}

/**
 * Rank runs and pick a backend.
 *
 * Ranks on the tail, never the mean, and refuses to declare a winner when the
 * difference sits inside run-to-run noise. An honest "too close to call" is more
 * useful than a decisive-looking number that will not reproduce — and picking a
 * backend is a decision we would live with for years.
 *
 * @param {Array<ReturnType<typeof analyse>>} results
 */
export function compare(results) {
  const scored = results
    .map((r) => ({ result: r, verdict: verdict(r) }))
    .sort((a, b) => {
      // Anything with xruns loses outright, whatever its percentiles say.
      if (a.result.xruns !== b.result.xruns) return a.result.xruns - b.result.xruns;
      return a.result.jitter.p99 - b.result.jitter.p99;
    });

  const passing = scored.filter((s) => s.verdict.pass);
  const best = scored[0];
  const runnerUp = scored[1];

  let recommendation;
  if (!best) {
    recommendation = "none — no runs supplied";
  } else if (passing.length === 0) {
    recommendation =
      "none — no configuration met the §8.1 budget; the budget or the approach needs revisiting";
  } else if (!runnerUp) {
    recommendation = `${best.result.backend}/${best.result.api}`;
  } else {
    const margin = runnerUp.result.jitter.p99 - best.result.jitter.p99;
    const noise = Math.max(best.result.jitter.stddev, runnerUp.result.jitter.stddev);
    recommendation =
      margin < noise
        ? `too close to call — ${best.result.backend} and ${runnerUp.result.backend} differ by ` +
          `${margin.toFixed(3)} ms, inside run-to-run noise (${noise.toFixed(3)} ms). Decide on other grounds.`
        : `${best.result.backend}/${best.result.api}`;
  }

  return { ranked: scored, recommendation };
}

/** @param {ReturnType<typeof analyse>} r */
export function formatResult(r) {
  const v = verdict(r);
  const ms = (x) => (Number.isFinite(x) ? x.toFixed(3) : "—");
  return [
    `${r.backend}/${r.api}  ${r.bufferFrames} frames @ ${r.sampleRate} Hz  (nominal ${ms(r.nominalPeriodMs)} ms)`,
    `  callbacks   ${r.callbacks} over ${r.durationSec.toFixed(1)}s (${r.warmupDiscarded} warm-up discarded)`,
    `  interval    p50 ${ms(r.interval.p50)}  p95 ${ms(r.interval.p95)}  p99 ${ms(r.interval.p99)}  max ${ms(r.interval.max)}`,
    `  jitter      p50 ${ms(r.jitter.p50)}  p95 ${ms(r.jitter.p95)}  p99 ${ms(r.jitter.p99)}  max ${ms(r.jitter.max)}`,
    `  xruns       ${r.xruns}`,
    `  verdict     ${v.pass ? "PASS" : "FAIL"}${v.failures.length ? "\n              - " + v.failures.join("\n              - ") : ""}`
  ].join("\n");
}
