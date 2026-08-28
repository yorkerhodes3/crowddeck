// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The Unified Scheduler — SPECIFICATION §3, Domain C.
 *
 * This is the novelty. No product surveyed, open or closed, spans both halves:
 * DJ software gives the audience no voice, and jukebox platforms give the music
 * no craft. The scheduler is what lets them share one set of speakers.
 *
 * ## One queue, two consumers
 *
 * Requests land in a **staging lane**. In `attended` mode a DJ promotes from it;
 * in `autonomous` mode the mixer drains it automatically. Same queue, same
 * fairness rules, same policy — only the consumer differs (REQ-SCH-3/4).
 *
 * ## What this file does not do
 *
 * It holds no persistence and touches no audio. It emits *intents*
 * (`cue`, `play`, `preload`) that an engine adapter turns into CDEP calls. That
 * keeps the interesting logic pure and testable with a fake clock, and keeps
 * the Apache-2.0 core clear of anything engine-specific (ADR-001).
 */

import { EventEmitter } from "node:events";
import { QueueEntry, State, Actor, PENDING_STATES } from "./queue.js";
import { orderQueue, resolveWeights } from "./priority.js";
import { checkRequest, checkVote, resolveFairness } from "./fairness.js";
import { resolvePolicy, screen } from "./policy.js";

export const Mode = Object.freeze({
  AUTONOMOUS: "autonomous",
  ATTENDED: "attended"
});

/** Max dead air permitted in any queue state — REQ-FALL-3. */
export const MAX_DEAD_AIR_MS = 2000;

export class Scheduler extends EventEmitter {
  /**
   * @param {object} [opts]
   * @param {string} [opts.venueId]
   * @param {() => number} [opts.now] injectable clock — keeps ordering deterministic (REQ-SCH-10)
   * @param {object} [opts.weights]
   * @param {object} [opts.fairness]
   * @param {object} [opts.policy]
   * @param {string} [opts.mode]
   * @param {() => (object|null)} [opts.fallbackProvider] supplies a track when the queue empties
   */
  constructor(opts = {}) {
    super();
    this.venueId = opts.venueId ?? "default";
    this.now = opts.now ?? (() => Date.now());
    this.weights = resolveWeights(opts.weights);
    this.fairness = resolveFairness(opts.fairness);
    this.policy = resolvePolicy(opts.policy);
    this.mode = opts.mode ?? Mode.AUTONOMOUS;
    this.fallbackProvider = opts.fallbackProvider ?? (() => null);

    /** @type {Map<string, QueueEntry>} */
    this.entries = new Map();
    /** @type {Array<{trackId: string, artist?: string, endedAt: number}>} */
    this.recentPlays = [];
    /** @type {Map<string, number[]>} patronId -> request timestamps */
    this.requestTimes = new Map();

    /** The entry currently audible, if any. */
    this.nowPlaying = null;
    /** Entry handed to the engine as the gapless follower. */
    this.preloaded = null;
  }

  /* ------------------------------------------------------------ queries */

  /** Entries not yet played, in effective play order with 1-based positions. */
  ordered() {
    const pending = [...this.entries.values()].filter((e) => e.pending);
    return orderQueue(pending, this.now(), this.weights);
  }

  /** The patron-facing queue — REQ-SCH-11, REQ-SCH-12. */
  publicQueue() {
    return this.ordered().map((o) => this.entries.get(o.id).toPublic(o.position));
  }

  /** A patron's position in line, or null if they have nothing queued. */
  positionOf(entryId) {
    const found = this.ordered().find((o) => o.id === entryId);
    return found ? found.position : null;
  }

  /** Entries a DJ can promote — the staging lane. */
  stagingLane() {
    return this.ordered()
      .filter((o) => this.entries.get(o.id).state === State.STAGED)
      .map((o) => this.entries.get(o.id).toPublic(o.position));
  }

  /* ------------------------------------------------------------ requests */

