// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Venue performing-rights profile — REQ-DAT-9, VEN-3.
 *
 * ## Why this is not a boolean
 *
 * The obvious model is `venue.hasProLicence: true`. It is wrong, and wrong in the
 * direction that matters: it makes the software answer "yes, you may play this"
 * with confidence it has not earned.
 *
 * In the United States a venue needs **separate** licences from ASCAP, BMI and
 * SESAC, and since Global Music Rights began signing major writers away from the
 * incumbents, a fourth. A venue holding three of the four is not 75% covered in any
 * useful sense — it is fully exposed on whatever GMR controls. Other territories
 * differ again: the UK splits the composition right (PRS) from the recording right
 * (PPL), so "one licence" is wrong there for a different reason.
 *
 * ## The case that actually decides the design
 *
 * Most tracks do not carry PRO metadata. So the common question is not "does the
 * venue hold SESAC" but **"the venue holds ASCAP and BMI, and we have no idea which
 * PRO this track belongs to — now what?"**
 *
 * Three options, and two of them are bad:
 *
 * - **Block it.** Legally safest and operationally useless: it would block most of
 *   the catalogue, so the venue disables the feature and gets no protection at all.
 * - **Allow it silently.** Convenient, and it manufactures false confidence — the
 *   precise failure this module exists to prevent.
 * - **Allow it and say so.** The assessment returns `coverage: "gap"` alongside
 *   `allowed: true`, naming the PROs not held. The venue can act on that: buy the
 *   missing licence, or accept a known risk knowingly.
 *
 * The third is implemented, with `strict` available for venues that would rather
 * refuse than guess. **The system never claims a track is cleared when it does not
 * know** — it distinguishes "cleared" from "probably fine" and reports which it has.
 */

/**
 * Performing-rights organisations by territory.
 *
 * Deliberately not exhaustive — it covers the territories v1 targets. An unknown
 * territory yields no registry, which the assessment treats as "cannot determine
 * full coverage" rather than silently assuming the venue is covered.
 */
export const TERRITORY_PROS = Object.freeze({
  US: Object.freeze(["ASCAP", "BMI", "SESAC", "GMR"]),
  CA: Object.freeze(["SOCAN"]),
  GB: Object.freeze(["PRS", "PPL"]),
  IE: Object.freeze(["IMRO"]),
  AU: Object.freeze(["APRA"]),
  NZ: Object.freeze(["APRA"]),
  DE: Object.freeze(["GEMA"]),
  FR: Object.freeze(["SACEM"]),
  NL: Object.freeze(["BUMA"]),
  SE: Object.freeze(["STIM"]),
  JP: Object.freeze(["JASRAC"])
});

/** Coverage outcomes. `GAP` is the honest middle the whole module exists for. */
export const Coverage = Object.freeze({
  /** The track's PRO is held, or the venue holds every PRO in its territory. */
  COVERED: "covered",
  /** The track's PRO is unknown and the venue lacks full territory coverage. */
  GAP: "gap",
  /** The track's PRO is known and the venue does not hold it. */
  UNCOVERED: "uncovered",
  /** No performing-rights licence is needed for this track at all. */
  NOT_REQUIRED: "not_required"
});

/**
 * Licence classes whose public performance is *not* covered by the work's own
 * licence, and therefore needs a PRO licence from the venue.
 *
 * `cc_attribution` and `cc_sharealike` grant public performance directly, so no PRO
 * is involved. `licensed_stream` is covered by the supplying service's own licence.
 * `cc_noncommercial` and `unknown` are refused earlier on other grounds.
 */
const NEEDS_PRO = new Set(["owned_local", "record_pool"]);

