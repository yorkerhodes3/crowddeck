// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Finding records that will actually mix — DJX-19.
 *
 * "Show me tracks near this tempo" sounds like a tolerance to invent — ±5 BPM,
 * or ±10%. It is not. The deck already defines the answer exactly: a follower
 * can only be beat-matched if its tempo can be brought to the leader's **within
 * the pitch fader's travel**, which is ±8%. Beyond that the fader hits the end
 * stop and the decks drift apart no matter what the browse list promised.
 *
 * So compatibility here is not a heuristic. It asks `syncRate` — the same
 * function SYNC uses — whether the mix is reachable, and reports what the fader
 * would have to do to get there. A track this list calls mixable is one the SYNC
 * button will genuinely lock.
 *
 * Half and double time come along for free, because `syncRate` already folds
 * them: 140 over 70 is a legitimate double-time mix, and it is also what a tempo
 * detector produces when it lands on the wrong octave.
 */

import { DEFAULT_RATE_RANGE, syncRate } from "./mixer.js";

/**
 * Can `candidateBpm` be mixed under `leaderBpm`, and at what cost?
 *
 * @param {number|null} leaderBpm The tempo already playing.
 * @param {number|null} candidateBpm The tempo being considered.
 * @param {number} [rateRange] Pitch fader travel; ±8% by default.
 * @returns {{mixable: boolean, percent: number|null, doubleTime: boolean,
 *            rate: number|null, reason: string}}
 */
export function tempoMatch(leaderBpm, candidateBpm, rateRange = DEFAULT_RATE_RANGE) {
  const no = (reason) => ({ mixable: false, percent: null, doubleTime: false, rate: null, reason });

  if (!Number.isFinite(leaderBpm) || leaderBpm <= 0) return no("nothing playing to match");
  if (!Number.isFinite(candidateBpm) || candidateBpm <= 0) return no("tempo unknown");

  const result = syncRate(leaderBpm, candidateBpm, rateRange);
  if (!result) return no("outside the pitch fader's range");

  // How far the fader has to move, as a percentage of the record's own tempo.
  // Reported rather than the raw control value because "+3.2%" is what is
  // written on a pitch fader, and -1..1 is not.
  const percent = (result.ratio - 1) * 100;

  // A ratio near 2 or 0.5 before folding means the octaves differ. Recovered by
  // comparing the folded ratio against the raw one rather than by re-deriving
  // it, so this cannot disagree with what syncRate actually decided.
  const rawRatio = leaderBpm / candidateBpm;
  const doubleTime = Math.abs(Math.log2(rawRatio / result.ratio)) > 0.1;

  return {
    mixable: true,
    percent,
    doubleTime,
    rate: result.rate,
    reason: "ok"
  };
}

/**
 * The pitch move a match needs, written the way a fader is labelled.
 *
 * @param {{mixable: boolean, percent: number|null, doubleTime: boolean}} match
 * @returns {string}
 */
export function formatTempoMatch(match) {
  if (!match || !match.mixable) return "—";
  const sign = match.percent >= 0 ? "+" : "−";
  const body = `${sign}${Math.abs(match.percent).toFixed(1)}%`;
  return match.doubleTime ? `${body} ×2` : body;
}

/**
 * Order candidates by how little the pitch fader has to move.
 *
 * Mixable first, then by pitch distance, because a mix that needs 0.4% is
 * materially easier than one needing 7.9% — the latter is audibly sped up and
 * changes the character of the record. Unmixable and unknown tracks are kept
 * rather than dropped, so a filter never silently empties a library.
 *
 * @param {Array<{bpm: number|null}>} items
 * @param {number|null} leaderBpm
 * @param {number} [rateRange]
 * @returns {Array<object>} new array; the input is not mutated
 */
export function rankByTempo(items, leaderBpm, rateRange = DEFAULT_RATE_RANGE) {
  return items
    .map((item, index) => ({ item, index, match: tempoMatch(leaderBpm, item.bpm, rateRange) }))
    .sort((a, b) => {
      if (a.match.mixable !== b.match.mixable) return a.match.mixable ? -1 : 1;
      if (a.match.mixable && b.match.mixable) {
        const d = Math.abs(a.match.percent) - Math.abs(b.match.percent);
        if (Math.abs(d) > 1e-9) return d;
      }
      // Stable: equal candidates keep the order the search returned, which is by
      // popularity and is a better tie-break than whatever sort() would do.
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

/**
 * Run `worker` over `items`, at most `limit` at a time.
 *
 * Scanning tempo means downloading and decoding whole tracks. Unbounded, twenty
 * of those at once starves the audio thread of bandwidth and CPU **while music
 * is playing**, which is the one thing a DJ application must never do. Bounded,
 * it is a background trickle.
 *
 * Failures resolve as `null` rather than rejecting: one unreadable track must
 * not abandon the other nineteen.
 *
 * @param {Array<T>} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<R>} worker
 * @param {{signal?: {aborted: boolean}}} [opts]
 * @returns {Promise<Array<R|null>>}
 * @template T, R
 */
export async function mapWithLimit(items, limit, worker, opts = {}) {
  const results = new Array(items.length).fill(null);
  const width = Math.max(1, Math.min(limit | 0 || 1, items.length));
  let next = 0;

  const run = async () => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      if (opts.signal && opts.signal.aborted) return;
      try {
        results[index] = await worker(items[index], index);
      } catch {
        results[index] = null;
      }
    }
  };

  await Promise.all(Array.from({ length: width }, run));
  return results;
}
