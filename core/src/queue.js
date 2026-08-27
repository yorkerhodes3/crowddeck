// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Queue entry lifecycle — SPECIFICATION §3.1, REQ-SCH-1 … REQ-SCH-5.
 *
 * ```
 *                     ┌──────────► rejected
 *                     │
 * requested ──► screened ──► staged ──► cued ──► playing ──► played
 *                     │          │        │
 *                     │          │        └────► skipped
 *                     └──────────┴─────────────► expired
 * ```
 *
 * ## The rule this file exists to enforce
 *
 * **Crowd requests never reach the audio output on their own.** An entry can
 * only become audible by passing through `cued`, and only a DJ (attended) or the
 * autonomous mixer (unattended) may put it there (REQ-SCH-3, REQ-SCH-4).
 * Patrons cannot touch an entry once it is cued or playing (REQ-SCH-5).
 *
 * That single constraint is what lets a jukebox and a DJ rig share one set of
 * speakers instead of fighting over them — the part no existing product, open or
 * closed, implements.
 *
 * Every transition is recorded with a timestamp, actor and reason (REQ-SCH-1),
 * which is also the audit trail for staff overrides (REQ-POL-4).
 */

export const State = Object.freeze({
  REQUESTED: "requested",
  SCREENED: "screened",
  STAGED: "staged",
  CUED: "cued",
  PLAYING: "playing",
  PLAYED: "played",
  REJECTED: "rejected",
  EXPIRED: "expired",
  SKIPPED: "skipped"
});

export const Actor = Object.freeze({
  PATRON: "patron",
  POLICY: "policy",
  STAFF: "staff",
  DJ: "dj",
  ENGINE: "engine",
  SCHEDULER: "scheduler"
});

/** Entries that have not yet played and still occupy a patron's quota. */
export const PENDING_STATES = Object.freeze([
  State.REQUESTED,
  State.SCREENED,
  State.STAGED,
  State.CUED
]);

/** States from which nothing further can happen. */
export const TERMINAL_STATES = Object.freeze([
  State.PLAYED,
  State.REJECTED,
  State.EXPIRED,
  State.SKIPPED
]);

/**
 * Legal transitions, and who may perform them.
 *
 * Encoding the actor here rather than checking it at each call site means the
 * staging-lane guarantee cannot be bypassed by a new code path forgetting to
 * check — a patron simply has no legal transition into `cued`.
 */
const TRANSITIONS = Object.freeze({
  [State.REQUESTED]: {
    [State.SCREENED]: [Actor.POLICY, Actor.SCHEDULER],
    [State.REJECTED]: [Actor.POLICY, Actor.STAFF],
    [State.EXPIRED]: [Actor.SCHEDULER]
  },
  [State.SCREENED]: {
    // Autonomous mode promotes automatically; a DJ or staff may also stage.
    [State.STAGED]: [Actor.SCHEDULER, Actor.DJ, Actor.STAFF],
    [State.REJECTED]: [Actor.STAFF, Actor.POLICY],
    [State.EXPIRED]: [Actor.SCHEDULER]
  },
  [State.STAGED]: {
    // The staging lane gate. Deliberately not available to Actor.PATRON.
    [State.CUED]: [Actor.DJ, Actor.STAFF, Actor.SCHEDULER],
    // Policy may reject here too: REQ-POL-3 re-screens at cue time, because
    // dayparting can tighten between a request and its promotion.
    [State.REJECTED]: [Actor.STAFF, Actor.POLICY],
    [State.EXPIRED]: [Actor.SCHEDULER]
  },
  [State.CUED]: {
    [State.PLAYING]: [Actor.ENGINE, Actor.SCHEDULER],
    [State.SKIPPED]: [Actor.STAFF, Actor.DJ],
    [State.STAGED]: [Actor.DJ, Actor.STAFF] // un-cue, back to the lane
  },
  [State.PLAYING]: {
    [State.PLAYED]: [Actor.ENGINE, Actor.SCHEDULER],
    [State.SKIPPED]: [Actor.STAFF, Actor.DJ]
  }
});

