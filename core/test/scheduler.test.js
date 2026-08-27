// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Unified Scheduler tests — Domain C, the part with no prior art.
 *
 * A fake clock is used throughout so ordering and aging are deterministic
 * (REQ-SCH-10) and the suite runs in milliseconds.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { Mode, Scheduler } from "../src/scheduler.js";
import { State, Actor, InvalidTransition } from "../src/queue.js";
import { LicenceClass } from "../src/policy.js";

const MIN = 60 * 1000;

function makeClock(start = 0) {
  let t = start;
  const fn = () => t;
  fn.advance = (ms) => (t += ms);
  fn.set = (ms) => (t = ms);
  return fn;
}

const track = (id, over = {}) => ({
  id,
  title: `Title ${id}`,
  artist: `Artist ${id}`,
  duration: 180,
  genre: "House",
  explicit: false,
  licenceClass: LicenceClass.OWNED_LOCAL,
  ...over
});

function makeScheduler(over = {}) {
  const now = makeClock();
  const s = new Scheduler({ now, mode: Mode.AUTONOMOUS, ...over });
  return { s, now };
}

/* --------------------------------------------------------------- requests */

test("a screened request lands in the staging lane, not on the output", () => {
  const { s } = makeScheduler();
  const r = s.request({ track: track("a"), patronId: "p1" });
  assert.equal(r.ok, true);
  assert.equal(r.entry.state, State.STAGED);
  assert.equal(r.position, 1);
  assert.equal(s.nowPlaying, null, "requesting must never make something audible");
});

test("a policy-rejected request never enters the queue — AC-7", () => {
  const { s } = makeScheduler();
  const r = s.request({ track: track("x", { explicit: true }), patronId: "p1" });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "explicit_content");
  assert.equal(s.publicQueue().length, 0);
});

test("fairness rejections carry a reason a client can explain — AC-5", () => {
  const { s } = makeScheduler();
  s.request({ track: track("a"), patronId: "p1" });
  s.request({ track: track("b"), patronId: "p1" });
  const r = s.request({ track: track("c"), patronId: "p1" });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "patron_limit");
  assert.ok(r.detail.length > 0);
});

test("position in line is 1-based and reflects ordering — REQ-SCH-11", () => {
  const { s } = makeScheduler();
  const a = s.request({ track: track("a"), patronId: "p1" }).entry;
  const b = s.request({ track: track("b"), patronId: "p2" }).entry;
  assert.equal(s.positionOf(a.id), 1);
  assert.equal(s.positionOf(b.id), 2);

  // Two votes move b ahead of a.
  s.vote(b.id, "p3");
  s.vote(b.id, "p4");
  assert.equal(s.positionOf(b.id), 1);
  assert.equal(s.positionOf(a.id), 2);
});

test("queueChanged fires so patrons see position updates in real time — REQ-SCH-12", () => {
  const { s } = makeScheduler();
  let fired = 0;
  s.on("queueChanged", () => fired++);
  s.request({ track: track("a"), patronId: "p1" });
  const b = s.request({ track: track("b"), patronId: "p2" }).entry;
  s.vote(b.id, "p3");
  assert.ok(fired >= 3, `expected an event per mutation, saw ${fired}`);
});

test("a patron cannot vote twice for the same entry — REQ-SCH-17", () => {
  const { s } = makeScheduler();
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  assert.equal(s.vote(e.id, "p2").ok, true);
  const second = s.vote(e.id, "p2");
  assert.equal(second.ok, false);
  assert.equal(second.reason, "duplicate_vote");
  assert.equal(e.votes, 1);
});

test("boosting raises priority through the same ordering function — ADR-003", () => {
  const { s } = makeScheduler();
  const a = s.request({ track: track("a"), patronId: "p1" }).entry;
  const b = s.request({ track: track("b"), patronId: "p2" }).entry;
  assert.equal(s.positionOf(a.id), 1);

  s.boost(b.id, 1);
  assert.equal(s.positionOf(b.id), 1, "a boost outranks an earlier request");
  assert.equal(b.boostUnits, 1);
});

/* ----------------------------------------------------------- staging lane */

