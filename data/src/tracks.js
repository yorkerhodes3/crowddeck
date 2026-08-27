// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Track store with a mandatory licence class — REQ-DAT-8 … REQ-DAT-11.
 *
 * ## The one decision worth explaining
 *
 * `licence_class` is `NOT NULL` with a `CHECK` constraint, and there is no default.
 * A track cannot be stored without someone saying what it is. The tempting
 * alternative — default to `unknown` — sounds harmless and is not: it silently
 * converts "nobody has checked this" into a stored fact, and `unknown` is precisely
 * the value that blocks playback in a commercial venue (REQ-DAT-10). Making it
 * explicit means an ingest pipeline that has not been taught about licensing fails
 * loudly at import instead of quietly filling a venue's library with unplayable
 * tracks.
 *
 * The *decision* about whether a track may play lives in `core/src/policy.js`
 * (`screenLicence`). This module stores the facts that decision reads; it does not
 * re-implement the rules, because two copies of a licensing rule is one copy too
 * many.
 */

import { LICENCE_CLASSES } from "./schema.js";

/** Classes that oblige the venue to display attribution while playing — REQ-DAT-11. */
const ATTRIBUTION_REQUIRED = new Set(["cc_attribution", "cc_sharealike"]);

export class TrackStore {
  /** @param {import("./db.js").VenueDatabase} vdb */
  constructor(vdb) {
    this.vdb = vdb;
    this.db = vdb.db;
    this.venueId = vdb.venueId;
  }

  /**
   * @param {object} t
   * @param {string} t.id
   * @param {string} t.licenceClass One of LICENCE_CLASSES — required, no default.
   */
  upsert(t) {
    if (!t || typeof t.id !== "string" || !t.id) {
      throw new TypeError("track.id is required");
    }
    if (!LICENCE_CLASSES.includes(t.licenceClass)) {
      throw new RangeError(
        `track "${t.id}" has licenceClass ${JSON.stringify(t.licenceClass)}. ` +
          `Every track must declare one of: ${LICENCE_CLASSES.join(", ")} (REQ-DAT-8). ` +
          `There is deliberately no default — "unknown" is a claim, not a fallback.`
      );
    }
    if (ATTRIBUTION_REQUIRED.has(t.licenceClass) && !t.attribution) {
      throw new RangeError(
        `track "${t.id}" is ${t.licenceClass} but carries no attribution text. ` +
          `REQ-DAT-11 requires attribution on the venue display while it plays, ` +
          `so it cannot be stored without it.`
      );
    }

    this.db
      .prepare(
        `INSERT INTO tracks
           (venue_id, track_id, title, artist, duration_ms, licence_class, attribution, source, explicit, playable)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (venue_id, track_id) DO UPDATE SET
           title = excluded.title, artist = excluded.artist, duration_ms = excluded.duration_ms,
           licence_class = excluded.licence_class, attribution = excluded.attribution,
           source = excluded.source, explicit = excluded.explicit, playable = excluded.playable`
      )
      .run(
        this.venueId,
        t.id,
        t.title ?? null,
        t.artist ?? null,
        t.duration ?? t.durationMs ?? null,
        t.licenceClass,
        t.attribution ?? null,
        t.source ?? null,
        t.explicit ? 1 : 0,
        t.playable === false ? 0 : 1
      );
    return t.id;
  }

  /** @param {string} trackId @returns {object|null} shaped for core/src/policy.js */
  get(trackId) {
    const r = this.db
      .prepare("SELECT * FROM tracks WHERE venue_id = ? AND track_id = ?")
      .get(this.venueId, trackId);
    return r ? rowToTrack(r) : null;
  }

  /** @returns {Array<object>} */
  all() {
    return this.db
      .prepare("SELECT * FROM tracks WHERE venue_id = ? ORDER BY artist, title")
      .all(this.venueId)
      .map(rowToTrack);
  }

  /** @param {string} q */
  search(q, limit = 50) {
    const like = `%${q}%`;
    return this.db
      .prepare(
        `SELECT * FROM tracks WHERE venue_id = ? AND (title LIKE ? OR artist LIKE ?)
         ORDER BY artist, title LIMIT ?`
      )
      .all(this.venueId, like, like, limit)
      .map(rowToTrack);
  }

  /**
   * Attribution text to show while this track plays, or null — REQ-DAT-11.
   * @param {string} trackId
   */
  attributionFor(trackId) {
    const t = this.get(trackId);
    if (!t) return null;
    return ATTRIBUTION_REQUIRED.has(t.licenceClass) ? t.attribution : null;
  }

  /** @param {string} licenceClass */
  countByClass() {
    return this.db
      .prepare(
        "SELECT licence_class, COUNT(*) AS n FROM tracks WHERE venue_id = ? GROUP BY licence_class"
      )
      .all(this.venueId);
  }
}

function rowToTrack(r) {
  return {
    id: r.track_id,
    venueId: r.venue_id,
    title: r.title,
    artist: r.artist,
    duration: r.duration_ms,
    licenceClass: r.licence_class,
    attribution: r.attribution,
    source: r.source,
    explicit: r.explicit === 1,
    playable: r.playable === 1
  };
}

export { ATTRIBUTION_REQUIRED };
