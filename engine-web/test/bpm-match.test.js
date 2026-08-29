// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Tempo matching in the browse list — DJX-19.
 *
 * The compatibility question is not a tolerance somebody invented; it is whether
 * the pitch fader can physically reach the tempo. These tests pin that to the
 * fader's actual travel, so a browse list can never promise a mix that the SYNC
 * button then refuses.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RATE_RANGE } from "../src/mixer.js";
import { formatTempoMatch, mapWithLimit, rankByTempo, tempoMatch } from "../src/bpm-match.js";

/* ------------------------------------------------------------ tempoMatch */

test("an identical tempo needs no pitch change at all", () => {
  const m = tempoMatch(128, 128);
  assert.equal(m.mixable, true);
  assert.ok(Math.abs(m.percent) < 1e-9);
  assert.equal(m.doubleTime, false);
});

test("a tempo inside the fader's travel is mixable, and says by how much", () => {
  // 124 under 128 is +3.2%, comfortably inside ±8%.
  const m = tempoMatch(128, 124);
  assert.equal(m.mixable, true);
  assert.ok(Math.abs(m.percent - 3.2258) < 0.01, `got ${m.percent}`);
});

test("a tempo beyond the fader's travel is refused, not rounded to the end stop", () => {
  // 110 under 128 needs +16%: the fader stops at 8, so the decks would drift
  // apart no matter what a browse list claimed.
  const m = tempoMatch(128, 110);
  assert.equal(m.mixable, false);
  assert.match(m.reason, /pitch fader/);
});

test("the boundary agrees exactly with the pitch fader's range", () => {
  // Pins the definition to the fader rather than to a number typed here. If
  // DEFAULT_RATE_RANGE changes, this follows it.
  const leader = 128;
  const justInside = leader / (1 + DEFAULT_RATE_RANGE * 0.999);
  const justOutside = leader / (1 + DEFAULT_RATE_RANGE * 1.001);
  assert.equal(tempoMatch(leader, justInside).mixable, true, "just inside should mix");
  assert.equal(tempoMatch(leader, justOutside).mixable, false, "just outside should not");
});

test("double time mixes, and is labelled as such", () => {
  // 70 under 140 is a legitimate double-time mix, and it is also what a tempo
  // detector produces when it lands on the wrong octave.
  const m = tempoMatch(140, 70);
  assert.equal(m.mixable, true);
  assert.equal(m.doubleTime, true);
  assert.ok(Math.abs(m.percent) < 1e-9, "an exact octave needs no pitch change");
});

test("half time mixes too", () => {
  const m = tempoMatch(70, 140);
  assert.equal(m.mixable, true);
  assert.equal(m.doubleTime, true);
});

test("an unknown tempo is not mixable, and explains itself", () => {
  // Reached constantly: nothing is playing, or the scan has not run.
  assert.equal(tempoMatch(null, 128).mixable, false);
  assert.match(tempoMatch(null, 128).reason, /nothing playing/);
  assert.equal(tempoMatch(128, null).mixable, false);
  assert.match(tempoMatch(128, null).reason, /unknown/);
  assert.equal(tempoMatch(0, 128).mixable, false);
  assert.equal(tempoMatch(128, NaN).mixable, false);
});

test("a match reads the way a pitch fader is labelled", () => {
  assert.equal(formatTempoMatch(tempoMatch(128, 128)), "+0.0%");
  assert.equal(formatTempoMatch(tempoMatch(128, 124)), "+3.2%");
  assert.equal(formatTempoMatch(tempoMatch(124, 128)), "−3.1%");
  assert.equal(formatTempoMatch(tempoMatch(140, 70)), "+0.0% ×2");
  assert.equal(formatTempoMatch(tempoMatch(128, 110)), "—");
  assert.equal(formatTempoMatch(null), "—");
});

/* ------------------------------------------------------------ rankByTempo */