test("in attended mode the scheduler may not promote — AC-1", () => {
  const { s } = makeScheduler({ mode: Mode.ATTENDED });
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  assert.equal(e.state, State.STAGED);

  assert.throws(
    () => s.promote(e.id, { actor: Actor.SCHEDULER }),
    /attended mode a DJ must promote/
  );
  assert.equal(e.state, State.STAGED, "the entry stays in the lane");
});

test("in attended mode a DJ promotes from the lane — AC-1", () => {
  const { s } = makeScheduler({ mode: Mode.ATTENDED });
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  const r = s.promote(e.id, { actor: Actor.DJ });
  assert.equal(r.ok, true);
  assert.equal(e.state, State.CUED);
});

test("a patron has no legal path to cue an entry — REQ-SCH-5", () => {
  const { s } = makeScheduler();
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  assert.throws(
    () => e.transition(State.CUED, { actor: Actor.PATRON, nowMs: 0 }),
    InvalidTransition
  );
});

test("patrons cannot alter an entry once it is playing — REQ-SCH-5", () => {
  const { s } = makeScheduler();
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  s.promote(e.id);
  s.markPlaying(e.id);

  const voted = s.vote(e.id, "p2");
  assert.equal(voted.ok, false);
  assert.equal(voted.reason, "not_pending");
  assert.equal(s.boost(e.id, 1).ok, false);
});

test("policy is re-evaluated at cue time — REQ-POL-3", () => {
  const { s } = makeScheduler({ policy: { explicitAllowed: true } });
  const e = s.request({ track: track("a", { explicit: true }), patronId: "p1" }).entry;

  // The venue tightens policy between request and cue.
  s.policy = { ...s.policy, explicitAllowed: false };
  const r = s.promote(e.id);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "explicit_content");
  assert.equal(e.state, State.REJECTED);
});

/* ------------------------------------------------------- autonomous drain */

test("autonomous mode cues the top of the queue on tick — AC-2", () => {
  const { s } = makeScheduler();
  const a = s.request({ track: track("a"), patronId: "p1" }).entry;
  s.request({ track: track("b"), patronId: "p2" });

  const cued = [];
  s.on("cue", (e) => cued.push(e.id));
  s.tick();

  assert.deepEqual(cued, [a.id]);
  assert.equal(a.state, State.CUED);
});

test("autonomous mode keeps a follower preloaded so the engine never runs dry", () => {
  const { s } = makeScheduler();
  s.request({ track: track("a"), patronId: "p1" });
  const b = s.request({ track: track("b"), patronId: "p2" }).entry;

  const { preloaded } = s.tick();
  assert.ok(preloaded, "a follower should be preloaded");
  assert.equal(preloaded.id, b.id);
});

test("attended mode does not auto-promote on tick — REQ-MODE-3", () => {
  const { s } = makeScheduler({ mode: Mode.ATTENDED });
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  const result = s.tick();
  assert.deepEqual(result.promoted, []);
  assert.equal(e.state, State.STAGED);
});

/* --------------------------------------------------------------- handoff */

test("switching mode does not disturb what is playing — AC-3", () => {
  const { s } = makeScheduler();
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  s.tick();
  s.markPlaying(e.id);

  assert.equal(s.nowPlaying.id, e.id);
  s.setMode(Mode.ATTENDED);

  assert.equal(s.mode, Mode.ATTENDED);
  assert.equal(s.nowPlaying.id, e.id, "audio continues across the handoff");
  assert.equal(e.state, State.PLAYING);
});

test("the mode event carries what was playing, for a gapless handoff", () => {
  const { s } = makeScheduler();
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  s.tick();
  s.markPlaying(e.id);

  let seen = null;
  s.on("mode", (m) => (seen = m));
  s.setMode(Mode.ATTENDED);

  assert.equal(seen.from, Mode.AUTONOMOUS);
  assert.equal(seen.to, Mode.ATTENDED);
  assert.equal(seen.nowPlaying.id, e.id);
});

test("returning to autonomous resumes promotion — REQ-MODE-4", () => {
  const { s } = makeScheduler({ mode: Mode.ATTENDED });
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  assert.equal(e.state, State.STAGED);

  s.setMode(Mode.AUTONOMOUS);
  assert.equal(e.state, State.CUED, "the queue starts draining again");
});

test("an unknown mode is rejected", () => {
  const { s } = makeScheduler();
  assert.throws(() => s.setMode("party"), RangeError);
});

