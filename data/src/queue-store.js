// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Durable queue — REQ-NFR-4: queue state MUST survive process restart.
 *
 * ## What "survive" has to mean
 *
 * It is easy to persist a list of track ids and call the queue durable. It is not.
 * A `QueueEntry` carries a state, the votes that got it there, the *identities* of
 * who voted (so REQ-SCH-17's one-vote-per-patron rule still holds after a restart),
 * and its transition log — which is the audit trail for staff overrides under
 * REQ-POL-4. Drop any of those and the queue comes back looking right while
 * behaving wrongly: a patron can vote twice, and a disputed skip has no record.
 *
 * So this module round-trips the whole entry, and `queue-store.test.js` proves it
 * by rebuilding entries and re-running the rules against them rather than merely
 * comparing ids.
 *
 * ## Why the writes are small and synchronous
 *
 * The alternative — snapshot the queue every N seconds — loses whatever happened in
 * the last N seconds, and what happens in a venue is people spending credits. Each
 * mutation is written as it occurs, inside the same transaction as the thing that
 * caused it where that matters (REQ-DAT-7).
 */

import { QueueEntry, State } from "../../core/src/queue.js";

export class QueueStore {
  /** @param {import("./db.js").VenueDatabase} vdb */
  constructor(vdb) {
    this.vdb = vdb;
    this.db = vdb.db;
    this.venueId = vdb.venueId;
  }

  /**
   * Writes an entry and its full associated state.
   * @param {QueueEntry} entry
   */
  save(entry) {
    this.vdb.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO queue_entries
             (entry_id, venue_id, track_id, track_json, patron_id, enqueued_at,
              state, votes, boost_units, staff_pinned, deck_group, reject_reason)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (entry_id) DO UPDATE SET
             state = excluded.state, votes = excluded.votes, boost_units = excluded.boost_units,
             staff_pinned = excluded.staff_pinned, deck_group = excluded.deck_group,
             reject_reason = excluded.reject_reason, track_json = excluded.track_json`
        )
        .run(
          entry.id,
          this.venueId,
          entry.trackId,
          JSON.stringify(entry.track),
          entry.patronId,
          entry.enqueuedAt,
          entry.state,
          entry.votes,
          entry.boostUnits,
          entry.staffPinned ? 1 : 0,
          entry.deckGroup,
          entry.rejectReason
        );

      // Voter identities, not just the count — REQ-SCH-17 must still hold after a
      // restart, and it cannot be reconstructed from a number.
      const insVoter = this.db.prepare(
        `INSERT INTO queue_voters (venue_id, entry_id, patron_id) VALUES (?, ?, ?)
         ON CONFLICT DO NOTHING`
      );
      for (const p of entry.voters) insVoter.run(this.venueId, entry.id, p);

      // The transition log is append-only in practice: rewrite from `seq` onward
      // only for events we have not stored yet.
      const have = this.db
        .prepare("SELECT COALESCE(MAX(seq), -1) AS m FROM queue_events WHERE venue_id = ? AND entry_id = ?")
        .get(this.venueId, entry.id).m;
      const insEvent = this.db.prepare(
        `INSERT INTO queue_events (venue_id, entry_id, seq, from_state, to_state, actor, reason, at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (let i = Number(have) + 1; i < entry.events.length; i++) {
        const e = entry.events[i];
        insEvent.run(this.venueId, entry.id, i, e.from, e.to, e.actor, e.reason, e.at);
      }
    });
    return entry.id;
  }

  /** @param {Iterable<QueueEntry>} entries */
  saveAll(entries) {
    let n = 0;
    for (const e of entries) {
      this.save(e);
      n++;
    }
    return n;
  }

  /**
   * Rebuilds a full `QueueEntry` — the same class the scheduler uses, so restored
   * entries obey exactly the same transition rules as fresh ones.
   * @param {string} entryId @returns {QueueEntry|null}
   */
  load(entryId) {
    const row = this.db
      .prepare("SELECT * FROM queue_entries WHERE venue_id = ? AND entry_id = ?")
      .get(this.venueId, entryId);
    return row ? this.#hydrate(row) : null;
  }

  /** @param {{states?: string[]}} [filter] @returns {QueueEntry[]} */
  loadAll(filter = {}) {
    let rows;
    if (filter.states?.length) {
      const marks = filter.states.map(() => "?").join(", ");
      rows = this.db
        .prepare(
          `SELECT * FROM queue_entries WHERE venue_id = ? AND state IN (${marks})
           ORDER BY enqueued_at ASC`
        )
        .all(this.venueId, ...filter.states);
    } else {
      rows = this.db
        .prepare("SELECT * FROM queue_entries WHERE venue_id = ? ORDER BY enqueued_at ASC")
        .all(this.venueId);
    }
    return rows.map((r) => this.#hydrate(r));
  }

  /**
   * The entries a restarting venue actually needs back: everything still in play.
   * Terminal entries stay in the database as history but do not re-enter the queue.
   */
  loadPending() {
    return this.loadAll({
      states: [State.REQUESTED, State.SCREENED, State.STAGED, State.CUED, State.PLAYING]
    });
  }

  #hydrate(row) {
    const track = JSON.parse(row.track_json);
    const entry = new QueueEntry({
      id: row.entry_id,
      venueId: row.venue_id,
      track,
      patronId: row.patron_id,
      nowMs: row.enqueued_at
    });

    entry.state = row.state;
    entry.boostUnits = row.boost_units;
    entry.staffPinned = row.staff_pinned === 1;
    entry.deckGroup = row.deck_group;
    entry.rejectReason = row.reject_reason;

    const voters = this.db
      .prepare("SELECT patron_id FROM queue_voters WHERE venue_id = ? AND entry_id = ?")
      .all(this.venueId, row.entry_id)
      .map((r) => r.patron_id);
    entry.voters = new Set(voters);
    // Derived from the identities, exactly as addVote() does, so a restored entry
    // cannot disagree with itself.
    entry.votes = entry.voters.size;

    entry.events = this.db
      .prepare(
        "SELECT from_state, to_state, actor, reason, at FROM queue_events WHERE venue_id = ? AND entry_id = ? ORDER BY seq"
      )
      .all(this.venueId, row.entry_id)
      .map((e) => ({ from: e.from_state, to: e.to_state, actor: e.actor, reason: e.reason, at: e.at }));

    return entry;
  }

  /** Removes terminal entries older than `beforeMs`. History pruning, not queue editing. */
  pruneTerminal(beforeMs) {
    const res = this.db
      .prepare(
        `DELETE FROM queue_entries
         WHERE venue_id = ? AND enqueued_at < ?
           AND state IN ('played', 'skipped', 'rejected', 'expired')`
      )
      .run(this.venueId, beforeMs);
    return Number(res.changes);
  }

  count() {
    return Number(
      this.db
        .prepare("SELECT COUNT(*) AS n FROM queue_entries WHERE venue_id = ?")
        .get(this.venueId).n
    );
  }
}
