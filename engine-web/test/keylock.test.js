// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Key lock — DJX-13.
 *
 * A pitch shifter fails silently. It does not throw, it does not return an
 * error; it returns audio that is subtly the wrong pitch, or the right pitch
 * with a warble under it, and you discover which in front of people. So these
 * tests measure the output rather than inspecting the state: the fundamental
 * that actually comes out, the amplitude ripple that actually appears, and the
 * delay that actually lands.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FRAME,
  DEFAULT_SEARCH,
  MAX_RATIO,
  MIN_RATIO,
  PitchShifter,
  hann,
  keylockRatio
} from "../src/keylock.js";

const SR = 48000;

/** A steady sine, the one signal whose pitch can be measured unambiguously. */
function sine(freq, samples, sampleRate = SR, amp = 0.5) {
  const out = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) out[i] = amp * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  return out;
}

/** A sawtooth, as a stand-in for real bass: same period, but with harmonics. */
function saw(freq, samples, sampleRate = SR, amp = 0.4) {
  const out = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) {
    let v = 0;
    for (let h = 1; h <= 12; h += 1) v += Math.sin((2 * Math.PI * freq * h * i) / sampleRate) / h;
    out[i] = amp * v * 0.6;
  }
  return out;
}

/** Run a signal through in realistic 128-sample render quanta. */
function run(shifter, input, block = 128) {
  const out = new Float32Array(input.length);
  for (let i = 0; i < input.length; i += block) {
    const n = Math.min(block, input.length - i);
    shifter.process(input.subarray(i, i + n), out.subarray(i, i + n));
  }
  return out;
}

/**
 * Fundamental frequency by autocorrelation, with parabolic interpolation.
 *
 * Two details, both learned the hard way here. Sub-sample interpolation is not
 * decoration: the whole question is whether the output is 440 or 475 Hz, an 8%
 * difference, and integer-lag autocorrelation at 48k blurs exactly that.
 *
 * And the peak taken must be the *earliest* strong one, not the tallest. A pure
 * sine correlates just as well at twice its period as at its period, so taking
 * the maximum reports the octave below — the first run of this file measured a
 * 475 Hz tone as 237.6 Hz and a 60 Hz tone as 31.8 Hz. The signal was fine; the
 * ruler was wrong.
 */
function fundamental(signal, sampleRate = SR, minHz = 80, maxHz = 2000) {
  const minLag = Math.floor(sampleRate / maxHz);
  const maxLag = Math.ceil(sampleRate / minHz);
  const n = signal.length;

  let mean = 0;
  for (let i = 0; i < n; i += 1) mean += signal[i];
  mean /= n;

  const corr = (lag) => {
    let s = 0;
    for (let i = 0; i + lag < n; i += 1) s += (signal[i] - mean) * (signal[i + lag] - mean);
    return s / (n - lag);
  };

  const scores = new Float64Array(maxLag + 2);
  let best = -Infinity;
  for (let lag = minLag; lag <= maxLag && lag + 1 < n; lag += 1) {
    scores[lag] = corr(lag);
    if (scores[lag] > best) best = scores[lag];
  }

  let bestLag = minLag;
  for (let lag = minLag + 1; lag <= maxLag - 1; lag += 1) {
    const isPeak = scores[lag] >= scores[lag - 1] && scores[lag] >= scores[lag + 1];
    if (isPeak && scores[lag] >= 0.9 * best) {
      bestLag = lag;
      break;
    }
  }

  const y0 = corr(bestLag - 1);
  const y1 = corr(bestLag);
  const y2 = corr(bestLag + 1);
  const denom = y0 - 2 * y1 + y2;
  const shift = denom === 0 ? 0 : (0.5 * (y0 - y2)) / denom;
  return sampleRate / (bestLag + shift);
}

/** RMS of a slice, for looking at amplitude steadiness. */
function rms(signal, from, to) {
  let s = 0;
  for (let i = from; i < to; i += 1) s += signal[i] * signal[i];
  return Math.sqrt(s / (to - from));
}

