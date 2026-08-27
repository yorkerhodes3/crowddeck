// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * MIDI clock — REQ-CLK-1, REQ-CLK-2, REQ-CLK-5, REQ-CLK-6.
 *
 * ## One tempo source for the whole room
 *
 * The **leader deck** is the single source of tempo, published to MIDI Clock and
 * (later) Ableton Link simultaneously. That is what lets a groovebox, a drum
 * machine and a laptop in the corner all sit on the same timeline — including
 * during autonomous mode, when nobody is driving.
 *
 * ## Clock, not MTC
 *
 * MIDI Clock carries tempo at 24 pulses per quarter note. MTC carries SMPTE
 * position and is explicitly **not** used for musical sync (REQ-CLK-5): its
 * ~0.6 ms resolution and susceptibility to traffic delay make it a positional
 * reference only. Getting this wrong is a common and audible mistake.
 *
 * ## On jitter
 *
 * REQ-CLK-6 sets a ≤1 ms RMS budget at the MIDI output. A JavaScript timer
 * cannot honour that — `setInterval` drift alone exceeds it. This scheduler is
 * therefore written to be *correct about when a pulse is due* (absolute
 * deadlines, never accumulated intervals) and to report the jitter it actually
 * achieves, so the shortfall is measured rather than assumed. Meeting the budget
 * needs the native engine plane, which is where the real clock will live.
 */

import { EventEmitter } from "node:events";
import { Status } from "./ports.js";

export const PPQN = 24;

/** Convert BPM to the interval between clock pulses. */
export function pulseIntervalMs(bpm) {
  if (!(bpm > 0)) throw new RangeError("bpm must be > 0");
  return 60000 / bpm / PPQN;
}

export class MidiClock extends EventEmitter {
  /**
   * @param {object} [opts]
   * @param {number} [opts.bpm]
   * @param {(data: number[]) => void} [opts.send] where pulses go
   * @param {() => number} [opts.now] injectable clock, for deterministic tests
   * @param {(fn: Function, ms: number) => any} [opts.setTimer]
   * @param {(handle: any) => void} [opts.clearTimer]
   */
  constructor(opts = {}) {
    super();
    this.bpm = opts.bpm ?? 120;
    this.send = opts.send ?? (() => {});
    this.now = opts.now ?? (() => Number(process.hrtime.bigint() / 1000000n));
    this.setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer = opts.clearTimer ?? ((h) => clearTimeout(h));

    this.running = false;
    this.pulseCount = 0;
    this.timer = null;
    this.nextDeadline = 0;

    /** Observed error per pulse, for the jitter report. */
    this.errors = [];
    this.maxSamples = 512;
  }

  /** Start the transport and begin emitting pulses. */
  start() {
    if (this.running) return;
    this.running = true;
    this.pulseCount = 0;
    this.errors = [];
    this.send([Status.START]);
    this.emit("start");
    this.nextDeadline = this.now() + pulseIntervalMs(this.bpm);
    this.#schedule();
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null;
    this.send([Status.STOP]);
    this.emit("stop");
  }

  /**
   * Change tempo without interrupting the pulse train.
   *
   * The pulse already scheduled keeps its original deadline; the new rate
   * applies from the one after. Pulling a pending pulse earlier could fire two
   * close together, which an instrument would hear as a stumble — worse than
   * arriving one pulse late.
   */
  setTempo(bpm) {
    if (!(bpm > 0)) throw new RangeError("bpm must be > 0");
    this.bpm = bpm;
    this.emit("tempo", bpm);
  }

  /**
   * Follow whichever deck is leader — REQ-CLK-1.
   *
   * The scheduler owns the notion of a leader; this simply mirrors its tempo, so
   * there is exactly one source of truth for the room's timeline.
   */
  followLeader(bpm) {
    if (bpm > 0 && bpm !== this.bpm) this.setTempo(bpm);
  }

  #schedule() {
    if (!this.running) return;
    const delay = Math.max(0, this.nextDeadline - this.now());
    this.timer = this.setTimer(() => this.#pulse(), delay);
  }

  #pulse() {
    if (!this.running) return;

    const actual = this.now();
    // Measure lateness against the deadline, not against the previous pulse, so
    // drift cannot accumulate silently.
    this.errors.push(actual - this.nextDeadline);
    if (this.errors.length > this.maxSamples) this.errors.shift();

    this.send([Status.CLOCK]);
    this.pulseCount++;

    if (this.pulseCount % PPQN === 0) this.emit("beat", this.pulseCount / PPQN);
    this.emit("pulse", this.pulseCount);

    // Absolute deadlines: a late pulse does not push every later pulse late.
    this.nextDeadline += pulseIntervalMs(this.bpm);
    // If we have fallen more than a whole interval behind, resynchronise rather
    // than trying to catch up with a burst.
    const interval = pulseIntervalMs(this.bpm);
    if (this.nextDeadline < actual - interval) this.nextDeadline = actual + interval;

    this.#schedule();
  }

  /**
   * Jitter actually achieved, against the REQ-CLK-6 budget.
   * @returns {{rmsMs: number, maxMs: number, samples: number, withinBudget: boolean}}
   */
  jitter() {
    if (!this.errors.length) {
      return { rmsMs: 0, maxMs: 0, samples: 0, withinBudget: true };
    }
    const sumSq = this.errors.reduce((a, e) => a + e * e, 0);
    const rms = Math.sqrt(sumSq / this.errors.length);
    const max = this.errors.reduce((a, e) => Math.max(a, Math.abs(e)), 0);
    return {
      rmsMs: rms,
      maxMs: max,
      samples: this.errors.length,
      withinBudget: rms <= 1
    };
  }

  /** Beats elapsed since start. */
  get beats() {
    return this.pulseCount / PPQN;
  }
}

/**
 * MTC is deliberately not implemented for musical sync — REQ-CLK-5.
 *
 * Exported as an explicit refusal rather than an omission, so the decision is
 * discoverable at the point someone reaches for it.
 */
export function mtcNotSupportedForMusicalSync() {
  throw new Error(
    "MTC carries SMPTE position, not tempo, and its resolution and jitter make it " +
      "unsuitable for beat-accurate sync (REQ-CLK-5). Use MIDI Clock or Ableton Link."
  );
}
