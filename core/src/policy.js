// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Venue policy engine — SPECIFICATION §3.5, REQ-POL-1 … REQ-POL-4,
 * and the licence-class gate from REQ-DAT-8 … REQ-DAT-11.
 *
 * ## Two design points worth stating
 *
 * **Search is filtered by the same function as requests** (REQ-POL-2, C6).
 * Filtering only at request time is a defect, not a shortcut: offering a patron
 * a track they cannot have and then refusing it is a worse experience than
 * never showing it. `screen()` is therefore used by both paths.
 *
 * **The licence question is answered from data, not assumed.** The system must
 * be able to say whether a venue may legally play a track *right now*
 * (REQ-DAT-9). Consumer-streaming and unknown-provenance content is refused by
 * construction, which is the flaw that makes the existing open-source jukeboxes
 * unusable in venues (REQ-CON-7, H4).
 */

/** Licence classes — REQ-DAT-8. */
export const LicenceClass = Object.freeze({
  OWNED_LOCAL: "owned_local",
  CC_ATTRIBUTION: "cc_attribution",
  CC_SHAREALIKE: "cc_sharealike",
  CC_NONCOMMERCIAL: "cc_noncommercial",
  RECORD_POOL: "record_pool",
  LICENSED_STREAM: "licensed_stream",
  UNKNOWN: "unknown"
});

export const PolicyReason = Object.freeze({
  EXPLICIT: "explicit_content",
  BLOCKED_ARTIST: "blocked_artist",
  BLOCKED_GENRE: "blocked_genre",
  NOT_ALLOWLISTED: "not_allowlisted",
  LICENCE_CLASS: "licence_class",
  DAYPART: "daypart",
  UNPLAYABLE: "unplayable"
});

/**
 * Classes that carry no public-performance right in a commercial venue.
 * `cc_noncommercial` and `unknown` default to blocked — REQ-DAT-10.
 */
const COMMERCIALLY_UNSAFE = new Set([
  LicenceClass.CC_NONCOMMERCIAL,
  LicenceClass.UNKNOWN
]);

export const DEFAULT_POLICY = Object.freeze({
  /** Commercial venues must hold PRO licences; set false for a private party. */
  commercial: true,
  explicitAllowed: false,
  /** "block" honours the block lists; "allow" permits only allowlisted values. */
  mode: "block",
  blockedArtists: [],
  blockedGenres: [],
  allowedGenres: [],
  /** [{ startMinute, endMinute, explicitAllowed?, allowedGenres?, blockedGenres? }] */
  daypartRules: []
});

/** @param {Partial<typeof DEFAULT_POLICY>} [overrides] */
export function resolvePolicy(overrides = {}) {
  const p = { ...DEFAULT_POLICY, ...overrides };
  if (!["block", "allow"].includes(p.mode)) {
    throw new RangeError(`policy.mode must be "block" or "allow", got "${p.mode}"`);
  }
  return Object.freeze({
    ...p,
    blockedArtists: p.blockedArtists.map(norm),
    blockedGenres: p.blockedGenres.map(norm),
    allowedGenres: p.allowedGenres.map(norm)
  });
}

/**
 * @typedef {object} PolicyDecision
 * @property {boolean} allowed
 * @property {string} [reason] one of {@link PolicyReason}
 * @property {string} [detail]
 */

const ALLOWED = Object.freeze({ allowed: true });

/**
 * Screen a track against venue policy.
 *
 * Called at request time **and again at cue time** (REQ-POL-3), because
 * dayparting may have changed in between — a track that was fine at 18:00 may
 * not be at 23:00.
 *
 * @param {object} args
 * @param {{id: string, artist?: string, genre?: string, explicit?: boolean,
 *          licenceClass?: string, playable?: boolean}} args.track
 * @param {ReturnType<typeof resolvePolicy>} args.policy
 * @param {{venueMinuteOfDay?: number, holdsPro?: boolean}} [args.context]
 * @returns {PolicyDecision}
 */
