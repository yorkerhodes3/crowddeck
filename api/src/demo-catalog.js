// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * An in-memory demo catalogue.
 *
 * Stands in for the provider abstraction (epic E8, `providers/`) so the API and
 * clients can be exercised now. Every track carries a **licence class**, because
 * the system must be able to answer "may this venue legally play this right
 * now?" from data rather than assumption (REQ-DAT-8, REQ-DAT-9).
 *
 * The mix is deliberate: mostly Creative Commons, with a couple of deliberately
 * unplayable entries so the policy gate is visible in a demo rather than
 * theoretical.
 */

import { LicenceClass } from "../../core/src/policy.js";

const TRACKS = [
  // `duration` is seconds here for readability; the constructor converts to the
  // milliseconds a track carries everywhere else.
  { id: "cc-001", title: "Neon Harbour",     artist: "Wavelet",        genre: "House",     duration: 212, bpm: 124, licenceClass: LicenceClass.CC_ATTRIBUTION },
  { id: "cc-002", title: "Slow Transit",     artist: "Wavelet",        genre: "Deep House",duration: 245, bpm: 120, licenceClass: LicenceClass.CC_ATTRIBUTION },
  { id: "cc-003", title: "Paper Lanterns",   artist: "Kite Season",    genre: "Indie",     duration: 198, bpm: 112, licenceClass: LicenceClass.CC_ATTRIBUTION },
  { id: "cc-004", title: "Cardamom",         artist: "Kite Season",    genre: "Indie",     duration: 187, bpm: 108, licenceClass: LicenceClass.CC_SHAREALIKE },
  { id: "cc-005", title: "Brass Tacks",      artist: "The Ledger",     genre: "Funk",      duration: 231, bpm: 106, licenceClass: LicenceClass.CC_ATTRIBUTION },
  { id: "cc-006", title: "Midnight Ledger",  artist: "The Ledger",     genre: "Funk",      duration: 259, bpm: 102, licenceClass: LicenceClass.CC_ATTRIBUTION },
  { id: "cc-007", title: "Copper Wire",      artist: "Static Bloom",   genre: "Techno",    duration: 302, bpm: 132, licenceClass: LicenceClass.CC_ATTRIBUTION },
  { id: "cc-008", title: "Halogen",          artist: "Static Bloom",   genre: "Techno",    duration: 288, bpm: 134, licenceClass: LicenceClass.CC_SHAREALIKE },
  { id: "cc-009", title: "Tidal Flats",      artist: "Ora Marsh",      genre: "Ambient",   duration: 341, bpm: 88,  licenceClass: LicenceClass.CC_ATTRIBUTION },
  { id: "cc-010", title: "Low Tide Radio",   artist: "Ora Marsh",      genre: "Ambient",   duration: 276, bpm: 92,  licenceClass: LicenceClass.CC_ATTRIBUTION },
  { id: "cc-011", title: "Sandbank",         artist: "Ferry Lights",   genre: "Disco",     duration: 224, bpm: 118, licenceClass: LicenceClass.CC_ATTRIBUTION },
  { id: "cc-012", title: "Late Ferry",       artist: "Ferry Lights",   genre: "Disco",     duration: 240, bpm: 116, licenceClass: LicenceClass.CC_ATTRIBUTION },
  { id: "pool-001", title: "Concrete Garden",artist: "Bloc Party Line",genre: "House",     duration: 265, bpm: 126, licenceClass: LicenceClass.RECORD_POOL },
  { id: "pool-002", title: "Nightbus",       artist: "Bloc Party Line",genre: "House",     duration: 251, bpm: 125, licenceClass: LicenceClass.RECORD_POOL },

  // Deliberately refused, so the policy gate is demonstrable rather than theoretical.
  { id: "exp-001", title: "Unfiltered",      artist: "Red Lines",      genre: "Hip Hop",   duration: 205, bpm: 95,  licenceClass: LicenceClass.CC_ATTRIBUTION, explicit: true },
  { id: "nc-001",  title: "Study Hall",      artist: "Quiet Hours",    genre: "Lo-fi",     duration: 180, bpm: 80,  licenceClass: LicenceClass.CC_NONCOMMERCIAL },
  { id: "unk-001", title: "Ripped From A CD",artist: "Unknown",        genre: "Rock",      duration: 200, bpm: 130, licenceClass: LicenceClass.UNKNOWN }
];

export class DemoCatalog {
  /**
   * The table above lists `duration` in seconds because that is what a human
   * writing a catalogue entry means. A *track* carries milliseconds everywhere
   * else — `duration_ms` in the schema, and what every provider emits — so the
   * conversion happens once, here, rather than leaving the demo catalogue as the
   * one source in the system speaking a different unit.
   */
  constructor(tracks = TRACKS) {
    this.tracks = tracks.map((t) => ({
      explicit: false,
      ...t,
      duration: Number.isFinite(t.duration) ? t.duration * 1000 : null
    }));
    this.byId = new Map(this.tracks.map((t) => [t.id, t]));
  }

  /** @param {string} query */
  search(query) {
    const q = String(query ?? "").trim().toLowerCase();
    if (!q) return [...this.tracks];
    return this.tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q)
    );
  }

  get(id) {
    return this.byId.get(id) ?? null;
  }

  /**
   * A fallback picker for the never-silent rotation (REQ-FALL-1).
   * Avoids whatever played most recently so filler does not loop obviously.
   */
  fallbackProvider(scheduler) {
    return () => {
      const recent = new Set(scheduler.recentPlays.slice(-6).map((p) => p.trackId));
      const candidates = this.tracks.filter(
        (t) => !recent.has(t.id) && !t.explicit && t.licenceClass !== "cc_noncommercial" && t.licenceClass !== "unknown"
      );
      const pool = candidates.length ? candidates : this.tracks;
      return pool[Math.floor(Math.random() * pool.length)];
    };
  }
}

export { TRACKS };
