// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Waveform and tempo analysis — DJX-4.
 *
 * Tested against **synthesised audio with a known answer**. A tempo detector
 * verified by eye on a handful of real tracks is not verified at all: you cannot
 * tell a detector that is right from one that is right on those tracks. Here the
 * click track is generated at an exact BPM, so "did it find 128" has a real
 * answer.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectBpm,
  firstAudible,
  foldTempo,
  onsetEnvelope,
  toMono,
  waveformPeaks
} from "../src/analyse.js";

const SR = 44100;

/**
 * A click track: short percussive bursts at an exact tempo, over quiet noise so
 * the signal is not unrealistically clean.
 */
function clickTrack(bpm, seconds = 12, sampleRate = SR, { noise = 0.005 } = {}) {
  const n = Math.floor(seconds * sampleRate);
  const out = new Float32Array(n);
  // Deterministic pseudo-noise, so a failure is reproducible.
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff - 0.5;
  };
  for (let i = 0; i < n; i++) out[i] = rand() * noise * 2;

  const period = (60 / bpm) * sampleRate;
  const decay = Math.floor(sampleRate * 0.04);
  for (let beat = 0; beat * period < n; beat++) {
    const start = Math.floor(beat * period);
    for (let j = 0; j < decay && start + j < n; j++) {
      const env = 1 - j / decay;
      out[start + j] += Math.sin((2 * Math.PI * 90 * j) / sampleRate) * env * 0.8;
    }
  }
  return out;
}

/* -------------------------------------------------------------- waveform */

test("the waveform keeps peaks, because an averaged waveform hides the beat", () => {
  const samples = new Float32Array(10000);
  // One loud transient in an otherwise quiet section.
  samples[5000] = 1;
  const { max, rms } = waveformPeaks(samples, 100);

  const bucket = Math.floor((5000 / 10000) * 100);
  assert.equal(max[bucket], 1, "the transient survives at full height");
  assert.ok(rms[bucket] < 0.2, "an averaged view would have flattened it to nothing");
});

test("the waveform keeps both extremes, so asymmetry stays visible", () => {
  const samples = new Float32Array(1000);
  samples[10] = 0.9;
  samples[20] = -0.4;
  const { min, max } = waveformPeaks(samples, 10);
  assert.ok(close(max[0], 0.9));
  assert.ok(close(min[0], -0.4));
});

test("waveform bucketing covers the whole track and never divides by zero", () => {
  for (const [len, buckets] of [[0, 100], [10, 1000], [44100, 1], [999, 7]]) {
    const { min, max, rms } = waveformPeaks(new Float32Array(len), buckets);
    assert.equal(max.length, buckets);
    for (let i = 0; i < buckets; i++) {
      assert.ok(Number.isFinite(min[i]) && Number.isFinite(max[i]) && Number.isFinite(rms[i]));
    }
  }
});

/* ---------------------------------------------------------------- onsets */

test("the onset envelope responds to rises, not to sustained loudness", () => {
  const n = SR * 2;
  const steady = new Float32Array(n);
  for (let i = 0; i < n; i++) steady[i] = Math.sin((2 * Math.PI * 220 * i) / SR) * 0.5;

  const env = onsetEnvelope(steady);
  const total = env.reduce((a, b) => a + b, 0);
  // A constant tone is loud throughout and has no onsets after the first frame.
  assert.ok(total < 1, `a steady tone produced ${total.toFixed(3)} of onset strength`);
});

test("a click track produces strong, regular onsets", () => {
  const env = onsetEnvelope(clickTrack(120, 6));
  const peak = Math.max(...env);
  assert.ok(peak > 0.1, `expected clear onsets, peak was ${peak.toFixed(4)}`);
});

/* ------------------------------------------------------------------ BPM */

test("a 128 BPM click track is detected as 128", () => {
  const { bpm, confidence } = detectBpm(clickTrack(128), SR);
  assert.ok(bpm !== null, "no tempo found at all");
  assert.ok(Math.abs(bpm - 128) < 1.5, `detected ${bpm}, expected 128`);
  assert.ok(confidence > 0, "a detection with no confidence is not a detection");
});

test("tempo detection works across the range a DJ actually plays", () => {
  for (const expected of [90, 100, 110, 124, 128, 140, 174]) {
    const { bpm } = detectBpm(clickTrack(expected, 14), SR);
    assert.ok(bpm !== null, `no tempo for ${expected}`);
    // An octave error is acceptable and expected — see foldTempo. What must not
    // happen is an answer unrelated to the real tempo.
    const ratio = bpm / expected;
    const octaveOk = [0.25, 0.5, 1, 2, 4].some((k) => Math.abs(ratio - k) < 0.04);
    assert.ok(octaveOk, `${expected} BPM detected as ${bpm}, which is not an octave of it`);
  }
});

test("silence yields no tempo rather than a confident wrong one", () => {
  const { bpm, confidence } = detectBpm(new Float32Array(SR * 5), SR);
  assert.equal(bpm, null);
  assert.equal(confidence, 0);
});