/* ------------------------------------------------------------------ window */

test("the Hann window at 50% overlap sums to exactly one", () => {
  // If this drifts the output gains a periodic amplitude ripple — heard as
  // tremolo, and easily mistaken for a fault in the track.
  const n = 1024;
  const w = hann(n);
  const hop = n / 2;
  for (let i = 0; i < hop; i += 1) {
    assert.ok(Math.abs(w[i] + w[i + hop] - 1) < 1e-6, `overlap at ${i} summed to ${w[i] + w[i + hop]}`);
  }
});

test("a symmetric window would NOT sum to one — the periodic form is load-bearing", () => {
  // Guards the choice rather than the code: the off-by-one form is the natural
  // thing to write and is wrong here, so its wrongness is pinned.
  const n = 1024;
  const sym = new Float32Array(n);
  for (let i = 0; i < n; i += 1) sym[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  let worst = 0;
  for (let i = 0; i < n / 2; i += 1) worst = Math.max(worst, Math.abs(sym[i] + sym[i + n / 2] - 1));
  assert.ok(worst > 1e-4, "expected the symmetric window to break unity overlap");
});

/* ------------------------------------------------------------------- ratio */

test("keylockRatio inverts the playback rate", () => {
  assert.ok(Math.abs(keylockRatio(1.08) - 1 / 1.08) < 1e-12);
  assert.ok(Math.abs(keylockRatio(0.92) - 1 / 0.92) < 1e-12);
  assert.equal(keylockRatio(1), 1);
});

test("keylockRatio refuses nonsense rather than producing NaN audio", () => {
  // A NaN here propagates into the ring buffer and silences the deck
  // permanently, because NaN spreads through every subsequent overlap-add.
  assert.equal(keylockRatio(0), 1);
  assert.equal(keylockRatio(-1), 1);
  assert.equal(keylockRatio(NaN), 1);
  assert.equal(keylockRatio(Infinity), 1);
});

test("the ratio is clamped, not rejected, so a stray value cannot kill a deck", () => {
  const s = new PitchShifter();
  s.setRatio(99);
  assert.equal(s.ratio, MAX_RATIO);
  s.setRatio(0.001);
  assert.equal(s.ratio, MIN_RATIO);
  s.setRatio(NaN);
  assert.equal(s.ratio, MIN_RATIO, "NaN should leave the previous ratio untouched");
});

test("an overlap that is not half the frame is refused at construction", () => {
  assert.throws(() => new PitchShifter({ frame: 1024, hop: 300 }), /unity overlap/);
});

/* ------------------------------------------------------------------- delay */

test("at unity the shifter is a pure delay of exactly its stated latency", () => {
  const s = new PitchShifter();
  const n = 8192;
  const input = new Float32Array(n);
  for (let i = 0; i < n; i += 1) input[i] = Math.sin(i * 0.01) * 0.5;

  const out = run(s, input);
  for (let i = 0; i < n - s.latency; i += 1) {
    assert.ok(
      Math.abs(out[i + s.latency] - input[i]) < 1e-6,
      `sample ${i} differed: ${out[i + s.latency]} vs ${input[i]}`
    );
  }
});

test("engaging keylock does not move the deck in time", () => {
  // The reason latency is paid unconditionally. If bypass were free, arming
  // keylock mid-mix would shift that deck ~27ms against the other — a flam on
  // every beat, appearing exactly when a DJ is least able to diagnose it.
  const unity = new PitchShifter();
  const shifted = new PitchShifter();
  shifted.setRatio(1 / 1.08);
  assert.equal(unity.latency, shifted.latency);

  // And the arrival of a transient agrees, within the splice search the
  // algorithm is allowed to use.
  const n = 16384;
  const click = new Float32Array(n);
  for (let i = 2000; i < 2040; i += 1) click[i] = 0.9;

  const arrival = (sh) => {
    const out = run(sh, click);
    let peak = 0;
    let at = 0;
    for (let i = 0; i < n; i += 1) {
      if (Math.abs(out[i]) > peak) {
        peak = Math.abs(out[i]);
        at = i;
      }
    }
    return { at, peak };
  };

  const a = arrival(unity);
  const b = arrival(shifted);
  assert.ok(a.peak > 0.1 && b.peak > 0.1, "the transient survived in both modes");
  const slack = shifted.search + shifted.hop;
  assert.ok(
    Math.abs(a.at - b.at) <= slack,
    `transient moved ${Math.abs(a.at - b.at)} samples between modes, allowed ${slack}`
  );
});

test("output is the same length as input, block by block", () => {
  const s = new PitchShifter();
  s.setRatio(1 / 1.05);
  const input = sine(220, 4096);
  const out = new Float32Array(input.length);
  for (let i = 0; i < input.length; i += 128) {
    s.process(input.subarray(i, i + 128), out.subarray(i, i + 128));
  }
  assert.equal(out.length, input.length);
});

/* --------------------------------------------------------------- the point */

test("a track sped up by 8% comes back at its original pitch", () => {
  // The entire feature in one assertion. Playing at 1.08 lifts a 440 Hz tone to
  // 475.2; keylock has to put it back.
  const rate = 1.08;
  const played = sine(440 * rate, SR * 2);

  const s = new PitchShifter();
  s.setRatio(keylockRatio(rate));
  const out = run(s, played);

  const settled = out.subarray(SR, SR * 2);
  const heard = fundamental(settled);
  assert.ok(
    Math.abs(heard - 440) < 4,
    `expected ~440 Hz after correction, measured ${heard.toFixed(2)} Hz`
  );

  // And confirm the uncorrected case really is audibly different, so the test
  // above cannot pass by the shifter doing nothing at all.
  const raw = fundamental(played.subarray(SR, SR * 2));
  assert.ok(Math.abs(raw - 475.2) < 4, `sanity: raw tone measured ${raw.toFixed(2)} Hz`);
});

test("a track slowed by 8% comes back at its original pitch", () => {
  const rate = 0.92;
  const played = sine(440 * rate, SR * 2);

  const s = new PitchShifter();
  s.setRatio(keylockRatio(rate));
  const out = run(s, played);

  const heard = fundamental(out.subarray(SR, SR * 2));
  assert.ok(
    Math.abs(heard - 440) < 4,
    `expected ~440 Hz after correction, measured ${heard.toFixed(2)} Hz`
  );
});

test("bass survives — a 60 Hz tone holds its pitch", () => {
  // The frequency most likely to be mangled: a 60 Hz period is 800 samples,
  // comparable to the grain, so poor splice alignment shows up here first.
  const rate = 1.06;
  const played = sine(60 * rate, SR * 2);

  const s = new PitchShifter();
  s.setRatio(keylockRatio(rate));
  const out = run(s, played);

  const heard = fundamental(out.subarray(SR, SR * 2), SR, 30, 500);
  assert.ok(Math.abs(heard - 60) < 1.5, `expected ~60 Hz, measured ${heard.toFixed(2)} Hz`);
});

test("a 41 Hz bass line keeps its pitch", () => {
  // Closer to real material than a sine: a sawtooth has the harmonics an actual
  // bass has, and 41 Hz is roughly the lowest note a club system reproduces.
  const rate = 1.06;
  const played = saw(41 * rate, SR * 3);

  const s = new PitchShifter();
  s.setRatio(keylockRatio(rate));
  const out = run(s, played);

  const heard = fundamental(out.subarray(SR, SR * 3), SR, 25, 300);
  const cents = 1200 * Math.log2(heard / 41);
  assert.ok(Math.abs(cents) < 25, `bass drifted ${cents.toFixed(0)} cents (measured ${heard.toFixed(2)} Hz)`);
});

test("the search range is load-bearing — too small and the bass is left uncorrected", () => {
  // Pins the parameter, not just the behaviour. The first working version of
  // this file used ±128 and passed every test at 440 Hz while leaving 60 Hz
  // *completely* uncorrected, because the offsets that splice cleanly repeat
  // once per pitch period and a 60 Hz period is 800 samples — a search shorter
  // than one period can never reach one. If someone shrinks the default to save
  // latency, this fails and says why.
  const rate = 1.06;
  const played = sine(60 * rate, SR * 2);

  const tooSmall = new PitchShifter({ search: 128 });
  tooSmall.setRatio(keylockRatio(rate));
  const bad = fundamental(run(tooSmall, played).subarray(SR, SR * 2), SR, 30, 500);

  assert.ok(
    Math.abs(bad - 60 * rate) < 1.5,
    `expected a too-small search to leave the tone at ${(60 * rate).toFixed(2)} Hz, got ${bad.toFixed(2)}`
  );
  assert.ok(
    DEFAULT_SEARCH >= 1200,
    "the default search must span a full period at the lowest audible bass, ~40 Hz"
  );
});

test("stereo stays stereo — both channels splice at the same point", () => {
  // Left and right must be cut and rejoined at identical offsets. Choosing per
  // channel does not sound like a slightly different splice; it decorrelates the
  // two sides and makes the image wander, which is invisible to every other
  // (mono) test in this file.
  //
  // The measurable symptom is *instability*, not offset. Verified by running two
  // independent mono shifters — exactly what a per-channel decision amounts to —
  // where the inter-channel lag drifted over a range of 3 samples while the
  // shared decision held it perfectly constant. An earlier version of this test
  // compared the lag against its original value with a tolerance of 6 samples,
  // and passed on the broken implementation.
  const rate = 1.06;
  const n = SR * 3;
  const left = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    left[i] = 0.4 * (Math.sin((2 * Math.PI * 220 * rate * i) / SR) + 0.5 * Math.sin((2 * Math.PI * 660 * rate * i) / SR));
  }
  // Identical content, delayed — a normal stereo relationship rather than a
  // duplicate, so any wandering of the splice shows up as the delay moving.
  const skew = 13;
  const right = new Float32Array(n);
  for (let i = skew; i < n; i += 1) right[i] = left[i - skew];

  const s = new PitchShifter({ channels: 2 });
  s.setRatio(keylockRatio(rate));
  const outL = new Float32Array(n);
  const outR = new Float32Array(n);
  for (let i = 0; i < n; i += 128) {
    s.processChannels(
      [left.subarray(i, i + 128), right.subarray(i, i + 128)],
      [outL.subarray(i, i + 128), outR.subarray(i, i + 128)]
    );
  }

  const lagAt = (a, b, from, len) => {
    let bestLag = 0;
    let best = -Infinity;
    for (let lag = -80; lag <= 80; lag += 1) {
      let dot = 0;
      for (let i = from; i < from + len; i += 1) dot += a[i] * b[i + lag];
      if (dot > best) {
        best = dot;
        bestLag = lag;
      }
    }
    return bestLag;
  };

  const lags = [];
  for (let w = SR; w + 8192 < n - 100; w += 8192) lags.push(lagAt(outL, outR, w, 8192));
  const spread = Math.max(...lags) - Math.min(...lags);
  assert.ok(
    spread <= 1,
    `the stereo image wandered by ${spread} samples across the track: ${lags.join(", ")}`
  );

  let energyR = 0;
  for (let i = SR; i < SR * 2; i += 1) energyR += outR[i] * outR[i];
  assert.ok(energyR > 100, "right channel produced audio");
  assert.ok(fundamental(outL.subarray(SR, SR * 2)) > 0, "left produced audio");
});

