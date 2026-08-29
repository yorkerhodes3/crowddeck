// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Musical key detection — DJX-14.
 *
 * Key lock (DJX-13) holds a track's key while the tempo moves. This answers the
 * other half of the question: *what key is it in?* Without that there is no
 * harmonic mixing — no way to know that the record you are about to bring in
 * clashes with the one already playing — and the reference application puts the
 * key on the deck next to the BPM for exactly that reason.
 *
 * ## Goertzel rather than an FFT
 *
 * The same reasoning as `keylock.js`. An FFT here would mean either a dependency
 * or a few hundred lines of radix-2 to write and then prove, and it computes
 * every frequency bin when only 72 are wanted. A Goertzel filter evaluates one
 * frequency at a time for about one multiply-add per sample, so asking directly
 * for the 72 semitones from C2 to B7 is both less code and less work.
 *
 * It also lines the bins up with **semitones rather than a linear grid**, which
 * is what actually matters: an FFT's uniform spacing is far too coarse in the
 * bass to separate adjacent semitones without a very long window.
 *
 * ## Krumhansl–Schmuckler
 *
 * Fold the 72 bins into 12 pitch classes, then correlate that profile against 24
 * key profiles — 12 major and 12 minor. The profiles are Krumhansl and Kessler's
 * published probe-tone ratings (Krumhansl, *Cognitive Foundations of Musical
 * Pitch*, 1990), which are empirical measurements of how strongly each scale
 * degree is heard as belonging to a key.
 *
 * ## It says "unknown" often, and that is the point
 *
 * Key detection on real music is genuinely hard; published algorithms sit around
 * 70–80% even on tonal material, and a drum loop has no key at all. The failure
 * that matters is not being wrong — it is being *confidently* wrong, because a DJ
 * who trusts a key badge will mix two records that clash and not know why.
 *
 * So the same discipline as the tempo detector, which learnt this the hard way
 * when autocorrelation reported a confident 150 BPM for a sine tone: there is a
 * **tonality gate** ahead of the answer. A flat chroma — percussion, noise,
 * speech — is reported as unknown rather than being handed to the correlation,
 * which would always return *something*.
 */

/** Pitch classes, sharp-spelled. */
export const PITCH_CLASSES = Object.freeze([
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
]);

/** Lowest analysed octave: C2 is about 65 Hz, below most basslines' fundamentals. */
export const LOWEST_MIDI = 36;

/** How many semitones are analysed — six octaves, C2 to B7. */
export const SEMITONE_COUNT = 72;

/**
 * Krumhansl–Kessler major profile.
 *
 * Reading it left to right: the tonic (6.35) dominates, the fifth (4.38 at index
 * 7... note the array is indexed by semitone, so 5.19) and the third are next,
 * and the notes outside the scale sit low. That shape is what the correlation
 * matches against.
 */
export const MAJOR_PROFILE = Object.freeze([
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88
]);

/** Krumhansl–Kessler minor profile. */
export const MINOR_PROFILE = Object.freeze([
  6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17
]);

/**
 * Below this, the chroma is too flat to be called a key.
 *
 * The measure is the ratio of the strongest pitch class to the mean. Tonal music
 * concentrates energy on a few degrees; percussion and noise spread it evenly.
 * Measured on synthetic material the two populations separate cleanly, and the
 * threshold sits in the gap rather than on top of either.
 */
export const MIN_TONALITY = 1.6;

/** Below this correlation margin, two keys fit about equally well — say so. */
export const MIN_MARGIN = 0.02;

/**
 * Camelot wheel positions, indexed by pitch class.
 *
 * The notation DJs actually use: the number is position on the circle of fifths
 * and the letter is the mode, so neighbouring numbers and the A/B pair at the
 * same number are the mixes that work. C major is 8B; its relative minor, A
 * minor, is 8A.
 */
const CAMELOT_MAJOR = Object.freeze([8, 3, 10, 5, 12, 7, 2, 9, 4, 11, 6, 1]);
const CAMELOT_MINOR = Object.freeze([5, 12, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10]);

/**
 * Frequency of a MIDI note number, in Hz, at A4 = 440.
 *
 * @param {number} midi
 * @returns {number}
 */
export function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Energy at one frequency, by the Goertzel algorithm.
 *
 * A two-tap recurrence that costs one multiply and two adds per sample and
 * yields the magnitude of a single DFT bin at the end. Returns squared magnitude
 * because only relative sizes are ever compared and the square root would be
 * thrown away.
 *
 * @param {Float32Array} frame Windowed samples.
 * @param {number} sampleRate
 * @param {number} hz
 * @returns {number}
 */
