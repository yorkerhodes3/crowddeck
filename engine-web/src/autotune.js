// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Autotune for a live microphone — DJX-25.
 *
 * Asked for, and cheaper to build than it sounds because the hard part already
 * exists: `keylock.js` is a working pitch shifter, and `key.js` already detects
 * pitch. Autotune is the musical decision between them — *what note should this
 * be?* — plus the honesty about what a browser can and cannot do live.
 *
 * ## The two things that actually matter
 *
 * **Latency.** The shifter imposes a constant 49 ms, detection needs a window on
 * top, and the browser adds its own output buffer. Measured end to end that is
 * roughly 90–110 ms. That is *fine* for a corrected vocal in the mix and
 * **unusable as a monitor in headphones** — 100 ms of delay on your own voice is
 * past the threshold where speech becomes difficult to produce, which is the
 * basis of the delayed-auditory-feedback effect. So the corrected signal is
 * routed to the mix, and monitoring is off by default with the reason stated.
 *
 * **Feedback.** A microphone and loudspeakers in one room is a feedback loop,
 * and a DJ application is guaranteed to have loudspeakers. Nothing in software
 * makes that safe, so the input starts muted, and the UI says headphones.
 *
 * ## Retune speed is the whole character of the effect
 *
 * Instant snapping is the hard, artificial sound everyone recognises. Slower
 * correction is transparent. It is one number, and it is exposed rather than
 * buried because it is the only creative decision in the feature.
 */

/** Semitone offsets from the tonic, by scale. */
export const SCALES = Object.freeze({
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  // Common in dance vocals, and forgiving: five notes means fewer wrong ones to
  // snap to, so a slightly flat note lands somewhere musical rather than
  // somewhere merely nearby.
  pentatonicMinor: [0, 3, 5, 7, 10],
  pentatonicMajor: [0, 2, 4, 7, 9]
});

/** A4, the tuning reference. */
export const CONCERT_A = 440;

/** MIDI note for A4. */
const A4_MIDI = 69;

/**
 * Widest correction that is a correction rather than a transposition.
 *
 * Beyond a semitone the singer is on a different note, and "fixing" it changes
 * the melody. Detection errors are also usually octave errors — an octave jump
 * would be silently accepted by a wider bound and audibly wrong.
 */
export const MAX_CORRECTION_SEMITONES = 1;

/** @param {number} hz @returns {number} fractional MIDI note */
export function hzToMidi(hz) {
  if (!Number.isFinite(hz) || hz <= 0) return NaN;
  return A4_MIDI + 12 * Math.log2(hz / CONCERT_A);
}

/** @param {number} midi @returns {number} Hz */
export function midiToHz(midi) {
  return CONCERT_A * Math.pow(2, (midi - A4_MIDI) / 12);
}

/**
 * The note in `scale` nearest to `hz`.
 *
 * @param {number} hz
 * @param {object} [opts]
 * @param {number} [opts.tonic] Pitch class of the key, 0 = C.
 * @param {number[]} [opts.scale] Semitone offsets; defaults to chromatic.
 * @returns {{midi: number, hz: number, cents: number}|null}
 */
export function nearestNote(hz, opts = {}) {
  const midi = hzToMidi(hz);
  if (!Number.isFinite(midi)) return null;

  const scale = opts.scale ?? SCALES.chromatic;
  const tonic = Number.isFinite(opts.tonic) ? opts.tonic : 0;

  // Candidates in the octaves either side, because the nearest scale note to a
  // B may be the C above it — searching only within one octave would snap it a
  // major seventh downwards instead of a semitone up.
  const base = Math.floor(midi / 12) * 12;
  let best = null;
  for (let octave = -1; octave <= 1; octave += 1) {
    for (const step of scale) {
      const candidate = base + octave * 12 + ((tonic + step) % 12);
      const distance = Math.abs(candidate - midi);
      if (!best || distance < best.distance) best = { candidate, distance };
    }
  }
  if (!best) return null;

  return {
    midi: best.candidate,
    hz: midiToHz(best.candidate),
    // Signed: positive means the sung note is sharp of the target.
    cents: (midi - best.candidate) * 100
  };
}

/**
 * The pitch ratio that moves `detectedHz` onto the nearest scale note.
 *
 * @param {number} detectedHz
 * @param {object} [opts]
 * @param {number} [opts.tonic]
 * @param {number[]} [opts.scale]
 * @param {number} [opts.strength] 0 = no correction, 1 = fully snapped.
 * @returns {{ratio: number, targetHz: number|null, cents: number, corrected: boolean, reason: string}}
 */
export function correctionFor(detectedHz, opts = {}) {
  const none = (reason) => ({ ratio: 1, targetHz: null, cents: 0, corrected: false, reason });

  if (!Number.isFinite(detectedHz) || detectedHz <= 0) return none("no pitch detected");

  const target = nearestNote(detectedHz, opts);
  if (!target) return none("no pitch detected");

  const semitonesOff = target.cents / 100;
  if (Math.abs(semitonesOff) > MAX_CORRECTION_SEMITONES) {
    // Further than a semitone is a different note, not a flat one — and is much
    // more likely to be an octave error in the detector than a singer being
    // three semitones out.
    return none(`${semitonesOff.toFixed(1)} semitones off — too far to be a correction`);
  }

  const strength = Math.min(1, Math.max(0, opts.strength ?? 1));
  // Partial correction moves part of the way, which is what makes the effect
  // sound like tuning rather than like a machine.
  const appliedCents = -target.cents * strength;
  return {
    ratio: Math.pow(2, appliedCents / 1200),
    targetHz: target.hz,
    cents: target.cents,
    corrected: strength > 0 && Math.abs(target.cents) > 0.5,
    reason: "ok"
  };
}

