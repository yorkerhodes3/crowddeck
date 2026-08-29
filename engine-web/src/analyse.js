// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Waveform and tempo analysis — DJX-4.
 *
 * Replaces the librosa dependency of CON-3 for the browser path. Pure functions
 * over sample arrays, so the detection can be tested in Node against synthetic
 * audio with a known answer rather than "it looked about right on one track".
 *
 * Without a waveform you cannot see the phrase coming; without a tempo you cannot
 * beatmatch. Both are table stakes for replacing a commercial DJ application.
 */

/** Analysis window for the onset envelope. ~11.6 ms at 44.1 kHz. */
export const HOP_SIZE = 512;

/** Tempo search range. Outside this, doubling and halving cover the rest. */
export const MIN_BPM = 70;
export const MAX_BPM = 180;

/**
 * How much the onset envelope must peak above its own mean to count as rhythmic.
 *
 * Measured, not guessed: real beats land at 29–55, while sustained tones and
 * white noise land at 3–6. Ten sits in the empty gap between those populations
 * with a wide margin on both sides.
 */
export const MIN_ONSET_CREST = 10;

/**
 * Peak envelope for drawing, reduced to `buckets` columns.
 *
 * Peak, not average. An averaged waveform of percussive music is a smooth blob
 * with no visible transients — you cannot see where the beat is, which is the one
 * thing a DJ looks at a waveform for. Both extremes are kept because a waveform
 * drawn from absolute values alone loses the asymmetry that makes a bassline
 * legible.
 *
 * @param {Float32Array} samples
 * @param {number} buckets
 * @returns {{min: Float32Array, max: Float32Array, rms: Float32Array}}
 */
export function waveformPeaks(samples, buckets = 2000) {
  const n = Math.max(1, Math.floor(buckets));
  const min = new Float32Array(n);
  const max = new Float32Array(n);
  const rms = new Float32Array(n);
  if (!samples || samples.length === 0) return { min, max, rms };

  const per = samples.length / n;
  for (let i = 0; i < n; i++) {
    const start = Math.floor(i * per);
    const end = Math.min(samples.length, Math.floor((i + 1) * per));
    let lo = 0;
    let hi = 0;
    let sumSq = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      const v = samples[j];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
      sumSq += v * v;
      count++;
    }
    min[i] = lo;
    max[i] = hi;
    rms[i] = count ? Math.sqrt(sumSq / count) : 0;
  }
  return { min, max, rms };
}

/**
 * An onset-strength envelope: how much the energy *rose* in each window.
 *
 * Rectified difference, not raw energy. A sustained loud passage has high energy
 * throughout but no onsets; what marks a beat is the *increase*. Taking only
 * positive changes is what makes a steady bassline invisible to the tempo
 * estimator and a kick drum obvious to it.
 *
 * @param {Float32Array} samples
 * @param {number} [hop]
 * @returns {Float32Array}
 */
export function onsetEnvelope(samples, hop = HOP_SIZE) {
  if (!samples || samples.length < hop * 2) return new Float32Array(0);

  const frames = Math.floor(samples.length / hop);
  const energy = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    const start = f * hop;
    let sum = 0;
    for (let j = start; j < start + hop; j++) sum += samples[j] * samples[j];
    // Log energy compresses the range, so a quiet intro's onsets count as much
    // as a loud chorus's. Without it the estimator only ever sees the loudest
    // section and a track that builds is analysed on its final minute alone.
    energy[f] = Math.log10(1e-10 + sum / hop);
  }

  const env = new Float32Array(frames);
  for (let f = 1; f < frames; f++) {
    const d = energy[f] - energy[f - 1];
    env[f] = d > 0 ? d : 0;
  }
  return env;
}

