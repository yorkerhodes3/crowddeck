// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Loops and hot cues — DJX-8.
 *
 * The failure modes here are silent: an inverted loop makes a deck produce no
 * sound at all with no error, and a playhead that ignores looping shows the DJ a
 * position the audio is nowhere near. Both are checked numerically.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BEAT_LOOP_LENGTHS,
  HOTCUE_COUNT,
  HotCues,
  beatLoop,
  beatSeconds,
  loopPosition,
  makeLoop,
  quantiseToBeat,
  scaleLoop,
  shiftLoop
} from "../src/cues.js";

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

/* ------------------------------------------------------------ beat maths */

test("a beat at 120 BPM is half a second", () => {
  assert.ok(close(beatSeconds(120, 1), 0.5));
  assert.ok(close(beatSeconds(120, 4), 2), "four beats is a bar at 4/4");
  assert.ok(close(beatSeconds(128, 8), (60 / 128) * 8));
});

test("an unknown tempo yields no beat length rather than a guess", () => {
  assert.equal(beatSeconds(null, 1), null);
  assert.equal(beatSeconds(0, 1), null);
  assert.equal(beatSeconds(-120, 1), null);
  assert.equal(beatSeconds(120, 0), null);
});

test("quantising snaps to the nearest beat from the grid anchor", () => {
  // 120 BPM, grid starting at 1.0s: beats at 1.0, 1.5, 2.0, 2.5 ...
  assert.ok(close(quantiseToBeat(1.6, 120, 1), 1.5));
  assert.ok(close(quantiseToBeat(1.8, 120, 1), 2.0));
  assert.ok(close(quantiseToBeat(1.0, 120, 1), 1.0));
});

test("quantising without a tempo leaves the position alone", () => {
  // Snapping to a guessed grid moves the cue somewhere the DJ did not choose.
  // An unsnapped cue is at least where they put it.
  assert.equal(quantiseToBeat(1.234, null), 1.234);
  assert.equal(quantiseToBeat(1.234, 0), 1.234);
});

/* ---------------------------------------------------------------- loops */

test("a loop is normalised, whichever order the points were set", () => {
  const forward = makeLoop(4, 8, 300);
  const backward = makeLoop(8, 4, 300);
  assert.deepEqual(forward, backward, "tapping out before in must still work");
  assert.equal(forward.start, 4);
  assert.equal(forward.end, 8);
  assert.equal(forward.enabled, true);
});

test("a vanishing loop is refused, because it silences the deck without erroring", () => {
  // Web Audio given loopEnd <= loopStart produces no sound and no exception,
  // which during a set reads as the application dying.
  assert.equal(makeLoop(5, 5, 300), null);
  assert.equal(makeLoop(5, 5.001, 300), null, "shorter than a click is not a loop");
  assert.equal(makeLoop(NaN, 8, 300), null);
  assert.equal(makeLoop(4, NaN, 300), null);
});

test("a loop is clamped inside the track", () => {
  const l = makeLoop(-5, 500, 300);
  assert.equal(l.start, 0);
  assert.equal(l.end, 300);
});

test("a beat loop is exactly as long as it claims", () => {
  for (const beats of BEAT_LOOP_LENGTHS) {
    const l = beatLoop(10, 120, beats, 300);
    assert.ok(l, `${beats}-beat loop was refused`);
    assert.ok(close(l.end - l.start, (60 / 120) * beats), `${beats}-beat loop had the wrong length`);
  }
});

test("a beat loop needs a tempo", () => {
  assert.equal(beatLoop(10, null, 4, 300), null);
});

test("halving and doubling keep the loop's start fixed", () => {
  // The start is the musical anchor — the downbeat you looped from. Scaling
  // around the centre would drift the loop off the beat a little each time.
  const four = beatLoop(10, 120, 4, 300);
  const two = scaleLoop(four, 0.5, 300);
  const eight = scaleLoop(four, 2, 300);

  assert.equal(two.start, 10);
  assert.equal(eight.start, 10);
  assert.ok(close(two.end - two.start, 1));
  assert.ok(close(eight.end - eight.start, 4));
});

test("halving repeatedly stops rather than collapsing to silence", () => {
  let loop = beatLoop(10, 120, 4, 300);
  for (let i = 0; i < 12; i++) {
    const next = scaleLoop(loop, 0.5, 300);
    if (next === null) return; // refused before it became a click
    loop = next;
  }
  assert.fail("halving never bottomed out");
});

