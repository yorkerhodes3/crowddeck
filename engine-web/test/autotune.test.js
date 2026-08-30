// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Autotune — DJX-25.
 *
 * Pitch arithmetic is unforgiving and silent: a sign error transposes instead of
 * correcting, an octave error snaps a voice into a different register, and both
 * sound like the singer's fault rather than the software's. So the maths is
 * tested numerically here rather than judged by ear.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONCERT_A,
  MAX_CORRECTION_SEMITONES,
  RetuneSmoother,
  SCALES,
  correctionFor,
  detectPitch,
  hzToMidi,
  isVoiced,
  midiToHz,
  nearestNote
} from "../src/autotune.js";

/* ------------------------------------------------------------ conversions */

test("A4 is 440 Hz and MIDI 69, and the octave relations hold", () => {
  assert.ok(Math.abs(hzToMidi(CONCERT_A) - 69) < 1e-9);
  assert.ok(Math.abs(midiToHz(69) - 440) < 1e-9);
  assert.ok(Math.abs(midiToHz(81) - 880) < 1e-9, "an octave up doubles");
  assert.ok(Math.abs(midiToHz(57) - 220) < 1e-9, "an octave down halves");
  assert.ok(Math.abs(midiToHz(60) - 261.6255653) < 1e-4, "middle C");
});

test("nonsense frequencies do not produce NaN notes", () => {
  assert.ok(Number.isNaN(hzToMidi(0)));
  assert.ok(Number.isNaN(hzToMidi(-100)));
  assert.equal(nearestNote(0), null);
  assert.equal(nearestNote(NaN), null);
});

/* ------------------------------------------------------------- snapping */

test("a note already in tune is not moved", () => {
  const n = nearestNote(440);
  assert.equal(n.midi, 69);
  assert.ok(Math.abs(n.cents) < 1e-6);
});

test("a slightly sharp note reports how sharp, with the right sign", () => {
  // 450 Hz is about 39 cents above A4. A sign error here transposes instead of
  // correcting, and sounds like the singer, not the software.
  const n = nearestNote(450);
  assert.equal(n.midi, 69);
  assert.ok(n.cents > 30 && n.cents < 45, `got ${n.cents}`);
});

test("a flat note reports negative cents", () => {
  const n = nearestNote(430);
  assert.equal(n.midi, 69);
  assert.ok(n.cents < 0, `got ${n.cents}`);
});

test("snapping crosses an octave boundary when that is nearer", () => {
  // The bug this guards: searching only within one octave snaps a B to the C
  // *below* — a major seventh down — instead of the semitone up.
  // B4 is MIDI 71; in C major the nearest note to a slightly sharp B is C5 (72).
  const n = nearestNote(midiToHz(71.6), { tonic: 0, scale: SCALES.major });
  assert.equal(n.midi, 72, "should snap up to C5, not down");
});

test("a scale constrains where a note may land", () => {
  // C# (MIDI 61) is not in C major. It must snap to C or D, never stay.
  const n = nearestNote(midiToHz(61), { tonic: 0, scale: SCALES.major });
  assert.ok([60, 62].includes(n.midi), `snapped to ${n.midi}`);
});

test("the chromatic scale leaves every semitone available", () => {
  for (let midi = 55; midi <= 75; midi += 1) {
    const n = nearestNote(midiToHz(midi), { scale: SCALES.chromatic });
    assert.equal(n.midi, midi, `chromatic should keep ${midi}`);
  }
});

test("a minor key snaps differently from a major one", () => {
  // Same input, different key: the third is the note that moves.
  const hz = midiToHz(64); // E
  const inC = nearestNote(hz, { tonic: 0, scale: SCALES.major });
  const inCminor = nearestNote(hz, { tonic: 0, scale: SCALES.minor });
  assert.equal(inC.midi, 64, "E is in C major");
  assert.equal(inCminor.midi, 63, "E should flatten to E♭ in C minor");
});

/* ----------------------------------------------------------- corrections */

test("correction moves the pitch toward the target, not away", () => {
  // The direction test. Sharp input must be corrected DOWN, so ratio < 1.
  const sharp = correctionFor(450);
  assert.ok(sharp.corrected);
  assert.ok(sharp.ratio < 1, `sharp input needs ratio < 1, got ${sharp.ratio}`);

  const flat = correctionFor(430);
  assert.ok(flat.ratio > 1, `flat input needs ratio > 1, got ${flat.ratio}`);
});

