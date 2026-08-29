// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Loops and hot cues — DJX-8.
 *
 * The largest remaining gap between this and a commercial DJ application. A deck
 * without hot cues cannot be re-entered at a known point, and a deck without
 * loops cannot hold a section while you find the next record — both are things a
 * DJ does constantly rather than occasionally.
 *
 * Kept as pure functions so the arithmetic — which is where the bugs are — runs
 * under `node --test` without an audio device. Web Audio has native looping on
 * `AudioBufferSourceNode`, so the binding is thin; what is *not* thin is getting
 * the beat maths and the position wrapping right.
 */

/** Loop lengths a DJ actually reaches for, in beats. */
export const BEAT_LOOP_LENGTHS = Object.freeze([0.25, 0.5, 1, 2, 4, 8, 16, 32]);

/** How many hot cues a deck carries — matches the CDEP control surface. */
export const HOTCUE_COUNT = 8;

/** Shortest loop that is still a loop rather than a click. */
const MIN_LOOP_SECONDS = 0.02;

/**
 * Seconds occupied by `beats` beats at `bpm`.
 *
 * @param {number} bpm
 * @param {number} beats
 * @returns {number|null} null when the tempo is unknown
 */
export function beatSeconds(bpm, beats = 1) {
  if (!Number.isFinite(bpm) || bpm <= 0) return null;
  if (!Number.isFinite(beats) || beats <= 0) return null;
  return (60 / bpm) * beats;
}

/**
 * Snap a position to the nearest beat.
 *
 * `firstBeat` is where the grid starts — usually the track's first audible
 * moment, because a beatgrid anchored at sample zero is anchored to the encoder's
 * padding rather than to the music.
 *
 * Returns the input unchanged when there is no tempo. Snapping to a guessed grid
 * would move the cue point somewhere the DJ did not choose, which is worse than
 * not snapping: an unsnapped cue is where you put it, and you can hear that.
 *
 * @param {number} position
 * @param {number} bpm
 * @param {number} [firstBeat]
 */
export function quantiseToBeat(position, bpm, firstBeat = 0) {
  const beat = beatSeconds(bpm, 1);
  if (beat === null || !Number.isFinite(position)) return position;
  const rel = position - firstBeat;
  return firstBeat + Math.round(rel / beat) * beat;
}

/**
 * Where the playhead really is when a loop is active.
 *
 * Web Audio wraps the *audio* inside `loopStart`..`loopEnd`, but the elapsed time
 * a caller computes from `currentTime` keeps rising forever. Without this the
 * waveform playhead sails off the end of the track while the sound is still
 * looping eight bars in — the display and the audio disagree, and the display is
 * the thing the DJ is reading.
 *
 * @param {number} rawPosition position as if nothing were looping
 * @param {{start: number, end: number, enabled: boolean}} loop
 * @returns {number}
 */
export function loopPosition(rawPosition, loop) {
  if (!loop || !loop.enabled) return rawPosition;
  const { start, end } = loop;
  if (!(end > start)) return rawPosition;
  if (rawPosition < end) return rawPosition;

  const span = end - start;
  return start + ((rawPosition - start) % span);
}

/**
 * Validate and normalise a loop region.
 *
 * Returns null rather than an inverted or vanishing loop. A loop whose end is
 * before its start silences the deck in Web Audio — no error, just no sound —
 * which in a set reads as the application dying.
 *
 * @param {number} start
 * @param {number} end
 * @param {number} duration
 */
export function makeLoop(start, end, duration) {
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

  let a = Math.max(0, Math.min(start, end));
  let b = Math.min(duration, Math.max(start, end));

  if (!(b - a >= MIN_LOOP_SECONDS)) return null;
  return { start: a, end: b, enabled: true };
}

/**
 * A loop of `beats` beats starting at `from`.
 *
 * @param {number} from
 * @param {number} bpm
 * @param {number} beats
 * @param {number} duration
 */
export function beatLoop(from, bpm, beats, duration) {
  const len = beatSeconds(bpm, beats);
  if (len === null) return null;
  return makeLoop(from, from + len, duration);
}

/**
 * Halve or double a loop, keeping its start fixed.
 *
 * The start is what stays put because that is the musical anchor — the downbeat
 * you looped from. Halving around the centre would drift the loop off the beat a
 * little more each time.
 *
 * @param {{start: number, end: number, enabled: boolean}} loop
 * @param {number} factor
 * @param {number} duration
 */
export function scaleLoop(loop, factor, duration) {
  if (!loop || !(loop.end > loop.start)) return null;
  if (!Number.isFinite(factor) || factor <= 0) return null;
  const span = (loop.end - loop.start) * factor;
  return makeLoop(loop.start, loop.start + span, duration);
}

/**
 * Move a loop forward or back by its own length, staying in phase.
 *
 * @param {{start: number, end: number, enabled: boolean}} loop
 * @param {number} direction
 * @param {number} duration
 */
export function shiftLoop(loop, direction, duration) {
  if (!loop || !(loop.end > loop.start)) return null;
  const span = loop.end - loop.start;
  const delta = span * (direction < 0 ? -1 : 1);
  return makeLoop(loop.start + delta, loop.end + delta, duration);
}

/**
 * A deck's hot cues.
 *
 * Setting and jumping are deliberately **separate operations**, not one control
 * that does whichever seems appropriate. A single "cue" button that sets when
 * empty and jumps when full will, sooner or later, overwrite a cue point
 * mid-performance because the deck was in a state the DJ had not noticed. Losing
 * a cue point during a set is unrecoverable in the moment.
 */
export class HotCues {
  /** @param {number} [count] */
  constructor(count = HOTCUE_COUNT) {
    this.count = count;
    /** @type {Array<number|null>} */
    this.points = new Array(count).fill(null);
  }

  /** 1-based, matching `hotcue_N_activate` in the CDEP surface. */
  #index(n) {
    const i = Math.trunc(n) - 1;
    return i >= 0 && i < this.count ? i : -1;
  }

  /**
   * @param {number} n
   * @param {number} seconds
   * @returns {boolean} whether it was stored
   */
  set(n, seconds) {
    const i = this.#index(n);
    if (i < 0 || !Number.isFinite(seconds) || seconds < 0) return false;
    this.points[i] = seconds;
    return true;
  }

  /** @param {number} n @returns {number|null} */
  get(n) {
    const i = this.#index(n);
    return i < 0 ? null : this.points[i];
  }

  /** @param {number} n */
  clear(n) {
    const i = this.#index(n);
    if (i < 0 || this.points[i] === null) return false;
    this.points[i] = null;
    return true;
  }

  /** Every set cue, in time order, for drawing markers on a waveform. */
  markers() {
    return this.points
      .map((at, i) => (at === null ? null : { slot: i + 1, at }))
      .filter(Boolean)
      .sort((x, y) => x.at - y.at);
  }

  /**
   * Serialisable form, so cue points survive a reload.
   *
   * A DJ who set eight cues and then refreshed the page has lost the work of
   * preparing that track. Cues belong to the *track*, not to the session.
   */
  toJSON() {
    return { format: "crowddeck-cues/1", points: this.points };
  }

  /** @param {object} json */
  static fromJSON(json) {
    const cues = new HotCues(json?.points?.length || HOTCUE_COUNT);
    if (Array.isArray(json?.points)) {
      json.points.forEach((v, i) => {
        cues.points[i] = Number.isFinite(v) && v >= 0 ? v : null;
      });
    }
    return cues;
  }
}