test("the easiest mixes come first, and nothing is dropped", () => {
  const items = [
    { id: "far", bpm: 110 },
    { id: "close", bpm: 127 },
    { id: "unknown", bpm: null },
    { id: "exact", bpm: 128 },
    { id: "near", bpm: 124 }
  ];
  const ranked = rankByTempo(items, 128).map((i) => i.id);
  assert.deepEqual(ranked.slice(0, 3), ["exact", "close", "near"]);
  // A filter that silently empties the library is worse than an unhelpful order.
  assert.equal(ranked.length, items.length);
  assert.ok(ranked.includes("far") && ranked.includes("unknown"));
});

test("ranking does not mutate the caller's array", () => {
  const items = [{ id: "a", bpm: 110 }, { id: "b", bpm: 128 }];
  const before = items.map((i) => i.id);
  rankByTempo(items, 128);
  assert.deepEqual(items.map((i) => i.id), before);
});

test("with nothing playing, the search order is preserved exactly", () => {
  // The Archive returns results by popularity, which is a better order than any
  // reshuffle we could invent when there is no tempo to match against.
  const items = [{ id: "a", bpm: 90 }, { id: "b", bpm: 128 }, { id: "c", bpm: null }];
  assert.deepEqual(rankByTempo(items, null).map((i) => i.id), ["a", "b", "c"]);
});

test("equally good matches keep their original order", () => {
  const items = [{ id: "first", bpm: 128 }, { id: "second", bpm: 128 }];
  assert.deepEqual(rankByTempo(items, 128).map((i) => i.id), ["first", "second"]);
});

/* ----------------------------------------------------------- mapWithLimit */

test("concurrency is actually bounded", () => {
  // Not decoration: each of these downloads and decodes a track. Twenty at once
  // starves the audio thread while music is playing, which is the one thing this
  // application must never do.
  let live = 0;
  let peak = 0;
  const items = Array.from({ length: 20 }, (_, i) => i);
  return mapWithLimit(items, 4, async (n) => {
    live += 1;
    peak = Math.max(peak, live);
    await new Promise((r) => setTimeout(r, 1));
    live -= 1;
    return n * 2;
  }).then((results) => {
    assert.ok(peak <= 4, `ran ${peak} at once`);
    assert.equal(results.length, 20);
    assert.equal(results[5], 10, "results must land at their own index");
  });
});

test("one failure does not abandon the rest", async () => {
  const results = await mapWithLimit([1, 2, 3, 4], 2, async (n) => {
    if (n === 2) throw new Error("unreadable track");
    return n;
  });
  assert.deepEqual(results, [1, null, 3, 4]);
});

test("results keep their input positions regardless of completion order", async () => {
  // Workers finish out of order by design; if results were pushed rather than
  // indexed, every tempo would be attached to the wrong record.
  const results = await mapWithLimit([30, 1, 20, 2], 4, async (ms, i) => {
    await new Promise((r) => setTimeout(r, ms));
    return i;
  });
  assert.deepEqual(results, [0, 1, 2, 3]);
});

test("an aborted scan stops early rather than running to completion", async () => {
  const signal = { aborted: false };
  let done = 0;
  const items = Array.from({ length: 50 }, (_, i) => i);
  const p = mapWithLimit(items, 2, async (n) => {
    done += 1;
    if (done === 4) signal.aborted = true;
    return n;
  }, { signal });
  await p;
  assert.ok(done < 50, `ran ${done} of 50 after abort`);
});

test("an empty list is not an error", async () => {
  assert.deepEqual(await mapWithLimit([], 4, async () => 1), []);
});

test("a nonsense concurrency still makes progress", async () => {
  // 0 or NaN must not mean "never start a worker", which would hang the scan.
  assert.deepEqual(await mapWithLimit([1, 2], 0, async (n) => n), [1, 2]);
  assert.deepEqual(await mapWithLimit([1, 2], NaN, async (n) => n), [1, 2]);
});
