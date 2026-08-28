// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Live MIDI instruments as queueable sources — REQ-INST-1, REQ-INST-2.
 *
 * ## The brief's distinguishing idea, taken to its conclusion
 *
 * Every DJ application treats MIDI as a *control surface*: a way to read knobs.
 * The original brief asked for something else — MIDI as an interface to
 * **musical instruments and other song source content**.
 *
 * So a keyboard, groovebox or drum machine is registered as a **source**, and a
 * performance on it becomes a queue entry like any track. It is scheduled by the
 * same scheduler, screened by the same policy, ordered by the same priority
 * function, and shown to patrons in the same queue with a position in line.
 *
 * Two consequences worth stating:
 *
 * **The room stays in time.** The instrument follows the leader deck's MIDI
 * clock, so a live performance sits on the same timeline as recorded tracks
 * rather than fighting them.
 *
 * **The room never goes silent.** A live slot has a duration, and if the
 * performer stops early the never-silent fallback takes over (REQ-INST-2,
 * REQ-FALL-3). A human forgetting to finish is not allowed to become dead air.
 */

import { EventEmitter } from "node:events";
import { LicenceClass } from "../../core/src/policy.js";
import { decodeMessage } from "./ports.js";

/** How long a live slot runs if nobody specifies — a sensible single-song length. */
export const DEFAULT_SLOT_SEC = 240;

/** Silence after which an unattended live slot is considered abandoned. */
export const IDLE_TIMEOUT_SEC = 30;

export class InstrumentSource extends EventEmitter {
  /**
   * @param {object} opts
   * @param {string} opts.portIdentity   the MIDI port this instrument is on
   * @param {string} opts.name           shown to patrons, e.g. "Live — Nina's SP-404"
   * @param {string} [opts.performer]
   * @param {number} [opts.durationSec]
   * @param {() => number} [opts.now]
   */
  constructor(opts) {
    super();
    this.portIdentity = opts.portIdentity;
    this.name = opts.name;
    this.performer = opts.performer ?? null;
    this.durationSec = opts.durationSec ?? DEFAULT_SLOT_SEC;
    this.now = opts.now ?? (() => Date.now());

    this.id = `live:${opts.portIdentity}`;
    this.active = false;
    this.startedAt = null;
    this.lastActivityAt = null;
    this.noteCount = 0;
  }

  /**
   * A track-shaped view, so the scheduler and every client can treat a live
   * performance exactly like a recording without special cases.
   *
   * `duration` is milliseconds, because that is what a track carries everywhere
   * else (`duration_ms` in the schema, and what every provider emits). The slot
   * itself is booked in seconds, which reads better for a human setting it, so the
   * conversion happens here rather than leaking a second unit into the queue.
   *
   * Licence class is `owned_local`: an original live performance needs no
   * recording licence, though the venue's live-performance licensing is a
   * separate matter it already tracks.
   */
  toTrack() {
    return {
      id: this.id,
      title: this.name,
      artist: this.performer ?? "Live",
      genre: "Live",
      duration: this.durationSec * 1000,
      explicit: false,
      licenceClass: LicenceClass.OWNED_LOCAL,
      isLive: true,
      portIdentity: this.portIdentity
    };
  }

  begin() {
    this.active = true;
    this.startedAt = this.now();
    this.lastActivityAt = this.startedAt;
    this.noteCount = 0;
    this.emit("begin", this.toTrack());
  }

  end(reason = "completed") {
    if (!this.active) return;
    this.active = false;
    this.emit("end", { reason, notes: this.noteCount });
  }

  /** Feed inbound MIDI so activity and idleness can be judged. */
  observe(data) {
    if (!this.active) return;
    const event = decodeMessage(data);
    if (!event) return;
    if (event.kind === "note" && event.value > 0) this.noteCount++;
    this.lastActivityAt = this.now();
  }

  get elapsedSec() {
    return this.startedAt === null ? 0 : (this.now() - this.startedAt) / 1000;
  }

  get idleSec() {
    return this.lastActivityAt === null ? 0 : (this.now() - this.lastActivityAt) / 1000;
  }

  /**
   * Should this slot end?
   *
   * Either the booked duration has elapsed, or the performer has stopped
   * playing for long enough that the room is effectively silent. The second
   * case is why REQ-INST-2 exists.
   *
   * @returns {{done: boolean, reason?: string}}
   */
  check() {
    if (!this.active) return { done: false };
    if (this.elapsedSec >= this.durationSec) return { done: true, reason: "duration_elapsed" };
    if (this.idleSec >= IDLE_TIMEOUT_SEC) return { done: true, reason: "performer_idle" };
    return { done: false };
  }
}

/**
 * Registry of instruments available to the venue.
 *
 * Bridges MIDI ports into the scheduler: an attached instrument can be queued,
 * and while it is playing its activity is monitored so the fallback engine can
 * step in the moment the performance really ends.
 */
export class InstrumentRegistry extends EventEmitter {
  /**
   * @param {{now?: () => number}} [opts]
   */
  constructor(opts = {}) {
    super();
    this.now = opts.now ?? (() => Date.now());
    /** @type {Map<string, InstrumentSource>} */
    this.instruments = new Map();
    /** @type {InstrumentSource|null} */
    this.performing = null;
  }

  /**
   * @param {{portIdentity: string, name: string, performer?: string, durationSec?: number}} spec
   */
  register(spec) {
    const inst = new InstrumentSource({ ...spec, now: this.now });
    this.instruments.set(inst.id, inst);
    this.emit("registered", inst);
    return inst;
  }

  unregister(id) {
    const inst = this.instruments.get(id);
    if (!inst) return false;
    if (inst.active) inst.end("unregistered");
    this.instruments.delete(id);
    this.emit("unregistered", { id });
    return true;
  }

  get(id) {
    return this.instruments.get(id) ?? null;
  }

  /** Track-shaped entries a patron or staff member could queue. */
  asTracks() {
    return [...this.instruments.values()].map((i) => i.toTrack());
  }

  /** Is this a live source rather than a recording? */
  isInstrument(trackId) {
    return this.instruments.has(trackId);
  }

  /** Begin a booked performance. */
  begin(id) {
    const inst = this.instruments.get(id);
    if (!inst) return null;
    if (this.performing && this.performing !== inst) {
      this.performing.end("superseded");
    }
    inst.begin();
    this.performing = inst;
    return inst;
  }

  /** Route inbound MIDI to whichever instrument is performing. */
  observe(portIdentity, data) {
    if (this.performing && this.performing.portIdentity === portIdentity) {
      this.performing.observe(data);
    }
  }

  /**
   * Poll the active performance. Emits `finished` when a slot should give the
   * room back to the queue.
   */
  tick() {
    if (!this.performing) return null;
    const status = this.performing.check();
    if (!status.done) return null;

    const inst = this.performing;
    inst.end(status.reason);
    this.performing = null;
    this.emit("finished", { instrument: inst, reason: status.reason });
    return { instrument: inst, reason: status.reason };
  }
}
