// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Venue performing-rights profile — REQ-DAT-9, VEN-3.
 *
 * The tests that matter most here are the ones about *not knowing*. Any model can
 * answer "the venue holds ASCAP and this is an ASCAP work". The question that
 * decides whether this module is honest is what it says when the track carries no
 * PRO metadata and the venue holds some but not all licences — which is the normal
 * case, not the edge case.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/db.js";
import { LicensingStore, VenueLicenceProfile, Coverage, TERRITORY_PROS } from "../src/licensing.js";
import { screenLicence, resolvePolicy } from "../../core/src/policy.js";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

const profile = (over = {}) =>
  new VenueLicenceProfile({ territory: "US", commercial: true, ...over });

function setup(t) {
  const db = openDatabase({ venueId: "v1" });
  t.after(() => db.close());
  return { db, store: new LicensingStore(db) };
}

/* ------------------------------------------- the case the design turns on */

test("an unknown PRO with partial coverage is allowed but flagged — REQ-DAT-9", () => {
  // The normal case: no PRO metadata, venue holds the big two.
  const p = profile({ licences: [{ pro: "ASCAP" }, { pro: "BMI" }] });
  const r = p.assess({ licenceClass: "owned_local" }, NOW);

  assert.equal(r.allowed, true, "blocking here would block most of the catalogue and get switched off");
  assert.equal(r.coverage, Coverage.GAP, "but it must not be reported as cleared");
  assert.deepEqual(r.missingPros, ["SESAC", "GMR"]);
  assert.match(r.detail, /not established/, "the uncertainty has to be stated, not implied");
});

test("strict venues refuse a coverage gap rather than guess", () => {
  const p = profile({ licences: [{ pro: "ASCAP" }], strict: true });
  const r = p.assess({ licenceClass: "owned_local" }, NOW);

  assert.equal(r.allowed, false);
  assert.equal(r.coverage, Coverage.GAP);
  assert.match(r.detail, /Strict licensing is on/);
});

test("blanket coverage clears an unknown PRO outright", () => {
  const p = profile({
    licences: TERRITORY_PROS.US.map((pro) => ({ pro }))
  });
  const r = p.assess({ licenceClass: "owned_local" }, NOW);

  assert.equal(r.allowed, true);
  assert.equal(r.coverage, Coverage.COVERED, "holding all four is genuinely covered, not a gap");
  assert.deepEqual(p.missingPros(NOW), []);
  assert.equal(p.hasBlanketCoverage(NOW), true);
});

test("holding three of four PROs does not cover the fourth — the GMR problem", () => {
  // The real-world fact this module exists for: Global Music Rights signed major
  // writers away from the incumbents, so ASCAP+BMI+SESAC is no longer everything.
  const p = profile({ licences: [{ pro: "ASCAP" }, { pro: "BMI" }, { pro: "SESAC" }] });
  const r = p.assess({ licenceClass: "owned_local", pro: "GMR" }, NOW);

  assert.equal(r.allowed, false, "three of four is not 75% covered, it is fully exposed on the fourth");
  assert.equal(r.coverage, Coverage.UNCOVERED);
  assert.equal(r.pro, "GMR");
  assert.match(r.detail, /Holding other PRO licences does not cover it/);
});

test("a known and held PRO is cleared without qualification", () => {
  const p = profile({ licences: [{ pro: "ASCAP" }, { pro: "BMI" }] });
  const r = p.assess({ licenceClass: "owned_local", pro: "bmi" }, NOW);

  assert.equal(r.allowed, true);
  assert.equal(r.coverage, Coverage.COVERED);
  assert.equal(r.pro, "BMI", "PRO names are compared case-insensitively");
});

test("no licences at all is refused, not merely flagged", () => {
  const p = profile({ licences: [] });
  const r = p.assess({ licenceClass: "owned_local" }, NOW);

  assert.equal(r.allowed, false);
  assert.equal(r.coverage, Coverage.UNCOVERED);
});

/* ---------------------------------------------------- expiry and validity */

