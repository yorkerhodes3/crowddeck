// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Mixer mathematics — DJX-1.
 *
 * Deliberately free of Web Audio. Everything here is a pure function from control
 * values to gains and rates, so the decisions that are actually *audible* can be
 * tested in Node without a sound card, and the Web Audio layer is left with
 * nothing to do but apply numbers to nodes.
 *
 * That split matters because the interesting bugs in a mixer are arithmetic, not
 * plumbing: a crossfader that dips in the middle, an EQ that cannot truly kill, a
 * pitch fader with the wrong range. None of those throw. They just sound wrong,
 * and you find out in front of people.
 */

/** Pitch fader travel, as a fraction. ±8% is the Technics 1200 default. */
export const DEFAULT_RATE_RANGE = 0.08;

/** EQ knobs: 0 kills, 1 is unity, 4 is the maximum boost. */
export const EQ_MIN = 0;
export const EQ_UNITY = 1;
export const EQ_MAX = 4;

/** Below this an EQ band is a true kill rather than a deep cut. */
const KILL_THRESHOLD = 0.0005;

/** Boost, in dB, at the top of an EQ knob's travel. */
export const EQ_MAX_BOOST_DB = 12;

export const CrossfaderCurve = Object.freeze({
  /** Equal power. Perceived loudness stays constant across the blend. */
  CONSTANT_POWER: "constant_power",
  /** Equal gain. Sums correctly for phase-coherent material, dips otherwise. */
  LINEAR: "linear",
  /** Both sides open across almost the whole travel — for cutting. */
  SHARP: "sharp"
});

/** @param {number} v @param {number} lo @param {number} hi */
export function clamp(v, lo, hi) {
  if (!Number.isFinite(v)) return lo;
  return v < lo ? lo : v > hi ? hi : v;
}

/** @param {number} db */
export function dbToGain(db) {
  return 10 ** (db / 20);
}

/** @param {number} gain */
export function gainToDb(gain) {
  return gain <= 0 ? -Infinity : 20 * Math.log10(gain);
}

/**
 * Crossfader position to a gain for each deck.
 *
 * `position` is −1 (hard left, deck A only) through 0 (both) to +1 (deck B only),
 * matching Mixxx's `[Master]`/`crossfader` range.
 *
 * **Constant power is the default, and the reason is audible.** A linear
 * crossfade puts both decks at 0.5 in the centre. Two uncorrelated signals sum by
 * power, not amplitude, so the middle of the blend is about 3 dB quieter than
 * either end — the mix sags exactly when both tracks are playing, which is when
 * you least want it to. Taking the gains along a quarter-circle (`cos`/`sin`)
 * puts both at 0.707 in the centre, whose squares sum to 1, so power is constant
 * the whole way across.
 *
 * `LINEAR` is still offered because it is the *correct* choice when the two decks
 * carry the same phase-coherent material — the same track double-copied — where
 * the signals sum by amplitude and constant power would instead bulge by 3 dB.
 *
 * @param {number} position
 * @param {string} [curve]
 * @returns {{a: number, b: number}}
 */
export function crossfaderGains(position, curve = CrossfaderCurve.CONSTANT_POWER) {
  const x = clamp(position, -1, 1);

  if (curve === CrossfaderCurve.LINEAR) {
    return { a: (1 - x) / 2, b: (1 + x) / 2 };
  }

  if (curve === CrossfaderCurve.SHARP) {
    // Both sides stay fully open until very near the end of the travel, so a
    // small movement cuts. This is what makes a crossfader usable for scratching
    // rather than for blending.
    const edge = 0.9;
    return {
      a: x <= edge ? 1 : clamp((1 - x) / (1 - edge), 0, 1),
      b: x >= -edge ? 1 : clamp((1 + x) / (1 - edge), 0, 1)
    };
  }

  const t = ((x + 1) / 2) * (Math.PI / 2);
  return { a: Math.cos(t), b: Math.sin(t) };
}

/**
 * An EQ knob position to a filter gain in dB.
 *
 * Zero is a **true kill**, not a deep cut. That is not a detail: killing the bass
 * to bring in the next track's kick is the single most-used move in mixing, and an
 * EQ that only reaches −26 dB leaves an audible rumble underneath, so the two
 * kicks fight. Mixxx, Serato, Rekordbox and every hardware mixer kill.
 *
 * Above unity the knob boosts to a bounded maximum rather than continuing to
 * scale, because an unbounded boost is a clipped mix.
 *
 * @param {number} knob 0..4, unity at 1
 * @returns {number} dB, −Infinity for a kill
 */
export function eqKnobToDb(knob) {
  const k = clamp(knob, EQ_MIN, EQ_MAX);
  if (k <= KILL_THRESHOLD) return -Infinity;
  if (k <= EQ_UNITY) {
    // Below unity, treat the knob as a straight amplitude ratio: 0.5 is −6 dB,
    // which is what a hand expects from half a turn down.
    return gainToDb(k);
  }
  // Above unity, map the remaining travel onto the boost ceiling.
  return ((k - EQ_UNITY) / (EQ_MAX - EQ_UNITY)) * EQ_MAX_BOOST_DB;
}

