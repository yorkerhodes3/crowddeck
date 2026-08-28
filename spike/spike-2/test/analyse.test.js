// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * SPIKE-2 analysis — tested today, on a machine with no audio toolchain.
 *
 * The point of testing this half now is that the statistics are where a spike
 * quietly goes wrong. A p99 computed with an off-by-one rank, or a jitter figure
 * that silently drops the outliers, produces a number that looks entirely
 * reasonable and leads to the wrong backend. Synthetic data with a known correct
 * answer catches that; real audio hardware would not, because with real data you
 * have nothing to check the answer against.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  percentile,
  summarise,
  parseProbeOutput,
  analyse,
  verdict,
  compare,
  formatResult,
  CALLBACK_BUDGET_MS,
  MIN_CALLBACKS
} from "../analyse.mjs";

/* ------------------------------------------------------------ percentiles */

test("nearest-rank percentiles match hand-computed values", () => {
  const s = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.equal(percentile(s, 50), 5, "ceil(0.5*10)=5 -> the 5th value");
  assert.equal(percentile(s, 90), 9);
  assert.equal(percentile(s, 99), 10);
  assert.equal(percentile(s, 100), 10);
  assert.equal(percentile(s, 0), 1);
});

test("a percentile always returns a value that actually occurred", () => {
  // Nearest-rank never interpolates. This is the property that makes "p99 = 12ms"
  // mean "some callback really took 12ms" rather than "a formula produced 12".
  const s = [1, 1, 1, 100];
  const p = percentile(s, 99);
  assert.ok(s.includes(p), `${p} is not one of the observed values`);
  assert.equal(p, 100, "the outlier is the 99th percentile of four samples");
});

test("percentiles of a single sample and of nothing", () => {
  assert.equal(percentile([42], 99), 42);
  assert.ok(Number.isNaN(percentile([], 50)));
});