test("a lapsed licence stops counting on its expiry date", () => {
  const p = profile({
    licences: [{ pro: "ASCAP", validUntil: NOW - DAY }, { pro: "BMI" }]
  });

  assert.deepEqual(p.heldPros(NOW), ["BMI"], "the expired ASCAP licence is not held");
  const r = p.assess({ licenceClass: "owned_local", pro: "ASCAP" }, NOW);
  assert.equal(r.allowed, false, "an expired licence must not clear a work");
  assert.match(r.detail, /no current ASCAP licence/);
});

test("a licence that has not started yet does not count either", () => {
  const p = profile({ licences: [{ pro: "ASCAP", validFrom: NOW + DAY }] });
  assert.deepEqual(p.heldPros(NOW), []);
  assert.deepEqual(p.heldPros(NOW + 2 * DAY), ["ASCAP"]);
});

test("licences expiring soon are surfaced before they lapse", () => {
  const p = profile({
    licences: [
      { pro: "ASCAP", validUntil: NOW + 10 * DAY },
      { pro: "BMI", validUntil: NOW + 200 * DAY },
      { pro: "SESAC" }
    ]
  });
  const soon = p.expiringSoon(30, NOW);
  assert.equal(soon.length, 1, "only ASCAP is inside the 30-day horizon");
  assert.equal(soon[0].pro, "ASCAP");
});

/* ------------------------------------------------- classes needing no PRO */

test("CC and licensed-stream tracks need no PRO licence at all", () => {
  const p = profile({ licences: [] }); // deliberately no licences held
  for (const cls of ["cc_attribution", "cc_sharealike", "licensed_stream"]) {
    const r = p.assess({ licenceClass: cls }, NOW);
    assert.equal(r.allowed, true, `${cls} should not require a PRO licence`);
    assert.equal(r.coverage, Coverage.NOT_REQUIRED);
  }
});

test("a non-commercial venue needs no PRO licence", () => {
  const p = profile({ commercial: false, licences: [] });
  const r = p.assess({ licenceClass: "owned_local" }, NOW);
  assert.equal(r.allowed, true);
  assert.equal(r.coverage, Coverage.NOT_REQUIRED);
});

/* ------------------------------------------------------------ territories */

test("territories differ in what full coverage means", () => {
  // The UK splits composition (PRS) from recording (PPL), so one licence is not
  // enough there either — for a different reason than the US.
  const uk = new VenueLicenceProfile({ territory: "GB", licences: [{ pro: "PRS" }] });
  assert.deepEqual(uk.missingPros(NOW), ["PPL"]);
  assert.equal(uk.assess({ licenceClass: "owned_local" }, NOW).coverage, Coverage.GAP);

  const ca = new VenueLicenceProfile({ territory: "CA", licences: [{ pro: "SOCAN" }] });
  assert.equal(ca.hasBlanketCoverage(NOW), true, "one PRO is full coverage in Canada");
});

test("an unknown territory is reported as undeterminable, not as covered", () => {
  const p = new VenueLicenceProfile({ territory: "ZZ", licences: [{ pro: "SOMEPRO" }] });
  assert.equal(p.territoryPros, null);
  assert.equal(p.missingPros(NOW), null);
  assert.equal(p.hasBlanketCoverage(NOW), false, "unknown must never be treated as blanket coverage");

  const r = p.assess({ licenceClass: "owned_local" }, NOW);
  assert.equal(r.coverage, Coverage.GAP);
  assert.match(r.detail, /no PRO registry on file/);
});

/* ------------------------------------------------------------ persistence */

test("the profile round-trips through the database", (t) => {
  const { store } = setup(t);

  store.addLicence({ pro: "ascap", reference: "A-12345", validUntil: NOW + 90 * DAY });
  store.addLicence({ pro: "BMI", reference: "B-67890" });

  const p = store.profile();
  assert.deepEqual(p.heldPros(NOW).sort(), ["ASCAP", "BMI"]);
  assert.equal(p.territory, "US", "territory defaults to US from migration 2");
  assert.equal(p.commercial, true);

  const stored = p.licences.find((l) => l.pro === "ASCAP");
  assert.equal(stored.reference, "A-12345", "the licence reference is kept for audit");
});