  /**
   * A patron requests a track.
   *
   * Runs the policy gate then the fairness gate, and either enqueues or returns
   * a specific reason (REQ-SCH-18).
   *
   * `actor: Actor.STAFF` skips the **fairness** gate but never the **policy**
   * gate, and the difference is the whole point. Fairness limits exist so one
   * patron cannot monopolise the queue — a courtesy rule, and applying it to
   * staff would stop a bartender queueing the next hour, which is a normal thing
   * to want. Policy is a legal control: licensing and explicit-content rules bind
   * a venue no matter who pressed the button, so no actor is exempt from them.
   *
   * @param {{track: object, patronId: string, context?: object, actor?: string}} args
   * @returns {{ok: true, entry: QueueEntry, position: number} | {ok: false, reason: string, detail: string, retryAfterMs?: number}}
   */
  request({ track, patronId, context = {}, actor = Actor.PATRON }) {
    const nowMs = this.now();

    const policyDecision = screen({ track, policy: this.policy, context });
    if (!policyDecision.allowed) {
      this.emit("rejected", { track, patronId, ...policyDecision });
      return { ok: false, reason: policyDecision.reason, detail: policyDecision.detail };
    }

    const pending = [...this.entries.values()]
      .filter((e) => e.pending)
      .map((e) => ({ trackId: e.trackId, patronId: e.patronId, state: e.state }));

    // Staff and DJs are not subject to the patron quota — see the note above.
    const exemptFromFairness = actor === Actor.STAFF || actor === Actor.DJ;

    const fairnessDecision = exemptFromFairness
      ? { allowed: true }
      : checkRequest({
          track,
          patronId,
          nowMs,
          pending,
          recentPlays: this.recentPlays,
          patronRequestTimes: this.requestTimes.get(patronId) ?? [],
          config: this.fairness
        });
    if (!fairnessDecision.allowed) {
      this.emit("rejected", { track, patronId, ...fairnessDecision });
      return {
        ok: false,
        reason: fairnessDecision.reason,
        detail: fairnessDecision.detail,
        ...(fairnessDecision.retryAfterMs === undefined
          ? {}
          : { retryAfterMs: fairnessDecision.retryAfterMs })
      };
    }

    const entry = new QueueEntry({ track, patronId, nowMs, venueId: this.venueId });
    this.entries.set(entry.id, entry);

    const times = this.requestTimes.get(patronId) ?? [];
    times.push(nowMs);
    this.requestTimes.set(patronId, times);

    // Screened immediately: policy already passed.
    entry.transition(State.SCREENED, { actor: Actor.POLICY, nowMs });

    // In autonomous mode nothing stands between screened and staged.
    if (this.mode === Mode.AUTONOMOUS) {
      entry.transition(State.STAGED, { actor: Actor.SCHEDULER, nowMs, reason: "autonomous" });
    } else {
      entry.transition(State.STAGED, { actor: Actor.SCHEDULER, nowMs, reason: "staging lane" });
    }

    this.emit("queued", entry);
    this.#emitQueueChanged();
    return { ok: true, entry, position: this.positionOf(entry.id) };
  }

  /** @param {string} entryId @param {string} patronId */
  vote(entryId, patronId) {
    const entry = this.entries.get(entryId);
    if (!entry) return { ok: false, reason: "unknown_entry", detail: "That song is no longer queued." };
    if (!entry.pending) {
      return { ok: false, reason: "not_pending", detail: "That song is already playing or finished." };
    }
    const decision = checkVote(entry, patronId);
    if (!decision.allowed) {
      return { ok: false, reason: decision.reason, detail: decision.detail };
    }
    entry.addVote(patronId, this.now());
    this.emit("voted", entry);
    this.#emitQueueChanged();
    return { ok: true, votes: entry.votes, position: this.positionOf(entryId) };
  }

  /**
   * Spend credits to raise an entry's priority.
   *
   * v1 has no payment rails (ADR-003); credits enter the ledger only by staff
   * grant or promotion. The scheduler is deliberately indifferent to where they
   * came from, which is why enabling payments later needs no change here.
   */
  boost(entryId, units = 1) {
    const entry = this.entries.get(entryId);
    if (!entry) return { ok: false, reason: "unknown_entry", detail: "That song is no longer queued." };
    if (!entry.pending) {
      return { ok: false, reason: "not_pending", detail: "That song is already playing or finished." };
    }
    entry.addBoost(units, this.now());
    this.emit("boosted", entry);
    this.#emitQueueChanged();
    return { ok: true, boostUnits: entry.boostUnits, position: this.positionOf(entryId) };
  }

