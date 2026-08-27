// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The stub engine's control registry and deck model.
 *
 * Implements the minimum control set from SPECIFICATION §2.10 and the
 * self-description contract (REQ-CDEP-12, REQ-CDEP-13): the descriptor set is
 * rich enough to build both a control UI and a MIDI mapping target list with no
 * hard-coded knowledge of this engine.
 */

import { EventEmitter } from "node:events";
import {
  CdepError,
  ErrorCode,
  MASTER_GROUP,
  coerceValue,
  control,
  controlKey,
  deckGroup
} from "../../protocol/src/index.js";
import { SimulatedSink } from "./sink.js";

export const ENGINE_NAME = "crowddeck-engine-stub";
export const ENGINE_VERSION = "0.1.0";

/**
 * Capabilities this engine advertises in `welcome`.
 *
 * Deliberately short. The stub does not do stems, key-lock, Link or MIDI clock,
 * and REQ-CDEP-11 requires clients to degrade gracefully when a capability is
 * absent — this is precisely the case that proves they do.
 */
export const CAPABILITIES = Object.freeze(["gapless"]);

export class StubEngine extends EventEmitter {
  /** @param {{decks?: number, sampleRate?: number, tickMs?: number}} [opts] */
  constructor(opts = {}) {
    super();
    this.deckCount = opts.decks ?? 4;
    this.sampleRate = opts.sampleRate ?? 48000;
    this.latencyMs = 5.3;

    /** @type {Map<string, import("../../protocol/src/controls.js").ControlDescriptor>} */
    this.descriptors = new Map();
    /** @type {Map<string, number>} */
    this.values = new Map();
    /** @type {Map<number, {sink: SimulatedSink, track: object|null, nextTrack: object|null}>} */
    this.decks = new Map();

    this.#defineControls();
    this.#createDecks();
  }

  /* ------------------------------------------------------- definition */