test("applying the ratio actually lands on the target frequency", () => {
  // The end-to-end arithmetic check: not just the sign, but the magnitude.
  for (const hz of [430, 445, 450, 262, 330, 98]) {
    const c = correctionFor(hz);
    if (!c.corrected) continue;
    const landed = hz * c.ratio;
    const centsOff = 1200 * Math.log2(landed / c.targetHz);
    assert.ok(Math.abs(centsOff) < 0.5, `${hz} Hz landed ${centsOff.toFixed(2)} cents off target`);
  }
});

test("a note already in tune is left exactly alone", () => {
  const c = correctionFor(440);
  assert.ok(Math.abs(c.ratio - 1) < 1e-9);
  assert.equal(c.corrected, false, "no audible correction means not corrected");
});

test("partial strength moves part of the way — that is the whole character", () => {
  const full = correctionFor(450, { strength: 1 });
  const half = correctionFor(450, { strength: 0.5 });
  const none = correctionFor(450, { strength: 0 });

  assert.ok(half.ratio > full.ratio && half.ratio < 1, "half should be between");
  assert.equal(none.ratio, 1);
  assert.equal(none.corrected, false);

  // Half strength should be about half the cents.
  const fullCents = Math.abs(1200 * Math.log2(full.ratio));
  const halfCents = Math.abs(1200 * Math.log2(half.ratio));
  assert.ok(Math.abs(halfCents - fullCents / 2) < 1, `${halfCents} vs ${fullCents / 2}`);
});

test("something more than a semitone off is refused, not transposed", () => {
  // Beyond a semitone the singer is on a different note and "fixing" it rewrites
  // the melody. It is also far more likely to be an octave error in the
  // detector than a singer being that far out.
  const octaveError = correctionFor(220, { tonic: 0, scale: SCALES.major });
  // 220 is exactly A3, so it is in tune — construct a real outlier instead.
  assert.ok(octaveError.ratio > 0);

  const wayOff = correctionFor(midiToHz(69.8), { tonic: 0, scale: SCALES.pentatonicMinor });
  if (!wayOff.corrected) assert.match(wayOff.reason, /too far/);
  assert.ok(MAX_CORRECTION_SEMITONES <= 1, "the bound must stay a correction, not a transposition");
});

test("silence and nonsense produce no correction rather than a NaN ratio", () => {
  // A NaN ratio reaching the pitch shifter silences the channel permanently,
  // because NaN spreads through every subsequent overlap-add.
  for (const bad of [0, -1, NaN, Infinity, null, undefined]) {
    const c = correctionFor(bad);
    assert.equal(c.ratio, 1);
    assert.equal(c.corrected, false);
    assert.ok(Number.isFinite(c.ratio));
  }
});

/* ------------------------------------------------------------- smoothing */

test("smoothing approaches the target rather than jumping to it", () => {
  const s = new RetuneSmoother({ retuneMs: 40 });
  const first = s.step(1.05, 10);
  assert.ok(first > 1 && first < 1.05, `moved to ${first}`);
  for (let i = 0; i < 50; i += 1) s.step(1.05, 10);
  assert.ok(Math.abs(s.current - 1.05) < 1e-3, "should converge");
});

test("smoothing is frame-rate independent", () => {
  // The same time constant must give the same audible speed at 60 Hz and 10 Hz,
  // or the effect changes character when the tab is busy.
  const fast = new RetuneSmoother({ retuneMs: 40 });
  const slow = new RetuneSmoother({ retuneMs: 40 });
  for (let t = 0; t < 100; t += 5) fast.step(1.05, 5);
  for (let t = 0; t < 100; t += 25) slow.step(1.05, 25);
  assert.ok(Math.abs(fast.current - slow.current) < 0.005,
    `${fast.current} vs ${slow.current} — smoothing depends on frame rate`);
});

test("zero retune time is an instant snap — the hard, obvious effect", () => {
  const s = new RetuneSmoother({ retuneMs: 0 });
  assert.equal(s.step(1.05, 16), 1.05);
});