/**
 * Smooth the correction over time.
 *
 * Applying each frame's ratio directly produces a stepped, jittery pitch,
 * because detection wobbles slightly frame to frame even on a steady note.
 * `retuneMs` is the time constant: small is the hard, obvious effect, large is
 * transparent correction.
 */
export class RetuneSmoother {
  /** @param {{retuneMs?: number}} [opts] */
  constructor(opts = {}) {
    this.retuneMs = Math.max(0, opts.retuneMs ?? 40);
    this.current = 1;
  }

  /**
   * @param {number} targetRatio
   * @param {number} deltaMs Time since the last update.
   * @returns {number}
   */
  step(targetRatio, deltaMs) {
    if (!Number.isFinite(targetRatio) || targetRatio <= 0) return this.current;
    if (this.retuneMs <= 0) {
      this.current = targetRatio;
      return this.current;
    }
    const dt = Number.isFinite(deltaMs) && deltaMs > 0 ? deltaMs : 0;
    // One-pole smoothing, frame-rate independent: the same time constant gives
    // the same audible speed whether the callback runs at 60 Hz or 10 Hz.
    const alpha = 1 - Math.exp(-dt / this.retuneMs);
    this.current += (targetRatio - this.current) * alpha;
    return this.current;
  }

  reset() {
    this.current = 1;
  }
}

/**
 * Detect the pitch of a short frame, by autocorrelation.
 *
 * Takes the **earliest** strong peak rather than the tallest. A periodic signal
 * correlates just as well at twice its period as at its period, so taking the
 * maximum reports the octave below — a mistake this repository has already made
 * once, measuring a 475 Hz tone as 237.6 Hz. An octave error in autotune is
 * worse than no autotune: it drags a voice into the wrong register confidently.
 *
 * @param {Float32Array} frame
 * @param {number} sampleRate
 * @param {{minHz?: number, maxHz?: number, threshold?: number}} [opts]
 * @returns {{hz: number|null, clarity: number}}
 */
export function detectPitch(frame, sampleRate, opts = {}) {
  // Bounded to the human voice by default: a bass guitar bleeding into the mic
  // should not be "corrected" as though it were a singer.
  const minHz = opts.minHz ?? 70;
  const maxHz = opts.maxHz ?? 1100;
  const threshold = opts.threshold ?? 0.35;

  if (!frame || frame.length < 256 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return { hz: null, clarity: 0 };
  }

  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxLag = Math.min(frame.length - 2, Math.ceil(sampleRate / minHz));
  if (maxLag <= minLag) return { hz: null, clarity: 0 };

  let mean = 0;
  for (let i = 0; i < frame.length; i += 1) mean += frame[i];
  mean /= frame.length;

  let energy = 0;
  for (let i = 0; i < frame.length; i += 1) {
    const v = frame[i] - mean;
    energy += v * v;
  }
  if (energy <= 0) return { hz: null, clarity: 0 };

  const corr = (lag) => {
    let sum = 0;
    for (let i = 0; i + lag < frame.length; i += 1) {
      sum += (frame[i] - mean) * (frame[i + lag] - mean);
    }
    return sum / energy;
  };

  const scores = new Float64Array(maxLag + 2);
  let best = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    scores[lag] = corr(lag);
    if (scores[lag] > best) best = scores[lag];
  }
  if (best < threshold) return { hz: null, clarity: Math.max(0, best) };

  // The earliest peak within 90% of the best — the fundamental, not a multiple.
  let chosen = -1;
  for (let lag = minLag + 1; lag < maxLag; lag += 1) {
    const isPeak = scores[lag] >= scores[lag - 1] && scores[lag] >= scores[lag + 1];
    if (isPeak && scores[lag] >= 0.9 * best) {
      chosen = lag;
      break;
    }
  }
  if (chosen < 0) return { hz: null, clarity: Math.max(0, best) };

  // Parabolic interpolation: at 48 kHz the integer lags near 440 Hz are about
  // 4 Hz apart, which is 16 cents — audible, and the whole point is tuning.
  const y0 = scores[chosen - 1];
  const y1 = scores[chosen];
  const y2 = scores[chosen + 1];
  const denom = y0 - 2 * y1 + y2;
  const shift = denom === 0 ? 0 : (0.5 * (y0 - y2)) / denom;

  return { hz: sampleRate / (chosen + shift), clarity: best };
}

/**
 * Is this frame worth tuning at all?
 *
 * A microphone in a venue picks up the room. Correcting the pitch of a
 * background hum, or of the music leaking back in, produces an eerie warble from
 * a channel nobody is singing into — so a frame has to be both loud enough and
 * periodic enough to be a voice.
 *
 * @param {Float32Array} frame
 * @param {object} [opts]
 * @returns {{voiced: boolean, rms: number, reason: string}}
 */
export function isVoiced(frame, opts = {}) {
  const floor = opts.rmsFloor ?? 0.01;
  if (!frame || frame.length === 0) return { voiced: false, rms: 0, reason: "no audio" };

  let sum = 0;
  for (let i = 0; i < frame.length; i += 1) sum += frame[i] * frame[i];
  const rms = Math.sqrt(sum / frame.length);

  if (rms < floor) return { voiced: false, rms, reason: "below the noise floor" };
  return { voiced: true, rms, reason: "ok" };
}
