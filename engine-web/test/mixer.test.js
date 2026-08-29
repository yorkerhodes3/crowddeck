// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Mixer mathematics — DJX-1.
 *
 * These are the decisions a DJ hears. None of them throw when wrong; they just
 * sound bad, so they are checked numerically here rather than by ear later.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CrossfaderCurve,
  DEFAULT_RATE_RANGE,
  EQ_MAX_BOOST_DB,
  crossfaderGains,
  dbToGain,
  deckMix,
  effectiveBpm,
  eqKnobToDb,
  gainToDb,
  rateToPlaybackRate,
  syncRate
} from "../src/mixer.js";

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

/* ------------------------------------------------------------- crossfader */

test("the crossfader reaches both extremes fully", () => {
  const left = crossfaderGains(-1);
  assert.ok(close(left.a, 1), "hard left is deck A at full");
  assert.ok(close(left.b, 0), "and deck B silent");

  const right = crossfaderGains(1);
  assert.ok(close(right.a, 0));
  assert.ok(close(right.b, 1));
});

test("the constant-power curve does not dip in the middle — the audible one", () => {
  // Uncorrelated signals sum by power. If a² + b² stays at 1 the perceived
  // loudness is constant; a linear fade gives 0.5 each, so 0.5 total power —
  // a 3 dB sag exactly when both tracks are playing.
  for (let x = -1; x <= 1; x += 0.05) {
    const { a, b } = crossfaderGains(x);
    assert.ok(
      close(a * a + b * b, 1, 1e-9),
      `power at ${x.toFixed(2)} was ${(a * a + b * b).toFixed(4)}, not 1`
    );
  }
});

test("the centre of a constant-power fade is −3 dB on each side, not −6", () => {
  const { a, b } = crossfaderGains(0);
  assert.ok(close(a, Math.SQRT1_2, 1e-12));
  assert.ok(close(b, Math.SQRT1_2, 1e-12));
  assert.ok(close(gainToDb(a), -3.0103, 1e-4));
});

test("the linear curve is offered for phase-coherent material, and does dip", () => {
  const { a, b } = crossfaderGains(0, CrossfaderCurve.LINEAR);
  assert.ok(close(a, 0.5));
  assert.ok(close(b, 0.5));
  // Amplitudes sum to 1, which is right when both decks carry the same signal
  // and wrong when they do not. Both cases exist, so both curves exist.
  assert.ok(close(a + b, 1));
});

test("the sharp curve keeps both sides open for cutting", () => {
  const mid = crossfaderGains(0, CrossfaderCurve.SHARP);
  assert.ok(close(mid.a, 1), "a cut curve is fully open in the centre");
  assert.ok(close(mid.b, 1));
  // And still closes completely at the ends, or it would not be a cut at all.
  assert.ok(close(crossfaderGains(1, CrossfaderCurve.SHARP).a, 0));
  assert.ok(close(crossfaderGains(-1, CrossfaderCurve.SHARP).b, 0));
});

test("crossfader positions outside the range are clamped, not wrapped", () => {
  assert.deepEqual(crossfaderGains(-99), crossfaderGains(-1));
  assert.deepEqual(crossfaderGains(99), crossfaderGains(1));
  // NaN from a dragged finger must not silently become full volume.
  const nan = crossfaderGains(NaN);
  assert.ok(Number.isFinite(nan.a) && Number.isFinite(nan.b));
});

/* --------------------------------------------------------------------- EQ */

test("an EQ knob at zero is a true kill, not a deep cut", () => {
  // The whole point. Killing the bass to bring in the next kick is the most-used
  // move in mixing; a -26 dB 'kill' leaves a rumble and the two kicks fight.
  assert.equal(eqKnobToDb(0), -Infinity);
  assert.equal(dbToGain(eqKnobToDb(0)), 0);
});

test("unity is unity — a knob at 1 changes nothing", () => {
  assert.equal(eqKnobToDb(1), 0);
  assert.ok(close(dbToGain(eqKnobToDb(1)), 1));
});

test("half a turn down is −6 dB, which is what a hand expects", () => {
  assert.ok(close(eqKnobToDb(0.5), -6.0206, 1e-4));
});

test("boost is bounded, because an unbounded boost is a clipped mix", () => {
  assert.ok(close(eqKnobToDb(4), EQ_MAX_BOOST_DB));
  assert.ok(close(eqKnobToDb(99), EQ_MAX_BOOST_DB), "past the end still stops at the ceiling");
});