export function goertzelPower(frame, sampleRate, hz) {
  const n = frame.length;
  // Rounding the target to the nearest exact bin keeps the recurrence stable and
  // costs at most half a bin of accuracy, which is far finer than a semitone.
  const k = Math.round((n * hz) / sampleRate);
  const omega = (2 * Math.PI * k) / n;
  const coeff = 2 * Math.cos(omega);

  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i += 1) {
    const s0 = frame[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return s1 * s1 + s2 * s2 - coeff * s1 * s2;
}

/** A Hann window, to stop frame edges smearing energy across semitones. */
function hann(n) {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i += 1) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
  return w;
}

/**
 * Reduce to roughly `targetRate` by averaging.
 *
 * Chroma needs nothing above about 4 kHz, and averaging blocks is a crude but
 * adequate low-pass that removes the aliasing plain decimation would fold down
 * into the very range being measured. It also cuts the analysis cost by the
 * decimation factor, which is what makes a whole track affordable.
 *
 * @param {Float32Array} samples
 * @param {number} sampleRate
 * @param {number} [targetRate]
 * @returns {{samples: Float32Array, sampleRate: number}}
 */
export function downsample(samples, sampleRate, targetRate = 11025) {
  const factor = Math.max(1, Math.floor(sampleRate / targetRate));
  if (factor === 1) return { samples, sampleRate };

  const out = new Float32Array(Math.floor(samples.length / factor));
  for (let i = 0; i < out.length; i += 1) {
    let sum = 0;
    const base = i * factor;
    for (let j = 0; j < factor; j += 1) sum += samples[base + j];
    out[i] = sum / factor;
  }
  return { samples: out, sampleRate: sampleRate / factor };
}

/**
 * A 12-bin pitch-class profile for a track.
 *
 * Frames are spread across the whole track rather than taken from the start: an
 * intro is frequently just drums, and a track that begins with a percussive
 * eight bars would otherwise be judged on material that has no key in it.
 *
 * Each frame is normalised before it is accumulated, so a loud chorus does not
 * outvote a quiet verse. Key is a property of the whole record, not of its
 * loudest moment.
 *
 * @param {Float32Array} samples Mono.
 * @param {number} sampleRate
 * @param {object} [opts]
 * @param {number} [opts.frames] How many windows to sample.
 * @param {number} [opts.frameSize] Samples per window, after downsampling.
 * @returns {Float64Array} 12 bins, starting at C.
 */
export function chromaProfile(samples, sampleRate, opts = {}) {
  const frameCount = opts.frames ?? 60;
  const reduced = downsample(samples, sampleRate);
  const frameSize = opts.frameSize ?? 8192;
  const chroma = new Float64Array(12);

  if (reduced.samples.length < frameSize) return chroma;

  const window = hann(frameSize);
  const frame = new Float32Array(frameSize);
  const usable = reduced.samples.length - frameSize;
  const step = frameCount > 1 ? Math.floor(usable / (frameCount - 1)) : 0;

  const hz = new Float64Array(SEMITONE_COUNT);
  for (let s = 0; s < SEMITONE_COUNT; s += 1) hz[s] = midiToHz(LOWEST_MIDI + s);

  for (let f = 0; f < frameCount; f += 1) {
    const start = step > 0 ? f * step : 0;
    if (start > usable) break;
    for (let i = 0; i < frameSize; i += 1) frame[i] = reduced.samples[start + i] * window[i];

    const bins = new Float64Array(12);
    let total = 0;
    for (let s = 0; s < SEMITONE_COUNT; s += 1) {
      const nyquist = reduced.sampleRate / 2;
      if (hz[s] >= nyquist) break;
      const power = goertzelPower(frame, reduced.sampleRate, hz[s]);
      bins[(LOWEST_MIDI + s) % 12] += power;
      total += power;
    }

    if (total <= 0) continue;
    for (let c = 0; c < 12; c += 1) chroma[c] += bins[c] / total;
  }

  return chroma;
}

/**
 * How concentrated a chroma is — the gate between "has a key" and "does not".
 *
 * @param {ArrayLike<number>} chroma
 * @returns {number}
 */
export function tonality(chroma) {
  let total = 0;
  let peak = 0;
  for (let i = 0; i < 12; i += 1) {
    total += chroma[i];
    if (chroma[i] > peak) peak = chroma[i];
  }
  if (total <= 0) return 0;
  return peak / (total / 12);
}

