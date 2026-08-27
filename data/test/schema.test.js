// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Schema guarantees — REQ-DAT-1, REQ-DAT-2, REQ-DAT-3.
 *
 * These test the database's *structure*, because the structure is the guarantee.
 * A comment saying "the ledger is append-only" is worth nothing; a trigger that
 * refuses an UPDATE is worth everything.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/db.js";
import { VENUE_SCOPED_TABLES, MIGRATIONS } from "../src/schema.js";

const open = (t, venueId = "v1") => {
  const db = openDatabase({ venueId });
  t.after(() => db.close());
  return db;
};

test("every venue-scoped table carries venue_id — REQ-DAT-1", (t) => {
  const vdb = open(t);
  for (const table of VENUE_SCOPED_TABLES) {
    const cols = vdb.db.prepare("SELECT name FROM pragma_table_info(?)").all(table).map((r) => r.name);
    assert.ok(cols.length > 0, `table "${table}" does not exist`);
    assert.ok(
      cols.includes("venue_id"),
      `"${table}" has no venue_id. Adding it later means migrating every table, index and query ` +
        `on a live venue's data — which is exactly what REQ-DAT-1 exists to avoid.`
    );
  }
});

test("no venue-scoped table was forgotten in the declared list — REQ-DAT-1", (t) => {
  const vdb = open(t);
  const tables = vdb.db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r) => r.name);

  // `venues` is the venue table itself and `schema_migrations` is database-wide.
  const exempt = new Set(["venues", "schema_migrations"]);
  for (const t2 of tables) {
    if (exempt.has(t2)) continue;
    assert.ok(
      VENUE_SCOPED_TABLES.includes(t2),
      `table "${t2}" exists but is not listed in VENUE_SCOPED_TABLES, so nothing checks it for venue_id`
    );
  }
});

test("migrations are idempotent and re-running changes nothing", (t) => {
  const vdb = open(t);
  const before = vdb.db.prepare("SELECT COUNT(*) AS n FROM schema_migrations").get().n;
  vdb.migrate();
  vdb.migrate();
  const after = vdb.db.prepare("SELECT COUNT(*) AS n FROM schema_migrations").get().n;
  assert.equal(after, before);
  assert.equal(Number(after), MIGRATIONS.length);
});

test("the runtime binds to exactly one venue — REQ-DAT-2", (t) => {
  const vdb = open(t, "the-anchor");
  assert.equal(vdb.venueId, "the-anchor");
  assert.equal(vdb.venue().venue_id, "the-anchor");

  assert.throws(() => openDatabase({ venueId: "" }), TypeError);
  assert.throws(() => openDatabase({}), TypeError);
});

test("the credit ledger refuses UPDATE and DELETE — REQ-DAT-3", (t) => {
  const vdb = open(t);
  vdb.db
    .prepare(
      `INSERT INTO credit_ledger (entry_id, venue_id, patron_id, delta, reason, created_at)
       VALUES ('e1', 'v1', 'p1', 5, 'staff_grant', 1000)`
    )
    .run();

  assert.throws(
    () => vdb.db.prepare("UPDATE credit_ledger SET delta = 500 WHERE entry_id = 'e1'").run(),
    /append-only/
  );
  assert.throws(
    () => vdb.db.prepare("DELETE FROM credit_ledger WHERE entry_id = 'e1'").run(),
    /append-only/
  );

  // The row is untouched, which is the point.
  assert.equal(vdb.db.prepare("SELECT delta FROM credit_ledger WHERE entry_id = 'e1'").get().delta, 5);
});

test("the play log cannot be deleted and closes only once — REQ-DAT-12", (t) => {
  const vdb = open(t);
  vdb.db
    .prepare(
      `INSERT INTO play_log (play_id, venue_id, track_id, started_at, mode, licence_class)
       VALUES ('p1', 'v1', 't1', 1000, 'unattended', 'owned_local')`
    )
    .run();

  assert.throws(() => vdb.db.prepare("DELETE FROM play_log WHERE play_id = 'p1'").run(), /cannot be deleted/);

  vdb.db.prepare("UPDATE play_log SET ended_at = 2000 WHERE play_id = 'p1'").run();
  assert.throws(
    () => vdb.db.prepare("UPDATE play_log SET ended_at = 3000 WHERE play_id = 'p1'").run(),
    /only have ended_at set once/
  );
  // Rewriting what was played is refused even before it is closed.
  assert.throws(
    () => vdb.db.prepare("UPDATE play_log SET licence_class = 'unknown' WHERE play_id = 'p1'").run(),
    /only have ended_at set once/
  );
});

test("a ledger reason outside the v1 set is rejected by the database — REQ-DAT-5", (t) => {
  const vdb = open(t);
  assert.throws(
    () =>
      vdb.db
        .prepare(
          `INSERT INTO credit_ledger (entry_id, venue_id, patron_id, delta, reason, created_at)
           VALUES ('e9', 'v1', 'p1', 10, 'purchase', 1000)`
        )
        .run(),
    /CHECK constraint failed/,
    "there is no paid top-up path in v1, so 'purchase' must not be storable"
  );
});

test("a transaction rolls back completely when the work inside it fails", (t) => {
  const vdb = open(t);
  assert.throws(() =>
    vdb.transaction(() => {
      vdb.db
        .prepare(
          `INSERT INTO credit_ledger (entry_id, venue_id, patron_id, delta, reason, created_at)
           VALUES ('e2', 'v1', 'p1', 5, 'staff_grant', 1000)`
        )
        .run();
      throw new Error("boom");
    })
  );
  assert.equal(vdb.db.prepare("SELECT COUNT(*) AS n FROM credit_ledger").get().n, 0);
});
