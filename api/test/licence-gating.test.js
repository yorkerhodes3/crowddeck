// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Licence gating at the API surface — REQ-DAT-9, REQ-POL-2, VEN-3.
 *
 * ## Why this file exists
 *
 * `#policyContext()` used to hard-code `holdsPro: true`, so the API told every
 * patron that every record-pool track was cleared for public performance,
 * regardless of what the venue actually held. Replacing that with a conservative
 * default changed which tracks patrons can see — and **the entire suite stayed
 * green**, because no test exercised licence gating through the API at all.
 *
 * A default that governs a legal question should not be changeable without a test
 * objecting, so these tests exist to object.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { VenueLicenceProfile, TERRITORY_PROS } from "../../data/src/licensing.js";
import { DemoCatalog } from "../src/demo-catalog.js";
import { filterSearch, resolvePolicy, screen } from "../../core/src/policy.js";

const catalog = new DemoCatalog();
const allTracks = catalog.search("");
const policy = resolvePolicy({});

const visibleIds = (context) => filterSearch(allTracks, policy, context).map((t) => t.id);
const poolTracks = (context) => visibleIds(context).filter((id) => id.startsWith("pool"));

test("an unconfigured venue does not offer tracks that need a PRO licence", () => {
  // The conservative default: a venue that has not told us what it holds has not
  // told us it holds anything.
  assert.deepEqual(
    poolTracks({ holdsPro: false }),
    [],
    "record-pool tracks require a performing-rights licence the venue has not declared"
  );
});

test("declaring a PRO licence makes those tracks requestable", () => {
  assert.deepEqual(
    poolTracks({ holdsPro: true }).sort(),
    ["pool-001", "pool-002"],
    "the same catalogue, unlocked by the venue declaring its licences"
  );
});

test("a fresh install still has music on first run — REQ-CON-6", () => {
  // The conservative default must not produce an empty jukebox, or venues will
  // simply turn the gating off. Creative Commons tracks need no PRO licence, so a
  // venue that has declared nothing can still open its doors.
  const visible = visibleIds({ holdsPro: false });
  assert.ok(visible.length >= 10, `expected a usable catalogue, got ${visible.length} tracks`);
  assert.ok(
    visible.every((id) => id.startsWith("cc-")),
    "what remains should be the CC catalogue, which carries its own performance grant"
  );
});

test("a real licence profile gates the same way the boolean did", () => {
  const noLicences = new VenueLicenceProfile({ territory: "US", licences: [] });
  assert.deepEqual(poolTracks({ licenceProfile: noLicences }), []);

  const blanket = new VenueLicenceProfile({
    territory: "US",
    licences: TERRITORY_PROS.US.map((pro) => ({ pro }))
  });
  assert.deepEqual(poolTracks({ licenceProfile: blanket }).sort(), ["pool-001", "pool-002"]);
});

test("a partial profile offers the track but records the coverage gap — VEN-3", () => {
  // The case a boolean cannot express: allowed, but not established as cleared.
  const partial = new VenueLicenceProfile({
    territory: "US",
    licences: [{ pro: "ASCAP" }, { pro: "BMI" }]
  });

  const decision = screen({
    track: allTracks.find((t) => t.id === "pool-001"),
    policy,
    context: { licenceProfile: partial }
  });

  assert.equal(decision.allowed, true, "refusing here would block most real catalogues");
  assert.equal(decision.coverage, "gap", "but the API must not report it as cleared");
  assert.deepEqual(decision.missingPros, ["SESAC", "GMR"]);
});

test("policy still blocks what it always blocked, profile or not", () => {
  const blanket = new VenueLicenceProfile({
    territory: "US",
    licences: TERRITORY_PROS.US.map((pro) => ({ pro }))
  });

  // Blanket PRO coverage says nothing about a non-commercial CC licence, an
  // unknown provenance, or an explicit-content rule.
  const visible = visibleIds({ licenceProfile: blanket });
  assert.ok(!visible.includes("nc-001"), "cc_noncommercial stays out of a commercial venue");
  assert.ok(!visible.includes("unk-001"), "unknown provenance stays out");
  assert.ok(!visible.includes("exp-001"), "explicit content stays out under the default policy");
});
