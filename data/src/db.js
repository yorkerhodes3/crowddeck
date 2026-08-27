// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Database connection, migrations, and the single-venue binding — REQ-DAT-1/2.
 *
 * Uses Node's built-in `node:sqlite`, which keeps the promise of **zero runtime
 * dependencies** while giving real transactions and real constraints. It is flagged
 * experimental by Node and prints a warning on import; that is a known trade and is
 * recorded in the package README rather than silenced, because silencing a warning
 * you did not read is how surprises get shipped.
 *
 * ## Why the venue binding is an object, not an argument
 *
 * REQ-DAT-2 says the runtime binds to exactly one venue. That could be a `venueId`
 * parameter threaded through every call, but then every call site is one typo away
 * from reading another venue's data, and nothing would catch it. Instead the venue
 * is fixed when the database is opened and injected by the store methods. There is
 * no supported way to ask this object about a different venue.
 */

import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS } from "./schema.js";

export class VenueDatabase {
  /**
   * @param {object} args
   * @param {string} [args.path] File path, or omitted for an in-memory database.
   * @param {string} args.venueId
   * @param {string} [args.venueName]
   * @param {number} [args.nowMs]
   */
  constructor({ path = ":memory:", venueId, venueName, nowMs = Date.now() }) {
    if (typeof venueId !== "string" || venueId.length === 0) {
      throw new TypeError("venueId is required — REQ-DAT-2");
    }
    this.venueId = venueId;
    this.path = path;
    this.db = new DatabaseSync(path);

    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    // Durability over speed: this is a venue's credit ledger, not a cache.
    this.db.exec("PRAGMA synchronous = FULL;");

    this.migrate();
    this.#ensureVenue(venueName ?? venueId, nowMs);
  }

  /** Applies any migrations this database has not yet seen. */
  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         INTEGER PRIMARY KEY,
        name       TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      ) STRICT;
    `);
    const applied = new Set(
      this.db.prepare("SELECT id FROM schema_migrations").all().map((r) => r.id)
    );
    for (const m of MIGRATIONS) {
      if (applied.has(m.id)) continue;
      // Each migration is one transaction: a half-applied schema is worse than none.
      this.db.exec("BEGIN");
      try {
        this.db.exec(m.sql);
        this.db
          .prepare("INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)")
          .run(m.id, m.name, Date.now());
        this.db.exec("COMMIT");
      } catch (e) {
        this.db.exec("ROLLBACK");
        throw new Error(`migration ${m.id} (${m.name}) failed: ${e.message}`, { cause: e });
      }
    }
  }

  #ensureVenue(name, nowMs) {
    this.db
      .prepare(
        `INSERT INTO venues (venue_id, name, commercial, pro_licence, created_at)
         VALUES (?, ?, 1, 0, ?)
         ON CONFLICT (venue_id) DO NOTHING`
      )
      .run(this.venueId, name, nowMs);
  }

  /** @returns {{venue_id: string, name: string, commercial: number, pro_licence: number}} */
  venue() {
    return this.db.prepare("SELECT * FROM venues WHERE venue_id = ?").get(this.venueId);
  }

  /** @param {{commercial?: boolean, proLicence?: boolean, name?: string}} patch */
  updateVenue(patch = {}) {
    const cur = this.venue();
    this.db
      .prepare("UPDATE venues SET name = ?, commercial = ?, pro_licence = ? WHERE venue_id = ?")
      .run(
        patch.name ?? cur.name,
        patch.commercial === undefined ? cur.commercial : patch.commercial ? 1 : 0,
        patch.proLicence === undefined ? cur.pro_licence : patch.proLicence ? 1 : 0,
        this.venueId
      );
    return this.venue();
  }

  /**
   * Runs `fn` inside a transaction, rolling back if it throws.
   *
   * This is what makes REQ-DAT-7 possible: spending a credit and applying the boost
   * it bought are one unit of work, so a failed boost cannot consume credit.
   *
   * @template T @param {() => T} fn @returns {T}
   */
  transaction(fn) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const out = fn();
      this.db.exec("COMMIT");
      return out;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  close() {
    this.db.close();
  }
}

/** @param {ConstructorParameters<typeof VenueDatabase>[0]} args */
export function openDatabase(args) {
  return new VenueDatabase(args);
}