test("the EQ curve is monotonic across its whole travel", () => {
  let prev = -Infinity;
  for (let k = 0.001; k <= 4; k += 0.01) {
    const db = eqKnobToDb(k);
    assert.ok(db >= prev, `EQ went backwards at knob ${k.toFixed(3)}`);
    prev = db;
  }
});

/* ------------------------------------------------------------------ pitch */

test("the pitch fader spans ±8% by default", () => {
  assert.ok(close(rateToPlaybackRate(0), 1));
  assert.ok(close(rateToPlaybackRate(1), 1.08));
  assert.ok(close(rateToPlaybackRate(-1), 0.92));
});

test("the pitch fader can be inverted, because hardware ships both ways", () => {
  assert.ok(close(rateToPlaybackRate(1, DEFAULT_RATE_RANGE, -1), 0.92));
  assert.ok(close(rateToPlaybackRate(-1, DEFAULT_RATE_RANGE, -1), 1.08));
});

test("a wider range is possible for tracks further apart", () => {
  assert.ok(close(rateToPlaybackRate(1, 0.5), 1.5));
});

test("the playback rate never reaches zero", () => {
  // Web Audio treats 0 as 'never advance', so the deck would appear to hang
  // rather than to stop, which looks like a crash.
  assert.ok(rateToPlaybackRate(-1, 2) > 0);
  assert.ok(rateToPlaybackRate(-1, 99) > 0);
});

test("effective BPM follows the pitch fader", () => {
  assert.ok(close(effectiveBpm(120, 1.08), 129.6));
  assert.equal(effectiveBpm(null, 1), null, "unknown tempo stays unknown");
  assert.equal(effectiveBpm(0, 1), null);
});

/* ------------------------------------------------------------------- sync */

test("sync matches two tempos within the fader's range", () => {
  const s = syncRate(128, 124);
  assert.ok(close(s.playbackRate, 128 / 124, 1e-12));
  assert.ok(close(effectiveBpm(124, s.playbackRate), 128, 1e-9));
});

test("sync handles double and half time, because 140 over 70 is a real mix", () => {
  const double = syncRate(140, 70);
  assert.ok(close(double.ratio, 1), "70 BPM plays at double time against 140");

  const half = syncRate(70, 140);
  assert.ok(close(half.ratio, 1));
});

test("sync refuses rather than silently failing when tempos are too far apart", () => {
  // A ±8% fader cannot bridge 128 to 100. Applying the maximum and calling it
  // synced is worse than saying no: the DJ believes the decks are locked and
  // stops listening for the drift.
  assert.equal(syncRate(128, 100), null);
});

test("sync refuses when a tempo is unknown", () => {
  assert.equal(syncRate(128, null), null);
  assert.equal(syncRate(null, 128), null);
  assert.equal(syncRate(128, 0), null);
});

test("a wider pitch range lets sync bridge more", () => {
  assert.equal(syncRate(128, 100), null);
  assert.ok(syncRate(128, 100, 0.5), "at ±50% the same pair is reachable");
});

/* --------------------------------------------------------------- deck mix */

test("the whole gain chain multiplies to one number", () => {
  const m = deckMix(
    { volume: 0.5, pregain: 2 },
    { crossfader: -1, masterGain: 1 },
    "a"
  );
  // Hard left, so deck A's crossfader gain is 1.
  assert.ok(close(m.effective, 0.5 * 2 * 1 * 1));
});

test("a deck faded out is silent no matter how loud its other stages are", () => {
  const m = deckMix({ volume: 1, pregain: 4 }, { crossfader: 1 }, "a");
  assert.ok(close(m.effective, 0, 1e-12), "the crossfader must win");
});

test("deck B is the other side of the same fader", () => {
  const master = { crossfader: 0.5 };
  const a = deckMix({}, master, "a");
  const b = deckMix({}, master, "b");
  assert.ok(b.crossfader > a.crossfader, "at +0.5 deck B is louder");
  assert.ok(close(a.crossfader ** 2 + b.crossfader ** 2, 1, 1e-9));
});

test("defaults are unity, so an untouched mixer changes nothing", () => {
  const m = deckMix({}, { crossfader: -1 }, "a");
  assert.ok(close(m.effective, 1));
  assert.equal(m.eq.lowDb, 0);
  assert.equal(m.eq.midDb, 0);
  assert.equal(m.eq.highDb, 0);
  assert.ok(close(m.playbackRate, 1));
});

test("a killed band is reported as a kill through the deck mix", () => {
  const m = deckMix({ eqLow: 0 }, {}, "a");
  assert.equal(m.eq.lowDb, -Infinity);
});
