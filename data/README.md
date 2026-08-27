<!-- SPDX-License-Identifier: Apache-2.0 -->

# `data/` — persistence for one venue

Apache-2.0. Implements SPECIFICATION §4 (`REQ-DAT-1` … `REQ-DAT-14`) and `REQ-NFR-4`.

Everything a venue accumulates that must outlive the process: its library and each
track's licence class, patron credits, the play log, and the request queue.

## Zero dependencies, with one caveat stated plainly

This package uses Node's **built-in `node:sqlite`**, so CrowdDeck still has no runtime
dependencies. That is a real benefit — a venue appliance that needs no package
registry to boot is one fewer thing to fail on a Friday night.

The caveat: `node:sqlite` is marked **experimental** by Node and prints
`ExperimentalWarning: SQLite is an experimental feature` on first use. It requires
**Node 22.5 or newer**. The API could change in a future Node release.

That warning is left visible rather than suppressed. A silenced warning is one nobody
reads, and this is a dependency decision the next maintainer deserves to see. If the
API does move, the blast radius is [`src/db.js`](src/db.js) — every other module talks
to `VenueDatabase`, not to `node:sqlite`.

## Design decisions worth knowing

**`venue_id` from the first migration (`REQ-DAT-1`).** v1 binds to a single venue
([ADR-004](../DECISIONS.md)), so the column looks like dead weight. Adding it later
means migrating every table, index and query on a live venue's credit data. It costs
one column now. `VENUE_SCOPED_TABLES` is asserted by a test, and a second test fails
if a *new* table is added without being listed — so this cannot rot quietly.

**The venue is bound at open time, not passed per call (`REQ-DAT-2`).** Threading a
`venueId` argument through every method leaves every call site one typo away from
reading another venue's data, with nothing to catch it. `openVenueStore()` fixes the
venue and injects it; there is no supported way to ask a store about a different one.

**Append-only is enforced by triggers, not by convention (`REQ-DAT-3`).** The ledger
raises on `UPDATE` and `DELETE` at the database level. A rule that lives only in a
comment is one careless statement away from rewriting a patron's balance history.
Corrections are compensating entries — `refund()` writes a new row and never touches
the old one.

**Balance is always `SUM(delta)` (`REQ-DAT-4`).** There is no balance column to drift
out of step with the entries that produced it. A test asserts the column does not
exist.

**No paid top-up path exists (`REQ-DAT-5`).** The `CHECK` constraint permits only
`staff_grant`, `promotion`, `spend`, `refund`. Taking money brings card-present rules,
chargebacks, tax and PCI scope, all of which ADR-003 put outside v1. Because it is a
constraint rather than a policy, there is literally no `purchase` value to write.

**Spending is atomic with what it buys (`REQ-DAT-7`).** `spendFor({ ..., apply })`
runs the debit and the effect in one transaction. If `apply()` throws, the credit is
not consumed. Callers must do the boost *inside* `apply`, not after it — which is why
the method refuses to run without one.

**A track cannot be stored without a declared licence class (`REQ-DAT-8`).** There is
deliberately no default. Defaulting to `unknown` would convert "nobody checked" into a
stored fact, and `unknown` is exactly what blocks playback in a commercial venue. An
ingest pipeline that has not been taught about licensing should fail at import, loudly.

**The play log has no transport (`REQ-DAT-14`).** No HTTP, no fetch, no sync. Export
returns a CSV string or writes to a local path a human chose. A test reads the module
source and fails if any transport API appears in it.

## Durability means behaviour, not rows

`QueueStore` round-trips the **whole** entry: state, votes, the *identities* of voters
so one-vote-per-patron (`REQ-SCH-17`) still holds after a restart, and the transition
log that is the audit trail for staff overrides (`REQ-POL-4`). Persisting only a vote
*count* would let a patron vote again after every reboot — the rule would weaken
silently. The tests restore into a fresh connection to a real file and then re-run the
rules, rather than comparing ids.

## Usage

```js
import { openVenueStore } from "./data/src/index.js";

const venue = openVenueStore({ path: "venue.db", venueId: "the-anchor" });

venue.tracks.upsert({ id: "t1", title: "Blue Monday", artist: "New Order",
                      licenceClass: "owned_local" });

venue.credits.grant("patron-7", 3);
venue.credits.spendFor({
  patronId: "patron-7",
  units: 1,
  apply: () => entry.addBoost(1, Date.now())   // inside the transaction
});

const playId = venue.playLog.start({ track, mode: "unattended" });
venue.playLog.end(playId);
venue.playLog.exportCsvTo("./march-2026.csv");

venue.close();
```

## Tests

```
node --test "data/test/**/*.test.js"
```

Each guarantee above has a test that fails when the guarantee is removed. That was
checked by deliberately breaking three of them — voter persistence, spend atomicity
and venue scoping — and confirming the suite went red each time.