test("a sustained tone has no tempo — autocorrelation alone says otherwise", () => {
  // The bug this guards. Playing a sine tone through the real engine had the deck
  // report 150 BPM with a sync button that looked ready to use. Autocorrelation
  // always has a maximum; the tiny numerical ripple in a drone's onset envelope
  // is itself periodic, so it correlates near-perfectly.
  for (const hz of [60, 220, 440, 1000]) {
    const n = SR * 6;
    const s = new Float32Array(n);
    for (let i = 0; i < n; i++) s[i] = Math.sin((2 * Math.PI * hz * i) / SR) * 0.7;
    const r = detectBpm(s, SR);
    assert.equal(r.bpm, null, `a steady ${hz} Hz tone was given a tempo of ${r.bpm}`);
  }
});

test("white noise has no tempo either", () => {
  const n = SR * 6;
  const s = new Float32Array(n);
  let seed = 7;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    s[i] = (seed / 0x7fffffff - 0.5) * 0.6;
  }
  assert.equal(detectBpm(s, SR).bpm, null);
});

test("confidence is higher for a real beat than for a drone — it was inverted", () => {
  // Measured, and the wrong way round: the raw correlation peak scored 1.00 for a
  // pure tone and 0.66 for a 128 BPM click track. Reporting that as confidence
  // would have put a reassuring number next to a meaningless answer.
  const beat = detectBpm(clickTrack(128), SR);

  const n = SR * 6;
  const drone = new Float32Array(n);
  for (let i = 0; i < n; i++) drone[i] = Math.sin((2 * Math.PI * 220 * i) / SR) * 0.7;
  const tone = detectBpm(drone, SR);

  assert.ok(beat.confidence > 0.5, `a clear beat scored only ${beat.confidence}`);
  assert.equal(tone.confidence, 0);
  assert.ok(beat.crest > tone.crest * 4, "the crest factor is what separates them");
});

test("a too-short clip yields no tempo", () => {
  assert.equal(detectBpm(new Float32Array(100), SR).bpm, null);
  assert.equal(detectBpm(new Float32Array(0), SR).bpm, null);
});

test("a bad sample rate does not produce a nonsense tempo", () => {
  assert.equal(detectBpm(clickTrack(128, 4), 0).bpm, null);
  assert.equal(detectBpm(clickTrack(128, 4), NaN).bpm, null);
});

test("alternative tempos are reported, because octave errors are the norm", () => {
  const { candidates } = detectBpm(clickTrack(128), SR);
  assert.ok(candidates.length > 1, "a UI needs alternatives to offer x2 and /2");
  for (const c of candidates) assert.ok(Number.isFinite(c.bpm) && c.bpm > 0);
});

test("folding puts a tempo in the range a human would call it", () => {
  // The contract is the *range*, not any one mapping. 87 is left alone because
  // 87 BPM is a real tempo a person would count — hip hop lives there. Folding
  // it to 174 would be the detector overriding the listener.
  for (const bpm of [40, 87, 128, 174, 320, 33.5]) {
    const folded = foldTempo(bpm);
    assert.ok(folded >= 85 && folded <= 170, `${bpm} folded to ${folded}, outside the range`);
    // Folding only ever halves or doubles, so the groove is preserved.
    const ratio = Math.log2(folded / bpm);
    assert.ok(
      Math.abs(ratio - Math.round(ratio)) < 1e-9,
      `${bpm} -> ${folded} is not a power-of-two relationship`
    );
  }
  assert.ok(close(foldTempo(320), 160));
  assert.ok(close(foldTempo(128), 128), "an already-sensible tempo is untouched");
  assert.equal(foldTempo(0), null);
  assert.equal(foldTempo(null), null);
});

/* ------------------------------------------------------------ housekeeping */

test("mono mixdown does not lose a hard-panned part", () => {
  const left = new Float32Array([0, 0, 0]);
  const right = new Float32Array([1, 1, 1]);
  const mono = toMono([left, right]);
  // Analysing the left channel alone would find silence, and a hard-panned
  // percussion line is exactly what carries the beat.
  assert.ok(mono.every((v) => v > 0));
});

test("a mono buffer passes through untouched", () => {
  const only = new Float32Array([0.5, -0.5]);
  assert.equal(toMono([only]), only);
  assert.equal(toMono([]).length, 0);
});

test("the cue point skips leading silence", () => {
  const n = SR * 3;
  const s = new Float32Array(n);
  // Two seconds of digital silence, then the track.
  for (let i = SR * 2; i < n; i++) s[i] = Math.sin((2 * Math.PI * 440 * i) / SR) * 0.8;

  const cue = firstAudible(s, SR);
  assert.ok(Math.abs(cue - 2) < 0.05, `cue landed at ${cue.toFixed(3)}s, expected ~2s`);
});

test("the cue threshold is relative, so a quiet recording is not skipped", () => {
  const n = SR;
  const quiet = new Float32Array(n);
  // A whole track at 1% of full scale is quiet, not silent.
  for (let i = 0; i < n; i++) quiet[i] = Math.sin((2 * Math.PI * 440 * i) / SR) * 0.01;
  assert.ok(firstAudible(quiet, SR) < 0.05, "a quiet track must not be treated as silence");
});

test("a fully silent file cues at zero rather than failing", () => {
  assert.equal(firstAudible(new Float32Array(1000), SR), 0);
  assert.equal(firstAudible(new Float32Array(0), SR), 0);
});

function close(a, b, eps = 1e-6) {
  return Math.abs(a - b) < eps;
}
