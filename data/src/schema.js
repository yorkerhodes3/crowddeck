// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Database schema — SPECIFICATION §4, REQ-DAT-1 … REQ-DAT-14, REQ-NFR-4.
 *
 * ## Two rules that shape everything here
 *
 * **1. `venue_id` exists from the first migration (REQ-DAT-1).** v1 binds to a
 * single venue (ADR-004), so carrying a venue column looks like dead weight today.
 * It is not: adding it later means a migration across every table, every index and
 * every query, on a live system holding a venue's credit balances. The cost now is
 * one column; the cost later is the whole schema. `VENUE_SCOPED_TABLES` below is
 * asserted by a test, so a new table cannot quietly forget it.
 *
 * **2. Append-only means enforced, not intended (REQ-DAT-3).** The credit ledger
 * is guarded by SQL triggers that raise on UPDATE and DELETE. A convention that
 * lives only in a code comment is one careless `UPDATE` away from silently
 * rewriting a patron's balance history, and money-like data must not depend on
 * everyone remembering.
 */

/** Tables holding venue-scoped rows. Every one MUST carry `venue_id` — REQ-DAT-1. */
export const VENUE_SCOPED_TABLES = Object.freeze([
  "tracks",
  "credit_ledger",
  "play_log",
  "queue_entries",
  "queue_voters",
  "queue_events"
]);

/** REQ-DAT-8 — mirrors `LicenceClass` in core/src/policy.js. */
export const LICENCE_CLASSES = Object.freeze([
  "owned_local",
  "cc_attribution",
  "cc_sharealike",
  "cc_noncommercial",
  "record_pool",
  "licensed_stream",
  "unknown"
]);

/** REQ-DAT-5 — v1 has no paid top-up path, so no `purchase` reason exists. */
export const LEDGER_REASONS = Object.freeze([
  "staff_grant",
  "promotion",
  "spend",
  "refund"
]);

const inList = (col, values) =>
  `${col} TEXT NOT NULL CHECK (${col} IN (${values.map((v) => `'${v}'`).join(", ")}))`;

/**
 * Ordered migrations. Append only — never edit a migration that has shipped.
 * @type {ReadonlyArray<{id: number, name: string, sql: string}>}
 */
export const MIGRATIONS = Object.freeze([
  {
    id: 1,
    name: "initial venue-scoped schema",
    sql: `
      CREATE TABLE venues (
        venue_id     TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        commercial   INTEGER NOT NULL DEFAULT 1,
        pro_licence  INTEGER NOT NULL DEFAULT 0,
        created_at   INTEGER NOT NULL
      ) STRICT;

      CREATE TABLE tracks (
        venue_id       TEXT NOT NULL,
        track_id       TEXT NOT NULL,
        title          TEXT,
        artist         TEXT,
        duration_ms    INTEGER,
        ${inList("licence_class", LICENCE_CLASSES)},
        attribution    TEXT,
        source         TEXT,
        explicit       INTEGER NOT NULL DEFAULT 0,
        playable       INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (venue_id, track_id)
      ) STRICT;

      -- REQ-DAT-3/4: append-only; balance is SUM(delta), never a stored column.
      CREATE TABLE credit_ledger (
        entry_id    TEXT PRIMARY KEY,
        venue_id    TEXT NOT NULL,
        patron_id   TEXT NOT NULL,
        delta       INTEGER NOT NULL CHECK (delta <> 0),
        ${inList("reason", LEDGER_REASONS)},
        ref_id      TEXT,
        note        TEXT,
        created_at  INTEGER NOT NULL
      ) STRICT;

      CREATE INDEX idx_ledger_patron ON credit_ledger (venue_id, patron_id);

      CREATE TRIGGER credit_ledger_no_update
        BEFORE UPDATE ON credit_ledger
        BEGIN SELECT RAISE(ABORT, 'credit_ledger is append-only (REQ-DAT-3)'); END;

      CREATE TRIGGER credit_ledger_no_delete
        BEFORE DELETE ON credit_ledger
        BEGIN SELECT RAISE(ABORT, 'credit_ledger is append-only (REQ-DAT-3)'); END;

      -- REQ-DAT-12/13/14: local-only evidence trail for PRO reporting.
      CREATE TABLE play_log (
        play_id        TEXT PRIMARY KEY,
        venue_id       TEXT NOT NULL,
        track_id       TEXT NOT NULL,
        title          TEXT,
        artist         TEXT,
        started_at     INTEGER NOT NULL,
        ended_at       INTEGER,
        mode           TEXT NOT NULL,
        licence_class  TEXT NOT NULL,
        source         TEXT,
        queue_entry_id TEXT,
        patron_id      TEXT
      ) STRICT;

      CREATE INDEX idx_playlog_started ON play_log (venue_id, started_at);

      CREATE TRIGGER play_log_no_delete
        BEFORE DELETE ON play_log
        BEGIN SELECT RAISE(ABORT, 'play_log is an evidence trail and cannot be deleted (REQ-DAT-12)'); END;

      -- A performance may only be closed out once: ended_at goes NULL -> value.
      -- Everything else about a logged performance is immutable.
      CREATE TRIGGER play_log_close_once
        BEFORE UPDATE ON play_log
        WHEN OLD.ended_at IS NOT NULL
          OR NEW.track_id <> OLD.track_id
          OR NEW.started_at <> OLD.started_at
          OR NEW.mode <> OLD.mode
          OR NEW.licence_class <> OLD.licence_class
        BEGIN SELECT RAISE(ABORT, 'play_log rows may only have ended_at set once (REQ-DAT-12)'); END;

      -- REQ-NFR-4: the queue survives process restart.
      CREATE TABLE queue_entries (
        entry_id      TEXT PRIMARY KEY,
        venue_id      TEXT NOT NULL,
        track_id      TEXT NOT NULL,
        track_json    TEXT NOT NULL,
        patron_id     TEXT NOT NULL,
        enqueued_at   INTEGER NOT NULL,
        state         TEXT NOT NULL,
        votes         INTEGER NOT NULL DEFAULT 0,
        boost_units   INTEGER NOT NULL DEFAULT 0,
        staff_pinned  INTEGER NOT NULL DEFAULT 0,
        deck_group    TEXT,
        reject_reason TEXT
      ) STRICT;

      CREATE INDEX idx_queue_state ON queue_entries (venue_id, state);

      CREATE TABLE queue_voters (
        venue_id  TEXT NOT NULL,
        entry_id  TEXT NOT NULL,
        patron_id TEXT NOT NULL,
        PRIMARY KEY (venue_id, entry_id, patron_id),
        FOREIGN KEY (entry_id) REFERENCES queue_entries (entry_id) ON DELETE CASCADE
      ) STRICT;

      CREATE TABLE queue_events (
        venue_id   TEXT NOT NULL,
        entry_id   TEXT NOT NULL,
        seq        INTEGER NOT NULL,
        from_state TEXT NOT NULL,
        to_state   TEXT NOT NULL,
        actor      TEXT NOT NULL,
        reason     TEXT,
        at         INTEGER NOT NULL,
        PRIMARY KEY (venue_id, entry_id, seq),
        FOREIGN KEY (entry_id) REFERENCES queue_entries (entry_id) ON DELETE CASCADE
      ) STRICT;
    `
  }
]);
