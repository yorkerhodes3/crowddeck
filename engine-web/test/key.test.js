// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Musical key detection — DJX-14.
 *
 * A key detector fails the same way a tempo detector does: it returns a
 * confident answer for material that has no key at all. So these tests check
 * both halves — that it finds the key when there is one, and that it *refuses*
 * when there is not.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MIN_TONALITY,
  PITCH_CLASSES,
  camelotCompatible,
  chromaProfile,
  detectKey,
  detectKeyFromChroma,
  goertzelPower,
  midiToHz,
  toCamelot,
  tonality
} from "../src/key.js";

const SR = 44100;

/** Sum of sine partials, so a note has the harmonics a real instrument has. */
function note(midi, samples, sampleRate = SR, amp = 0.3) {
  const out = new Float32Array(samples);
  const f0 = midiToHz(midi);
  for (let h = 1; h <= 5; h += 1) {
    const f = f0 * h;
    if (f > sampleRate / 2.2) break;
    const a = amp / h;
    for (let i = 0; i < samples; i += 1) out[i] += a * Math.sin((2 * Math.PI * f * i) / sampleRate);
  }
  return out;
}

/** A chord progression in a key, as a real record would outline it. */
function progression(midiChords, secondsPerChord = 1, sampleRate = SR) {
  const per = Math.floor(secondsPerChord * sampleRate);
  const out = new Float32Array(per * midiChords.length);
  midiChords.forEach((chord, index) => {
    for (const midi of chord) {
      const tone = note(midi, per, sampleRate);
      const base = index * per;
      for (let i = 0; i < per; i += 1) out[base + i] += tone[i] / chord.length;
    }
  });
  return out;
}

/* ---------------------------------------------------------------- Goertzel */

test("Goertzel finds the frequency it is asked for, and not its neighbours", () => {
  const n = 8192;
  const target = 440;
  const frame = new Float32Array(n);
  for (let i = 0; i < n; i += 1) frame[i] = Math.sin((2 * Math.PI * target * i) / SR);

  const onPitch = goertzelPower(frame, SR, 440);
  const semitoneUp = goertzelPower(frame, SR, midiToHz(70));
  const semitoneDown = goertzelPower(frame, SR, midiToHz(68));

  assert.ok(onPitch > semitoneUp * 50, `440 Hz did not dominate its neighbour above (${onPitch} vs ${semitoneUp})`);
  assert.ok(onPitch > semitoneDown * 50, `440 Hz did not dominate its neighbour below (${onPitch} vs ${semitoneDown})`);
});

test("A4 is 440 Hz and the octave below is 220", () => {
  assert.ok(Math.abs(midiToHz(69) - 440) < 1e-9);
  assert.ok(Math.abs(midiToHz(57) - 220) < 1e-9);
  assert.ok(Math.abs(midiToHz(60) - 261.6255653) < 1e-4, "middle C");
});

/* ------------------------------------------------------------------ chroma */

test("a single note lands in its own pitch class", () => {
  // A3 is MIDI 57, pitch class 9.
  const chroma = chromaProfile(note(57, SR * 2), SR, { frames: 8 });
  let peak = 0;
  for (let i = 1; i < 12; i += 1) if (chroma[i] > chroma[peak]) peak = i;
  assert.equal(PITCH_CLASSES[peak], "A", `peaked on ${PITCH_CLASSES[peak]} instead`);
});

test("a chord puts energy on each of its notes", () => {
  // C major triad: C (0), E (4), G (7).
  const chroma = chromaProfile(progression([[60, 64, 67]], 2), SR, { frames: 8 });
  const ranked = [...chroma.keys()].sort((a, b) => chroma[b] - chroma[a]).slice(0, 3).sort((a, b) => a - b);
  assert.deepEqual(ranked, [0, 4, 7], `top three pitch classes were ${ranked.map((i) => PITCH_CLASSES[i]).join(" ")}`);
});

/* ------------------------------------------------------------------- keys */

