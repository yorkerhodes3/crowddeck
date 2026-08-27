// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Append-only credit ledger — REQ-DAT-3 … REQ-DAT-7.
 *
 * ## Why a ledger and not a balance column
 *
 * A `balance` column is a single mutable number with no history. When a patron says
 * "I had three credits and now I have one", a balance column can only shrug. A
 * ledger answers the question: every change is an entry with a reason, a timestamp
 * and a reference to whatever caused it, and the balance is simply the sum
 * (REQ-DAT-4). Corrections are compensating entries, never edits (REQ-DAT-3) —
 * enforced by triggers in the schema, not by convention here.
 *
 * ## What is deliberately absent
 *
 * There is **no paid top-up path** (REQ-DAT-5). Credits enter only by `staff_grant`
 * or `promotion`. Taking money brings card-present rules, refunds, chargebacks, tax
 * and PCI scope, and ADR-003 put all of that outside v1. The schema's CHECK
 * constraint makes that a structural fact rather than a policy someone can forget:
 * there is no `purchase` reason to write.
 *
 * Credits also never expire (REQ-DAT-6) — matching the TouchTunes wallet mechanic
 * that patrons already understand. That is why nothing here reads a clock to decide
 * whether an entry still counts.
 */

let seq = 0;
const newId = () => `cl_${Date.now().toString(36)}_${(seq++).toString(36)}`;

export class InsufficientCredit extends Error {
  /** @param {string} patronId @param {number} balance @param {number} requested */
  constructor(patronId, balance, requested) {
    super(
      `patron ${patronId} has ${balance} credit(s) but ${requested} were requested`
    );
    this.name = "InsufficientCredit";
    this.code = "insufficient_credit";
    this.balance = balance;
    this.requested = requested;
  }
}

export class CreditLedger {
  /** @param {import("./db.js").VenueDatabase} vdb */
  constructor(vdb) {
    this.vdb = vdb;
    this.db = vdb.db;
    this.venueId = vdb.venueId;
  }

  /**
   * Balance is always derived, never stored — REQ-DAT-4.
   * @param {string} patronId @returns {number}
   */
  balance(patronId) {
    const row = this.db
      .prepare(
        "SELECT COALESCE(SUM(delta), 0) AS bal FROM credit_ledger WHERE venue_id = ? AND patron_id = ?"
      )
      .get(this.venueId, patronId);
    return Number(row.bal);
  }

  /**
   * Appends an entry. Positive deltas grant, negative deltas spend.
   *
   * @param {object} args
   * @param {string} args.patronId
   * @param {number} args.delta
   * @param {"staff_grant"|"promotion"|"spend"|"refund"} args.reason
   * @param {string} [args.refId] What this entry relates to — a queue entry, usually.
   * @param {string} [args.note]
   * @param {number} [args.nowMs]
   */
  append({ patronId, delta, reason, refId = null, note = null, nowMs = Date.now() }) {
    if (!Number.isInteger(delta) || delta === 0) {
      throw new RangeError("delta must be a non-zero integer");
    }
    const id = newId();
    try {
      this.db
        .prepare(
          `INSERT INTO credit_ledger (entry_id, venue_id, patron_id, delta, reason, ref_id, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(id, this.venueId, patronId, delta, reason, refId, note, nowMs);
    } catch (e) {
      // A bad reason is a CHECK violation. Say which reasons exist rather than
      // making the caller go and read the schema.
      if (/CHECK constraint failed/.test(e.message)) {
        throw new RangeError(
          `"${reason}" is not a valid ledger reason. v1 accepts staff_grant, promotion, spend, refund ` +
            `— there is no paid top-up path (REQ-DAT-5).`,
          { cause: e }
        );
      }
      throw e;
    }
    return id;
  }

  /** @param {string} patronId @param {number} units @param {object} [opts] */
  grant(patronId, units, opts = {}) {
    if (!Number.isInteger(units) || units <= 0) {
      throw new RangeError("granted units must be a positive integer");
    }
    return this.append({
      patronId,
      delta: units,
      reason: opts.reason ?? "staff_grant",
      note: opts.note,
      nowMs: opts.nowMs
    });
  }

  /**
   * Spends credit **and** performs `apply` as one atomic unit — REQ-DAT-7.
   *
   * This is the whole point of the class. If `apply` throws, the transaction rolls
   * back and the credit is not consumed: a patron never pays for a boost that did
   * not happen. Callers must therefore do the boost inside `apply`, not after.
   *
   * @template T
   * @param {object} args
   * @param {string} args.patronId
   * @param {number} args.units
   * @param {string} [args.refId]
   * @param {number} [args.nowMs]
   * @param {() => T} args.apply The effect the credit is buying.
   * @returns {{entryId: string, balance: number, result: T}}
   */
  spendFor({ patronId, units, refId = null, nowMs = Date.now(), apply }) {
    if (!Number.isInteger(units) || units <= 0) {
      throw new RangeError("spent units must be a positive integer");
    }
    if (typeof apply !== "function") {
      throw new TypeError("spendFor requires an apply() — credit may only be spent on something");
    }

    return this.vdb.transaction(() => {
      const balance = this.balance(patronId);
      if (balance < units) throw new InsufficientCredit(patronId, balance, units);

      const entryId = this.append({
        patronId,
        delta: -units,
        reason: "spend",
        refId,
        nowMs
      });

      const result = apply();

      return { entryId, balance: balance - units, result };
    });
  }

  /**
   * Reverses an earlier entry with a compensating entry — REQ-DAT-3.
   * The original row is never touched.
   *
   * @param {string} entryId @param {object} [opts]
   */
  refund(entryId, opts = {}) {
    const original = this.db
      .prepare("SELECT * FROM credit_ledger WHERE venue_id = ? AND entry_id = ?")
      .get(this.venueId, entryId);
    if (!original) throw new RangeError(`no ledger entry ${entryId}`);

    return this.append({
      patronId: original.patron_id,
      delta: -original.delta,
      reason: "refund",
      refId: entryId,
      note: opts.note ?? `compensating entry for ${entryId}`,
      nowMs: opts.nowMs
    });
  }

  /** @param {string} patronId @returns {Array<object>} newest first */
  history(patronId, limit = 100) {
    return this.db
      .prepare(
        `SELECT * FROM credit_ledger WHERE venue_id = ? AND patron_id = ?
         ORDER BY created_at DESC, rowid DESC LIMIT ?`
      )
      .all(this.venueId, patronId, limit);
  }
}