  /* -------------------------------------------------------------- staff */

  pin(entryId, pinned = true) {
    const entry = this.#require(entryId);
    entry.staffPinned = pinned;
    this.#emitQueueChanged();
    return entry;
  }

  reject(entryId, reason = "staff") {
    const entry = this.#require(entryId);
    entry.transition(State.REJECTED, { actor: Actor.STAFF, nowMs: this.now(), reason });
    this.emit("rejected", { entry, reason });
    this.#emitQueueChanged();
    return entry;
  }

  /* ------------------------------------------------- promotion and play */

  /**
   * Promote a staged entry to cued.
   *
   * The gate that keeps crowd requests off the speakers (REQ-SCH-3, AC-1).
   * In attended mode the caller must be a DJ or staff; the scheduler may only do
   * it itself when running autonomously.
   *
   * @param {string} entryId
   * @param {{actor?: string, deckGroup?: string}} [opts]
   */
  promote(entryId, opts = {}) {
    const entry = this.#require(entryId);
    const nowMs = this.now();
    const actor = opts.actor ?? (this.mode === Mode.AUTONOMOUS ? Actor.SCHEDULER : Actor.DJ);

    if (this.mode === Mode.ATTENDED && actor === Actor.SCHEDULER) {
      throw new Error(
        "in attended mode a DJ must promote from the staging lane (REQ-SCH-3)"
      );
    }

    // Re-screen: dayparting may have changed since the request — REQ-POL-3.
    const decision = screen({ track: entry.track, policy: this.policy, context: opts.context ?? {} });
    if (!decision.allowed) {
      entry.transition(State.REJECTED, { actor: Actor.POLICY, nowMs, reason: decision.reason });
      this.emit("rejected", { entry, ...decision });
      this.#emitQueueChanged();
      return { ok: false, reason: decision.reason, detail: decision.detail };
    }

    entry.transition(State.CUED, { actor, nowMs });
    entry.deckGroup = opts.deckGroup ?? null;
    this.emit("cue", entry);
    this.#emitQueueChanged();
    return { ok: true, entry };
  }

  /** Mark a cued entry as audible. Normally driven by an engine event. */
  markPlaying(entryId) {
    const entry = this.#require(entryId);
    entry.transition(State.PLAYING, { actor: Actor.ENGINE, nowMs: this.now() });
    this.nowPlaying = entry;
    if (this.preloaded?.id === entry.id) this.preloaded = null;
    this.emit("nowPlaying", entry);
    this.#emitQueueChanged();
    return entry;
  }

  /** Mark the playing entry finished and record it for cooldown purposes. */
  markPlayed(entryId) {
    const entry = this.#require(entryId);
    const nowMs = this.now();
    entry.transition(State.PLAYED, { actor: Actor.ENGINE, nowMs });
    this.recentPlays.push({
      trackId: entry.trackId,
      artist: entry.track.artist,
      endedAt: nowMs
    });
    if (this.nowPlaying?.id === entry.id) this.nowPlaying = null;
    this.emit("played", entry);
    this.#emitQueueChanged();
    return entry;
  }

  skip(entryId, actor = Actor.STAFF) {
    const entry = this.#require(entryId);
    const nowMs = this.now();
    entry.transition(State.SKIPPED, { actor, nowMs, reason: "skipped" });
    // A skip still counts as played for cooldown: the room heard some of it.
    this.recentPlays.push({ trackId: entry.trackId, artist: entry.track.artist, endedAt: nowMs });
    if (this.nowPlaying?.id === entry.id) this.nowPlaying = null;
    this.emit("skipped", entry);
    this.#emitQueueChanged();
    return entry;
  }

  /* ---------------------------------------------------- mode and handoff */