  #define(desc) {
    const key = controlKey(desc.group, desc.item);
    this.descriptors.set(key, desc);
    this.values.set(key, desc.default);
  }

  #defineControls() {
    for (let i = 1; i <= this.deckCount; i++) {
      const g = deckGroup(i);
      const d = (item, label, extra = {}) => this.#define(control({ group: g, item, label, ...extra }));

      d("play", "Play / pause", { type: "bool" });
      d("cue_gotoandplay", "Jump to cue and play", { type: "bool" });
      d("rate", "Tempo adjust", { min: -1, max: 1, default: 0 });
      d("rate_dir", "Tempo direction", { type: "int", min: -1, max: 1, default: 1 });
      d("bpm", "Detected BPM", { min: 0, max: 300, default: 0, readonly: true });
      d("key", "Detected musical key", { type: "int", min: 0, max: 24, default: 0, readonly: true });
      d("keylock", "Key lock", { type: "bool" });
      d("volume", "Channel volume", { default: 1 });
      d("pregain", "Pre-fader gain", { min: 0, max: 4, default: 1 });
      d("filter", "Filter", { min: -1, max: 1, default: 0 });
      d("eq_low", "EQ low", { min: 0, max: 4, default: 1 });
      d("eq_mid", "EQ mid", { min: 0, max: 4, default: 1 });
      d("eq_high", "EQ high", { min: 0, max: 4, default: 1 });
      d("loop_in", "Set loop in", { type: "bool" });
      d("loop_out", "Set loop out", { type: "bool" });
      d("loop_enabled", "Loop active", { type: "bool" });
      for (let h = 1; h <= 8; h++) {
        d(`hotcue_${h}_activate`, `Hot cue ${h}`, { type: "bool" });
      }
      d("playposition", "Play position", { readonly: true, highRate: true });
      d("track_loaded", "Track loaded", { type: "bool", readonly: true });
      d("duration", "Track duration (s)", { min: 0, max: 86400, default: 0, readonly: true });
      d("sync_enabled", "Sync lock", { type: "bool" });
      d("sync_leader", "Leader deck", { type: "bool" });
    }

    const m = (item, label, extra = {}) =>
      this.#define(control({ group: MASTER_GROUP, item, label, ...extra }));

    m("crossfader", "Crossfader", { min: -1, max: 1, default: 0 });
    m("gain", "Master gain", { min: 0, max: 4, default: 1 });
    m("headMix", "Headphone mix", { min: -1, max: 1, default: -1 });
    m("headGain", "Headphone gain", { min: 0, max: 4, default: 1 });
    m("bpm", "Master BPM", { min: 0, max: 300, default: 0, readonly: true });
    m("mode", "Venue mode", {
      type: "enum",
      min: 0,
      max: 1,
      default: 0,
      values: ["autonomous", "attended"]
    });
    m("num_decks", "Deck count", {
      type: "int",
      min: 1,
      max: this.deckCount,
      default: this.deckCount,
      readonly: true
    });
  }

  #createDecks() {
    for (let i = 1; i <= this.deckCount; i++) {
      const sink = new SimulatedSink({ sampleRate: this.sampleRate });
      const state = { sink, track: null, nextTrack: null };
      this.decks.set(i, state);

      sink.on("tick", ({ position, duration }) => {
        const g = deckGroup(i);
        this.#setInternal(g, "playposition", duration > 0 ? position / duration : 0);
      });

      sink.on("ended", () => this.#onTrackEnded(i));
    }
  }

  /* ------------------------------------------------------------ access */

  /** @returns {import("../../protocol/src/controls.js").ControlDescriptor[]} */
  describe() {
    return [...this.descriptors.values()];
  }

  has(group, item) {
    return this.descriptors.has(controlKey(group, item));
  }

  get(group, item) {
    const key = controlKey(group, item);
    if (!this.descriptors.has(key)) {
      throw new CdepError(ErrorCode.UNKNOWN_CONTROL, `${group}/${item}`);
    }
    return this.values.get(key);
  }

  /**
   * Apply an external write. Rejects readonly controls (REQ-CDEP-12) and
   * out-of-range values rather than clamping.
   */
  set(group, item, rawValue) {
    const key = controlKey(group, item);
    const desc = this.descriptors.get(key);
    if (!desc) throw new CdepError(ErrorCode.UNKNOWN_CONTROL, `${group}/${item}`);
    if (desc.readonly) throw new CdepError(ErrorCode.READONLY_CONTROL, `${group}/${item}`);

    const value = coerceValue(desc, rawValue);
    this.#setInternal(group, item, value);
    this.#applySideEffects(group, item, value);
    return value;
  }

  /** Engine-originated write: bypasses the readonly guard, still notifies. */
  #setInternal(group, item, value) {
    const key = controlKey(group, item);
    if (this.values.get(key) === value) return;
    this.values.set(key, value);
    this.emit("changed", group, item, value);
  }

  /* ----------------------------------------------------- side effects */

  #applySideEffects(group, item, value) {
    const deckIndex = deckIndexOf(group);
    if (deckIndex === null) {
      if (group === MASTER_GROUP && item === "mode") {
        this.emit("mode", value === 1 ? "attended" : "autonomous");
      }
      return;
    }
    const deck = this.decks.get(deckIndex);
    if (!deck) return;

    if (item === "play") {
      if (value === 1) {
        if (!deck.track) {
          // Nothing to play: reflect reality rather than reporting a lie.
          this.#setInternal(group, "play", 0);
          throw new CdepError(ErrorCode.UNAVAILABLE, `${group}: no track loaded`);
        }
        deck.sink.resume();
      } else {
        deck.sink.pause();
      }
    }

    if (item === "cue_gotoandplay" && value === 1) {
      if (deck.track) {
        deck.sink.seek(0);
        deck.sink.resume();
        this.#setInternal(group, "play", 1);
      }
      this.#setInternal(group, "cue_gotoandplay", 0);
    }

    if (item === "sync_leader" && value === 1) {
      // Exactly one leader deck — REQ-CLK-1 keeps a single tempo source.
      for (const [i] of this.decks) {
        if (i !== deckIndex) this.#setInternal(deckGroup(i), "sync_leader", 0);
      }
      const bpm = this.get(group, "bpm");
      this.#setInternal(MASTER_GROUP, "bpm", bpm);
    }
  }

  /* ---------------------------------------------------------- loading */

  /**
   * Load a track onto a deck.
   *
   * @param {string} group
   * @param {{id: string, duration?: number, bpm?: number, key?: number}} track
   */
  load(group, track) {
    const deckIndex = deckIndexOf(group);
    if (deckIndex === null || !this.decks.has(deckIndex)) {
      throw new CdepError(ErrorCode.UNKNOWN_CONTROL, `${group} is not a deck`);
    }
    if (!track || typeof track.id !== "string" || track.id.length === 0) {
      throw new CdepError(ErrorCode.INVALID_FIELD, `"track.id" must be a non-empty string`);
    }
    const durationSec = typeof track.duration === "number" && track.duration > 0
      ? track.duration
      : 180;

    const deck = this.decks.get(deckIndex);
    deck.sink.stop();
    deck.track = { id: track.id, durationSec };

    this.#setInternal(group, "track_loaded", 1);
    this.#setInternal(group, "duration", durationSec);
    this.#setInternal(group, "playposition", 0);
    this.#setInternal(group, "play", 0);
    this.#setInternal(group, "bpm", typeof track.bpm === "number" ? track.bpm : 0);
    this.#setInternal(group, "key", typeof track.key === "number" ? track.key : 0);

    // The sink starts paused; `play` drives it.
    deck.sink.start(deck.track);
    deck.sink.pause();
    deck.sink.seek(0);

    this.emit("event", "track_loaded", { group, track: track.id, duration: durationSec });
    return deck.track;
  }

  /**
   * Queue the next track for gapless continuation on the same deck — CDEP-3.
   *
   * The fusion core uses this to hand the engine the next queue entry before the
   * current one ends, so the room never hears a gap (REQ-FALL-3).
   */
  queueNext(group, track) {
    const deckIndex = deckIndexOf(group);
    if (deckIndex === null || !this.decks.has(deckIndex)) {
      throw new CdepError(ErrorCode.UNKNOWN_CONTROL, `${group} is not a deck`);
    }
    const durationSec = typeof track?.duration === "number" && track.duration > 0
      ? track.duration
      : 180;
    this.decks.get(deckIndex).nextTrack = { id: track.id, durationSec };
  }

  #onTrackEnded(deckIndex) {
    const group = deckGroup(deckIndex);
    const deck = this.decks.get(deckIndex);
    const finished = deck.track;

    this.emit("event", "track_ended", { group, track: finished ? finished.id : null });

    if (deck.nextTrack) {
      const next = deck.nextTrack;
      deck.nextTrack = null;
      this.load(group, { id: next.id, duration: next.durationSec });
      // Gapless: continue straight into the queued track.
      this.decks.get(deckIndex).sink.resume();
      this.#setInternal(group, "play", 1);
      return;
    }

    deck.track = null;
    this.#setInternal(group, "play", 0);
    this.#setInternal(group, "track_loaded", 0);
    this.#setInternal(group, "playposition", 0);
    this.emit("event", "deck_empty", { group });
  }

  dispose() {
    for (const [, deck] of this.decks) deck.sink.dispose();
    this.removeAllListeners();
  }
}

/** `[Channel3]` -> 3; anything else -> null. */
export function deckIndexOf(group) {
  const m = /^\[Channel(\d+)\]$/.exec(group);
  return m ? Number(m[1]) : null;
}
