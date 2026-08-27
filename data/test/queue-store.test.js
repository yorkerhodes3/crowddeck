// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Durable queue — REQ-NFR-4.
 *
 * The interesting question is not "did the rows come back" but "does the queue
 * still behave correctly after coming back". So these tests restore entries into a
 * *fresh database connection* — a real restart, not a re-read — and then re-run the
 * rules against them.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { openDatabase } from "../src/db.js";
import { QueueStore } from "../src/queue-store.js";
import { QueueEntry, State, Actor } from "../../core/src/queue.js";

const T0 = 1_700_000_000_000;

/** A real file, so closing and reopening is a genuine restart. */
function venueFile(t) {
  const file = join(tmpdir(), `crowddeck-queue-${randomUUID()}.db`);
  const open = [];
  t.after(() => {
    for (const db of open) {
      try {
        db.close();
      } catch {
        /* already closed */
      }
    }
    for (const suffix of ["", "-wal", "-shm"]) rmSync(file + suffix, { force: true });
  });
  return {
    /** Simulates a process start: a brand-new connection to the same file. */
    boot() {
      const db = openDatabase({ path: file, venueId: "v1" });
      open.push(db);
      return { db, store: new QueueStore(db) };
    }
  };
}

const mkEntry = (over = {}) =>
  new QueueEntry({
    id: over.id ?? "qe1",
    venueId: "v1",
    track: over.track ?? { id: "t1", title: "Blue Monday", artist: "New Order", duration: 270000 },
    patronId: over.patronId ?? "p1",
    nowMs: over.nowMs ?? T0
  });

test("the queue survives a process restart — REQ-NFR-4", (t) => {
  const venue = venueFile(t);

  // ---- first run
  const first = venue.boot();
  const e = mkEntry();
  e.transition(State.SCREENED, { actor: Actor.POLICY, nowMs: T0 + 1 });
  e.transition(State.STAGED, { actor: Actor.SCHEDULER, nowMs: T0 + 2 });
  e.addVote("p2", T0 + 3);
  e.addVote("p3", T0 + 4);
  e.addBoost(2, T0 + 5);
  first.store.save(e);
  first.db.close();

  // ---- restart
  const second = venue.boot();
  const restored = second.store.load("qe1");

  assert.ok(restored instanceof QueueEntry, "must come back as the real class, not a plain object");
  assert.equal(restored.state, State.STAGED);
  assert.equal(restored.votes, 2);
  assert.equal(restored.boostUnits, 2);
  assert.equal(restored.patronId, "p1");
  assert.equal(restored.enqueuedAt, T0);
  assert.deepEqual(restored.track, { id: "t1", title: "Blue Monday", artist: "New Order", duration: 270000 });
});

test("voter identities survive, so one-vote-per-patron still holds — REQ-SCH-17", (t) => {
  const venue = venueFile(t);

  const first = venue.boot();
  const e = mkEntry();
  e.addVote("p2", T0 + 1);
  first.store.save(e);
  first.db.close();

  const restored = venue.boot().store.load("qe1");

  // Storing only the *count* would let p2 vote again after a restart — the rule
  // would silently weaken every time the venue rebooted.
  assert.equal(restored.addVote("p2", T0 + 100), false, "p2 already voted before the restart");
  assert.equal(restored.votes, 1);
  assert.equal(restored.addVote("p9", T0 + 101), true);
  assert.equal(restored.votes, 2);
});

test("the transition log survives, so overrides stay auditable — REQ-POL-4", (t) => {
  const venue = venueFile(t);

  const first = venue.boot();
  const e = mkEntry();
  e.transition(State.SCREENED, { actor: Actor.POLICY, nowMs: T0 + 1 });
  e.transition(State.STAGED, { actor: Actor.SCHEDULER, nowMs: T0 + 2 });
  e.transition(State.CUED, { actor: Actor.DJ, nowMs: T0 + 3, reason: "dj pulled it forward" });
  first.store.save(e);
  first.db.close();

  const restored = venue.boot().store.load("qe1");
  const cued = restored.events.find((x) => x.to === State.CUED);

  assert.ok(cued, "the audit trail must survive a restart or it is not an audit trail");
  assert.equal(cued.actor, Actor.DJ);
  assert.equal(cued.reason, "dj pulled it forward");
  assert.equal(cued.at, T0 + 3);
  assert.equal(restored.events.length, e.events.length);
});