/**
 * Pitch fader to a playback rate multiplier.
 *
 * `rate` is −1..1 across the fader's travel and `rateRange` is how much that
 * means — ±8% by convention. `direction` is +1 or −1 because DJs disagree about
 * which way a pitch fader should move, and hardware ships both ways.
 *
 * **This changes pitch as well as tempo**, exactly like a turntable. Holding pitch
 * while changing tempo needs a phase vocoder, which is not implemented here; the
 * engine reports `keylock` as unsupported rather than accepting it and doing
 * nothing, so nobody mixes a set believing it is on.
 *
 * @param {number} rate
 * @param {number} [rateRange]
 * @param {number} [direction]
 */
export function rateToPlaybackRate(rate, rateRange = DEFAULT_RATE_RANGE, direction = 1) {
  const r = clamp(rate, -1, 1);
  const dir = direction < 0 ? -1 : 1;
  const multiplier = 1 + r * rateRange * dir;
  // Web Audio treats a rate of 0 as "never advance", and a negative rate is not
  // expressible on an AudioBufferSourceNode at all.
  return Math.max(0.01, multiplier);
}

/**
 * The tempo a deck is actually running at.
 *
 * @param {number} baseBpm the track's analysed tempo
 * @param {number} playbackRate
 */
export function effectiveBpm(baseBpm, playbackRate) {
  if (!Number.isFinite(baseBpm) || baseBpm <= 0) return null;
  return baseBpm * playbackRate;
}

/**
 * The pitch adjustment that would put `follower` at the leader's tempo — DJX-6.
 *
 * Returns null when either tempo is unknown, rather than a rate of 1: silently
 * "syncing" to no effect is worse than reporting that sync is unavailable,
 * because the DJ believes the decks are locked and stops listening for drift.
 *
 * Also returns null when the required stretch exceeds the fader's range. Two
 * tracks 40 BPM apart cannot be matched by a ±8% fader, and pretending otherwise
 * would silently apply the maximum and leave them audibly out of time.
 *
 * @param {number} leaderBpm
 * @param {number} followerBpm
 * @param {number} [rateRange]
 * @returns {{rate: number, playbackRate: number, ratio: number}|null}
 */
export function syncRate(leaderBpm, followerBpm, rateRange = DEFAULT_RATE_RANGE) {
  if (!Number.isFinite(leaderBpm) || !Number.isFinite(followerBpm)) return null;
  if (leaderBpm <= 0 || followerBpm <= 0) return null;

  let ratio = leaderBpm / followerBpm;

  // Halve or double until the tempos are within an octave of each other. A
  // 140 BPM track over a 70 BPM track is a legitimate mix at double time, and
  // tempo detection routinely reports the wrong octave, so this is both a
  // musical convenience and a hedge against the analyser.
  while (ratio > 1.5) ratio /= 2;
  while (ratio < 0.75) ratio *= 2;

  const rate = (ratio - 1) / rateRange;
  if (Math.abs(rate) > 1) return null;

  return { rate, playbackRate: ratio, ratio };
}

/**
 * Everything the audio graph needs for one deck, from its control values.
 *
 * This exists so the *ordering* and the unity points of the gain chain are
 * defined in one place and tested, instead of being implicit in whatever order
 * the nodes happen to be connected.
 *
 * @param {{volume?: number, pregain?: number, rate?: number, rateDir?: number,
 *          eqLow?: number, eqMid?: number, eqHigh?: number}} controls
 * @param {{crossfader?: number, curve?: string, masterGain?: number, rateRange?: number}} master
 * @param {"a"|"b"} side
 */
export function deckMix(controls, master = {}, side = "a") {
  const volume = clamp(controls.volume ?? 1, 0, 1);
  // Pregain is the normalisation trim (CON-6) and is already a linear multiplier.
  const pregain = clamp(controls.pregain ?? 1, 0, 4);
  const xf = crossfaderGains(master.crossfader ?? 0, master.curve);
  const masterGain = clamp(master.masterGain ?? 1, 0, 4);
  const fader = side === "b" ? xf.b : xf.a;

  return {
    pregain,
    volume,
    crossfader: fader,
    masterGain,
    // The product is what the listener hears. Reported so a console can show one
    // number and a test can assert on it without re-deriving the chain.
    effective: pregain * volume * fader * masterGain,
    eq: {
      lowDb: eqKnobToDb(controls.eqLow ?? EQ_UNITY),
      midDb: eqKnobToDb(controls.eqMid ?? EQ_UNITY),
      highDb: eqKnobToDb(controls.eqHigh ?? EQ_UNITY)
    },
    playbackRate: rateToPlaybackRate(
      controls.rate ?? 0,
      master.rateRange ?? DEFAULT_RATE_RANGE,
      controls.rateDir ?? 1
    )
  };
}
