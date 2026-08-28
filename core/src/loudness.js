// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Loudness normalisation — REQ-CON-4, CON-6.
 *
 * > Loudness MUST be normalised (ReplayGain / EBU R128) across all sources. Mixing
 * > a CC track, a local file and a live instrument without this is unacceptable in
 * > a venue.
 *
 * ## Why a venue needs this more than a listener does
 *
 * At home, a track that comes in 6 dB hot is mildly annoying and you reach for the
 * volume. In a venue it empties the floor: the room has been set to a level, the
 * next track arrives noticeably louder, and staff turn the system down — so the
 * *following* track, mastered quietly in 1974, is inaudible. One badly matched
 * transition degrades the next twenty minutes.
 *
 * CrowdDeck makes this worse than a normal DJ rig would, because its sources are
 * deliberately heterogeneous: a loudness-war CD master, a Creative Commons track
 * from a bedroom studio, and a live instrument all follow one another. Their
 * integrated loudness can differ by 15 dB or more.
 *
 * ## The part that is easy to get wrong
 *
 * The naive implementation computes `gain = target - measured` and applies it. That
 * introduces clipping, which is *worse than the problem it solves*: inconsistent
 * loudness is a comfort issue, digital clipping is audible distortion through a PA.
 *
 * A track measuring -20 LUFS needs +6 dB to reach a -14 LUFS target. If it already
 * peaks at -2 dBTP, that gain puts it at +4 dBTP and it clips hard. So the gain is
 * **clamped by the available peak headroom**, and when that clamp bites the track
 * simply plays a little quieter than target — which is the correct trade, and the
 * reason ReplayGain has carried a peak field since 2001.
 *
 * `computeGain()` therefore always returns both the gain and whether it was limited,
 * so a DJ console can show *"-2.1 dB (peak-limited)"* rather than silently doing
 * something different from what was asked.
 *
 * ## What is not attempted
 *
 * No dynamic-range compression and no limiter. Both change how the music sounds;
 * this module only chooses a playback gain. A venue that wants a limiter should put
 * one in the signal chain where an engineer can see it, not have one applied
 * invisibly by a jukebox.
 */

/**
 * Target integrated loudness in LUFS.
 *
 * -14 LUFS matches Spotify, YouTube and Amazon, so a venue mixing streamed-era
 * masters with its own library gets transitions that sound consistent with what
 * patrons hear elsewhere. ReplayGain 2.0's -18 and EBU R128 broadcast's -23 are
 * both quieter than a busy room wants.
 */
export const DEFAULT_TARGET_LUFS = -14;

/**
 * Ceiling for true peak, in dBTP.
 *
 * -1.0 rather than 0.0 because lossy encoders overshoot: a file that peaks at
 * exactly 0 dBFS can reconstruct above it after MP3 or AAC decoding, and clip on
 * output even though nothing in the file exceeded full scale. One dB of headroom
 * is the usual allowance and costs nothing audible.
 */
export const DEFAULT_PEAK_CEILING_DBTP = -1.0;

/** Bounds on the gain we will apply, whatever the measurements say. */
export const MAX_BOOST_DB = 12;
export const MAX_CUT_DB = -24;

/** Where a loudness figure came from. Drives what the console shows. */
export const LoudnessSource = Object.freeze({
  /** Measured by our own analysis pass (REQ-CON-2). */
  ANALYSIS: "analysis",
  /** From file tags: ReplayGain, or an `R128_TRACK_GAIN` Opus tag. */
  TAGS: "tags",
  /** Supplied by a provider's API. */
  PROVIDER: "provider",
  /** Nothing known. */
  NONE: "none"
});

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Convert a linear peak (0..1+, as ReplayGain stores it) to dBTP.
 * @param {number} linear
 */
export function linearPeakToDb(linear) {
  if (!Number.isFinite(linear) || linear <= 0) return -Infinity;
  return 20 * Math.log10(linear);
}

/** @param {number} db */
export function dbToLinear(db) {
  return 10 ** (db / 20);
}

/**
 * Read loudness from whatever a track happens to carry.
 *
 * Sources are tried in order of trustworthiness: our own analysis, then file tags,
 * then a provider's claim. Tags are common but not always honest — some encoders
 * write a nominal value rather than a measured one — so a real measurement wins
 * when we have it.
 *
 * @param {object} track
 * @returns {{lufs: number|null, peakDb: number|null, source: string}}
 */
export function readLoudness(track) {
  if (!track || typeof track !== "object") {
    return { lufs: null, peakDb: null, source: LoudnessSource.NONE };
  }

  // 1. Our own analysis pass.
  if (Number.isFinite(track.loudnessLufs)) {
    return {
      lufs: track.loudnessLufs,
      peakDb: Number.isFinite(track.truePeakDb) ? track.truePeakDb : null,
      source: LoudnessSource.ANALYSIS
    };
  }

  // 2. ReplayGain tags. These store a *gain* relative to their own reference
  //    level, not a loudness, so convert: ReplayGain 2.0 references -18 LUFS.
  if (Number.isFinite(track.replayGainDb)) {
    const reference = Number.isFinite(track.replayGainReferenceLufs)
      ? track.replayGainReferenceLufs
      : -18;
    return {
      lufs: reference - track.replayGainDb,
      peakDb: Number.isFinite(track.replayGainPeak)
        ? linearPeakToDb(track.replayGainPeak)
        : null,
      source: LoudnessSource.TAGS
    };
  }

  // 3. A provider's own figure.
  if (Number.isFinite(track.providerLufs)) {
    return { lufs: track.providerLufs, peakDb: null, source: LoudnessSource.PROVIDER };
  }

  return { lufs: null, peakDb: null, source: LoudnessSource.NONE };
}

