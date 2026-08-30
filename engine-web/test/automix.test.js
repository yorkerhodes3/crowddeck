// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Automix — DJX-24.
 *
 * Automix fails in a specific, embarrassing way: it produces silence in a room
 * full of people, or it fights the DJ for control of the crossfader. Both are
 * behaviours of the decision function, so both are tested here without an audio
 * device — and swept across a whole transition rather than probed at one moment.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AutomixAction,
  DEFAULT_CROSSFADE_SECONDS,
  chooseNext,
  detectManualMove,
  faderAt,
  nextAction
} from "../src/automix.js";

const base = (over = {}) => ({
  enabled: true,
  playingSide: "a",
  position: 0,
  duration: 200,
  otherLoaded: true,
  otherPlaying: false,
  crossfader: -1,
  ...over
});

/* ------------------------------------------------------------- the timeline */

test("nothing happens in the body of a track", () => {
  const r = nextAction(base({ position: 30 }));
  assert.equal(r.action, AutomixAction.NONE);
});

test("the next deck is prepared before the crossfade, not during it", () => {
  // Loading and analysing takes seconds. Preparing at the moment the fade should
  // start means the fade starts late by however long the network took.
  const r = nextAction(base({ position: 180 })); // 20s left
  assert.equal(r.action, AutomixAction.PREPARE);
});

test("the incoming deck starts as the crossfade begins", () => {
  const r = nextAction(base({ position: 190, prepared: true })); // 10s left
  assert.equal(r.action, AutomixAction.START_NEXT);
});

test("a crossfade runs to completion across the whole overlap", () => {
  // Swept rather than sampled, and driven as a real state machine: `prepared`
  // only becomes true once PREPARE has actually been emitted, and the incoming
  // deck only plays once START_NEXT has. Holding those flags constant — as an
  // earlier version of this test did — makes the sweep unable to observe the
  // very transitions it exists to check.
  const seen = [];
  let prepared = false;
  let otherPlaying = false;

  for (let t = 0; t <= 200; t += 0.25) {
    const r = nextAction(base({ position: t, prepared, otherPlaying }));
    seen.push(r.action);
    assert.ok(r.progress >= 0 && r.progress <= 1, `progress ${r.progress} at t=${t}`);
    if (r.action === AutomixAction.PREPARE) prepared = true;
    if (r.action === AutomixAction.START_NEXT) otherPlaying = true;
  }

  const order = seen.filter((a, i) => a !== seen[i - 1]);
  assert.ok(order.includes(AutomixAction.PREPARE), `never prepared: ${order.join(" → ")}`);
  assert.ok(order.includes(AutomixAction.START_NEXT), `never started: ${order.join(" → ")}`);
  assert.ok(order.includes(AutomixAction.CROSSFADE), `never crossfaded: ${order.join(" → ")}`);
  // And in that order — preparing after starting would mean beat-matching a
  // track the room can already hear, which is an audible pitch slide.
  assert.ok(
    order.indexOf(AutomixAction.PREPARE) < order.indexOf(AutomixAction.START_NEXT),
    `wrong order: ${order.join(" → ")}`
  );
  assert.ok(
    order.indexOf(AutomixAction.START_NEXT) <= order.indexOf(AutomixAction.CROSSFADE),
    `wrong order: ${order.join(" → ")}`
  );
});

test("progress reaches 1 by the end of the track", () => {
  const r = nextAction(base({ position: 200 - 0.01, prepared: true, otherPlaying: true }));
  assert.ok(r.progress > 0.99, `progress was ${r.progress}`);
});

test("the fader is driven to the incoming deck, whichever way round", () => {
  const fromA = nextAction(base({ position: 195, prepared: true, otherPlaying: true }));
  assert.equal(fromA.target, 1, "A→B ends fully on B");
  const fromB = nextAction(base({ playingSide: "b", crossfader: 1, position: 195, prepared: true, otherPlaying: true }));
  assert.equal(fromB.target, -1, "B→A ends fully on A");
});

test("the transition finishes once the fader has arrived", () => {
  const r = nextAction(base({ position: 199, prepared: true, otherPlaying: true, crossfader: 1 }));
  assert.equal(r.action, AutomixAction.FINISH);
});

/* --------------------------------------------------------- refusing to break */

test("automix off does nothing at all", () => {
  assert.equal(nextAction(base({ enabled: false, position: 195 })).action, AutomixAction.NONE);
});

test("no track on the other deck is explained, not silently ignored", () => {
  // Someone who armed automix and walked away deserves to know it will not fire.
  const r = nextAction(base({ position: 190, otherLoaded: false }));
  assert.equal(r.action, AutomixAction.NONE);
  assert.match(r.reason, /load one/);
});