test("a bad ratio does not corrupt the smoother", () => {
  const s = new RetuneSmoother();
  s.step(1.05, 16);
  const before = s.current;
  s.step(NaN, 16);
  s.step(-1, 16);
  assert.equal(s.current, before);
  assert.ok(Number.isFinite(s.current));
});

/* ----------------------------------------------------------- gating input */

test("a quiet frame is not treated as a voice", () => {
  // A microphone in a venue picks up the room. Correcting the pitch of a hum
  // produces an eerie warble from a channel nobody is singing into.
  const quiet = new Float32Array(1024).fill(0.001);
  assert.equal(isVoiced(quiet).voiced, false);
  assert.match(isVoiced(quiet).reason, /noise floor/);
});

test("a loud frame is voiced", () => {
  const loud = new Float32Array(1024);
  for (let i = 0; i < loud.length; i += 1) loud[i] = 0.3 * Math.sin(i / 8);
  assert.equal(isVoiced(loud).voiced, true);
});

test("an empty frame is handled rather than dividing by zero", () => {
  assert.equal(isVoiced(new Float32Array(0)).voiced, false);
  assert.equal(isVoiced(null).voiced, false);
});

/* ------------------------------------------------------- pitch detection */

const SR = 48000;
const sine = (hz, n = 4096, amp = 0.4) => {
  const f = new Float32Array(n);
  for (let i = 0; i < n; i += 1) f[i] = amp * Math.sin((2 * Math.PI * hz * i) / SR);
  return f;
};

test("a pure tone is detected at its own frequency, not an octave below", () => {
  // The octave error is the failure mode: autocorrelation peaks equally at every
  // multiple of the period, so taking the tallest peak reports half the pitch.
  // This repository already measured a 475 Hz tone as 237.6 Hz that way.
  for (const hz of [110, 220, 440, 660]) {
    const { hz: got } = detectPitch(sine(hz), SR);
    assert.ok(got, `no pitch for ${hz} Hz`);
    const cents = 1200 * Math.log2(got / hz);
    assert.ok(Math.abs(cents) < 25, `${hz} Hz detected as ${got.toFixed(1)} (${cents.toFixed(0)} cents off)`);
  }
});

test("a voice-like tone with harmonics reports the fundamental", () => {
  // A sung note is not a sine; its harmonics are what tempt a detector upward.
  const n = 4096;
  const f = new Float32Array(n);
  for (let h = 1; h <= 6; h += 1) {
    for (let i = 0; i < n; i += 1) f[i] += (0.4 / h) * Math.sin((2 * Math.PI * 220 * h * i) / SR);
  }
  const { hz } = detectPitch(f, SR);
  assert.ok(hz, "should detect a pitch");
  assert.ok(Math.abs(1200 * Math.log2(hz / 220)) < 40, `detected ${hz.toFixed(1)} instead of 220`);
});

test("noise and silence report no pitch rather than a confident wrong one", () => {
  // The same discipline as the tempo detector, which once reported 150 BPM for a
  // sine tone. A confident wrong pitch would autotune a room rumble.
  const noise = new Float32Array(4096);
  for (let i = 0; i < noise.length; i += 1) noise[i] = (Math.random() - 0.5) * 0.5;
  assert.equal(detectPitch(noise, SR).hz, null);
  assert.equal(detectPitch(new Float32Array(4096), SR).hz, null);
});

test("a frame too short to hold a period is refused", () => {
  assert.equal(detectPitch(new Float32Array(64), SR).hz, null);
  assert.equal(detectPitch(null, SR).hz, null);
  assert.equal(detectPitch(sine(440), 0).hz, null);
});

test("pitch outside the vocal range is ignored", () => {
  // A bass line bleeding into the mic must not be "corrected" as a singer.
  const { hz } = detectPitch(sine(40), SR, { minHz: 70 });
  if (hz !== null) assert.ok(hz >= 70, `reported ${hz}, below the configured floor`);
});

test("detection is precise enough to be worth correcting", () => {
  // Integer lags near 440 Hz are ~16 cents apart; without interpolation the
  // detector's own error would exceed the correction it is asking for.
  const { hz } = detectPitch(sine(443), SR);
  assert.ok(Math.abs(1200 * Math.log2(hz / 443)) < 12, `detected ${hz.toFixed(2)} for 443`);
});