export class VenueLicenceProfile {
  /**
   * @param {object} args
   * @param {string} [args.territory] ISO 3166-1 alpha-2. Defaults to US.
   * @param {Array<{pro: string, reference?: string, validFrom?: number, validUntil?: number}>} [args.licences]
   * @param {boolean} [args.commercial] Non-commercial venues need no PRO licence.
   * @param {boolean} [args.strict] Refuse on a coverage gap instead of flagging it.
   */
  constructor({ territory = "US", licences = [], commercial = true, strict = false } = {}) {
    this.territory = territory;
    this.commercial = commercial;
    this.strict = strict;
    this.licences = licences.map((l) => ({
      pro: String(l.pro).toUpperCase(),
      reference: l.reference ?? null,
      validFrom: l.validFrom ?? null,
      validUntil: l.validUntil ?? null
    }));
  }

  /** PROs that exist in this territory, or null if the territory is unknown. */
  get territoryPros() {
    return TERRITORY_PROS[this.territory] ?? null;
  }

  /**
   * Licences in force at `nowMs`.
   *
   * A lapsed licence is not a licence. Checking validity here rather than at the
   * call site means an expired ASCAP account stops counting on its expiry date
   * without anyone remembering to update a flag.
   */
  activeLicences(nowMs = Date.now()) {
    return this.licences.filter(
      (l) =>
        (l.validFrom === null || l.validFrom <= nowMs) &&
        (l.validUntil === null || l.validUntil >= nowMs)
    );
  }

  /** @returns {string[]} PRO names currently held. */
  heldPros(nowMs = Date.now()) {
    return this.activeLicences(nowMs).map((l) => l.pro);
  }

  /** @param {string} pro */
  holds(pro, nowMs = Date.now()) {
    return this.heldPros(nowMs).includes(String(pro).toUpperCase());
  }

  /** PROs in the territory that are not held. Empty means blanket coverage. */
  missingPros(nowMs = Date.now()) {
    const registry = this.territoryPros;
    if (!registry) return null; // unknown territory — coverage is undeterminable
    const held = new Set(this.heldPros(nowMs));
    return registry.filter((p) => !held.has(p));
  }

  /** True only when every PRO in the territory is held. */
  hasBlanketCoverage(nowMs = Date.now()) {
    const missing = this.missingPros(nowMs);
    return missing !== null && missing.length === 0;
  }

  /** Licences expiring within `days`, so staff can renew before a gap opens. */
  expiringSoon(days = 30, nowMs = Date.now()) {
    const horizon = nowMs + days * 86_400_000;
    return this.activeLicences(nowMs).filter(
      (l) => l.validUntil !== null && l.validUntil <= horizon
    );
  }

  /**
   * May this venue legally perform this track right now? — REQ-DAT-9.
   *
   * @param {{licenceClass?: string, pro?: string|null, id?: string}} track
   * @param {number} [nowMs]
   * @returns {{allowed: boolean, coverage: string, detail: string, missingPros?: string[], pro?: string}}
   */
  assess(track, nowMs = Date.now()) {
    const cls = track.licenceClass ?? "unknown";

    if (!this.commercial) {
      return {
        allowed: true,
        coverage: Coverage.NOT_REQUIRED,
        detail: "Non-commercial venue — no public-performance licence is required."
      };
    }

    if (!NEEDS_PRO.has(cls)) {
      return {
        allowed: true,
        coverage: Coverage.NOT_REQUIRED,
        detail: `A ${cls} track carries its own public-performance grant, so no PRO licence applies.`
      };
    }

    const trackPro = track.pro ? String(track.pro).toUpperCase() : null;

    // Case 1: we know which PRO controls the work.
    if (trackPro) {
      if (this.holds(trackPro, nowMs)) {
        return {
          allowed: true,
          coverage: Coverage.COVERED,
          pro: trackPro,
          detail: `Covered by the venue's ${trackPro} licence.`
        };
      }
      return {
        allowed: false,
        coverage: Coverage.UNCOVERED,
        pro: trackPro,
        detail:
          `This work is controlled by ${trackPro} and the venue holds no current ${trackPro} licence. ` +
          `Holding other PRO licences does not cover it.`
      };
    }

    // Case 2: the PRO is unknown, which is the normal case.
    const missing = this.missingPros(nowMs);

    if (missing !== null && missing.length === 0) {
      return {
        allowed: true,
        coverage: Coverage.COVERED,
        detail: `The venue holds every ${this.territory} PRO licence, so repertoire is covered whoever controls it.`
      };
    }

    const held = this.heldPros(nowMs);

    if (held.length === 0) {
      return {
        allowed: false,
        coverage: Coverage.UNCOVERED,
        missingPros: missing ?? undefined,
        detail: "The venue holds no current performing-rights licence for this catalogue."
      };
    }

    const gapDetail =
      missing === null
        ? `Territory "${this.territory}" has no PRO registry on file, so full coverage cannot be confirmed.`
        : `This track does not say which PRO controls it, and the venue holds no ${missing.join(" or ")} licence. ` +
          `It is probably covered by ${held.join(" / ")}, but that is not established.`;

    return {
      allowed: !this.strict,
      coverage: Coverage.GAP,
      missingPros: missing ?? undefined,
      detail: this.strict
        ? `${gapDetail} Strict licensing is on, so it will not be played.`
        : gapDetail
    };
  }