/**
 * Choose a playback gain for one track.
 *
 * @param {object} track
 * @param {{targetLufs?: number, peakCeilingDb?: number, maxBoostDb?: number, maxCutDb?: number}} [opts]
 * @returns {{gainDb: number, applied: boolean, peakLimited: boolean, clamped: boolean,
 *            measuredLufs: number|null, source: string, reason: string}}
 */
export function computeGain(track, opts = {}) {
  const target = opts.targetLufs ?? DEFAULT_TARGET_LUFS;
  const ceiling = opts.peakCeilingDb ?? DEFAULT_PEAK_CEILING_DBTP;
  const maxBoost = opts.maxBoostDb ?? MAX_BOOST_DB;
  const maxCut = opts.maxCutDb ?? MAX_CUT_DB;

  const { lufs, peakDb, source } = readLoudness(track);

  // Unknown loudness: play it as mastered. Guessing a gain for an unmeasured track
  // would be worse than leaving it alone — a wrong guess is an audible error, and
  // "we don't know" is honest and inaudible.
  if (lufs === null) {
    return {
      gainDb: 0,
      applied: false,
      peakLimited: false,
      clamped: false,
      measuredLufs: null,
      source,
      reason: "no loudness measurement, so the track plays as mastered"
    };
  }

  const desired = target - lufs;
  let gain = clamp(desired, maxCut, maxBoost);
  const clamped = gain !== desired;

  // The peak guard. Without it, normalisation introduces clipping — which is worse
  // than the inconsistency it set out to fix.
  let peakLimited = false;
  if (peakDb !== null && Number.isFinite(peakDb)) {
    const headroom = ceiling - peakDb;
    if (gain > headroom) {
      gain = headroom;
      peakLimited = true;
    }
  }

  // Never turn a boost into a cut through peak limiting: a track already louder
  // than the ceiling is handled by the ordinary cut above, and applying the
  // headroom figure on top would double-attenuate it.
  if (peakLimited && desired < 0) {
    gain = clamp(desired, maxCut, maxBoost);
    peakLimited = false;
  }

  const rounded = Math.round(gain * 10) / 10;

  return {
    gainDb: rounded,
    applied: rounded !== 0,
    peakLimited,
    clamped,
    measuredLufs: lufs,
    source,
    reason: peakLimited
      ? `limited to ${rounded} dB to keep true peak under ${ceiling} dBTP — ` +
        `the full ${Math.round(desired * 10) / 10} dB would clip`
      : clamped
        ? `clamped to ${rounded} dB; ${Math.round(desired * 10) / 10} dB is beyond the safe range`
        : `${rounded} dB to reach ${target} LUFS from ${Math.round(lufs * 10) / 10} LUFS`
  };
}

/**
 * Loudness for a live instrument — REQ-INST-*, REQ-CON-4.
 *
 * A live source cannot be measured in advance: there is no file, and the
 * performance has not happened yet. Pretending otherwise would be the worst
 * possible answer, so this returns an explicit trim the venue set during
 * soundcheck, and says plainly that it is not a measurement.
 *
 * @param {{trimDb?: number}} instrument
 */
export function liveInstrumentGain(instrument = {}) {
  const trim = Number.isFinite(instrument.trimDb) ? clamp(instrument.trimDb, MAX_CUT_DB, MAX_BOOST_DB) : 0;
  return {
    gainDb: trim,
    applied: trim !== 0,
    peakLimited: false,
    clamped: false,
    measuredLufs: null,
    source: LoudnessSource.NONE,
    reason:
      trim === 0
        ? "live source with no soundcheck trim set — level is the performer's responsibility"
        : `soundcheck trim of ${trim} dB; a live source cannot be measured in advance`
  };
}

/**
 * The gain difference between two consecutive tracks.
 *
 * This is the number that decides whether a transition is comfortable. Exposed so a
 * DJ console can warn *before* the handover rather than the room discovering it.
 *
 * @param {object} outgoing @param {object} incoming @param {object} [opts]
 */
export function transitionDelta(outgoing, incoming, opts = {}) {
  const a = computeGain(outgoing, opts);
  const b = computeGain(incoming, opts);

  const outLevel = (a.measuredLufs ?? opts.targetLufs ?? DEFAULT_TARGET_LUFS) + a.gainDb;
  const inLevel = (b.measuredLufs ?? opts.targetLufs ?? DEFAULT_TARGET_LUFS) + b.gainDb;
  const deltaDb = Math.round((inLevel - outLevel) * 10) / 10;

  // 3 dB is roughly where a level change stops reading as "the next song" and
  // starts reading as "someone changed the volume".
  const noticeable = Math.abs(deltaDb) >= 3;

  return {
    deltaDb,
    noticeable,
    outgoing: a,
    incoming: b,
    reason: noticeable
      ? `the next track lands ${deltaDb > 0 ? "louder" : "quieter"} by ${Math.abs(deltaDb)} dB` +
        (a.source === LoudnessSource.NONE || b.source === LoudnessSource.NONE
          ? " — at least one track has no loudness measurement"
          : "")
      : "levels are matched within a few dB"
  };
}
