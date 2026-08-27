// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Engine link — reconnection and resynchronisation. **REQ-NFR-5.**
 *
 * > A fusion-core crash MUST NOT stop audio; the engine continues its cued track
 * > and the core resumes on reconnect.
 *
 * ## Why this is a separate object
 *
 * The two-plane split in [ADR-001](../../DECISIONS.md) exists so that the room keeps
 * playing when the clever half falls over. That is only true if two things hold:
 *
 * 1. the engine's audio does not depend on a client being attached — an architectural
 *    property of CDEP, since the engine owns the audio thread and the socket is only
 *    a control channel; and
 * 2. the core, on restart, **adopts** what the engine is already doing rather than
 *    imposing what it remembers.
 *
 * Point 2 is the one that needs code, and it is easy to get subtly wrong. The naive
 * reconnect re-issues the last known `load`, which restarts the track the venue is
 * currently dancing to — a crash the audience could not hear becomes a crash they
 * very much can. So `resync()` asks the engine what is on the deck **first** and only
 * intervenes if the deck is genuinely idle.
 *
 * ## Backoff
 *
 * Reconnection backs off exponentially with jitter, capped. A core in a crash loop
 * should not turn into a busy-wait against the engine's accept queue, and unjittered
 * retries from several clients would synchronise into thundering herds.
 */

import { EventEmitter } from "node:events";

export const DEFAULT_BACKOFF = Object.freeze({
  initialMs: 100,
  maxMs: 5000,
  factor: 2,
  jitter: 0.2
});

export class EngineLink extends EventEmitter {
  /**
   * @param {object} opts
   * @param {() => Promise<import("../../protocol/src/client.js").CdepClient>} opts.connect
   *   Creates and connects a fresh client. A factory rather than a client instance,
   *   because a closed socket cannot be reopened.
   * @param {import("./engine-adapter.js").EngineAdapter} [opts.adapter]
   * @param {typeof DEFAULT_BACKOFF} [opts.backoff]
   * @param {(ms: number) => Promise<void>} [opts.sleep] Injected so tests are fast.
   * @param {() => number} [opts.random] Injected so jitter is deterministic in tests.
   */
  constructor(opts) {
    super();
    if (typeof opts.connect !== "function") {
      throw new TypeError("EngineLink requires a connect() factory");
    }
    this.connectFn = opts.connect;
    this.adapter = opts.adapter ?? null;
    this.backoff = { ...DEFAULT_BACKOFF, ...(opts.backoff ?? {}) };
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.random = opts.random ?? Math.random;

    /** @type {import("../../protocol/src/client.js").CdepClient|null} */
    this.client = null;
    this.connected = false;
    this.stopped = false;
    this.attempts = 0;
    this.reconnects = 0;
  }

  /** Connects, and keeps reconnecting until `stop()`. */
  async start() {
    this.stopped = false;
    await this.#connectWithRetry();
  }

  stop() {
    this.stopped = true;
    if (this.client) {
      try {
        this.client.close();
      } catch {
        /* already gone */
      }
    }
    this.connected = false;
  }

  async #connectWithRetry() {
    while (!this.stopped) {
      try {
        const client = await this.connectFn();
        this.client = client;
        this.connected = true;
        this.attempts = 0;

        client.once("close", () => this.#onDrop());

        if (this.adapter) {
          this.adapter.client = client;
          await this.resync();
        }

        this.emit("connected", { reconnects: this.reconnects });
        return client;
      } catch (err) {
        this.connected = false;
        this.attempts++;
        this.emit("connectError", { attempt: this.attempts, error: err });
        if (this.stopped) return null;
        await this.sleep(this.delayFor(this.attempts));
      }
    }
    return null;
  }

  #onDrop() {
    if (this.stopped) return;
    this.connected = false;
    this.reconnects++;
    this.emit("disconnected", { reconnects: this.reconnects });
    // Deliberately not awaited: a drop is an event, not a call.
    this.#connectWithRetry().catch((err) => this.emit("connectError", { error: err }));
  }

  /** Exponential backoff with jitter, capped. @param {number} attempt */
  delayFor(attempt) {
    const raw = this.backoff.initialMs * this.backoff.factor ** (attempt - 1);
    const capped = Math.min(raw, this.backoff.maxMs);
    const spread = capped * this.backoff.jitter;
    return Math.round(capped - spread + this.random() * spread * 2);
  }

  /**
   * Adopt the engine's current reality — the heart of REQ-NFR-5.
   *
   * Reads the deck **before** deciding anything. If a track is playing, the core
   * takes ownership of it and leaves the audio strictly alone. Only a genuinely
   * idle deck is refilled.
   */
  async resync() {
    const adapter = this.adapter;
    if (!adapter) return { adopted: false, reason: "no_adapter" };

    const client = this.client;
    adapter.client = client;

    let loaded = 0;
    let playing = 0;
    try {
      loaded = await client.get(adapter.deck, "track_loaded");
      playing = await client.get(adapter.deck, "play");
    } catch (err) {
      this.emit("resyncError", { error: err });
      return { adopted: false, reason: "unreadable" };
    }

    if (loaded && playing) {
      // The venue is mid-track. Whatever the core remembers, the engine is the
      // authority on what the room can hear — never re-issue `load` here.
      const entry = adapter.loaded ?? adapter.scheduler?.playingEntry?.() ?? null;
      this.emit("adopted", { deck: adapter.deck, entry: entry?.id ?? null });
      return { adopted: true, entry: entry?.id ?? null, restarted: false };
    }

    // Deck idle: the core may safely take over. Let the scheduler decide what next.
    adapter.loaded = null;
    adapter.queuedNext = null;
    adapter.scheduler?.tick?.();
    this.emit("resumed", { deck: adapter.deck });
    return { adopted: false, reason: "deck_idle", restarted: true };
  }
}
