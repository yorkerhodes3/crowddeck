// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Credit ledger — REQ-DAT-3 … REQ-DAT-7.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { openDatabase } from "../src/db.js";
import { CreditLedger, InsufficientCredit } from "../src/ledger.js";

function setup(t) {
  const db = openDatabase({ venueId: "v1" });
  t.after(() => db.close());
  return new CreditLedger(db);
}

test("balance is the sum of deltas, never a stored column — REQ-DAT-4", (t) => {
  const l = setup(t);
  assert.equal(l.balance("p1"), 0, "an unknown patron has no credit, not an error");

  l.grant("p1", 3);
  l.grant("p1", 2, { reason: "promotion" });
  assert.equal(l.balance("p1"), 5);

  l.append({ patronId: "p1", delta: -1, reason: "spend" });
  assert.equal(l.balance("p1"), 4);

  // There is no balance column anywhere to disagree with the sum.
  const cols = l.db.prepare("SELECT name FROM pragma_table_info('credit_ledger')").all().map((r) => r.name);
  assert.ok(!cols.includes("balance"), "a stored balance would be a second source of truth");
});

test("credits never expire — REQ-DAT-6", (t) => {
  const l = setup(t);
  const tenYearsAgo = Date.now() - 10 * 365 * 24 * 3600 * 1000;
  l.append({ patronId: "p1", delta: 5, reason: "staff_grant", nowMs: tenYearsAgo });
  assert.equal(l.balance("p1"), 5, "a decade-old credit is still a credit");
});

test("v1 accepts only the four reasons — REQ-DAT-5", (t) => {
  const l = setup(t);
  for (const reason of ["staff_grant", "promotion", "spend", "refund"]) {
    assert.doesNotThrow(() =>
      l.append({ patronId: "p1", delta: reason === "spend" ? -1 : 1, reason })
    );
  }
  assert.throws(
    () => l.append({ patronId: "p1", delta: 10, reason: "purchase" }),
    /no paid top-up path/,
    "the error should explain why, not just say 'constraint failed'"
  );
});

test("spending is atomic with the boost it buys — REQ-DAT-7", (t) => {
  const l = setup(t);
  l.grant("p1", 5);

  // The success path: credit is spent and the effect happened.
  let applied = false;
  const out = l.spendFor({
    patronId: "p1",
    units: 2,
    apply: () => {
      applied = true;
      return "boosted";
    }
  });
  assert.ok(applied);
  assert.equal(out.result, "boosted");
  assert.equal(l.balance("p1"), 3);

  // The failure path is the requirement: a boost that throws must not cost credit.
  assert.throws(
    () =>
      l.spendFor({
        patronId: "p1",
        units: 2,
        apply: () => {
          throw new Error("deck rejected the boost");
        }
      }),
    /deck rejected the boost/
  );
  assert.equal(l.balance("p1"), 3, "a failed boost MUST NOT consume credit — REQ-DAT-7");

  // And nothing was left behind in the ledger.
  assert.equal(l.history("p1").filter((e) => e.reason === "spend").length, 1);
});

test("credit cannot be overspent", (t) => {
  const l = setup(t);
  l.grant("p1", 1);
  assert.throws(
    () => l.spendFor({ patronId: "p1", units: 2, apply: () => "x" }),
    (e) => e instanceof InsufficientCredit && e.balance === 1 && e.requested === 2
  );
  assert.equal(l.balance("p1"), 1);
});

test("spending requires something to spend on", (t) => {
  const l = setup(t);
  l.grant("p1", 5);
  // Without an effect, "spend" would just be destroying credit — almost certainly a
  // caller bug, and the atomicity guarantee would be meaningless.
  assert.throws(() => l.spendFor({ patronId: "p1", units: 1 }), TypeError);
});

test("corrections are compensating entries, never edits — REQ-DAT-3", (t) => {
  const l = setup(t);
  l.grant("p1", 5);
  const spend = l.spendFor({ patronId: "p1", units: 3, apply: () => true });
  assert.equal(l.balance("p1"), 2);

  l.refund(spend.entryId);
  assert.equal(l.balance("p1"), 5, "the refund restores the balance");

  const rows = l.history("p1");
  assert.equal(rows.length, 3, "grant, spend, refund — the spend is still there");
  const original = rows.find((r) => r.entry_id === spend.entryId);
  assert.equal(original.delta, -3, "the original entry is unchanged");
  const comp = rows.find((r) => r.reason === "refund");
  assert.equal(comp.ref_id, spend.entryId, "the correction points at what it corrects");
});

test("a zero or fractional delta is refused", (t) => {
  const l = setup(t);
  assert.throws(() => l.append({ patronId: "p1", delta: 0, reason: "staff_grant" }), RangeError);
  assert.throws(() => l.append({ patronId: "p1", delta: 1.5, reason: "staff_grant" }), RangeError);
  assert.throws(() => l.grant("p1", -1), RangeError);
  assert.throws(() => l.grant("p1", 0), RangeError);
});

test("balances are per patron", (t) => {
  const l = setup(t);
  l.grant("p1", 5);
  l.grant("p2", 2);
  assert.equal(l.balance("p1"), 5);
  assert.equal(l.balance("p2"), 2);
});

test("a ledger is scoped to its venue — REQ-DAT-1/2", (t) => {
  // Both venues must share ONE database file. Two `:memory:` databases cannot see
  // each other whatever the code does, so that version of this test would pass even
  // with venue scoping entirely removed — it would prove nothing.
  const file = join(tmpdir(), `crowddeck-scope-${randomUUID()}.db`);
  const a = openDatabase({ path: file, venueId: "venue-a" });
  const b = openDatabase({ path: file, venueId: "venue-b" });

  // One hook, in the right order: Windows will not unlink a file that is still open,
  // and WAL leaves -wal/-shm siblings behind.
  t.after(() => {
    a.close();
    b.close();
    for (const suffix of ["", "-wal", "-shm"]) rmSync(file + suffix, { force: true });
  });

  const la = new CreditLedger(a);
  const lb = new CreditLedger(b);
  la.grant("shared-patron", 10);

  assert.equal(la.balance("shared-patron"), 10);
  assert.equal(
    lb.balance("shared-patron"),
    0,
    "the same patron id in a different venue is a different balance"
  );

  // Prove both rows really are in the one file, so the isolation above is the
  // query's doing and not an artefact of separate storage.
  assert.equal(Number(b.db.prepare("SELECT COUNT(*) AS n FROM credit_ledger").get().n), 1);

  lb.grant("shared-patron", 4);
  assert.equal(la.balance("shared-patron"), 10, "venue A is unaffected by venue B");
  assert.equal(lb.balance("shared-patron"), 4);
  assert.equal(Number(b.db.prepare("SELECT COUNT(*) AS n FROM credit_ledger").get().n), 2);
});
