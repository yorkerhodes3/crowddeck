// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Audio sink abstraction for the stub engine.
 *
 * ## Scope, stated honestly
 *
 * The stub engine's job is to be a **conformant CDEP peer**, not a good audio
 * player — REQ-CDEP-18 requires "enough for the fusion core to be developed and
 * tested against it with no Mixxx dependency". Real low-latency output is the
 * Mixxx-derived engine's job (ENG-1..ENG-7).
 *
 * So the shipped sink is a `SimulatedSink`: it advances a monotonic playhead in
 * real time and produces no sound. That is deliberate and has a real benefit —
 * tests are deterministic and need no audio device in CI.
 *
 * `AudioSink` is the seam a native sink drops into later without the transport
 * or the CDEP server changing.
 */

import { EventEmitter } from "node:events";

/**
 * @abstract
 * Contract: a sink owns a monotonic playhead and reports it in seconds.
 */
export class AudioSink extends EventEmitter {
  /** @param {{sampleRate?: number, tickMs?: number}} [opts] */
  constructor(opts = {}) {
    super();
    this.sampleRate = opts.sampleRate ?? 48000;
    this.tickMs = opts.tickMs ?? 20;
  }

  /* eslint-disable no-unused-vars */
  /** @param {{id: string, durationSec: number}} _track */
  start(_track) { throw new Error("not implemented"); }
  stop() { throw new Error("not implemented"); }
  pause() { throw new Error("not implemented"); }
  resume() { throw new Error("not implemented"); }
  /** @param {number} _sec */
  seek(_sec) { throw new Error("not implemented"); }
  /** @returns {number} seconds */
  get position() { throw new Error("not implemented"); }
  /* eslint-enable no-unused-vars */
}

/**
 * A sink that models playback with a wall-clock timer and emits no audio.
 *
 * Emits:
 *   - `tick`  ({position, duration}) once per `tickMs` while playing
 *   - `ended` () when the playhead reaches the track duration
 *
 * The tick is scheduled against absolute deadlines rather than by accumulating
 * `setInterval` drift, so a busy event loop shows up as a late tick rather than
 * a slow clock. That matters: the stall test (AC-18) asserts this clock keeps
 * time while a client is refusing to read.
 */
export class SimulatedSink extends AudioSink {
  #timer = null;
  #track = null;
  #positionSec = 0;
  #playing = false;
  #lastTickAt = 0;

  start(track) {
    this.#track = track;
    this.#positionSec = 0;
    this.#playing = true;
    this.#lastTickAt = now();
    this.#schedule();
  }

  stop() {
    this.#playing = false;
    this.#track = null;
    this.#positionSec = 0;
    this.#clear();
  }

  pause() {
    if (!this.#playing) return;
    this.#advance();
    this.#playing = false;
    this.#clear();
  }

  resume() {
    if (this.#playing || !this.#track) return;
    this.#playing = true;
    this.#lastTickAt = now();
    this.#schedule();
  }

  seek(sec) {
    if (!this.#track) return;
    this.#positionSec = Math.max(0, Math.min(sec, this.#track.durationSec));
    this.#lastTickAt = now();
  }

  get position() {
    if (this.#playing) this.#advance();
    return this.#positionSec;
  }

  get playing() {
    return this.#playing;
  }

  get track() {
    return this.#track;
  }

  #advance() {
    const t = now();
    const deltaSec = (t - this.#lastTickAt) / 1000;
    this.#lastTickAt = t;
    if (!this.#track) return;
    this.#positionSec = Math.min(this.#positionSec + deltaSec, this.#track.durationSec);
  }

  #schedule() {
    this.#clear();
    this.#timer = setInterval(() => {
      if (!this.#playing || !this.#track) return;
      this.#advance();
      this.emit("tick", { position: this.#positionSec, duration: this.#track.durationSec });
      if (this.#positionSec >= this.#track.durationSec) {
        this.#playing = false;
        this.#clear();
        this.emit("ended");
      }
    }, this.tickMs);
    if (typeof this.#timer.unref === "function") this.#timer.unref();
  }

  #clear() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  /** Release the timer so a process can exit cleanly. */
  dispose() {
    this.#clear();
    this.removeAllListeners();
  }
}

function now() {
  return Number(process.hrtime.bigint() / 1000000n);
}