test("a restored entry obeys the same transition rules as a fresh one", (t) => {
  const venue = venueFile(t);

  const first = venue.boot();
  const e = mkEntry();
  e.transition(State.SCREENED, { actor: Actor.POLICY, nowMs: T0 + 1 });
  e.transition(State.STAGED, { actor: Actor.SCHEDULER, nowMs: T0 + 2 });
  first.store.save(e);
  first.db.close();

  const restored = venue.boot().store.load("qe1");

  // The staging-lane guarantee: a patron has no legal transition into `cued`, and
  // that must still be true for an entry that came out of the database.
  assert.throws(
    () => restored.transition(State.CUED, { actor: Actor.PATRON, nowMs: T0 + 10 }),
    /InvalidTransition|not allowed|cannot/i
  );
  assert.doesNotThrow(() => restored.transition(State.CUED, { actor: Actor.DJ, nowMs: T0 + 11 }));
});

test("saving twice updates rather than duplicating, and appends only new events", (t) => {
  const venue = venueFile(t);
  const { store } = venue.boot();

  const e = mkEntry();
  store.save(e);
  e.transition(State.SCREENED, { actor: Actor.POLICY, nowMs: T0 + 1 });
  store.save(e);
  e.transition(State.STAGED, { actor: Actor.SCHEDULER, nowMs: T0 + 2 });
  store.save(e);
  store.save(e);

  assert.equal(store.count(), 1);
  const restored = store.load("qe1");
  assert.equal(restored.state, State.STAGED);
  assert.equal(restored.events.length, 2, "each transition logged once, not once per save");
});

test("only entries still in play are restored to the queue", (t) => {
  const venue = venueFile(t);
  const { store } = venue.boot();

  const staged = mkEntry({ id: "staged" });
  staged.transition(State.SCREENED, { actor: Actor.POLICY, nowMs: T0 });
  staged.transition(State.STAGED, { actor: Actor.SCHEDULER, nowMs: T0 });

  const rejected = mkEntry({ id: "rejected" });
  rejected.transition(State.REJECTED, { actor: Actor.POLICY, nowMs: T0, reason: "explicit" });

  const played = mkEntry({ id: "played" });
  played.transition(State.SCREENED, { actor: Actor.POLICY, nowMs: T0 });
  played.transition(State.STAGED, { actor: Actor.SCHEDULER, nowMs: T0 });
  played.transition(State.CUED, { actor: Actor.DJ, nowMs: T0 });
  played.transition(State.PLAYING, { actor: Actor.ENGINE, nowMs: T0 });
  played.transition(State.PLAYED, { actor: Actor.ENGINE, nowMs: T0 });

  store.saveAll([staged, rejected, played]);

  const pending = store.loadPending().map((x) => x.id);
  assert.deepEqual(pending, ["staged"], "a rejected or played entry must not rejoin the queue");

  // But they remain as history — the venue can still answer what happened.
  assert.equal(store.count(), 3);
  assert.equal(store.load("rejected").rejectReason, "explicit");
});

test("terminal history can be pruned without touching live entries", (t) => {
  const venue = venueFile(t);
  const { store } = venue.boot();

  const old = mkEntry({ id: "old", nowMs: T0 });
  old.transition(State.REJECTED, { actor: Actor.POLICY, nowMs: T0, reason: "old" });
  const live = mkEntry({ id: "live", nowMs: T0 });
  live.transition(State.SCREENED, { actor: Actor.POLICY, nowMs: T0 });
  store.saveAll([old, live]);

  assert.equal(store.pruneTerminal(T0 + 1), 1);
  assert.equal(store.count(), 1);
  assert.ok(store.load("live"), "a pending entry is never pruned");
});

test("an unknown entry loads as null rather than throwing", (t) => {
  const { store } = venueFile(t).boot();
  assert.equal(store.load("nope"), null);
});