test("a C major progression is detected as C major", () => {
  // I–V–vi–IV, the most common progression in popular music.
  const audio = progression([
    [60, 64, 67], [67, 71, 74], [57, 60, 64], [65, 69, 72]
  ], 1.5);
  const result = detectKey(audio, SR, { frames: 40 });
  assert.equal(result.key, "C major", `got ${result.key} (${result.reason})`);
  assert.equal(result.camelot, "8B");
  assert.ok(result.confidence > 0, "should carry some confidence");
});

test("an A minor progression is detected as minor, not its relative major", () => {
  // The hardest common case: A minor and C major share all seven notes, so only
  // the *weighting* of the tonic and fifth separates them. A detector that gets
  // this wrong looks fine on a spectrum and sends a DJ to the wrong half of the
  // Camelot wheel.
  const audio = progression([
    [57, 60, 64], [64, 68, 71], [57, 60, 64], [53, 57, 60]
  ], 1.5);
  const result = detectKey(audio, SR, { frames: 40 });
  assert.equal(result.mode, "minor", `got ${result.key} (${result.reason})`);
  assert.equal(PITCH_CLASSES[result.tonic], "A", `got tonic ${result.key}`);
  assert.equal(result.camelot, "8A");
});

test("transposing the music transposes the answer", () => {
  // Guards the rotation arithmetic, which is the easiest thing to get subtly
  // wrong and the hardest to notice: every key would still return *a* key.
  const base = [[60, 64, 67], [67, 71, 74], [57, 60, 64], [65, 69, 72]];
  for (const shift of [2, 5, 7]) {
    const moved = base.map((chord) => chord.map((m) => m + shift));
    const result = detectKey(progression(moved, 1.5), SR, { frames: 40 });
    assert.equal(
      PITCH_CLASSES[result.tonic],
      PITCH_CLASSES[(0 + shift) % 12],
      `shifting by ${shift} gave ${result.key}`
    );
    assert.equal(result.mode, "major", `shifting by ${shift} changed the mode: ${result.key}`);
  }
});

/* ------------------------------------------------- refusing to guess */

test("white noise has no key, and is reported as having none", () => {
  const noise = new Float32Array(SR * 4);
  for (let i = 0; i < noise.length; i += 1) noise[i] = (Math.random() - 0.5) * 0.5;
  const result = detectKey(noise, SR, { frames: 20 });
  assert.equal(result.key, null, `claimed ${result.key} for white noise`);
  assert.match(result.reason, /no clear key/);
});

test("a drum pattern has no key, and is reported as having none", () => {
  // The case that matters commercially: a DJ tool is pointed at percussion
  // constantly, and a key badge on a drum loop is a confident wrong answer.
  const n = SR * 4;
  const drums = new Float32Array(n);
  for (let beat = 0; beat * (SR / 2) < n; beat += 1) {
    const at = Math.floor(beat * (SR / 2));
    for (let i = 0; i < 3000 && at + i < n; i += 1) {
      const env = Math.exp(-i / 400);
      drums[at + i] += env * (Math.random() - 0.5) * 0.8;
    }
  }
  const result = detectKey(drums, SR, { frames: 20 });
  assert.equal(result.key, null, `claimed ${result.key} for a drum pattern`);
});

test("silence has no key", () => {
  const result = detectKey(new Float32Array(SR), SR, { frames: 8 });
  assert.equal(result.key, null);
});

test("empty input does not throw", () => {
  assert.equal(detectKey(new Float32Array(0), SR).key, null);
  assert.equal(detectKey(null, SR).key, null);
  assert.equal(detectKey(new Float32Array(10), 0).key, null);
});

