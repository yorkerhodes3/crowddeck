// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Priority ordering — SPECIFICATION §3.2, REQ-SCH-6 … REQ-SCH-10.
 *
 * ## The one idea in this file
 *
 * Votes and paid boosts are **two inputs to one score**, not two competing
 * orderings. That is what lets payments arrive in v1.1 without touching the
 * scheduler (ADR-003): the boost term already exists, and enabling a payment
 * provider only changes how `boostUnits` gets populated.
 *
 * ## Why aging is not optional
 *
 * Without an aging term, an entry can be buried forever by a steady stream of
 * newer, more popular requests. Note the precise property: aging applies to
 * every entry equally, so it cannot separate two entries that arrived together —
 * what it does is guarantee that a **waiting** entry eventually outranks
 * **fresh arrivals**, which is the real starvation case in a busy room.
 *
 * A patron whose song never plays concludes the queue is rigged and stops using
 * it, so anti-starvation is a **correctness property** (REQ-SCH-8). That is why
 * `agingWeight` may not be configured to zero.
 */

/** Defaults from SPECIFICATION §3.2. All venue-configurable (REQ-SCH-9). */
export const DEFAULT_WEIGHTS = Object.freeze({
  voteWeight: 10,
  boostWeight: 25,
  agingIntervalMs: 5 * 60 * 1000,
  agingWeight: 3,
  // REQ-SCH-19. On by default, because the default has to be the fair one: a
  // venue should have to opt *out* of patrons taking turns, not opt in.
  rotatePatrons: true
});

/**
 * @typedef {object} Weights
 * @property {number} voteWeight
 * @property {number} boostWeight
 * @property {number} agingIntervalMs
 * @property {number} agingWeight
 * @property {boolean} rotatePatrons
 */

/**
 * @param {Partial<Weights>} [overrides]
 * @returns {Weights}
 */
export function resolveWeights(overrides = {}) {
  const w = { ...DEFAULT_WEIGHTS, ...overrides };

  if (!(w.agingIntervalMs > 0)) {
    throw new RangeError("agingIntervalMs must be > 0");
  }
  if (!(w.agingWeight > 0)) {
    // REQ-SCH-8 requires a non-zero, monotonically increasing aging term.
    // Accepting zero would silently reintroduce starvation.
    throw new RangeError(
      "agingWeight must be > 0: without it an unpopular request never plays (REQ-SCH-8)"
    );
  }
  if (w.voteWeight < 0 || w.boostWeight < 0) {
    throw new RangeError("voteWeight and boostWeight must be >= 0");
  }
  return Object.freeze(w);
}

/**
 * Score accrued purely by waiting.
 *
 * Stepped rather than continuous so ordering is stable between steps. A
 * continuously rising score would reshuffle the queue on every tick and make
 * "position in line" flicker for patrons.
 *
 * Because every entry ages at the same rate, this term does not reorder entries
 * that arrived together — it lets older entries overtake newer ones, which is
 * exactly the anti-starvation property REQ-SCH-8 asks for.
 *
 * @param {number} waitedMs
 * @param {Weights} w
 */
export function ageBonus(waitedMs, w) {
  if (waitedMs <= 0) return 0;
  return Math.floor(waitedMs / w.agingIntervalMs) * w.agingWeight;
}

/**
 * Compute an entry's priority score.
 *
 * Deterministic: identical inputs give an identical score. Wall-clock time
 * enters only through `nowMs`, supplied by the caller (REQ-SCH-10), which is
 * what makes the ordering reproducible and testable.
 *
 * @param {{votes?: number, boostUnits?: number, enqueuedAt: number}} entry
 * @param {number} nowMs
 * @param {Weights} w
 */
export function priorityScore(entry, nowMs, w) {
  const votes = entry.votes ?? 0;
  const boost = entry.boostUnits ?? 0;
  return votes * w.voteWeight + boost * w.boostWeight + ageBonus(nowMs - entry.enqueuedAt, w);
}

/**
 * Order entries into the effective play order.
 *
 * 1. Staff-pinned first, regardless of score (REQ-SCH-6) — staff overriding the
 *    crowd must always win.
 * 2. Then descending priority score.
 * 3. Then FIFO by enqueue time, so equal-scoring entries are fair.
 * 4. Then by id, to make the sort total and therefore deterministic.
 *
 * Finally, unless disabled, the unpinned entries are **rotated between patrons**
 * (REQ-SCH-19) so nobody holds consecutive positions while somebody else is still
 * waiting for a first turn.
 *
 * Returns a new array; the input is not mutated.
 *
 * @template {{id: string, enqueuedAt: number, staffPinned?: boolean, patronId?: string}} T
 * @param {T[]} entries
 * @param {number} nowMs
 * @param {Weights} [weights]
 * @returns {Array<T & {priorityScore: number, position: number}>}
 */
export function orderQueue(entries, nowMs, weights) {
  const w = weights ?? resolveWeights();

  const scored = entries
    .map((e) => ({ ...e, priorityScore: priorityScore(e, nowMs, w) }))
    .sort((a, b) => {
      const pinned = Number(b.staffPinned ?? false) - Number(a.staffPinned ?? false);
      if (pinned !== 0) return pinned;

      const score = b.priorityScore - a.priorityScore;
      if (score !== 0) return score;

      const fifo = a.enqueuedAt - b.enqueuedAt;
      if (fifo !== 0) return fifo;

      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

  const ordered = w.rotatePatrons ? rotateByPatron(scored) : scored;

  return ordered.map((e, i) => ({ ...e, position: i + 1 })); // 1-based — REQ-SCH-11
}

/**
 * Deal the queue out one entry per patron per round — REQ-SCH-19.
 *
 * Generalised from Karaoke Eternal's singer rotation. The array arrives already
 * sorted, so this only ever *reorders between patrons*: within one patron the
 * relative order is untouched, and the first round is taken in the order the
 * patrons' best entries already had. The strongest entry therefore still plays
 * first — rotation decides turn order, not who wins, or voting would stop meaning
 * anything.
 *
 * Two details that would otherwise be quiet bugs:
 *
 * - **Pinned entries are excluded and kept at the front.** Interleaving a patron
 *   between two staff-pinned tracks would break REQ-SCH-6, which is the one
 *   override staff have.
 * - **An entry with no patron is its own queue.** Anonymous entries — a fallback
 *   track, an imported set — would otherwise collapse into a single pseudo-patron
 *   who then takes one rotation slot for all of them, starving the real queue of
 *   fallback material.
 */
function rotateByPatron(scored) {
  const pinned = scored.filter((e) => e.staffPinned);
  const rest = scored.filter((e) => !e.staffPinned);

  /** @type {Map<string, object[]>} insertion-ordered, so round 1 follows the sort */
  const byPatron = new Map();
  let anonymous = 0;
  for (const e of rest) {
    // `undefined` and `null` are not one patron, they are unattributed entries.
    const key = e.patronId === undefined || e.patronId === null
      ? `\u0000anon:${anonymous++}`
      : `p:${e.patronId}`;
    const bucket = byPatron.get(key);
    if (bucket) bucket.push(e);
    else byPatron.set(key, [e]);
  }

  const out = [];
  const queues = [...byPatron.values()];
  let round = 0;
  while (out.length < rest.length) {
    let placed = false;
    for (const q of queues) {
      if (round < q.length) {
        out.push(q[round]);
        placed = true;
      }
    }
    // Cannot happen while out.length < rest.length, but an infinite loop here
    // would hang the scheduler rather than misorder it.
    if (!placed) break;
    round++;
  }

  return [...pinned, ...out];
}
