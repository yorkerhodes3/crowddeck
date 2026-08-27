// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Track store and licence gating — REQ-DAT-8 … REQ-DAT-11.
 *
 * The gating *decision* lives in core/src/policy.js. These tests check that the
 * stored facts feed it correctly, and that the store refuses to hold a track whose
 * licence nobody has established.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/db.js";
import { TrackStore } from "../src/tracks.js";
import { LICENCE_CLASSES } from "../src/schema.js";
import { screenLicence, resolvePolicy, LicenceClass } from "../../core/src/policy.js";

function setup(t) {
  const db = openDatabase({ venueId: "v1" });
  t.after(() => db.close());
  return new TrackStore(db);
}

const track = (over = {}) => ({
  id: "t1",
  title: "Blue Monday",
  artist: "New Order",
  duration: 270000,
  licenceClass: "owned_local",
  ...over
});

test("every track must declare a licence class — REQ-DAT-8", (t) => {
  const s = setup(t);

  assert.throws(() => s.upsert({ id: "t1" }), /must declare one of/);
  assert.throws(() => s.upsert(track({ licenceClass: "probably_fine" })), /must declare one of/);
  assert.throws(() => s.upsert(track({ licenceClass: null })), /must declare one of/);

  // The point of refusing a default: "unknown" must be a claim someone made, not a
  // gap the system filled in on their behalf.
  assert.doesNotThrow(() => s.upsert(track({ licenceClass: "unknown" })));
  assert.equal(s.get("t1").licenceClass, "unknown");
});

test("the schema and the code agree on the class list", (t) => {
  const s = setup(t);
  const fromPolicy = new Set(Object.values(LicenceClass));
  assert.deepEqual(new Set(LICENCE_CLASSES), fromPolicy, "a class in one and not the other is a bug waiting");

  for (const cls of LICENCE_CLASSES) {
    const attribution = cls === "cc_attribution" || cls === "cc_sharealike" ? "By Someone, CC BY 4.0" : null;
    assert.doesNotThrow(() => s.upsert(track({ id: `t_${cls}`, licenceClass: cls, attribution })));
  }
  assert.equal(s.all().length, LICENCE_CLASSES.length);
});

test("stored tracks answer the venue's licence question — REQ-DAT-9", (t) => {
  const s = setup(t);
  s.upsert(track({ id: "owned", licenceClass: "owned_local" }));
  s.upsert(track({ id: "nc", licenceClass: "cc_noncommercial" }));

  const commercialWithPro = resolvePolicy({ commercial: true, proLicence: true });
  assert.equal(screenLicence(s.get("owned"), commercialWithPro).allowed, true);
  assert.equal(screenLicence(s.get("nc"), commercialWithPro).allowed, false);
});

test("cc_noncommercial and unknown are blocked in a commercial venue — REQ-DAT-10", (t) => {
  const s = setup(t);
  s.upsert(track({ id: "nc", licenceClass: "cc_noncommercial" }));
  s.upsert(track({ id: "unk", licenceClass: "unknown" }));

  const policy = resolvePolicy({ commercial: true, proLicence: true });
  for (const id of ["nc", "unk"]) {
    const d = screenLicence(s.get(id), policy);
    assert.equal(d.allowed, false, `${id} must be blocked by default`);
    assert.equal(d.reason, "licence_class");
    assert.ok(d.detail.length > 0, "a refusal must be explainable to a patron");
  }
});

test("attribution-required tracks cannot be stored without attribution — REQ-DAT-11", (t) => {
  const s = setup(t);
  assert.throws(
    () => s.upsert(track({ id: "cc", licenceClass: "cc_attribution" })),
    /requires attribution on the venue display/
  );
  assert.throws(
    () => s.upsert(track({ id: "sa", licenceClass: "cc_sharealike", attribution: "" })),
    /requires attribution/
  );

  s.upsert(track({ id: "cc", licenceClass: "cc_attribution", attribution: "Kai Engel — CC BY 4.0" }));
  assert.equal(s.attributionFor("cc"), "Kai Engel — CC BY 4.0");
});

test("attribution is surfaced only where it is owed — REQ-DAT-11", (t) => {
  const s = setup(t);
  s.upsert(track({ id: "owned", licenceClass: "owned_local", attribution: "irrelevant" }));
  assert.equal(s.attributionFor("owned"), null, "an owned track owes no attribution display");
  assert.equal(s.attributionFor("missing"), null);
});

test("upsert updates rather than duplicating", (t) => {
  const s = setup(t);
  s.upsert(track());
  s.upsert(track({ title: "Blue Monday '88" }));
  assert.equal(s.all().length, 1);
  assert.equal(s.get("t1").title, "Blue Monday '88");
});

test("search matches title and artist", (t) => {
  const s = setup(t);
  s.upsert(track({ id: "a", title: "Blue Monday", artist: "New Order" }));
  s.upsert(track({ id: "b", title: "Temptation", artist: "New Order" }));
  s.upsert(track({ id: "c", title: "Once in a Lifetime", artist: "Talking Heads" }));

  assert.equal(s.search("New Order").length, 2);
  assert.equal(s.search("Lifetime").length, 1);
  assert.equal(s.search("nothing here").length, 0);
});

test("tracks round-trip their flags", (t) => {
  const s = setup(t);
  s.upsert(track({ id: "x", explicit: true, playable: false, source: "local" }));
  const got = s.get("x");
  assert.equal(got.explicit, true);
  assert.equal(got.playable, false);
  assert.equal(got.source, "local");
  assert.equal(got.duration, 270000);
});
