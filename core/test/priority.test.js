// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_WEIGHTS,
  ageBonus,
  orderQueue,
  priorityScore,
  resolveWeights
} from "../src/priority.js";

const W = resolveWeights();
const MIN = 60 * 1000;

test("votes and boosts both feed one score — ADR-003", () => {
  const base = { id: "a", enqueuedAt: 0 };
  const voted = priorityScore({ ...base, votes: 5 }, 0, W);
  const boosted = priorityScore({ ...base, boostUnits: 2 }, 0, W);
  assert.equal(voted, 5 * W.voteWeight);
  assert.equal(boosted, 2 * W.boostWeight);
  // Combined, they add rather than compete.
  assert.equal(
    priorityScore({ ...base, votes: 5, boostUnits: 2 }, 0, W),
    voted + boosted
  );
});

test("aging is stepped, not continuous, so ordering is stable between steps", () => {
  assert.equal(ageBonus(0, W), 0);
  assert.equal(ageBonus(4 * MIN, W), 0, "no bonus before the first interval");
  assert.equal(ageBonus(5 * MIN, W), W.agingWeight);
  assert.equal(ageBonus(9 * MIN, W), W.agingWeight, "stable within an interval");
  assert.equal(ageBonus(10 * MIN, W), 2 * W.agingWeight);
});

test("aging stops an old entry being buried by a stream of newer popular ones — REQ-SCH-8", () => {
  // The real starvation scenario is not "unpopular vs equally-old popular" —
  // aging applies to both, so it cannot separate them. It is an old entry being
  // permanently overtaken by a steady stream of *fresh* popular requests.
  const ignored = { id: "ignored", enqueuedAt: 0, votes: 0 };

  // A newcomer with 3 votes arrives 10 minutes in and wins comfortably.
  let newcomer = { id: "new", enqueuedAt: 10 * MIN, votes: 3 };
  assert.equal(orderQueue([ignored, newcomer], 10 * MIN, W)[0].id, "new");

  // Newcomers keep arriving. Eventually the waiting entry's age bonus exceeds
  // what a fresh 3-vote request is worth, and it finally plays.
  newcomer = { id: "new", enqueuedAt: 60 * MIN, votes: 3 };
  assert.equal(
    orderQueue([ignored, newcomer], 60 * MIN, W)[0].id,
    "ignored",
    "a long-waiting entry must eventually outrank fresh arrivals"
  );
});

test("the crossover point follows from the configured weights", () => {
  const ignored = { id: "ignored", enqueuedAt: 0, votes: 0 };
  const fresh = (t) => ({ id: "fresh", enqueuedAt: t, votes: 3 });

  // 3 votes = 30 points. The waiting entry needs an age bonus of at least that.
  // At 45 min it has 9 complete intervals = 27 points, so the newcomer still wins.
  assert.equal(orderQueue([ignored, fresh(45 * MIN)], 45 * MIN, W)[0].id, "fresh");

  // At 50 min it has 10 intervals = 30 points: an exact tie, which the FIFO
  // tie-break resolves in favour of whoever waited longer.
  assert.equal(orderQueue([ignored, fresh(50 * MIN)], 50 * MIN, W)[0].id, "ignored");
});

test("agingWeight of zero is rejected rather than silently accepted", () => {
  assert.throws(() => resolveWeights({ agingWeight: 0 }), RangeError);
  assert.throws(() => resolveWeights({ agingIntervalMs: 0 }), RangeError);
  assert.throws(() => resolveWeights({ voteWeight: -1 }), RangeError);
});

test("staff-pinned entries outrank everything — REQ-SCH-6", () => {
  const pinned = { id: "pinned", enqueuedAt: 0, votes: 0, staffPinned: true };
  const popular = { id: "popular", enqueuedAt: 0, votes: 99 };
  const order = orderQueue([popular, pinned], 0, W);
  assert.equal(order[0].id, "pinned");
  assert.equal(order[0].position, 1);
});

test("equal scores fall back to FIFO", () => {
  const first = { id: "b", enqueuedAt: 100, votes: 1 };
  const second = { id: "a", enqueuedAt: 200, votes: 1 };
  const order = orderQueue([second, first], 300, W);
  assert.deepEqual(order.map((o) => o.id), ["b", "a"], "earlier request wins a tie");
});

test("ordering is total and deterministic even for identical entries", () => {
  const entries = [
    { id: "c", enqueuedAt: 0, votes: 1 },
    { id: "a", enqueuedAt: 0, votes: 1 },
    { id: "b", enqueuedAt: 0, votes: 1 }
  ];
  const once = orderQueue(entries, 0, W).map((o) => o.id);
  const twice = orderQueue([...entries].reverse(), 0, W).map((o) => o.id);
  assert.deepEqual(once, twice, "input order must not affect the result");
  assert.deepEqual(once, ["a", "b", "c"]);
});

test("scores depend on wall clock only through nowMs — REQ-SCH-10", () => {
  const e = { id: "x", enqueuedAt: 0, votes: 2, boostUnits: 1 };
  assert.equal(priorityScore(e, 1000, W), priorityScore(e, 1000, W));
  assert.notEqual(priorityScore(e, 0, W), priorityScore(e, 60 * MIN, W));
});

test("positions are 1-based — REQ-SCH-11", () => {
  const order = orderQueue(
    [
      { id: "a", enqueuedAt: 0, votes: 1 },
      { id: "b", enqueuedAt: 1, votes: 5 }
    ],
    0,
    W
  );
  assert.deepEqual(order.map((o) => o.position), [1, 2]);
  assert.equal(order[0].id, "b", "higher score first");
});

test("orderQueue does not mutate its input", () => {
  const entries = [{ id: "a", enqueuedAt: 0, votes: 1 }];
  const snapshot = JSON.parse(JSON.stringify(entries));
  orderQueue(entries, 5000, W);
  assert.deepEqual(entries, snapshot);
});

test("weights are venue-configurable — REQ-SCH-9", () => {
  const w = resolveWeights({ voteWeight: 1, boostWeight: 1000 });
  const voted = { id: "v", enqueuedAt: 0, votes: 50 };
  const paid = { id: "p", enqueuedAt: 0, boostUnits: 1 };
  const order = orderQueue([voted, paid], 0, w);
  assert.equal(order[0].id, "p", "a venue can make paid priority dominant");

  const w2 = resolveWeights({ voteWeight: 100, boostWeight: 1 });
  assert.equal(orderQueue([voted, paid], 0, w2)[0].id, "v", "or make votes dominant");
});

test("defaults match the specification", () => {
  assert.equal(DEFAULT_WEIGHTS.voteWeight, 10);
  assert.equal(DEFAULT_WEIGHTS.boostWeight, 25);
  assert.equal(DEFAULT_WEIGHTS.agingIntervalMs, 5 * MIN);
  assert.equal(DEFAULT_WEIGHTS.agingWeight, 3);
});
