// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Play log and CSV export — REQ-DAT-12, REQ-DAT-13, REQ-DAT-14.
 *
 * ## What this is for
 *
 * Performing-rights organisations ask venues what they played. A venue that cannot
 * answer pays a blanket estimate; a venue with a log pays for what it actually
 * performed. That is the entire value proposition, and it only works if the log is
 * complete and trustworthy — hence the delete trigger in the schema and the
 * close-once rule on `ended_at`.
 *
 * ## The requirement that shapes the API
 *
 * **REQ-DAT-14: the log is local-only and MUST NOT be transmitted anywhere.** So
 * this module has no network code, no upload helper, and no "sync" anything. Export
 * returns a CSV *string* and writes to a *local path* the operator chooses. Getting
 * the data out is a deliberate act by a human, not a background job — which is also
 * the only honest way to keep the no-telemetry promise in ADR-003.
 */

import { writeFileSync } from "node:fs";

let seq = 0;
const newId = () => `pl_${Date.now().toString(36)}_${(seq++).toString(36)}`;

/** Columns exported, in order. Header text is chosen to be legible to a PRO, not to a programmer. */
const CSV_COLUMNS = Object.freeze([
  ["started_at_iso", (r) => new Date(r.started_at).toISOString()],
  ["ended_at_iso", (r) => (r.ended_at == null ? "" : new Date(r.ended_at).toISOString())],
  ["duration_seconds", (r) => (r.ended_at == null ? "" : Math.round((r.ended_at - r.started_at) / 1000))],
  ["title", (r) => r.title ?? ""],
  ["artist", (r) => r.artist ?? ""],
  ["track_id", (r) => r.track_id],
  ["licence_class", (r) => r.licence_class],
  ["mode", (r) => r.mode],
  ["source", (r) => r.source ?? ""],
  ["venue_id", (r) => r.venue_id]
]);

/**
 * RFC 4180 quoting. A track called `Say "Hello", Wave Goodbye` must not shift every
 * later column by one and quietly corrupt a royalty report.
 * @param {unknown} v
 */
export function csvField(v) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export class PlayLog {
  /** @param {import("./db.js").VenueDatabase} vdb */
  constructor(vdb) {
    this.vdb = vdb;
    this.db = vdb.db;
    this.venueId = vdb.venueId;
  }

  /**
   * Records the start of a performance — REQ-DAT-12.
   *
   * @param {object} args
   * @param {{id: string, title?: string, artist?: string, licenceClass: string, source?: string}} args.track
   * @param {"attended"|"unattended"|"fallback"|string} args.mode
   * @param {number} [args.startedAt]
   * @param {string} [args.queueEntryId]
   * @param {string} [args.patronId]
   * @returns {string} play id
   */
  start({ track, mode, startedAt = Date.now(), queueEntryId = null, patronId = null }) {
    if (!track?.id) throw new TypeError("track.id is required");
    if (!track.licenceClass) {
      // Without this the log cannot answer the question it exists to answer.
      throw new TypeError(
        `cannot log a performance of "${track.id}" with no licence class — REQ-DAT-12`
      );
    }
    if (!mode) throw new TypeError("mode is required");

    const id = newId();
    this.db
      .prepare(
        `INSERT INTO play_log
           (play_id, venue_id, track_id, title, artist, started_at, ended_at, mode, licence_class, source, queue_entry_id, patron_id)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        this.venueId,
        track.id,
        track.title ?? null,
        track.artist ?? null,
        startedAt,
        mode,
        track.licenceClass,
        track.source ?? null,
        queueEntryId,
        patronId
      );
    return id;
  }

  /**
   * Closes a performance. May only be done once — the schema enforces it.
   * @param {string} playId @param {number} [endedAt]
   */
  end(playId, endedAt = Date.now()) {
    const row = this.db
      .prepare("SELECT * FROM play_log WHERE venue_id = ? AND play_id = ?")
      .get(this.venueId, playId);
    if (!row) throw new RangeError(`no play_log entry ${playId}`);
    if (endedAt < row.started_at) {
      throw new RangeError("a performance cannot end before it started");
    }
    this.db
      .prepare("UPDATE play_log SET ended_at = ? WHERE venue_id = ? AND play_id = ?")
      .run(endedAt, this.venueId, playId);
    return playId;
  }

  /** @param {{from?: number, to?: number, limit?: number}} [range] */
  entries(range = {}) {
    const { from = 0, to = Number.MAX_SAFE_INTEGER, limit = 10000 } = range;
    return this.db
      .prepare(
        `SELECT * FROM play_log WHERE venue_id = ? AND started_at >= ? AND started_at <= ?
         ORDER BY started_at ASC LIMIT ?`
      )
      .all(this.venueId, from, to, limit);
  }

  /** Anything still open — used on restart to close out an interrupted performance. */
  openEntries() {
    return this.db
      .prepare("SELECT * FROM play_log WHERE venue_id = ? AND ended_at IS NULL")
      .all(this.venueId);
  }

  /**
   * CSV for PRO reporting — REQ-DAT-13.
   * @param {{from?: number, to?: number}} [range]
   * @returns {string}
   */
  toCsv(range = {}) {
    const rows = this.entries(range);
    const lines = [CSV_COLUMNS.map(([h]) => h).join(",")];
    for (const r of rows) {
      lines.push(CSV_COLUMNS.map(([, fn]) => csvField(fn(r))).join(","));
    }
    // Trailing newline: POSIX text files end with one, and spreadsheet importers
    // are happier for it.
    return lines.join("\r\n") + "\r\n";
  }

  /**
   * Writes the CSV to a local path. There is no upload counterpart, by design —
   * REQ-DAT-14.
   * @param {string} path @param {{from?: number, to?: number}} [range]
   */
  exportCsvTo(path, range = {}) {
    const csv = this.toCsv(range);
    writeFileSync(path, csv, "utf8");
    return { path, bytes: Buffer.byteLength(csv, "utf8") };
  }

  /** Summary for the venue console: what was played, by licence class. */
  summary(range = {}) {
    const { from = 0, to = Number.MAX_SAFE_INTEGER } = range;
    return this.db
      .prepare(
        `SELECT licence_class, mode, COUNT(*) AS plays,
                SUM(COALESCE(ended_at, started_at) - started_at) AS total_ms
         FROM play_log
         WHERE venue_id = ? AND started_at >= ? AND started_at <= ?
         GROUP BY licence_class, mode
         ORDER BY plays DESC`
      )
      .all(this.venueId, from, to);
  }
}
