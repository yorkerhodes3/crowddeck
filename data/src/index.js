// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Persistence for a single venue — SPECIFICATION §4.
 *
 * Everything here is local. There is no network code in this package by design:
 * REQ-DAT-14 makes the play log local-only, and ADR-003 rules out telemetry.
 */

export { VenueDatabase, openDatabase } from "./db.js";
export { MIGRATIONS, VENUE_SCOPED_TABLES, LICENCE_CLASSES, LEDGER_REASONS } from "./schema.js";
export { CreditLedger, InsufficientCredit } from "./ledger.js";
export { TrackStore } from "./tracks.js";
export { PlayLog, csvField } from "./playlog.js";
export { QueueStore } from "./queue-store.js";

import { openDatabase } from "./db.js";
import { CreditLedger } from "./ledger.js";
import { TrackStore } from "./tracks.js";
import { PlayLog } from "./playlog.js";
import { QueueStore } from "./queue-store.js";

/**
 * Opens a venue's database and returns the stores bound to it.
 *
 * @param {{path?: string, venueId: string, venueName?: string}} args
 */
export function openVenueStore(args) {
  const db = openDatabase(args);
  return {
    db,
    credits: new CreditLedger(db),
    tracks: new TrackStore(db),
    playLog: new PlayLog(db),
    queue: new QueueStore(db),
    close: () => db.close()
  };
}
