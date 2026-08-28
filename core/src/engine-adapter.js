// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Engine adapter — binds the Unified Scheduler to a CDEP engine.
 *
 * This is the seam between the two planes. The scheduler emits *intents*
 * (`cue`, `preload`) and knows nothing about audio; this adapter turns them into
 * CDEP calls, and turns engine events back into scheduler state changes.
 *
 * Keeping the translation here means:
 *   - the scheduler stays pure and testable with a fake clock;
 *   - the Apache-2.0 core never links against the GPL engine — it speaks to it
 *     over a socket, which is the boundary ADR-001 depends on;
 *   - swapping the stub for the Mixxx-derived engine changes nothing above this
 *     file, which is the whole point of writing the contract first.
 */

import { State } from "./queue.js";
import { computeGain, dbToLinear } from "./loudness.js";

/** The deck the autonomous mixer drives by default. */
export const PRIMARY_DECK = "[Channel1]";

export class EngineAdapter {
  /**
   * @param {object} opts
   * @param {import("./scheduler.js").Scheduler} opts.scheduler
   * @param {import("../../protocol/src/client.js").CdepClient} opts.client
   * @param {string} [opts.deck]
   */
  constructor(opts) {
    this.scheduler = opts.scheduler;
    this.client = opts.client;
    this.deck = opts.deck ?? PRIMARY_DECK;
    // REQ-CON-4. On by default: a venue mixing heterogeneous sources needs this,
    // and an operator who wants raw levels can opt out explicitly.
    this.normaliseLoudness = opts.normaliseLoudness ?? true;
    this.loudnessOptions = opts.loudnessOptions ?? {};
    this.started = false;

    /** Entry currently loaded on the deck. */
    this.loaded = null;
    /** Entry handed to the engine as the gapless follower. */
    this.queuedNext = null;

    this.onCue = this.onCue.bind(this);
    this.onPreload = this.onPreload.bind(this);
    this.onEngineEvent = this.onEngineEvent.bind(this);
  }

  /** Wire both directions and begin. */
  async start() {
    if (this.started) return;
    this.started = true;

    this.scheduler.on("cue", this.onCue);
    this.scheduler.on("preload", this.onPreload);
    this.client.on("event", this.onEngineEvent);

    // Only track-level events are needed; high-rate controls stay unsubscribed
    // unless a UI asks for them (REQ-CDEP-15).
    this.scheduler.tick();
  }

  stop() {
    if (!this.started) return;
    this.started = false;
    this.scheduler.off("cue", this.onCue);
    this.scheduler.off("preload", this.onPreload);
    this.client.off("event", this.onEngineEvent);
  }

  /* --------------------------------------------------- scheduler → engine */

  /** @param {import("./queue.js").QueueEntry} entry */
  async onCue(entry) {
    // The engine may already have this entry on the deck, having continued into
    // its gapless follower by itself. Re-loading would restart the track that is
    // already playing, so only mark it audible.
    if (this.loaded?.id === entry.id) {
      if (entry.state === State.CUED) this.scheduler.markPlaying(entry.id);
      return;
    }

    try {
      // Claim the deck before awaiting. `cue` and `preload` are emitted back to
      // back, and a preload that ran first would see a null `loaded` and skip
      // queueing the follower.
      this.loaded = entry;
      entry.deckGroup = this.deck;

      await this.client.load(this.deck, {
        id: entry.track.id,
        duration: entry.track.duration,
        bpm: entry.track.bpm,
        key: entry.track.key
      });

      // REQ-CON-4: match the level before it becomes audible. Set after `load`
      // and before `play`, so the deck's gain is already correct when the track
      // starts rather than jumping a moment later — a correction the room would
      // hear is not a correction, it is a second problem.
      await this.#applyLoudness(entry);

      await this.client.set(this.deck, "play", 1);
      if (entry.state === State.CUED) this.scheduler.markPlaying(entry.id);
    } catch (err) {
      // A load failure must not wedge the queue: drop this entry and move on,
      // so the room does not go silent because of one bad file (REQ-FALL-3).
      if (this.loaded?.id === entry.id) this.loaded = null;
      this.scheduler.emit("engineError", { entry, error: err });
      try {
        this.scheduler.skip(entry.id, "engine");
      } catch {
        /* already terminal */
      }
      this.scheduler.tick();
    }
  }

  /**
   * Hand the engine the follower so it can continue without a gap.
   *
   * Uses `queue`, never `load`: re-loading the deck to attach a follower would
   * restart the track that is currently playing, which is the exact opposite of
   * a seamless transition.
   *
   * @param {import("./queue.js").QueueEntry} entry
   */
  async onPreload(entry) {
    if (!this.loaded || this.queuedNext?.id === entry.id) return;
    if (!this.client.supportsGapless) return; // engine cannot chain — REQ-CDEP-11
    try {
      await this.client.queueNext(this.deck, {
        id: entry.track.id,
        duration: entry.track.duration
      });
      this.queuedNext = entry;
    } catch (err) {
      this.scheduler.emit("engineError", { entry, error: err });
    }
  }

  /**
   * Apply the track's normalisation gain to the deck — REQ-CON-4.
   *
   * `pregain` rather than `volume`: volume is the DJ's fader and belongs to
   * whoever is mixing. Writing to it would fight a human hand and undo their
   * moves. Pregain is the per-deck trim, which is exactly what a normalisation
   * offset is.
   *
   * A failure here is logged, not thrown: a track at the wrong level is a lesser
   * problem than a track that does not play, and REQ-FALL-3 says the room must
   * not go silent for a recoverable fault.
   *
   * @param {import("./queue.js").QueueEntry} entry
   */
  async #applyLoudness(entry) {
    if (!this.normaliseLoudness) return null;

    const result = computeGain(entry.track, this.loudnessOptions);
    try {
      // Always written, including 0 dB: the deck may still carry the previous
      // track's trim, and leaving it there would apply one track's correction to
      // the next — worse than not normalising at all.
      await this.client.set(this.deck, "pregain", dbToLinear(result.gainDb));
      this.scheduler.emit("loudness", { entry, ...result });
    } catch (err) {
      this.scheduler.emit("engineError", { entry, error: err });
    }
    return result;
  }

  /* --------------------------------------------------- engine → scheduler */

  /** @param {{event: string, group?: string, track?: string}} msg */
  onEngineEvent(msg) {
    if (msg.group && msg.group !== this.deck) return;

    switch (msg.event) {
      case "track_ended": {
        const finished = this.loaded;
        if (finished && finished.state === State.PLAYING) {
          this.scheduler.markPlayed(finished.id);
        }
        this.loaded = null;

        if (this.queuedNext) {
          // The engine continued into its preloaded follower by itself.
          const next = this.queuedNext;
          this.queuedNext = null;
          // Set `loaded` first so onCue knows not to re-load and restart it.
          this.loaded = next;
          if (next.state === State.STAGED) {
            this.scheduler.promote(next.id, { deckGroup: this.deck });
          } else if (next.state === State.CUED) {
            this.scheduler.markPlaying(next.id);
          }
          // Keep a fresh follower ready behind it.
          this.scheduler.tick();
        }
        // With no follower the engine also emits deck_empty, which is what
        // chooses the next track. Selecting here as well would double-promote.
        return;
      }

      case "deck_empty": {
        // Nothing followed: the room is about to go quiet — REQ-FALL-1, AC-8.
        this.loaded = null;
        this.queuedNext = null;
        this.scheduler.onDeckEmpty();
        return;
      }

      default:
        // beat / phase / xrun / device_error are surfaced for observers.
        this.scheduler.emit("engine", msg);
    }
  }
}