/* -------------------------------------------------------------- fallback */

test("an empty queue falls back so the room is never silent — AC-8", () => {
  let n = 0;
  const { s } = makeScheduler({
    fallbackProvider: () => track(`fallback-${n++}`)
  });

  const e = s.onDeckEmpty();
  assert.ok(e, "a fallback entry should be produced");
  assert.equal(e.state, State.CUED);
  assert.equal(e.isFallback, true);
});

test("fallback selections pass the same policy screening — REQ-FALL-2", () => {
  const { s } = makeScheduler({
    fallbackProvider: () => track("bad", { explicit: true })
  });
  let rejected = null;
  s.on("fallbackRejected", (r) => (rejected = r));

  const e = s.onDeckEmpty();
  assert.equal(e, null, "a non-compliant fallback must not be played");
  assert.ok(rejected, "and the venue should be told why");
});

test("with no queue and no fallback the scheduler reports silence rather than hiding it", () => {
  const { s } = makeScheduler({ fallbackProvider: () => null });
  let silent = null;
  s.on("silent", (x) => (silent = x));
  assert.equal(s.onDeckEmpty(), null);
  assert.ok(silent, "silence must be surfaced, not swallowed");
});

test("a real request is preferred over fallback", () => {
  const { s } = makeScheduler({ fallbackProvider: () => track("fallback") });
  const real = s.request({ track: track("real"), patronId: "p1" }).entry;
  const chosen = s.onDeckEmpty();
  assert.equal(chosen.id, real.id, "patron requests outrank filler");
});

/* ---------------------------------------------------------- play accounting */

test("a played track starts its cooldown — AC-6", () => {
  const { s, now } = makeScheduler();
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  s.tick();
  s.markPlaying(e.id);
  s.markPlayed(e.id);

  now.advance(10 * MIN);
  const again = s.request({ track: track("a"), patronId: "p2" });
  assert.equal(again.ok, false);
  assert.equal(again.reason, "track_cooldown");

  now.advance(60 * MIN);
  assert.equal(s.request({ track: track("a"), patronId: "p3" }).ok, true);
});

test("a skipped track still counts for cooldown", () => {
  const { s, now } = makeScheduler();
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  s.tick();
  s.markPlaying(e.id);
  s.skip(e.id);

  now.advance(MIN);
  const again = s.request({ track: track("a"), patronId: "p2" });
  assert.equal(again.ok, false, "the room already heard some of it");
  assert.equal(again.reason, "track_cooldown");
});

test("staff can pin an entry to the top — REQ-SCH-6", () => {
  const { s } = makeScheduler();
  const a = s.request({ track: track("a"), patronId: "p1" }).entry;
  const b = s.request({ track: track("b"), patronId: "p2" }).entry;
  s.vote(a.id, "p3");
  assert.equal(s.positionOf(a.id), 1);

  s.pin(b.id);
  assert.equal(s.positionOf(b.id), 1, "staff override beats the crowd");
});

test("staff rejection removes an entry from the queue", () => {
  const { s } = makeScheduler();
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  s.reject(e.id, "inappropriate");
  assert.equal(e.state, State.REJECTED);
  assert.equal(e.rejectReason, "inappropriate");
  assert.equal(s.publicQueue().length, 0);
});

/* ----------------------------------------------------------------- audit */

test("every transition is recorded with actor and timestamp — REQ-SCH-1", () => {
  const { s, now } = makeScheduler();
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  now.advance(1000);
  s.tick();
  now.advance(1000);
  s.markPlaying(e.id);

  const states = e.events.map((ev) => ev.to);
  assert.deepEqual(states, [State.SCREENED, State.STAGED, State.CUED, State.PLAYING]);
  for (const ev of e.events) {
    assert.ok(ev.actor, "each event needs an actor");
    assert.equal(typeof ev.at, "number");
  }
});

test("the public projection never leaks voter identities", () => {
  const { s } = makeScheduler();
  const e = s.request({ track: track("a"), patronId: "p1" }).entry;
  s.vote(e.id, "p2");
  const pub = e.toPublic(1);
  assert.equal(pub.votes, 1);
  assert.equal(pub.voters, undefined);
  assert.equal(pub.patronId, undefined);
});