export function screen(args) {
  const { track, policy, context = {} } = args;

  if (track.playable === false) {
    return { allowed: false, reason: PolicyReason.UNPLAYABLE, detail: "Track is not playable." };
  }

  // Licence gate first: it is the one that carries legal consequence.
  const licenceDecision = screenLicence(track, policy, context);
  if (!licenceDecision.allowed) return licenceDecision;

  const daypart = activeDaypart(policy, context.venueMinuteOfDay);
  const explicitAllowed = daypart?.explicitAllowed ?? policy.explicitAllowed;

  if (track.explicit && !explicitAllowed) {
    return {
      allowed: false,
      reason: PolicyReason.EXPLICIT,
      detail: "Explicit content is not allowed here right now."
    };
  }

  if (track.artist && policy.blockedArtists.includes(norm(track.artist))) {
    return {
      allowed: false,
      reason: PolicyReason.BLOCKED_ARTIST,
      detail: "That artist is blocked by the venue."
    };
  }

  const genre = track.genre ? norm(track.genre) : null;
  const blockedGenres = daypart?.blockedGenres?.map(norm) ?? policy.blockedGenres;
  if (genre && blockedGenres.includes(genre)) {
    return {
      allowed: false,
      reason: PolicyReason.BLOCKED_GENRE,
      detail: "That genre is blocked by the venue."
    };
  }

  const allowedGenres = daypart?.allowedGenres?.map(norm) ?? policy.allowedGenres;
  if (policy.mode === "allow" || (daypart?.allowedGenres?.length ?? 0) > 0) {
    if (allowedGenres.length > 0 && (!genre || !allowedGenres.includes(genre))) {
      return {
        allowed: false,
        reason: daypart?.allowedGenres ? PolicyReason.DAYPART : PolicyReason.NOT_ALLOWLISTED,
        detail: "That genre isn't on the venue's list right now."
      };
    }
  }

  // Everything that could refuse has passed. Carry the licence coverage through
  // rather than returning a bare ALLOWED: a caller needs to distinguish "cleared"
  // from "allowed, but the PRO coverage is unestablished" (VEN-3). Flattening the
  // two here is exactly how that qualification disappears on the way to the UI.
  return licenceDecision.coverage
    ? { ...ALLOWED, coverage: licenceDecision.coverage, missingPros: licenceDecision.missingPros }
    : ALLOWED;
}

/**
 * May this venue legally play this track right now? — REQ-DAT-9.
 *
 * Accepts either shape of venue context:
 *
 * - `context.licenceProfile` — anything with an `assess(track)` method, in practice
 *   a `VenueLicenceProfile` from `data/` (VEN-3). Models PRO licences individually,
 *   which is what reality looks like: a US venue needs ASCAP *and* BMI *and* SESAC
 *   *and* GMR, and holding three of four is a real exposure, not a rounding error.
 * - `context.holdsPro` — the original boolean. Still honoured, so a venue that has
 *   not configured a profile gets the coarse check rather than no check at all.
 *
 * Structural typing is deliberate: this module calls `.assess()` and never imports
 * the class, so the fusion core stays independent of the persistence layer.
 *
 * When a profile is present its `coverage` is carried onto the decision, so callers
 * can tell "cleared" from "probably fine but unestablished". Flattening those two
 * into one boolean is how software ends up asserting legal conclusions it has not
 * earned.
 *
 * @returns {PolicyDecision}
 */
export function screenLicence(track, policy, context = {}) {
  const cls = track.licenceClass ?? LicenceClass.UNKNOWN;

  if (!policy.commercial) return ALLOWED; // private, non-commercial use

  if (COMMERCIALLY_UNSAFE.has(cls)) {
    return {
      allowed: false,
      reason: PolicyReason.LICENCE_CLASS,
      detail:
        cls === LicenceClass.CC_NONCOMMERCIAL
          ? "Licensed for non-commercial use only, so it cannot be played in a commercial venue."
          : "The licence for this track is unknown, so it cannot be played in a commercial venue."
    };
  }

  if (context.licenceProfile && typeof context.licenceProfile.assess === "function") {
    const assessment = context.licenceProfile.assess(track, context.nowMs);
    if (!assessment.allowed) {
      return {
        allowed: false,
        reason: PolicyReason.LICENCE_CLASS,
        detail: assessment.detail,
        coverage: assessment.coverage,
        missingPros: assessment.missingPros
      };
    }
    return { ...ALLOWED, coverage: assessment.coverage, missingPros: assessment.missingPros };
  }

  // owned_local and record_pool depend on the venue holding PRO licences.
  if (
    (cls === LicenceClass.OWNED_LOCAL || cls === LicenceClass.RECORD_POOL) &&
    context.holdsPro === false
  ) {
    return {
      allowed: false,
      reason: PolicyReason.LICENCE_CLASS,
      detail: "The venue has no performing-rights licence on file for this catalogue."
    };
  }

  return ALLOWED;
}

/**
 * Filter search results with the same rules used at request time — REQ-POL-2.
 *
 * @template {{id: string}} T
 * @param {T[]} tracks
 * @param {ReturnType<typeof resolvePolicy>} policy
 * @param {{venueMinuteOfDay?: number, holdsPro?: boolean}} [context]
 * @returns {T[]}
 */
export function filterSearch(tracks, policy, context = {}) {
  return tracks.filter((track) => screen({ track, policy, context }).allowed);
}

/** Tracks needing on-screen attribution while playing — REQ-DAT-11. */
export function requiresAttribution(track) {
  return (
    track.licenceClass === LicenceClass.CC_ATTRIBUTION ||
    track.licenceClass === LicenceClass.CC_SHAREALIKE
  );
}

function activeDaypart(policy, minuteOfDay) {
  if (minuteOfDay === undefined || !policy.daypartRules?.length) return null;
  return (
    policy.daypartRules.find((r) =>
      r.startMinute <= r.endMinute
        ? minuteOfDay >= r.startMinute && minuteOfDay < r.endMinute
        : // A window that wraps past midnight, e.g. 22:00 -> 02:00.
          minuteOfDay >= r.startMinute || minuteOfDay < r.endMinute
    ) ?? null
  );
}

function norm(s) {
  return String(s).trim().toLowerCase();
}
