// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

import { test } from "node:test";
import assert from "node:assert/strict";
import { RejectReason, checkRequest, checkVote, resolveFairness } from "../src/fairness.js";

const CFG = resolveFairness();
const MIN = 60 * 1000;

/** @param {Partial<Parameters<typeof checkRequest>[0]>} [over] */
function args(over = {}) {
  return {
    track: { id: "t1", artist: "Artist A" },
    patronId: "p1",
    nowMs: 10 * MIN,
    pending: [],
    recentPlays: [],
    patronRequestTimes: [],
    config: CFG,
    ...over
  };
}

test("a clean request is allowed", () => {
  assert.equal(checkRequest(args()).allowed, true);
});

test("a patron is capped at maxPendingPerPatron — AC-5", () => {
  const pending = [
    { trackId: "x", patronId: "p1", state: "staged" },
    { trackId: "y", patronId: "p1", state: "screened" }
  ];
  const d = checkRequest(args({ pending }));
  assert.equal(d.allowed, false);
  assert.equal(d.reason, RejectReason.PATRON_LIMIT);
  assert.ok(d.detail.length > 0, "a rejection must explain itself — REQ-SCH-18");
});

test("another patron's pending entries do not count against you", () => {
  const pending = [
    { trackId: "x", patronId: "p2", state: "staged" },
    { trackId: "y", patronId: "p3", state: "staged" }
  ];
  assert.equal(checkRequest(args({ pending })).allowed, true);
});

test("a track already in the queue cannot be queued twice", () => {
  const pending = [{ trackId: "t1", patronId: "p9", state: "staged" }];
  const d = checkRequest(args({ pending }));
  assert.equal(d.allowed, false);
  assert.equal(d.reason, RejectReason.ALREADY_QUEUED);
});

test("track cooldown blocks a recent replay venue-wide — AC-6", () => {
  const recentPlays = [{ trackId: "t1", artist: "Artist A", endedAt: 5 * MIN }];
  const d = checkRequest(args({ recentPlays, nowMs: 15 * MIN }));
  assert.equal(d.allowed, false);
  assert.equal(d.reason, RejectReason.TRACK_COOLDOWN);
  assert.ok(d.retryAfterMs > 0, "should say when it becomes available again");
});

test("track cooldown expires", () => {
  const recentPlays = [{ trackId: "t1", artist: "Artist A", endedAt: 0 }];
  assert.equal(checkRequest(args({ recentPlays, nowMs: 61 * MIN })).allowed, true);
});

test("artist cooldown blocks a different track by the same artist", () => {
  const recentPlays = [{ trackId: "other", artist: "Artist A", endedAt: 10 * MIN }];
  const d = checkRequest(args({ recentPlays, nowMs: 20 * MIN }));
  assert.equal(d.allowed, false);
  assert.equal(d.reason, RejectReason.ARTIST_COOLDOWN);
});

test("artist matching ignores case and a leading 'The'", () => {
  const recentPlays = [{ trackId: "other", artist: "the beatles", endedAt: 10 * MIN }];
  const d = checkRequest(
    args({
      track: { id: "t2", artist: "The Beatles" },
      recentPlays,
      nowMs: 20 * MIN
    })
  );
  assert.equal(d.allowed, false, "'The Beatles' and 'the beatles' share a cooldown");
  assert.equal(d.reason, RejectReason.ARTIST_COOLDOWN);
});

test("a different artist is unaffected by another's cooldown", () => {
  const recentPlays = [{ trackId: "other", artist: "Artist B", endedAt: 10 * MIN }];
  assert.equal(checkRequest(args({ recentPlays, nowMs: 20 * MIN })).allowed, true);
});

test("rate limiting counts only requests inside the window", () => {
  // Five requests, but all older than the 15-minute window.
  const old = [0, 1, 2, 3, 4].map((i) => i * MIN);
  assert.equal(checkRequest(args({ patronRequestTimes: old, nowMs: 60 * MIN })).allowed, true);

  // Five inside the window trips the limit.
  const recent = [50, 51, 52, 53, 54].map((i) => i * MIN);
  const d = checkRequest(args({ patronRequestTimes: recent, nowMs: 55 * MIN }));
  assert.equal(d.allowed, false);
  assert.equal(d.reason, RejectReason.RATE_LIMIT);
  assert.ok(d.retryAfterMs > 0);
});

test("a track with no artist skips the artist cooldown", () => {
  const recentPlays = [{ trackId: "other", artist: "Artist A", endedAt: 10 * MIN }];
  const d = checkRequest(args({ track: { id: "t2" }, recentPlays, nowMs: 20 * MIN }));
  assert.equal(d.allowed, true);
});

test("one vote per patron per entry — REQ-SCH-17", () => {
  const entry = { voters: new Set(["p1"]) };
  assert.equal(checkVote(entry, "p2").allowed, true);
  const d = checkVote(entry, "p1");
  assert.equal(d.allowed, false);
  assert.equal(d.reason, RejectReason.DUPLICATE_VOTE);
});

test("checkVote accepts an array of voters as well as a Set", () => {
  assert.equal(checkVote({ voters: ["p1"] }, "p1").allowed, false);
  assert.equal(checkVote({ voters: [] }, "p1").allowed, true);
  assert.equal(checkVote({}, "p1").allowed, true);
});

test("fairness config is validated", () => {
  assert.throws(() => resolveFairness({ maxPendingPerPatron: 0 }), RangeError);
  assert.throws(() => resolveFairness({ rateLimitCount: 0 }), RangeError);
});

test("defaults match the specification", () => {
  assert.equal(CFG.maxPendingPerPatron, 2);
  assert.equal(CFG.trackCooldownMs, 60 * MIN);
  assert.equal(CFG.artistCooldownMs, 30 * MIN);
  assert.equal(CFG.rateLimitCount, 5);
  assert.equal(CFG.rateLimitWindowMs, 15 * MIN);
});
