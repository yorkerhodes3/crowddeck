// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Queue rotation — CRW-1, REQ-SCH-19.
 *
 * The idea is harvested from **Karaoke Eternal** (MIT), whose rotation is the best
 * prior art for this problem: singers take turns, and a singer with three songs
 * queued does not get three turns in a row. Generalised here from "singers" to
 * "patrons with priority".
 *
 * A pure score sort does not give this. Two entries from one patron can outscore
 * everyone and play back to back, while a patron who queued once waits behind
 * both. Nothing is broken and no rule is violated — the queue is simply doing
 * exactly what it was told — and the patron who waited concludes it is rigged.
 * `priority.js` already warns about that perception; this is the case that causes
 * it.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { orderQueue, resolveWeights } from "../src/priority.js";

const T0 = 1_700_000_000_000;

const entry = (id, patronId, over = {}) => ({
  id,
  patronId,
  enqueuedAt: T0,
  votes: 0,
  boostUnits: 0,
  staffPinned: false,
  ...over
});

const patronsOf = (ordered) => ordered.map((e) => e.patronId);

test("without rotation, one patron can hold consecutive slots", () => {
  // The behaviour this story exists to change, pinned so the change is visible
  // rather than asserted about.
  const entries = [
    entry("a1", "alice", { votes: 10 }),
    entry("a2", "alice", { votes: 9 }),
    entry("b1", "bob", { votes: 8 })
  ];
  const ordered = orderQueue(entries, T0, resolveWeights({ rotatePatrons: false }));
  assert.deepEqual(patronsOf(ordered), ["alice", "alice", "bob"]);
});

test("with rotation, patrons take turns — CRW-1", () => {
  const entries = [
    entry("a1", "alice", { votes: 10 }),
    entry("a2", "alice", { votes: 9 }),
    entry("b1", "bob", { votes: 8 })
  ];
  const ordered = orderQueue(entries, T0);
  assert.deepEqual(patronsOf(ordered), ["alice", "bob", "alice"]);
});

test("rotation is on by default, because the default must be the fair one", () => {
  assert.equal(resolveWeights().rotatePatrons, true);
});

test("the strongest patron still goes first — rotation is not equalisation", () => {
  // Rotation decides *turn order*, not who wins. A track with real crowd support
  // must still play before one with none, or voting stops meaning anything.
  const ordered = orderQueue(
    [entry("b1", "bob", { votes: 1 }), entry("a1", "alice", { votes: 10 })],
    T0
  );
  assert.deepEqual(patronsOf(ordered), ["alice", "bob"]);
});

test("each patron's own entries stay in their own priority order", () => {
  const ordered = orderQueue(
    [
      entry("a_low", "alice", { votes: 1 }),
      entry("a_high", "alice", { votes: 10 }),
      entry("b1", "bob", { votes: 5 })
    ],
    T0
  );
  // Alice's better track is the one that takes her first turn.
  assert.deepEqual(
    ordered.map((e) => e.id),
    ["a_high", "b1", "a_low"]
  );
});

test("a lone patron is unaffected — rotation must not penalise a quiet night", () => {
  const ordered = orderQueue(
    [
      entry("a1", "alice", { votes: 3 }),
      entry("a2", "alice", { votes: 2 }),
      entry("a3", "alice", { votes: 1 })
    ],
    T0
  );
  assert.deepEqual(
    ordered.map((e) => e.id),
    ["a1", "a2", "a3"]
  );
});

test("staff-pinned entries still sort above everything — REQ-SCH-6", () => {
  // Rotation must not weaken the one override staff have. A pinned track is
  // usually a request from the room's owner, and it plays next.
  const ordered = orderQueue(
    [
      entry("a1", "alice", { votes: 10 }),
      entry("a2", "alice", { votes: 9 }),
      entry("s1", "staff", { staffPinned: true, votes: 0 }),
      entry("s2", "staff", { staffPinned: true, votes: 0 })
    ],
    T0
  );
  assert.deepEqual(
    ordered.map((e) => e.id).slice(0, 2),
    ["s1", "s2"],
    "both pinned entries lead, and rotation does not interleave a patron between them"
  );
});

test("three patrons interleave round by round", () => {
  const entries = [
    entry("a1", "alice", { votes: 30 }),
    entry("a2", "alice", { votes: 29 }),
    entry("b1", "bob", { votes: 20 }),
    entry("b2", "bob", { votes: 19 }),
    entry("c1", "cass", { votes: 10 })
  ];
  assert.deepEqual(patronsOf(orderQueue(entries, T0)), [
    "alice", "bob", "cass",
    "alice", "bob"
  ]);
});

test("a patron with no id is treated as their own queue, not merged with others", () => {
  // Anonymous entries — a fallback track, an imported set — must not collapse
  // into one pseudo-patron who then monopolises a rotation slot.
  const ordered = orderQueue(
    [
      entry("f1", undefined, { votes: 5 }),
      entry("f2", undefined, { votes: 4 }),
      entry("b1", "bob", { votes: 3 })
    ],
    T0
  );
  assert.equal(ordered.length, 3);
  assert.deepEqual(ordered.map((e) => e.id), ["f1", "f2", "b1"]);
});

test("ordering stays deterministic and positions stay 1-based", () => {
  const entries = [
    entry("a1", "alice", { votes: 5 }),
    entry("b1", "bob", { votes: 5 }),
    entry("c1", "cass", { votes: 5 })
  ];
  const first = orderQueue(entries, T0).map((e) => e.id);
  for (let i = 0; i < 20; i++) {
    assert.deepEqual(orderQueue([...entries].reverse(), T0).map((e) => e.id), first);
  }
  assert.deepEqual(orderQueue(entries, T0).map((e) => e.position), [1, 2, 3]);
});

test("the input array is never mutated", () => {
  const entries = [entry("a1", "alice", { votes: 2 }), entry("b1", "bob", { votes: 1 })];
  const before = JSON.stringify(entries);
  orderQueue(entries, T0);
  assert.equal(JSON.stringify(entries), before);
});