/** Pearson correlation between a chroma and a profile rotated to `tonic`. */
function correlate(chroma, profile, tonic) {
  let meanC = 0;
  let meanP = 0;
  for (let i = 0; i < 12; i += 1) {
    meanC += chroma[i];
    meanP += profile[i];
  }
  meanC /= 12;
  meanP /= 12;

  let num = 0;
  let dc = 0;
  let dp = 0;
  for (let i = 0; i < 12; i += 1) {
    const a = chroma[(tonic + i) % 12] - meanC;
    const b = profile[i] - meanP;
    num += a * b;
    dc += a * a;
    dp += b * b;
  }
  if (dc <= 0 || dp <= 0) return 0;
  return num / Math.sqrt(dc * dp);
}

/**
 * The Camelot code for a key, e.g. `8B` for C major.
 *
 * @param {number} tonic Pitch class, 0 = C.
 * @param {"major"|"minor"} mode
 * @returns {string}
 */
export function toCamelot(tonic, mode) {
  const n = mode === "minor" ? CAMELOT_MINOR[tonic] : CAMELOT_MAJOR[tonic];
  return `${n}${mode === "minor" ? "A" : "B"}`;
}

/**
 * Whether two Camelot codes mix harmonically.
 *
 * The standard rule: the same code, its relative major/minor at the same number,
 * or one step around the wheel. Deliberately not cleverer than that — the wheel
 * is a rule of thumb DJs already know, and inventing a private notion of
 * compatibility would be worse than useless.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function camelotCompatible(a, b) {
  const parse = (code) => {
    const m = /^(\d{1,2})([AB])$/.exec(String(code || "").trim().toUpperCase());
    return m ? { n: Number(m[1]), letter: m[2] } : null;
  };
  const x = parse(a);
  const y = parse(b);
  if (!x || !y) return false;
  if (x.n < 1 || x.n > 12 || y.n < 1 || y.n > 12) return false;

  if (x.n === y.n) return true;
  if (x.letter !== y.letter) return false;
  const step = Math.abs(x.n - y.n);
  return step === 1 || step === 11;
}

/**
 * Detect the key of a chroma profile.
 *
 * Returns `key: null` rather than a guess when the material is not tonal enough,
 * or when two keys fit about equally well.
 *
 * @param {ArrayLike<number>} chroma
 * @returns {{key: string|null, tonic: number|null, mode: string|null, camelot: string|null,
 *            confidence: number, tonality: number, reason: string}}
 */
export function detectKeyFromChroma(chroma) {
  const tone = tonality(chroma);
  const unknown = (reason) => ({
    key: null, tonic: null, mode: null, camelot: null,
    confidence: 0, tonality: tone, reason
  });

  if (tone < MIN_TONALITY) {
    return unknown(
      `no clear key — the pitch content is too evenly spread (${tone.toFixed(2)}, needs ${MIN_TONALITY})`
    );
  }

  let best = null;
  let second = -Infinity;
  for (let tonic = 0; tonic < 12; tonic += 1) {
    for (const mode of ["major", "minor"]) {
      const score = correlate(chroma, mode === "major" ? MAJOR_PROFILE : MINOR_PROFILE, tonic);
      if (!best || score > best.score) {
        if (best) second = best.score;
        best = { tonic, mode, score };
      } else if (score > second) {
        second = score;
      }
    }
  }

  if (!best || best.score <= 0) return unknown("no key profile matched");

  const margin = best.score - second;
  if (margin < MIN_MARGIN) {
    return unknown(`ambiguous — two keys fit within ${margin.toFixed(3)}`);
  }

  return {
    key: `${PITCH_CLASSES[best.tonic]} ${best.mode}`,
    tonic: best.tonic,
    mode: best.mode,
    camelot: toCamelot(best.tonic, best.mode),
    // Reported as the margin over the runner-up rather than the raw correlation.
    // A high correlation with a close second is not confidence — it means the
    // material fits two keys, which is exactly when a badge misleads.
    confidence: Math.max(0, Math.min(1, margin * 5)),
    tonality: tone,
    reason: "ok"
  };
}

/**
 * Detect the key of decoded audio.
 *
 * @param {Float32Array} samples Mono.
 * @param {number} sampleRate
 * @param {object} [opts]
 */
export function detectKey(samples, sampleRate, opts = {}) {
  if (!samples || samples.length === 0 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return detectKeyFromChroma(new Float64Array(12));
  }
  return detectKeyFromChroma(chromaProfile(samples, sampleRate, opts));
}