  /** A summary for the venue console: what is held, what is missing, what expires. */
  summary(nowMs = Date.now()) {
    const missing = this.missingPros(nowMs);
    return {
      territory: this.territory,
      commercial: this.commercial,
      strict: this.strict,
      held: this.heldPros(nowMs),
      missing: missing ?? [],
      blanketCoverage: this.hasBlanketCoverage(nowMs),
      territoryUnknown: this.territoryPros === null,
      expiringSoon: this.expiringSoon(30, nowMs).map((l) => ({
        pro: l.pro,
        validUntil: l.validUntil
      }))
    };
  }
}

/** Reads a venue's profile from the database. */
export class LicensingStore {
  /** @param {import("./db.js").VenueDatabase} vdb */
  constructor(vdb) {
    this.vdb = vdb;
    this.db = vdb.db;
    this.venueId = vdb.venueId;
  }

  /** @param {{pro: string, reference?: string, validFrom?: number, validUntil?: number}} licence */
  addLicence(licence) {
    const pro = String(licence.pro).toUpperCase();
    this.db
      .prepare(
        `INSERT INTO venue_pro_licences (venue_id, pro, reference, valid_from, valid_until)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (venue_id, pro) DO UPDATE SET
           reference = excluded.reference,
           valid_from = excluded.valid_from,
           valid_until = excluded.valid_until`
      )
      .run(
        this.venueId,
        pro,
        licence.reference ?? null,
        licence.validFrom ?? null,
        licence.validUntil ?? null
      );
    return pro;
  }

  /** @param {string} pro */
  removeLicence(pro) {
    const res = this.db
      .prepare("DELETE FROM venue_pro_licences WHERE venue_id = ? AND pro = ?")
      .run(this.venueId, String(pro).toUpperCase());
    return Number(res.changes) > 0;
  }

  /** @returns {VenueLicenceProfile} */
  profile(opts = {}) {
    const venue = this.db
      .prepare("SELECT territory, commercial FROM venues WHERE venue_id = ?")
      .get(this.venueId);

    const rows = this.db
      .prepare("SELECT * FROM venue_pro_licences WHERE venue_id = ? ORDER BY pro")
      .all(this.venueId);

    return new VenueLicenceProfile({
      territory: opts.territory ?? venue?.territory ?? "US",
      commercial: opts.commercial ?? venue?.commercial === 1,
      strict: opts.strict ?? false,
      licences: rows.map((r) => ({
        pro: r.pro,
        reference: r.reference,
        validFrom: r.valid_from,
        validUntil: r.valid_until
      }))
    });
  }

  /** @param {string} territory */
  setTerritory(territory) {
    this.db
      .prepare("UPDATE venues SET territory = ? WHERE venue_id = ?")
      .run(territory, this.venueId);
    return territory;
  }
}