test("summarise computes mean and stddev correctly", () => {
  const s = summarise([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.equal(s.n, 8);
  assert.equal(s.mean, 5);
  assert.equal(s.stddev, 2, "population stddev of the classic worked example");
  assert.equal(s.min, 2);
  assert.equal(s.max, 9);
});

/* ----------------------------------------------------------------- parsing */

test("probe output parses metadata and samples", () => {
  const text = `
# backend=miniaudio
# api=wasapi_exclusive
# sample_rate=48000
# buffer_frames=128
0,1000000,128,0
1,3666666,128,0
2,6333333,128,1
`;
  const { meta, samples } = parseProbeOutput(text);

  assert.equal(meta.backend, "miniaudio");
  assert.equal(meta.api, "wasapi_exclusive");
  assert.equal(meta.sample_rate, 48000, "numeric metadata is converted");
  assert.equal(samples.length, 3);
  assert.equal(samples[2].xrun, true, "a non-zero xrun flag is a real xrun");
  assert.equal(samples[0].xrun, false);
});

test("malformed lines are skipped rather than poisoning the statistics", () => {
  const { samples } = parseProbeOutput("0,1000,128,0\ngarbage\n\n1,2000,128,0\nx,y,z\n");
  assert.equal(samples.length, 2, "only the well-formed rows count");
});

/* ---------------------------------------------------------------- analysis */

/** Build probe output with a known, exact period and injected anomalies. */
function synth({
  backend = "miniaudio",
  api = "wasapi_exclusive",
  sampleRate = 48000,
  frames = 128,
  count = 2000,
  spikes = {},
  xrunAt = []
} = {}) {
  const periodNs = (frames / sampleRate) * 1e9;
  const lines = [
    `# backend=${backend}`,
    `# api=${api}`,
    `# sample_rate=${sampleRate}`,
    `# buffer_frames=${frames}`
  ];
  let t = 0;
  for (let i = 0; i < count; i++) {
    lines.push(`${i},${Math.round(t)},${frames},${xrunAt.includes(i) ? 1 : 0}`);
    t += periodNs + (spikes[i] ?? 0) * 1e6; // spikes given in ms
  }
  return lines.join("\n");
}

test("a perfectly regular stream reports near-zero jitter", () => {
  const r = analyse(parseProbeOutput(synth()));

  assert.equal(r.backend, "miniaudio");
  assert.equal(r.bufferFrames, 128);
  assert.ok(Math.abs(r.nominalPeriodMs - 2.6667) < 0.001, "128 frames at 48kHz is 2.667ms");
  assert.ok(r.jitter.p99 < 0.01, `expected near-zero jitter, got ${r.jitter.p99}`);
  assert.equal(r.xruns, 0);
  assert.equal(verdict(r).pass, true);
});

test("a single large stall is caught even though p99 passes", () => {
  // One 40ms stall in 2000 callbacks is far below the 99th percentile, so a
  // percentile-only check would call this backend fine. It is not fine: the room
  // hears that stall. This is why verdict() also checks the maximum.
  const r = analyse(parseProbeOutput(synth({ spikes: { 900: 40 } })));

  assert.ok(r.interval.p99 < CALLBACK_BUDGET_MS, "the percentile alone would have passed this");
  const v = verdict(r);
  assert.equal(v.pass, false, "but a 40ms stall must fail");
  assert.match(v.failures.join(" "), /stalled at least once/);
});

test("warm-up callbacks are discarded and the count is reported", () => {
  // The first callbacks after stream start are routinely late. If they were kept,
  // every backend would look worse than it is; if they were dropped silently, the
  // discard would be an invisible thumb on the scale.
  const spikes = {};
  for (let i = 0; i < 20; i++) spikes[i] = 5;
  const r = analyse(parseProbeOutput(synth({ spikes })));

  assert.ok(r.warmupDiscarded > 0, "warm-up must be discarded");
  assert.ok(r.jitter.max < 1, "the early spikes are excluded from steady-state figures");
  assert.equal(r.callbacks, 2000, "but the raw callback count is still reported in full");
});

test("late callbacks are counted, and judged as a rate rather than any-at-all", () => {
  // Originally this asserted that a single xrun failed the run. Real measurement
  // corrected that: the probe's "xrun" is a proxy — a gap over twice the nominal
  // period — and with two periods of buffering a late callback is not necessarily
  // an audible glitch. WASAPI shared measured 0.14% late while sounding continuous;
  // exclusive measured 17%. So the verdict judges the rate.
  const occasional = analyse(parseProbeOutput(synth({ xrunAt: [500, 1200] })));
  assert.equal(occasional.xruns, 2);
  assert.ok(occasional.xrunRatePerMinute > 0);
  assert.equal(
    verdict(occasional).pass,
    true,
    "2 late callbacks in 2000 is 0.1% — ordinary jitter, not a broken stream"
  );

  // A rate that cannot be explained as jitter must still fail.
  const constant = [];
  for (let i = 0; i < 2000; i += 3) constant.push(i);
  const persistent = analyse(parseProbeOutput(synth({ xrunAt: constant })));
  const v = verdict(persistent);
  assert.equal(v.pass, false);
  assert.match(v.failures.join(" "), /late callbacks/);
  assert.match(v.failures.join(" "), /not ordinary jitter/);
});

test("a short run is refused rather than reported as a result", () => {
  // 100 callbacks cannot support a p99. Reporting one anyway would be the most
  // dangerous possible output: a confident number with nothing behind it.
  const r = analyse(parseProbeOutput(synth({ count: 100 })));
  const v = verdict(r);

  assert.equal(v.pass, false);
  assert.match(v.failures.join(" "), new RegExp(`${MIN_CALLBACKS}`));
});

test("a genuinely bad backend fails on the interval budget", () => {
  // Every callback 12ms late, well past the 10ms budget.
  const spikes = {};
  for (let i = 0; i < 2000; i++) spikes[i] = 12;
  const r = analyse(parseProbeOutput(synth({ spikes })));

  const v = verdict(r);
  assert.equal(v.pass, false);
  assert.match(v.failures.join(" "), /over the 10 ms budget/);
});

/* -------------------------------------------------------------- comparison */

test("comparison ranks on the tail, not the mean", () => {
  // A: consistently 0.5ms late. mean 0.5, p99 0.5.
  // B: perfect except a 8ms stall every 40 callbacks — about 2.4% of samples.
  //
  // The proportions matter and are easy to get wrong: spikes have to exceed 1% of
  // samples to land at or above p99. An earlier version of this test spiked every
  // 100 callbacks (0.95%), which put the spikes *below* the 99th percentile and
  // made B look better on both measures — the fixture was wrong, not the code.
  //
  // With 2.4%: B's mean is ~0.19 (better than A) and B's p99 is 8 (much worse).
  const steadySpikes = {};
  for (let i = 0; i < 2000; i++) steadySpikes[i] = 0.5;
  const a = analyse(parseProbeOutput(synth({ backend: "A", spikes: steadySpikes })));

  const burstSpikes = {};
  for (let i = 100; i < 2000; i += 40) burstSpikes[i] = 8;
  const b = analyse(parseProbeOutput(synth({ backend: "B", spikes: burstSpikes })));

  assert.ok(
    b.jitter.mean < a.jitter.mean,
    `B should have the better average (A ${a.jitter.mean.toFixed(3)}, B ${b.jitter.mean.toFixed(3)})`
  );
  assert.ok(
    b.jitter.p99 > a.jitter.p99,
    `but the worse tail (A p99 ${a.jitter.p99.toFixed(3)}, B p99 ${b.jitter.p99.toFixed(3)})`
  );

  const { ranked } = compare([b, a]);
  assert.equal(ranked[0].result.backend, "A", "the steadier backend must rank first");
});

test("any xrun loses outright, however good the percentiles", () => {
  const clean = analyse(parseProbeOutput(synth({ backend: "clean", spikes: { 500: 1.5 } })));
  const glitchy = analyse(parseProbeOutput(synth({ backend: "glitchy", xrunAt: [700] })));

  assert.ok(glitchy.jitter.p99 <= clean.jitter.p99, "glitchy has the better timing figures");
  const { ranked } = compare([glitchy, clean]);
  assert.equal(ranked[0].result.backend, "clean", "but an xrun disqualifies it anyway");
});

test("a difference inside the noise is reported as too close to call", () => {
  // Two near-identical backends. Declaring a winner here would be picking a
  // multi-year architectural dependency on a coin flip dressed up as a number.
  const jitterA = {};
  const jitterB = {};
  for (let i = 0; i < 2000; i++) {
    jitterA[i] = (i % 7) * 0.1;
    jitterB[i] = (i % 7) * 0.1 + 0.001;
  }
  const a = analyse(parseProbeOutput(synth({ backend: "A", spikes: jitterA })));
  const b = analyse(parseProbeOutput(synth({ backend: "B", spikes: jitterB })));

  const { recommendation } = compare([a, b]);
  assert.match(recommendation, /too close to call/);
});

test("a clear winner is named", () => {
  const bad = {};
  for (let i = 0; i < 2000; i++) bad[i] = 3;
  const good = analyse(parseProbeOutput(synth({ backend: "good", api: "wasapi_exclusive" })));
  const worse = analyse(parseProbeOutput(synth({ backend: "worse", spikes: bad })));

  const { recommendation } = compare([worse, good]);
  assert.equal(recommendation, "good/wasapi_exclusive");
});

test("the null backend is reported as not measurable, not as a failure", () => {
  // The null backend is a software timer with no device behind it. Judging it
  // against an audio budget produces a confident FAIL that means nothing — and in
  // CI, where the null backend is exactly what proves the callback loop works on a
  // machine with no sound card, that red mark would be a pure red herring.
  const r = analyse(parseProbeOutput(synth({ backend: "miniaudio", api: "null" })));
  const v = verdict(r);

  assert.equal(v.pass, null, "neither pass nor fail — unjudgeable");
  assert.equal(v.notMeasurable, true);
  assert.deepEqual(v.failures, []);
  assert.match(v.detail, /no device behind it/);
  assert.match(formatResult(r), /NOT MEASURABLE/);
});

test("an unmeasurable run is excluded from ranking", () => {
  // Otherwise a meaningless number appears in the table people use to pick a
  // backend, ranked against real ones.
  const real = analyse(parseProbeOutput(synth({ backend: "miniaudio", api: "wasapi_shared" })));
  const nullRun = analyse(parseProbeOutput(synth({ backend: "miniaudio", api: "null" })));

  const { ranked, recommendation } = compare([nullRun, real]);
  assert.equal(ranked.length, 1, "only the judgeable run is ranked");
  assert.equal(ranked[0].result.api, "wasapi_shared");
  assert.equal(recommendation, "miniaudio/wasapi_shared");
});

test("when nothing was measurable, that is said rather than blamed on the machine", () => {
  const nullRun = analyse(parseProbeOutput(synth({ backend: "miniaudio", api: "null" })));
  const { ranked, recommendation } = compare([nullRun]);

  assert.equal(ranked.length, 0);
  assert.match(recommendation, /no run had a real device behind it/);
  assert.doesNotMatch(
    recommendation,
    /budget or the approach needs revisiting/,
    "an unmeasurable run is not evidence that the budget is wrong"
  );
});

test("when nothing passes, that is said plainly", () => {
  const bad = {};
  for (let i = 0; i < 2000; i++) bad[i] = 15;
  const a = analyse(parseProbeOutput(synth({ backend: "A", spikes: bad })));
  const b = analyse(parseProbeOutput(synth({ backend: "B", spikes: bad })));

  const { recommendation } = compare([a, b]);
  assert.match(recommendation, /no configuration met/);
  assert.match(recommendation, /needs revisiting/);
});

/* ----------------------------------------------------------------- output */

test("the formatted report shows the tail, not just an average", () => {
  const r = analyse(parseProbeOutput(synth()));
  const out = formatResult(r);

  assert.match(out, /p99/, "a report without a p99 hides the thing that matters");
  assert.match(out, /xruns/);
  assert.match(out, /PASS|FAIL/);
  assert.match(out, /warm-up discarded/, "the discard must be visible in the report");
});