/**
 * Estimate tempo by autocorrelating the onset envelope.
 *
 * Returns the best candidate and its rivals, because **tempo detection is
 * routinely out by an octave** — 174 and 87 are the same groove and the maths
 * cannot always tell which a human would tap. Reporting the alternatives lets a
 * UI offer "×2 / ÷2" instead of silently being wrong, and `syncRate` already
 * folds octaves so a wrong octave still beatmatches correctly.
 *
 * ## Material with no beat must return null, and that is the hard part
 *
 * Autocorrelation always has a maximum. Run it over a sustained tone and it will
 * confidently report a tempo, because the tiny numerical fluctuations in the
 * onset envelope are themselves periodic. Measured on real inputs, the height of
 * that peak is **inversely** related to whether there is a beat at all:
 *
 * | material         | peak score | onset crest |
 * |------------------|-----------:|------------:|
 * | 128 BPM clicks   |       0.66 |        38.8 |
 * | 174 BPM clicks   |       0.76 |        29.4 |
 * | pure 60 Hz tone  |   **1.00** |     **3.2** |
 * | pure 440 Hz tone |   **1.00** |     **3.1** |
 * | white noise      |       0.78 |         6.2 |
 *
 * So gating on the correlation score would reject every real beat and accept
 * every drone. What separates them is the **crest factor of the onset envelope** —
 * peak over mean — which is large only when there are transients standing out of
 * a quiet background, which is what a beat *is*. It is also scale-invariant, so a
 * quiet recording is not penalised.
 *
 * This was caught by playing a sine tone through the real engine and watching the
 * deck report 150 BPM with a sync button that looked ready to use.
 *
 * @param {Float32Array} samples
 * @param {number} sampleRate
 * @param {{hop?: number, minBpm?: number, maxBpm?: number, minCrest?: number}} [opts]
 * @returns {{bpm: number|null, confidence: number, crest: number, candidates: Array<{bpm: number, score: number}>}}
 */
