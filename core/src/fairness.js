// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Fair-queue anti-monopoly rules — SPECIFICATION §3.4, REQ-SCH-14 … REQ-SCH-18.
 *
 * Without these, one enthusiastic patron plays the same song six times and the
 * venue switches the system off. That failure mode is why these are P0 for
 * adoption rather than polish.
 *
 * Every rejection carries a specific machine-readable reason (REQ-SCH-18) so the
 * client can explain *why* rather than showing a generic failure — a patron who
 * understands the rule accepts it; a patron who hits an unexplained wall
 * assumes the system is broken.
 */

/** Defaults from SPECIFICATION §3.4. */
export const DEFAULT_FAIRNESS = Object.freeze({
  maxPendingPerPatron: 2,
  trackCooldownMs: 60 * 60 * 1000,
  artistCooldownMs: 30 * 60 * 1000,
  rateLimitCount: 5,
  rateLimitWindowMs: 15 * 60 * 1000
});

export const RejectReason = Object.freeze({
  PATRON_LIMIT: "patron_limit",
  TRACK_COOLDOWN: "track_cooldown",
  ARTIST_COOLDOWN: "artist_cooldown",
  RATE_LIMIT: "rate_limit",
  ALREADY_QUEUED: "already_queued",
  DUPLICATE_VOTE: "duplicate_vote"
});

/**
 * @typedef {object} FairnessConfig
 * @property {number} maxPendingPerPatron
 * @property {number} trackCooldownMs
 * @property {number} artistCooldownMs
 * @property {number} rateLimitCount
 * @property {number} rateLimitWindowMs
 */

/** @param {Partial<FairnessConfig>} [overrides] @returns {FairnessConfig} */
export function resolveFairness(overrides = {}) {
  const f = { ...DEFAULT_FAIRNESS, ...overrides };
  if (f.maxPendingPerPatron < 1) throw new RangeError("maxPendingPerPatron must be >= 1");
  if (f.rateLimitCount < 1) throw new RangeError("rateLimitCount must be >= 1");
  return Object.freeze(f);
}

/**
 * @typedef {object} FairnessDecision
 * @property {boolean} allowed
 * @property {string} [reason]   one of {@link RejectReason}
 * @property {string} [detail]   human-readable explanation
 * @property {number} [retryAfterMs]
 */

const ALLOWED = Object.freeze({ allowed: true });

/**
 * Decide whether a patron may enqueue a track right now.
 *
 * Pure: all state is passed in, so the rules are trivially testable and the
 * caller owns persistence.
 *
 * @param {object} args
 * @param {{id: string, artist?: string}} args.track
 * @param {string} args.patronId
 * @param {number} args.nowMs
 * @param {Array<{trackId: string, patronId: string, state: string}>} args.pending
 *        entries not yet played (requested / screened / staged / cued)
 * @param {Array<{trackId: string, artist?: string, endedAt: number}>} args.recentPlays
 * @param {number[]} args.patronRequestTimes  epoch ms of this patron's recent requests
 * @param {FairnessConfig} args.config
 * @returns {FairnessDecision}
 */
export function checkRequest(args) {
  const { track, patronId, nowMs, pending, recentPlays, patronRequestTimes, config } = args;

  // 1. Per-patron pending cap — REQ-SCH-14.
  const mine = pending.filter((e) => e.patronId === patronId).length;
  if (mine >= config.maxPendingPerPatron) {
    return {
      allowed: false,
      reason: RejectReason.PATRON_LIMIT,
      detail: `You already have ${mine} songs waiting. Wait for one to play before adding another.`
    };
  }

  // 2. The same track already queued by anyone. Not in the spec's list, but a
  //    duplicate is always a mistake from the patron's point of view and the
  //    cooldown rules would not catch it until after the first play.
  if (pending.some((e) => e.trackId === track.id)) {
    return {
      allowed: false,
      reason: RejectReason.ALREADY_QUEUED,
      detail: "That song is already in the queue."
    };
  }

  // 3. Track cooldown, venue-wide, from last play — REQ-SCH-15.
  const lastPlay = latest(recentPlays.filter((p) => p.trackId === track.id));
  if (lastPlay) {
    const since = nowMs - lastPlay.endedAt;
    if (since < config.trackCooldownMs) {
      return {
        allowed: false,
        reason: RejectReason.TRACK_COOLDOWN,
        detail: "That song played recently. Give it a while.",
        retryAfterMs: config.trackCooldownMs - since
      };
    }
  }

  // 4. Artist cooldown — REQ-SCH-15.
  if (track.artist) {
    const key = normaliseArtist(track.artist);
    const lastByArtist = latest(
      recentPlays.filter((p) => p.artist && normaliseArtist(p.artist) === key)
    );
    if (lastByArtist) {
      const since = nowMs - lastByArtist.endedAt;
      if (since < config.artistCooldownMs) {
        return {
          allowed: false,
          reason: RejectReason.ARTIST_COOLDOWN,
          detail: `${track.artist} played recently. Try something else.`,
          retryAfterMs: config.artistCooldownMs - since
        };
      }
    }
  }

  // 5. Per-patron rate limit — REQ-SCH-16.
  const windowStart = nowMs - config.rateLimitWindowMs;
  const inWindow = patronRequestTimes.filter((t) => t > windowStart);
  if (inWindow.length >= config.rateLimitCount) {
    const oldest = Math.min(...inWindow);
    return {
      allowed: false,
      reason: RejectReason.RATE_LIMIT,
      detail: "You're adding songs faster than the venue allows. Try again shortly.",
      retryAfterMs: oldest + config.rateLimitWindowMs - nowMs
    };
  }

  return ALLOWED;
}

/**
 * One vote per patron per entry — REQ-SCH-17.
 *
 * The scheduler enforces it here, and the data model enforces it again with a
 * UNIQUE(queue_entry_id, patron_id) constraint. Belt and braces on purpose:
 * this is the cheapest thing in the system to cheat by replaying a request.
 *
 * @param {{voters: Set<string>|string[]}} entry
 * @param {string} patronId
 * @returns {FairnessDecision}
 */
export function checkVote(entry, patronId) {
  const voters = entry.voters instanceof Set ? entry.voters : new Set(entry.voters ?? []);
  if (voters.has(patronId)) {
    return {
      allowed: false,
      reason: RejectReason.DUPLICATE_VOTE,
      detail: "You've already voted for this song."
    };
  }
  return ALLOWED;
}

function latest(plays) {
  let best = null;
  for (const p of plays) if (!best || p.endedAt > best.endedAt) best = p;
  return best;
}

/** Loose match so "The Beatles" and "the beatles" share a cooldown. */
function normaliseArtist(name) {
  return name.trim().toLowerCase().replace(/^the\s+/, "");
}