test("a manual fader move stops automix touching the fader again", () => {
  // A control that fights the hand on it is worse than no automatic control:
  // the DJ cannot tell whether the deck is broken or possessed.
  const r = nextAction(base({ position: 195, prepared: true, otherPlaying: true, manualOverride: true }));
  assert.equal(r.action, AutomixAction.NONE);
  assert.match(r.reason, /manual/);
});

test("nonsense state is inert rather than fatal", () => {
  assert.equal(nextAction(base({ duration: 0 })).action, AutomixAction.NONE);
  assert.equal(nextAction(base({ duration: NaN })).action, AutomixAction.NONE);
  assert.equal(nextAction(base({ position: NaN })).action, AutomixAction.NONE);
  assert.equal(nextAction(null).action, AutomixAction.NONE);
  assert.equal(nextAction(undefined).action, AutomixAction.NONE);
});

test("a track shorter than the crossfade still transitions", () => {
  // A 6-second jingle must not wedge the deck by never reaching a state where a
  // 12-second fade can begin.
  const r = nextAction(base({ duration: 6, position: 1, prepared: true, otherPlaying: true }));
  assert.ok([AutomixAction.CROSSFADE, AutomixAction.START_NEXT].includes(r.action), r.action);
});

/* ------------------------------------------------------------------- fader */

test("the fader sweeps the full travel, in the right direction", () => {
  assert.equal(faderAt("a", 0), -1);
  assert.equal(faderAt("a", 1), 1);
  assert.equal(faderAt("a", 0.5), 0);
  assert.equal(faderAt("b", 0), 1);
  assert.equal(faderAt("b", 1), -1);
});

test("fader progress is clamped, so a late frame cannot overshoot", () => {
  assert.equal(faderAt("a", 2), 1);
  assert.equal(faderAt("a", -3), -1);
  assert.equal(faderAt("a", NaN), -1);
});

test("a manual move is detected, and automix's own moves are not", () => {
  // The failure this prevents is a transition that stops itself, because automix
  // read back its own output and called it interference.
  assert.equal(detectManualMove(0.5, 0.5), false, "its own value is not a move");
  assert.equal(detectManualMove(0.52, 0.5), false, "rounding is not a move");
  assert.equal(detectManualMove(0.9, 0.5), true, "a real nudge is a move");
  assert.equal(detectManualMove(0.5, null), false, "before automix sets anything");
  assert.equal(detectManualMove(NaN, 0.5), false);
});

/* ------------------------------------------------------------ what plays next */

const match = (a, b) => {
  if (!a || !b) return { mixable: false, percent: null };
  const pct = ((a - b) / b) * 100;
  return { mixable: Math.abs(pct) <= 8, percent: pct };
};

test("the easiest mix is chosen, not merely the first", () => {
  const picked = chooseNext(
    [{ id: "far", bpm: 150 }, { id: "close", bpm: 129 }, { id: "ok", bpm: 134 }],
    128,
    match
  );
  assert.equal(picked.id, "close");
});

test("already-played tracks are not repeated", () => {
  const picked = chooseNext(
    [{ id: "a", bpm: 128 }, { id: "b", bpm: 129 }],
    128,
    match,
    new Set(["a"])
  );
  assert.equal(picked.id, "b");
});

test("when nothing is mixable it still plays something — silence is the real failure", () => {
  // An automix that stops because no tempo matched has failed at its one job.
  const picked = chooseNext([{ id: "x", bpm: 200 }, { id: "y", bpm: 60 }], 128, match);
  assert.ok(picked, "must not return null just because nothing beat-matches");
  assert.equal(picked.id, "x");
});

test("an unknown tempo is still a candidate", () => {
  const picked = chooseNext([{ id: "notempo", bpm: null }], 128, match);
  assert.equal(picked.id, "notempo");
});

test("an empty or exhausted queue is null, not an exception", () => {
  assert.equal(chooseNext([], 128, match), null);
  assert.equal(chooseNext(null, 128, match), null);
  assert.equal(chooseNext([{ id: "a", bpm: 128 }], 128, match, new Set(["a"])), null);
});

test("the crossfade length is a real duration, not a fraction of the track", () => {
  // A fraction gives a 30-second outro on a nine-minute mix and two seconds on a
  // jingle. Pins the choice so it cannot quietly become a percentage.
  assert.ok(DEFAULT_CROSSFADE_SECONDS >= 4 && DEFAULT_CROSSFADE_SECONDS <= 30);
  const long = nextAction(base({ duration: 600, position: 600 - DEFAULT_CROSSFADE_SECONDS + 1, prepared: true, otherPlaying: true }));
  const short = nextAction(base({ duration: 60, position: 60 - DEFAULT_CROSSFADE_SECONDS + 1, prepared: true, otherPlaying: true }));
  assert.equal(long.action, AutomixAction.CROSSFADE);
  assert.equal(short.action, AutomixAction.CROSSFADE);
});