export function detectBpm(samples, sampleRate, opts = {}) {
  const hop = opts.hop ?? HOP_SIZE;
  const minBpm = opts.minBpm ?? MIN_BPM;
  const maxBpm = opts.maxBpm ?? MAX_BPM;
  const minCrest = opts.minCrest ?? MIN_ONSET_CREST;

  const none = (crest = 0) => ({ bpm: null, confidence: 0, crest, candidates: [] });

  const env = onsetEnvelope(samples, hop);
  if (env.length < 16 || !Number.isFinite(sampleRate) || sampleRate <= 0) return none();

  let sum = 0;
  let peak = 0;
  for (const v of env) {
    sum += v;
    if (v > peak) peak = v;
  }
  const mean = sum / env.length;
  const crest = mean > 0 ? peak / mean : 0;

  // No transients, so no beat — whatever the correlation would have said.
  if (crest < minCrest) return none(round2(crest));

  // Mean-remove so the autocorrelation measures periodicity rather than the
  // constant offset, which would otherwise dominate every lag equally.
  const centred = new Float32Array(env.length);
  for (let i = 0; i < env.length; i++) centred[i] = env[i] - mean;

  const framesPerSecond = sampleRate / hop;
  const minLag = Math.max(1, Math.floor((framesPerSecond * 60) / maxBpm));
  const maxLag = Math.min(centred.length - 1, Math.ceil((framesPerSecond * 60) / minBpm));
  if (maxLag <= minLag) return none(round2(crest));

  let zero = 0;
  for (const v of centred) zero += v * v;
  if (zero <= 0) return none(round2(crest));

  const scored = [];
  for (let lag = minLag; lag <= maxLag; lag++) {
    let acc = 0;
    for (let i = 0; i + lag < centred.length; i++) acc += centred[i] * centred[i + lag];
    // Normalise by the overlap length, or long lags are penalised purely for
    // having fewer terms and the estimator drifts systematically fast.
    const overlap = centred.length - lag;
    scored.push({ bpm: (framesPerSecond * 60) / lag, score: acc / overlap / (zero / centred.length) });
  }

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score <= 0) return none(round2(crest));

  // Keep candidates that are genuinely distinct tempos rather than adjacent lags
  // describing the same one.
  const candidates = [];
  for (const c of scored) {
    if (candidates.length >= 4) break;
    if (candidates.some((k) => Math.abs(k.bpm - c.bpm) < 2)) continue;
    candidates.push({ bpm: round2(c.bpm), score: round2(c.score) });
  }

  return {
    bpm: round2(best.bpm),
    // Reported from the crest factor, not the correlation peak — see above. The
    // correlation peak is not a measure of confidence and presenting it as one
    // would put a reassuring number next to a wrong answer.
    confidence: Math.max(0, Math.min(1, (crest - minCrest) / (40 - minCrest))),
    crest: round2(crest),
    candidates
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Fold a tempo into the range a DJ would call it.
 *
 * A detector reporting 87 for a 174 BPM drum-and-bass track is not wrong about
 * the periodicity, only about which multiple a human counts.
 *
 * @param {number} bpm
 * @param {number} [lo]
 * @param {number} [hi]
 */
export function foldTempo(bpm, lo = 85, hi = 170) {
  if (!Number.isFinite(bpm) || bpm <= 0) return null;
  let b = bpm;
  let guard = 0;
  while (b < lo && guard++ < 8) b *= 2;
  while (b > hi && guard++ < 16) b /= 2;
  return round2(b);
}

/** A 12-inch record turns at 33⅓ rpm; a DJ's eye is calibrated to it. */
export const PLATTER_RPM = 33 + 1 / 3;
export const PLATTER_DEG_PER_SECOND = (PLATTER_RPM / 60) * 360;

/**
 * Advance a spinning platter — DJX-11.
 *
 * Rotation is derived from the deck's **own playhead**, never from wall-clock
 * time. Driving it off elapsed real time would drift away from the audio the
 * moment a frame is dropped or the pitch fader moves; taking the delta from
 * `position` means the record turns *because the music is playing*, so it slows
 * with the pitch fader and stops dead when the deck pauses — which is the entire
 * reason a DJ looks at it.
 *
 * A cue jump or a loop wrap is a discontinuity in `position`, not a spin. Rotating
 * by it would fling the record round and read as a glitch, so any implausible
 * delta contributes nothing while still updating the reference point.
 *
 * @param {{angle: number, lastAt: number}} state mutated in place
 * @param {number} position current playhead, seconds
 * @param {boolean} playing
 * @param {number} [maxStepSeconds] beyond this, treat the jump as a seek
 * @returns {number} the new angle in degrees, 0..360
 */
export function advancePlatter(state, position, playing, maxStepSeconds = 1) {
  const pos = Number.isFinite(position) ? position : state.lastAt;
  if (playing) {
    const delta = pos - state.lastAt;
    // Negative means a loop wrapped or the deck was cued backwards; too large
    // means a seek. Neither is rotation.
    if (delta > 0 && delta <= maxStepSeconds) {
      state.angle = (state.angle + delta * PLATTER_DEG_PER_SECOND) % 360;
    }
  }
  state.lastAt = pos;
  return state.angle;
}

/**
 * Mix a multi-channel buffer down to one array for analysis.
 *
 * Analysing only the left channel would miss anything panned right, and a
 * hard-panned percussion line is exactly the sort of thing that carries the beat.
 *
 * @param {Array<Float32Array>} channels
 */
export function toMono(channels) {
  if (!channels || channels.length === 0) return new Float32Array(0);
  if (channels.length === 1) return channels[0];
  const n = channels[0].length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (const ch of channels) sum += ch[i];
    out[i] = sum / channels.length;
  }
  return out;
}

/**
 * Find the first point the track is actually audible — the cue point.
 *
 * Dropping the needle on a file with two seconds of digital silence means the
 * mix starts late, and by then the moment has passed. Threshold is relative to
 * the track's own peak, because a quiet recording's "silence" is not the same
 * absolute level as a loud one's.
 *
 * @param {Float32Array} samples
 * @param {number} sampleRate
 * @param {number} [relativeThreshold]
 * @returns {number} seconds
 */
export function firstAudible(samples, sampleRate, relativeThreshold = 0.02) {
  if (!samples || samples.length === 0 || !sampleRate) return 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
  }
  if (peak === 0) return 0;

  const threshold = peak * relativeThreshold;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) >= threshold) return i / sampleRate;
  }
  return 0;
}
