// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Key lock — pitch-independent tempo — DJX-13.
 *
 * Until now the engine *refused* keylock rather than pretending: `set` returned
 * false and `get` returned 0, because reporting it as on while the pitch still
 * moved would have a DJ mix a set believing the key was held. This is the honest
 * version made real.
 *
 * Why it matters: the pitch fader is how two records are beat-matched, and
 * without keylock it drags the pitch with it. At the ±8% a 1200 offers, that is
 * up to about 1.4 semitones — far enough that a vocal audibly changes key and
 * two tracks in nominally the same key stop agreeing. Every commercial DJ
 * application has had this since Final Scratch; a deck without it cannot be used
 * to mix anything with a voice in it.
 *
 * ## Why SOLA rather than a phase vocoder
 *
 * A phase vocoder is the textbook answer and the wrong one here. It needs an
 * FFT — which means either a dependency or several hundred lines of radix-2 we
 * would then have to prove — and it smears transients, which for four-to-the-
 * floor material is the one artefact a DJ will not accept. Time-domain overlap
 * and add keeps the transients intact, needs no FFT, and is what SoundTouch (and
 * therefore Mixxx's default keylock) actually uses.
 *
 * It also suits *this* problem specifically. The pitch fader is bounded at ±8%,
 * so the ratio is always within a whisker of 1, and the correction needed per
 * hop is tens of samples rather than hundreds. SOLA is at its best exactly
 * there, and a phase vocoder's advantages appear at ratios we never reach.
 *
 * ## The shape of it
 *
 * Two stages, in this order, and the order is the whole lesson.
 *
 * 1. **Resample** the input stream at `ratio` with a fractional read pointer.
 *    This scales pitch by `ratio` and length by `1 / ratio`.
 * 2. **Time-scale** the resampled stream back by `ratio` using overlap-add, so
 *    the length returns to 1:1 while the pitch stays where stage 1 put it.
 *
 * Stage 2 copies each grain **verbatim** — it only chooses *where* to read, never
 * alters what it reads. That is what makes the splice search safe.
 *
 * The first version of this file did the obvious thing instead: one stage, with
 * the resampling done *inside* each grain, and the splice search run over the
 * already-resampled candidate. It measured perfectly at 440, 200 and 1000 Hz and
 * was completely wrong at 60 Hz — a bass tone came out at exactly its input
 * pitch, entirely uncorrected. The search was maximising similarity against the
 * previous output, and for a resampled grain the offset that matches best is the
 * one that *undoes the resampling*. At 440 Hz the search range spans several
 * periods so it locks to a phase-aligned offset and the shift survives; at 60 Hz
 * one period is 754 samples, the correlation has a single broad lobe, and the
 * offset slides freely until the pitch change is cancelled. The search was
 * quietly competing with the resampler, and below about 150 Hz it won.
 *
 * Splitting the stages removes the conflict by construction rather than by
 * tuning: a verbatim grain cannot change pitch no matter which offset is chosen.
 *
 * The Hann window at 50% overlap sums to exactly one, so no normalisation is
 * needed and no amplitude ripple is introduced.
 *
 * The `W` in WSOLA is the part that stops it sounding like a chorus pedal: each
 * grain's read position is nudged within a small search range to the offset that
 * best correlates with the tail already written, so the two overlapping copies
 * reinforce instead of fighting. Without it, successive grains land at arbitrary
 * phase and the cancellation is audible as warble on sustained notes.
 *
 * Kept free of Web Audio so it runs under `node --test`: the bugs in a pitch
 * shifter are arithmetic and they do not throw, they just sound wrong.
 */

/** Grain length in samples. 2048 at 48k is ~43ms — long enough to correlate a bass period, short enough not to smear a transient. */
export const DEFAULT_FRAME = 2048;

/** Output hop. Half the frame, so a Hann window sums to unity. */
export const DEFAULT_HOP = DEFAULT_FRAME / 2;

/**
 * How far back a grain may be nudged to find a better splice.
 *
 * Backward only, and that is a latency decision rather than a stylistic one. The
 * offsets that splice cleanly repeat every pitch period, so exactly one of them
 * always lies in the window one period *behind* the nominal position — searching
 * forward as well finds nothing new but forces the algorithm to buffer that much
 * more lookahead. Making the search one-sided cut the latency from 67ms to 45ms
 * for identical output.
 *
 * 1536 samples is one period at 31 Hz, below the fundamental of anything a
 * loudspeaker will reproduce.
 */
export const DEFAULT_SEARCH = 1536;

/**
 * The widest ratio the buffer is sized for.
 *
 * The fader reaches 1.087 (±8%); 1.15 leaves room for a wider range later
 * without the read running past the end of the buffered input.
 */
export const MAX_RATIO = 1.15;

/** The narrowest ratio, for the same reason. */
export const MIN_RATIO = 1 / MAX_RATIO;

/** Below this difference from unity, resampling is not worth doing. */
const UNITY_EPSILON = 1e-6;

/** Coarse search step, in samples, before refining. */
const COARSE_STRIDE = 8;

/** Correlation decimation during the coarse pass. */
const COARSE_DECIMATION = 4;

/**
 * Round up to a power of two.
 *
 * Ring indexing uses `& (capacity - 1)` rather than `%`, which is both faster
 * and — the reason it matters here — correct for negative positions. The splice
 * search reads up to `search` samples *behind* the nominal offset, and JavaScript's
 * `%` returns a negative result for a negative left operand, which silently
 * indexes off the end of the array and yields `undefined`.
 *
 * @param {number} n
 * @returns {number}
 */
function nextPowerOfTwo(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * A Hann window, precomputed.
 *
 * Periodic rather than symmetric (`/ n`, not `/ (n - 1)`) because that is the
 * form whose 50%-overlap sum is exactly one. The symmetric form is off by a
 * sample and leaves a slow ripple across the output that reads as tremolo.
 *
 * @param {number} n
 * @returns {Float32Array}
 */
export function hann(n) {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i += 1) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
  return w;
}

/**
 * Streaming pitch shifter: same number of samples out as in, pitch scaled.
 *
 * Deliberately an insert effect rather than a replacement for the source node.
 * The deck already does loops, hot cues, seeking and position reporting against
 * `AudioBufferSourceNode`; re-implementing all of that inside a worklet to add
 * keylock would put the two most bug-prone parts of the engine in one place. As
 * a pure stream effect it needs to know nothing about any of it.
 */
export class PitchShifter {
  /**
   * @param {object} [opts]
   * @param {number} [opts.channels] How many channels move together.
   * @param {number} [opts.frame] Grain length in samples.
   * @param {number} [opts.hop] Output hop in samples; must be `frame / 2`.
   * @param {number} [opts.search] How far back a splice may be nudged.
   * @param {number} [opts.corrLength] Samples correlated when choosing a splice.
   */
  constructor(opts = {}) {
    const frame = opts.frame ?? DEFAULT_FRAME;
    const hop = opts.hop ?? Math.floor(frame / 2);
    if (hop * 2 !== frame) {
      // Not a style preference: at any other overlap a Hann window does not sum
      // to one, and the output gains a periodic amplitude ripple.
      throw new Error("hop must be exactly half the frame for unity overlap-add");
    }

    this.channels = Math.max(1, opts.channels ?? 1);
    this.frame = frame;
    this.hop = hop;
    this.search = opts.search ?? DEFAULT_SEARCH;
    this.corrLength = Math.min(opts.corrLength ?? hop, frame);
    this.window = hann(frame);

    /**
     * Constant latency, in samples, in *both* modes.
     *
     * The single most important property here. If bypass were free and keylock
     * delayed, then arming keylock mid-mix would shift that deck by ~27ms
     * against the other — an audible flam on every beat, appearing at the exact
     * moment a DJ is least able to diagnose it. A constant delay is something
     * you learn once; a delay that appears when you touch a button is a fault.
     * So the delay is paid always, and enabling keylock changes only the sound.
     *
     * Sized for the widest ratio rather than the current one, so it also does
     * not move when the pitch fader does. Only the grain needs to be read ahead
     * of the playhead — the splice search looks backward into history, which is
     * already buffered and therefore free.
     */
    this.latency = Math.ceil(this.frame * MAX_RATIO) + 2;

    this.ratio = 1;

    this.inCapacity = nextPowerOfTwo(this.latency + frame + 2 * hop);
    this.writePos = 0;
    this.readPos = 0;

    // The resampled stream sitting between the two stages. Holds the search
    // range as history behind the read point as well as the grain ahead of it.
    this.midCapacity = nextPowerOfTwo(frame + this.search + 4 * hop);
    this.midWrite = 0;
    this.inRead = 0;
    this.anaPos = 0;

    const perChannel = (size) => Array.from({ length: this.channels }, () => new Float32Array(size));
    this.rings = perChannel(this.inCapacity);
    this.mids = perChannel(this.midCapacity);
    this.accums = perChannel(frame);
    this.pendings = perChannel(frame);

    this.accumFill = 0;
    this.pendingCount = 0;
    this.pendingRead = 0;
  }

  /** Discard all state — used on seek, where continuity is meaningless. */
  reset() {
    for (let c = 0; c < this.channels; c += 1) {
      this.rings[c].fill(0);
      this.mids[c].fill(0);
      this.accums[c].fill(0);
    }
    this.writePos = 0;
    this.readPos = 0;
    this.midWrite = 0;
    this.inRead = 0;
    this.anaPos = 0;
    this.accumFill = 0;
    this.pendingCount = 0;
    this.pendingRead = 0;
  }

  /**
   * Set the pitch multiplier.
   *
   * Clamped rather than rejected: a rate arriving slightly outside the range
   * should not silence a deck mid-set, and the buffer is sized for the clamp.
   *
   * @param {number} ratio
   */
  setRatio(ratio) {
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    this.ratio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
  }

  /** True when the shifter is doing nothing but delaying. */
  get isUnity() {
    return Math.abs(this.ratio - 1) < UNITY_EPSILON;
  }

  /** Linear interpolation. Enough at these ratios; the error sits above hearing. */
  #interpIn(ring, pos) {
    const i = Math.floor(pos);
    const frac = pos - i;
    const mask = this.inCapacity - 1;
    const a = ring[i & mask];
    const b = ring[(i + 1) & mask];
    return a + (b - a) * frac;
  }

  /**
   * Stage 1 — advance the resampler until `target` samples exist downstream.
   *
   * Bounded by the input actually written, so it can never read ahead of the
   * data and manufacture silence part-way through a grain.
   */
  #fillMid(target) {
    const mask = this.midCapacity - 1;
    while (this.midWrite < target && this.inRead + 1 < this.writePos) {
      for (let c = 0; c < this.channels; c += 1) {
        this.mids[c][this.midWrite & mask] = this.#interpIn(this.rings[c], this.inRead);
      }
      this.midWrite += 1;
      this.inRead += this.ratio;
    }
  }

  /**
   * Choose the read offset whose content best reinforces what is already written.
   *
   * Normalised cross-correlation, so a quiet passage is not beaten by a loud
   * misaligned one — the unnormalised form locks onto amplitude rather than
   * shape and picks the wrong splice on anything with a dynamic range.
   *
   * Searched coarse-to-fine because the range has to be wide. A full-resolution
   * scan of 1536 offsets against a 1024-sample overlap is 1.6M multiplies per
   * hop, which is roughly 75 million per second per deck — too much to spend in
   * an audio callback that must never miss a deadline. Striding by 8 over a
   * decimated correlation and then refining ±8 costs about 3% of that and picks
   * the same offset, because at these periods the correlation surface is smooth
   * on the scale of a few samples.
   *
   * Correlated across every channel at once, producing **one** offset for all of
   * them. Deciding per channel would let left and right splice at different
   * points, which does not sound like a slightly different splice — it decorrelates
   * the two sides and collapses the stereo image into a phasey blur.
   */
  #bestOffset(base) {
    if (this.accumFill === 0) return 0;

    const n = this.corrLength;
    const score = (delta, stride) => {
      let dot = 0;
      let energy = 0;
      for (let c = 0; c < this.channels; c += 1) {
        const mid = this.mids[c];
        const accum = this.accums[c];
        const mask = this.midCapacity - 1;
        for (let i = 0; i < n; i += stride) {
          const s = mid[(base + delta + i) & mask];
          dot += s * accum[i];
          energy += s * s;
        }
      }
      return dot / Math.sqrt(energy + 1e-9);
    };

    let best = 0;
    let bestScore = -Infinity;
    for (let delta = -this.search; delta <= 0; delta += COARSE_STRIDE) {
      const sc = score(delta, COARSE_DECIMATION);
      if (sc > bestScore) {
        bestScore = sc;
        best = delta;
      }
    }

    let refined = best;
    let refinedScore = -Infinity;
    const from = Math.max(-this.search, best - COARSE_STRIDE);
    const to = Math.min(0, best + COARSE_STRIDE);
    for (let delta = from; delta <= to; delta += 1) {
      const sc = score(delta, 1);
      if (sc > refinedScore) {
        refinedScore = sc;
        refined = delta;
      }
    }
    return refined;
  }

  /** Produce the next `hop` output samples into `this.pendings`. */
  #renderGrain() {
    if (this.isUnity) {
      // Bypass: still delayed by exactly `latency`, so timing never moves.
      for (let c = 0; c < this.channels; c += 1) {
        const ring = this.rings[c];
        const pending = this.pendings[c];
        for (let i = 0; i < this.hop; i += 1) pending[i] = ring[(this.readPos + i) & (this.inCapacity - 1)];
        this.accums[c].fill(0);
      }
      this.readPos += this.hop;
      this.pendingCount = this.hop;
      this.pendingRead = 0;
      // Keep the two stages tracking the input while bypassed, so re-engaging
      // keylock splices into live audio instead of into a stale buffer.
      this.inRead = this.readPos;
      this.midWrite = this.readPos;
      this.anaPos = this.readPos;
      this.accumFill = 0;
      return;
    }

    const nominal = Math.floor(this.anaPos);
    this.#fillMid(nominal + this.frame + 1);

    // Stage 2 reads verbatim, so the offset can only align — never re-pitch.
    const delta = this.#bestOffset(nominal);
    const base = nominal + delta;
    const mask = this.midCapacity - 1;

    for (let c = 0; c < this.channels; c += 1) {
      const mid = this.mids[c];
      const accum = this.accums[c];
      const pending = this.pendings[c];

      for (let i = 0; i < this.frame; i += 1) {
        accum[i] += mid[(base + i) & mask] * this.window[i];
      }
      for (let i = 0; i < this.hop; i += 1) pending[i] = accum[i];

      // Slide the overlap tail down; the far half starts empty for the next grain.
      accum.copyWithin(0, this.hop);
      accum.fill(0, this.hop);
    }

    this.pendingCount = this.hop;
    this.pendingRead = 0;
    this.accumFill = this.hop;

    // Analysis advances faster than synthesis by exactly 1/ratio, which is what
    // undoes the length change stage 1 introduced. Kept fractional: rounding it
    // per grain accumulates into an audible drift over a few minutes.
    this.anaPos += this.hop / this.ratio;
    this.readPos += this.hop;
  }

  /**
   * Push one mono buffer through, filling `output` with the same sample count.
   *
   * @param {Float32Array} input
   * @param {Float32Array} output Written in place; may alias `input`.
   */
  process(input, output) {
    this.processChannels([input], [output]);
  }

  /**
   * Push every channel through together, filling `outputs` in place.
   *
   * @param {Float32Array[]} inputs
   * @param {Float32Array[]} outputs
   */
  processChannels(inputs, outputs) {
    const n = inputs[0].length;
    const threshold = this.latency + 1;
    const channels = Math.min(this.channels, inputs.length, outputs.length);
    const inMask = this.inCapacity - 1;

    for (let i = 0; i < n; i += 1) {
      for (let c = 0; c < channels; c += 1) {
        this.rings[c][this.writePos & inMask] = inputs[c][i];
      }
      this.writePos += 1;

      if (this.pendingRead >= this.pendingCount && this.writePos - this.readPos >= threshold) {
        // Rendering only once the lead is established makes the delay exactly
        // `latency`, rather than "however much happened to be buffered".
        this.#renderGrain();
      }

      if (this.pendingRead < this.pendingCount) {
        for (let c = 0; c < channels; c += 1) outputs[c][i] = this.pendings[c][this.pendingRead];
        this.pendingRead += 1;
      } else {
        for (let c = 0; c < channels; c += 1) outputs[c][i] = 0;
      }
    }
  }
}

/**
 * Pitch multiplier that cancels a playback-rate change.
 *
 * The deck plays at `playbackRate`, which scales pitch by the same factor, so
 * the shifter has to scale it back by the reciprocal. Trivial arithmetic, given
 * a name because getting it inverted is silent: the pitch simply doubles its
 * movement instead of holding, and it takes a trained ear to spot which way.
 *
 * @param {number} playbackRate
 * @returns {number}
 */
export function keylockRatio(playbackRate) {
  if (!Number.isFinite(playbackRate) || playbackRate <= 0) return 1;
  return 1 / playbackRate;
}