test("adding the same PRO twice updates rather than duplicating", (t) => {
  const { store } = setup(t);
  store.addLicence({ pro: "ASCAP", reference: "old" });
  store.addLicence({ pro: "ASCAP", reference: "new" });

  const p = store.profile();
  assert.equal(p.licences.length, 1);
  assert.equal(p.licences[0].reference, "new");
});

test("a licence can be removed when a venue drops it", (t) => {
  const { store } = setup(t);
  store.addLicence({ pro: "SESAC" });
  assert.equal(store.removeLicence("sesac"), true);
  assert.deepEqual(store.profile().heldPros(NOW), []);
  assert.equal(store.removeLicence("SESAC"), false, "removing what is absent is not an error");
});

test("territory is persisted and changes what coverage means", (t) => {
  const { store } = setup(t);
  store.setTerritory("GB");
  store.addLicence({ pro: "PRS" });
  store.addLicence({ pro: "PPL" });

  const p = store.profile();
  assert.equal(p.territory, "GB");
  assert.equal(p.hasBlanketCoverage(NOW), true);
});

test("licences are venue-scoped — REQ-DAT-1", (t) => {
  const { store, db } = setup(t);
  store.addLicence({ pro: "ASCAP" });

  const cols = db.db.prepare("SELECT name FROM pragma_table_info('venue_pro_licences')").all().map((r) => r.name);
  assert.ok(cols.includes("venue_id"));

  const rows = db.db.prepare("SELECT venue_id FROM venue_pro_licences").all();
  assert.ok(rows.every((r) => r.venue_id === "v1"));
});

/* ------------------------------------------------ integration with policy */

test("the policy engine uses the profile when one is supplied", () => {
  const policy = resolvePolicy({ commercial: true });
  const licenceProfile = profile({ licences: [{ pro: "ASCAP" }, { pro: "BMI" }] });

  const gmr = screenLicence({ licenceClass: "owned_local", pro: "GMR" }, policy, {
    licenceProfile,
    nowMs: NOW
  });
  assert.equal(gmr.allowed, false);
  assert.equal(gmr.coverage, Coverage.UNCOVERED);

  const unknown = screenLicence({ licenceClass: "owned_local" }, policy, {
    licenceProfile,
    nowMs: NOW
  });
  assert.equal(unknown.allowed, true);
  assert.equal(unknown.coverage, Coverage.GAP, "a gap must survive into the policy decision");
  assert.deepEqual(unknown.missingPros, ["SESAC", "GMR"]);
});

test("the older holdsPro boolean still works when no profile is configured", () => {
  const policy = resolvePolicy({ commercial: true });

  assert.equal(screenLicence({ licenceClass: "owned_local" }, policy, { holdsPro: true }).allowed, true);
  assert.equal(screenLicence({ licenceClass: "owned_local" }, policy, { holdsPro: false }).allowed, false);
});

test("a profile does not rescue a commercially unsafe class", () => {
  // Blanket PRO coverage says nothing about a non-commercial CC licence.
  const policy = resolvePolicy({ commercial: true });
  const licenceProfile = profile({ licences: TERRITORY_PROS.US.map((pro) => ({ pro })) });

  for (const cls of ["cc_noncommercial", "unknown"]) {
    const r = screenLicence({ licenceClass: cls }, policy, { licenceProfile, nowMs: NOW });
    assert.equal(r.allowed, false, `${cls} must stay blocked regardless of PRO coverage`);
  }
});

test("summary gives the venue console what it needs to act", () => {
  const p = profile({
    licences: [{ pro: "ASCAP", validUntil: NOW + 5 * DAY }, { pro: "BMI" }]
  });
  const s = p.summary(NOW);

  assert.deepEqual(s.held.sort(), ["ASCAP", "BMI"]);
  assert.deepEqual(s.missing, ["SESAC", "GMR"]);
  assert.equal(s.blanketCoverage, false);
  assert.equal(s.expiringSoon.length, 1);
  assert.equal(s.territory, "US");
});
