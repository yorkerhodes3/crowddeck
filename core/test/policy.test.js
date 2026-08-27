// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LicenceClass,
  PolicyReason,
  filterSearch,
  requiresAttribution,
  resolvePolicy,
  screen
} from "../src/policy.js";

const OWNED = LicenceClass.OWNED_LOCAL;

const track = (over = {}) => ({
  id: "t1",
  artist: "Artist A",
  genre: "House",
  explicit: false,
  licenceClass: OWNED,
  ...over
});

test("a clean track passes", () => {
  assert.equal(screen({ track: track(), policy: resolvePolicy() }).allowed, true);
});

test("explicit content is blocked by default — AC-7", () => {
  const d = screen({ track: track({ explicit: true }), policy: resolvePolicy() });
  assert.equal(d.allowed, false);
  assert.equal(d.reason, PolicyReason.EXPLICIT);
});

test("a venue can allow explicit content", () => {
  const policy = resolvePolicy({ explicitAllowed: true });
  assert.equal(screen({ track: track({ explicit: true }), policy }).allowed, true);
});

test("blocked artists and genres are refused", () => {
  const byArtist = resolvePolicy({ blockedArtists: ["artist a"] });
  assert.equal(screen({ track: track(), policy: byArtist }).reason, PolicyReason.BLOCKED_ARTIST);

  const byGenre = resolvePolicy({ blockedGenres: ["House"] });
  assert.equal(screen({ track: track(), policy: byGenre }).reason, PolicyReason.BLOCKED_GENRE);
});

test("block lists are case-insensitive", () => {
  const policy = resolvePolicy({ blockedArtists: ["ARTIST A"] });
  assert.equal(screen({ track: track({ artist: "artist a" }), policy }).allowed, false);
});

test("allow mode permits only allowlisted genres", () => {
  const policy = resolvePolicy({ mode: "allow", allowedGenres: ["Jazz"] });
  assert.equal(screen({ track: track({ genre: "Jazz" }), policy }).allowed, true);
  const d = screen({ track: track({ genre: "House" }), policy });
  assert.equal(d.allowed, false);
  assert.equal(d.reason, PolicyReason.NOT_ALLOWLISTED);
});

/* ------------------------------------------------------------- licensing */

test("non-commercial CC is refused in a commercial venue — AC-14", () => {
  const d = screen({
    track: track({ licenceClass: LicenceClass.CC_NONCOMMERCIAL }),
    policy: resolvePolicy()
  });
  assert.equal(d.allowed, false);
  assert.equal(d.reason, PolicyReason.LICENCE_CLASS);
});

test("unknown provenance is refused in a commercial venue — REQ-DAT-10", () => {
  const d = screen({
    track: track({ licenceClass: LicenceClass.UNKNOWN }),
    policy: resolvePolicy()
  });
  assert.equal(d.allowed, false);
  assert.equal(d.reason, PolicyReason.LICENCE_CLASS);
});

test("a track with no declared licence is treated as unknown, not as safe", () => {
  const t = track();
  delete t.licenceClass;
  const d = screen({ track: t, policy: resolvePolicy() });
  assert.equal(d.allowed, false, "absence of a licence must fail closed");
});

test("a non-commercial venue may play non-commercial CC", () => {
  const policy = resolvePolicy({ commercial: false });
  assert.equal(
    screen({ track: track({ licenceClass: LicenceClass.CC_NONCOMMERCIAL }), policy }).allowed,
    true
  );
});

test("owned local media needs a PRO licence on file — REQ-DAT-9", () => {
  const policy = resolvePolicy();
  assert.equal(screen({ track: track(), policy, context: { holdsPro: true } }).allowed, true);
  const d = screen({ track: track(), policy, context: { holdsPro: false } });
  assert.equal(d.allowed, false);
  assert.equal(d.reason, PolicyReason.LICENCE_CLASS);
});

test("CC attribution tracks are playable and flagged for on-screen credit — REQ-DAT-11", () => {
  const t = track({ licenceClass: LicenceClass.CC_ATTRIBUTION });
  assert.equal(screen({ track: t, policy: resolvePolicy() }).allowed, true);
  assert.equal(requiresAttribution(t), true);
  assert.equal(requiresAttribution(track()), false);
});

/* -------------------------------------------------------------- dayparts */

test("dayparting can tighten policy at certain hours — REQ-POL-1", () => {
  const policy = resolvePolicy({
    explicitAllowed: true,
    daypartRules: [{ startMinute: 11 * 60, endMinute: 18 * 60, explicitAllowed: false }]
  });
  const explicit = track({ explicit: true });

  // Inside the family-hours window.
  assert.equal(
    screen({ track: explicit, policy, context: { venueMinuteOfDay: 12 * 60 } }).allowed,
    false
  );
  // Outside it.
  assert.equal(
    screen({ track: explicit, policy, context: { venueMinuteOfDay: 22 * 60 } }).allowed,
    true
  );
});

test("a daypart window may wrap past midnight", () => {
  const policy = resolvePolicy({
    explicitAllowed: false,
    daypartRules: [{ startMinute: 22 * 60, endMinute: 2 * 60, explicitAllowed: true }]
  });
  const explicit = track({ explicit: true });
  assert.equal(
    screen({ track: explicit, policy, context: { venueMinuteOfDay: 23 * 60 } }).allowed,
    true,
    "23:00 is inside a 22:00-02:00 window"
  );
  assert.equal(
    screen({ track: explicit, policy, context: { venueMinuteOfDay: 60 } }).allowed,
    true,
    "01:00 is also inside it"
  );
  assert.equal(
    screen({ track: explicit, policy, context: { venueMinuteOfDay: 12 * 60 } }).allowed,
    false,
    "midday is outside it"
  );
});

/* ---------------------------------------------------------------- search */

test("search is filtered by the same rules as requests — REQ-POL-2, C6", () => {
  const policy = resolvePolicy({ blockedArtists: ["Blocked Act"] });
  const results = filterSearch(
    [
      track({ id: "ok" }),
      track({ id: "explicit", explicit: true }),
      track({ id: "blocked", artist: "Blocked Act" }),
      track({ id: "noncommercial", licenceClass: LicenceClass.CC_NONCOMMERCIAL })
    ],
    policy
  );
  assert.deepEqual(
    results.map((t) => t.id),
    ["ok"],
    "an unrequestable track must never be offered in results"
  );
});

test("an unplayable track is never offered", () => {
  const d = screen({ track: track({ playable: false }), policy: resolvePolicy() });
  assert.equal(d.allowed, false);
  assert.equal(d.reason, PolicyReason.UNPLAYABLE);
});

test("policy mode is validated", () => {
  assert.throws(() => resolvePolicy({ mode: "sometimes" }), RangeError);
});