test("a corrected tone does not warble", () => {
  // Pitch can be right while the sound is wrong. Overlap-add that splices at
  // the wrong phase cancels periodically, which reads as tremolo rather than as
  // a tuning error, so amplitude steadiness is checked separately from pitch.
  const rate = 1.08;
  const played = sine(440 * rate, SR * 2, SR, 0.5);

  const s = new PitchShifter();
  s.setRatio(keylockRatio(rate));
  const out = run(s, played);

  const win = 2048;
  let lo = Infinity;
  let hi = 0;
  for (let i = SR; i + win < SR * 2; i += win) {
    const r = rms(out, i, i + win);
    lo = Math.min(lo, r);
    hi = Math.max(hi, r);
  }
  assert.ok(lo > 0.2, `output collapsed to ${lo.toFixed(3)} RMS somewhere`);
  assert.ok(hi / lo < 1.25, `amplitude swung by ${(hi / lo).toFixed(2)}x — audible as warble`);
});

test("the output stays sane — no NaN, no runaway gain", () => {
  const s = new PitchShifter();
  s.setRatio(keylockRatio(1.08));
  const played = sine(1000, SR, SR, 0.9);
  const out = run(s, played);
  for (let i = 0; i < out.length; i += 1) {
    assert.ok(Number.isFinite(out[i]), `sample ${i} was ${out[i]}`);
    assert.ok(Math.abs(out[i]) < 1.5, `sample ${i} reached ${out[i]}`);
  }
});