export class InvalidTransition extends Error {
  constructor(from, to, actor) {
    super(
      TRANSITIONS[from]?.[to]
        ? `actor "${actor}" may not move an entry from ${from} to ${to}`
        : `illegal transition ${from} -> ${to}`
    );
    this.name = "InvalidTransition";
    this.from = from;
    this.to = to;
    this.actor = actor;
  }
}

/** @param {string} from @param {string} to @param {string} actor */
export function canTransition(from, to, actor) {
  const allowed = TRANSITIONS[from]?.[to];
  return Array.isArray(allowed) && allowed.includes(actor);
}

let seq = 0;

/**
 * A single request in the queue.
 *
 * Holds its own transition log so the audit trail cannot drift from the state.
 */
export class QueueEntry {
  /**
   * @param {object} args
   * @param {{id: string, title?: string, artist?: string, duration?: number}} args.track
   * @param {string} args.patronId
   * @param {number} args.nowMs
   * @param {string} [args.id]
   * @param {string} [args.venueId]
   */
  constructor(args) {
    this.id = args.id ?? `qe_${Date.now().toString(36)}_${(seq++).toString(36)}`;
    this.venueId = args.venueId ?? "default"; // REQ-DAT-1: present from day one
    this.track = args.track;
    this.trackId = args.track.id;
    this.patronId = args.patronId;
    this.enqueuedAt = args.nowMs;

    this.state = State.REQUESTED;
    this.votes = 0;
    this.boostUnits = 0;
    this.staffPinned = false;
    this.deckGroup = null;
    this.rejectReason = null;

    /** @type {Set<string>} patrons who have voted — REQ-SCH-17 */
    this.voters = new Set();
    /** @type {Array<{from: string, to: string, actor: string, reason: string|null, at: number}>} */
    this.events = [];
  }

  get pending() {
    return PENDING_STATES.includes(this.state);
  }

  get terminal() {
    return TERMINAL_STATES.includes(this.state);
  }

  /**
   * Move to a new state, or throw.
   *
   * @param {string} to
   * @param {{actor: string, nowMs: number, reason?: string}} opts
   */
  transition(to, opts) {
    const { actor, nowMs, reason = null } = opts;
    if (!canTransition(this.state, to, actor)) {
      throw new InvalidTransition(this.state, to, actor);
    }
    const from = this.state;
    this.state = to;
    if (to === State.REJECTED || to === State.EXPIRED) this.rejectReason = reason;
    this.events.push({ from, to, actor, reason, at: nowMs });
    return this;
  }

  /** @param {string} patronId @param {number} nowMs */
  addVote(patronId, nowMs) {
    if (this.voters.has(patronId)) return false;
    this.voters.add(patronId);
    this.votes = this.voters.size;
    this.events.push({ from: this.state, to: this.state, actor: Actor.PATRON, reason: "vote", at: nowMs });
    return true;
  }

  /** @param {number} units @param {number} nowMs */
  addBoost(units, nowMs) {
    if (!Number.isInteger(units) || units <= 0) {
      throw new RangeError("boost units must be a positive integer");
    }
    this.boostUnits += units;
    this.events.push({ from: this.state, to: this.state, actor: Actor.PATRON, reason: "boost", at: nowMs });
    return this.boostUnits;
  }

  /** Public projection — never leaks voter identities. */
  toPublic(position = null) {
    return {
      id: this.id,
      track: {
        id: this.track.id,
        title: this.track.title ?? null,
        artist: this.track.artist ?? null,
        duration: this.track.duration ?? null
      },
      state: this.state,
      votes: this.votes,
      boostUnits: this.boostUnits,
      staffPinned: this.staffPinned,
      enqueuedAt: this.enqueuedAt,
      position
    };
  }
}