  /**
   * Switch mode without interrupting audio — REQ-MODE-1..4, AC-3.
   *
   * Nothing here touches the currently playing entry. A handoff mid-track is
   * invisible to the room, which is the whole point: a DJ arriving at 21:00 must
   * not cause a gap.
   */
  setMode(mode, { actor = Actor.STAFF } = {}) {
    if (![Mode.AUTONOMOUS, Mode.ATTENDED].includes(mode)) {
      throw new RangeError(`unknown mode "${mode}"`);
    }
    if (mode === this.mode) return this.mode;

    const previous = this.mode;
    this.mode = mode;
    this.emit("mode", { from: previous, to: mode, actor, nowPlaying: this.nowPlaying });

    // Entering autonomous resumes automatic promotion from the current state.
    if (mode === Mode.AUTONOMOUS) this.tick();
    return this.mode;
  }

  /* ---------------------------------------------------------------- tick */

  /**
   * Advance the scheduler.
   *
   * In autonomous mode this drains the staging lane and keeps a follower
   * preloaded so the engine can continue gaplessly (REQ-FALL-3, AC-2).
   * In attended mode it does nothing but report: the DJ is in charge.
   *
   * Idempotent — safe to call on a timer or on every engine event.
   */
  tick() {
    if (this.mode !== Mode.AUTONOMOUS) return { promoted: [], preloaded: null };

    const promoted = [];

    // Ensure something is cued or playing.
    if (!this.nowPlaying && !this.#hasCued()) {
      const next = this.#nextStaged() ?? this.#fallbackEntry();
      if (next) {
        const r = this.promote(next.id, { actor: Actor.SCHEDULER });
        if (r.ok) promoted.push(r.entry);
      }
    }

    // Keep one follower ready so the engine never runs dry.
    if (!this.preloaded) {
      const follower = this.#nextStaged();
      if (follower) {
        this.preloaded = follower;
        this.emit("preload", follower);
      }
    }

    return { promoted, preloaded: this.preloaded };
  }

  /**
   * Called when the engine reports the deck went empty.
   * Guarantees the room does not stay silent — REQ-FALL-1, REQ-FALL-3, AC-8.
   */
  onDeckEmpty() {
    // The engine has nothing chained, so any notion of a preloaded follower is
    // stale. Clearing it first prevents a follower that was never actually
    // handed to the engine from being stranded and never played.
    this.preloaded = null;

    const next = this.#nextStaged() ?? this.#fallbackEntry();
    if (!next) {
      this.emit("silent", { reason: "no_fallback_available" });
      return null;
    }
    const r = this.promote(next.id, { actor: Actor.SCHEDULER });
    return r.ok ? r.entry : null;
  }

  /* ------------------------------------------------------------ internals */

  #hasCued() {
    for (const e of this.entries.values()) if (e.state === State.CUED) return true;
    return false;
  }

  #nextStaged() {
    const ordered = this.ordered();
    for (const o of ordered) {
      const entry = this.entries.get(o.id);
      if (entry.state === State.STAGED && entry.id !== this.preloaded?.id) return entry;
    }
    return null;
  }

  /**
   * Pull a fallback track so the room never goes silent — REQ-FALL-1/2.
   * Fallback selections pass the same policy screening as patron requests.
   */
  #fallbackEntry() {
    const track = this.fallbackProvider();
    if (!track) return null;

    const decision = screen({ track, policy: this.policy });
    if (!decision.allowed) {
      this.emit("fallbackRejected", { track, ...decision });
      return null;
    }

    const nowMs = this.now();
    const entry = new QueueEntry({
      track,
      patronId: "__fallback__",
      nowMs,
      venueId: this.venueId
    });
    entry.isFallback = true;
    this.entries.set(entry.id, entry);
    entry.transition(State.SCREENED, { actor: Actor.POLICY, nowMs, reason: "fallback" });
    entry.transition(State.STAGED, { actor: Actor.SCHEDULER, nowMs, reason: "fallback" });
    this.emit("fallback", entry);
    return entry;
  }

  #require(entryId) {
    const entry = this.entries.get(entryId);
    if (!entry) throw new Error(`unknown queue entry "${entryId}"`);
    return entry;
  }

  #emitQueueChanged() {
    // Position changes must reach patrons in real time — REQ-SCH-12.
    this.emit("queueChanged", this.publicQueue());
  }
}

export { State, Actor, PENDING_STATES };