test("silence in, silence out", () => {
  const s = new PitchShifter();
  s.setRatio(keylockRatio(1.08));
  const out = run(s, new Float32Array(8192));
  for (const v of out) assert.equal(v, 0);
});

test("the ratio can move while audio is flowing", () => {
  // The pitch fader is a continuous control; it is not set once before play.
  const s = new PitchShifter();
  const n = SR;
  const input = sine(440, n);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 128) {
    s.setRatio(keylockRatio(1 + 0.08 * Math.sin(i / 4000)));
    s.process(input.subarray(i, i + 128), out.subarray(i, i + 128));
  }
  for (let i = 0; i < n; i += 1) assert.ok(Number.isFinite(out[i]), `sample ${i} was ${out[i]}`);
});

test("reset clears the tail, so a seek does not drag the old track with it", () => {
  const s = new PitchShifter();
  s.setRatio(keylockRatio(1.08));
  run(s, sine(440, 8192, SR, 0.9));
  s.reset();
  const out = run(s, new Float32Array(4096));
  for (const v of out) assert.equal(v, 0, "audio survived a reset");
});

test("latency is a whole number of samples and covers the widest grain", () => {
  const s = new PitchShifter();
  assert.equal(s.latency, Math.trunc(s.latency));
  assert.ok(s.latency >= DEFAULT_FRAME, "latency must cover at least one grain");
  assert.ok(s.inCapacity > s.latency + DEFAULT_FRAME * MAX_RATIO, "input ring must not lap itself");
  assert.ok(s.midCapacity > DEFAULT_FRAME + s.search, "intermediate ring must hold a grain plus its search history");
  // Masked indexing requires powers of two; `%` would go negative on the
  // backward reach of the splice search and read past the end of the array.
  assert.equal(s.inCapacity & (s.inCapacity - 1), 0);
  assert.equal(s.midCapacity & (s.midCapacity - 1), 0);
});

test("it runs far faster than realtime, because it runs in an audio callback", () => {
  // A deliberately loose bound. It is not a benchmark; it is a guard against
  // the coarse-to-fine search being simplified away, which would multiply the
  // work by about thirty and turn a comfortable margin into dropouts. Measured
  // headroom when written was ~84x realtime per deck.
  const s = new PitchShifter();
  s.setRatio(keylockRatio(1.06));
  const seconds = 5;
  const input = saw(55, SR * seconds);
  const started = Date.now();
  run(s, input);
  const elapsed = (Date.now() - started) / 1000;
  assert.ok(
    elapsed < seconds,
    `took ${elapsed.toFixed(2)}s to process ${seconds}s of audio — no longer comfortably realtime`
  );
});