test("shifting moves a loop by its own length, staying in phase", () => {
  const l = beatLoop(10, 120, 4, 300);
  const fwd = shiftLoop(l, 1, 300);
  const back = shiftLoop(l, -1, 300);
  assert.ok(close(fwd.start, 12));
  assert.ok(close(fwd.end, 14));
  assert.ok(close(back.start, 8));
  assert.ok(close(back.end, 10));
});

/* --------------------------------------------------- the playhead wraps */

test("the playhead wraps inside an active loop", () => {
  // Web Audio wraps the audio; elapsed time keeps rising. Without wrapping, the
  // waveform playhead sails off the end while the sound is still looping — the
  // display and the audio disagree, and the display is what the DJ reads.
  const loop = { start: 10, end: 14, enabled: true };
  assert.equal(loopPosition(12, loop), 12, "inside the loop, unchanged");
  assert.equal(loopPosition(14, loop), 10, "at the end, back to the start");
  assert.equal(loopPosition(15, loop), 11);
  assert.equal(loopPosition(22, loop), 10, "three laps later");
  assert.equal(loopPosition(5, loop), 5, "before the loop, unchanged");
});

test("a disabled or malformed loop does not wrap the playhead", () => {
  assert.equal(loopPosition(99, { start: 10, end: 14, enabled: false }), 99);
  assert.equal(loopPosition(99, { start: 14, end: 10, enabled: true }), 99);
  assert.equal(loopPosition(99, null), 99);
});

/* ------------------------------------------------------------ hot cues */

test("a hot cue stores and returns a position", () => {
  const c = new HotCues();
  assert.equal(c.set(1, 12.5), true);
  assert.equal(c.get(1), 12.5);
  assert.equal(c.get(2), null, "an unset cue is null, not zero");
});

test("cue slots are 1-based, matching hotcue_N_activate", () => {
  const c = new HotCues();
  assert.equal(c.set(0, 5), false, "there is no cue zero");
  assert.equal(c.set(HOTCUE_COUNT, 5), true);
  assert.equal(c.set(HOTCUE_COUNT + 1, 5), false);
  assert.equal(c.get(0), null);
});

test("a nonsense position is refused rather than stored", () => {
  const c = new HotCues();
  assert.equal(c.set(1, NaN), false);
  assert.equal(c.set(1, -3), false);
  assert.equal(c.get(1), null);
});

test("setting and jumping are separate, so a cue cannot be overwritten by accident", () => {
  // A single button that sets when empty and jumps when full will eventually
  // destroy a cue point mid-performance, which is unrecoverable in the moment.
  const c = new HotCues();
  c.set(1, 10);
  assert.equal(c.get(1), 10, "reading never mutates");
  assert.equal(c.get(1), 10);
  c.set(1, 20);
  assert.equal(c.get(1), 20, "overwriting is possible, but only by asking for it");
});

test("clearing a cue reports whether there was one", () => {
  const c = new HotCues();
  c.set(3, 7);
  assert.equal(c.clear(3), true);
  assert.equal(c.clear(3), false);
  assert.equal(c.get(3), null);
});

test("markers come back in time order for drawing on a waveform", () => {
  const c = new HotCues();
  c.set(3, 30);
  c.set(1, 10);
  c.set(5, 20);
  assert.deepEqual(c.markers(), [
    { slot: 1, at: 10 },
    { slot: 5, at: 20 },
    { slot: 3, at: 30 }
  ]);
});

test("cues survive a round trip, because they belong to the track not the session", () => {
  // A DJ who set eight cues and then refreshed has lost the work of preparing
  // that track.
  const c = new HotCues();
  c.set(1, 10);
  c.set(8, 200.5);
  const back = HotCues.fromJSON(JSON.parse(JSON.stringify(c.toJSON())));
  assert.equal(back.get(1), 10);
  assert.equal(back.get(8), 200.5);
  assert.equal(back.get(4), null);
});

test("corrupt stored cues load as empty rather than as garbage positions", () => {
  const back = HotCues.fromJSON({ points: [null, "banana", -5, NaN, 12] });
  assert.equal(back.get(2), null);
  assert.equal(back.get(3), null);
  assert.equal(back.get(4), null);
  assert.equal(back.get(5), 12);
});