test("the tonality gate separates music from percussion", () => {
  // Pins the threshold rather than the outcome. If someone lowers MIN_TONALITY
  // to make more tracks show a key, this fails and shows the two populations it
  // was chosen to sit between.
  const tonal = chromaProfile(progression([[60, 64, 67], [65, 69, 72]], 2), SR, { frames: 20 });
  const noise = new Float32Array(SR * 2);
  for (let i = 0; i < noise.length; i += 1) noise[i] = (Math.random() - 0.5) * 0.5;
  const flat = chromaProfile(noise, SR, { frames: 20 });

  const tonalScore = tonality(tonal);
  const flatScore = tonality(flat);
  assert.ok(tonalScore > MIN_TONALITY, `tonal material scored ${tonalScore.toFixed(2)}`);
  assert.ok(flatScore < MIN_TONALITY, `noise scored ${flatScore.toFixed(2)}`);
  assert.ok(
    tonalScore > flatScore * 1.5,
    `the gap is too small to be a threshold: ${tonalScore.toFixed(2)} vs ${flatScore.toFixed(2)}`
  );
});

test("a single sustained note is not a key, despite being extremely tonal", () => {
  // The two gates do genuinely different jobs, and this proves it. One note
  // scores 11.07 on tonality — far above the threshold, since all its energy is
  // in one pitch class — and is still refused, because a single note fits a
  // dozen keys equally well and the margin between them is 0.012.
  //
  // Musically that is the right answer: a note does not establish a key, a
  // progression does. If only the tonality gate existed, a held bass note would
  // produce a confident key badge.
  const result = detectKey(note(57, SR * 3), SR, { frames: 20 });
  assert.equal(result.key, null, `claimed ${result.key} for a single note`);
  assert.ok(result.tonality > MIN_TONALITY, "it should pass the tonality gate");
  assert.match(result.reason, /ambiguous/);
});

test("an ambiguous chroma is refused rather than resolved by a coin toss", () => {
  // A perfectly flat-but-peaked chroma: two pitch classes only, which fits many
  // keys equally. The correlation will still rank them; the margin check is what
  // stops that ranking being presented as an answer.
  const chroma = new Float64Array(12);
  chroma[0] = 1;
  chroma[6] = 1;
  const result = detectKeyFromChroma(chroma);
  assert.equal(result.key, null, `claimed ${result.key} for a tritone`);
});

/* ---------------------------------------------------------------- Camelot */

test("Camelot codes match the wheel DJs actually use", () => {
  assert.equal(toCamelot(0, "major"), "8B", "C major");
  assert.equal(toCamelot(9, "minor"), "8A", "A minor is C major's relative");
  assert.equal(toCamelot(7, "major"), "9B", "G major is one step up from C");
  assert.equal(toCamelot(5, "major"), "7B", "F major is one step down from C");
});

test("every key maps to a distinct Camelot code", () => {
  const seen = new Set();
  for (let tonic = 0; tonic < 12; tonic += 1) {
    for (const mode of ["major", "minor"]) seen.add(toCamelot(tonic, mode));
  }
  assert.equal(seen.size, 24, "the wheel has 24 positions and every key needs its own");
});

test("compatibility follows the wheel: same, relative, or one step", () => {
  assert.ok(camelotCompatible("8B", "8B"), "the same key");
  assert.ok(camelotCompatible("8B", "8A"), "relative minor");
  assert.ok(camelotCompatible("8B", "9B"), "one step up");
  assert.ok(camelotCompatible("8B", "7B"), "one step down");
  assert.ok(camelotCompatible("12B", "1B"), "the wheel wraps");
  assert.ok(camelotCompatible("1A", "12A"), "and wraps the other way");

  assert.ok(!camelotCompatible("8B", "10B"), "two steps is not a match");
  assert.ok(!camelotCompatible("8B", "9A"), "a step AND a mode change is not a match");
  assert.ok(!camelotCompatible("8B", "2B"), "the far side of the wheel");
});

test("compatibility with an unknown key is false, not an exception", () => {
  // Reached constantly in practice: most decks have nothing loaded, and a track
  // whose key was refused has null. Throwing here would take the UI down.
  assert.equal(camelotCompatible(null, "8B"), false);
  assert.equal(camelotCompatible("8B", undefined), false);
  assert.equal(camelotCompatible("", ""), false);
  assert.equal(camelotCompatible("13B", "8B"), false);
  assert.equal(camelotCompatible("banana", "8B"), false);
});
