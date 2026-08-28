// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Creative Commons classification — REQ-DAT-8, CON-5.
 *
 * This is the most legally consequential parsing in the product: a permissive
 * mistake means a venue publicly performing a non-commercial track. So the whole
 * licence matrix is enumerated rather than spot-checked, and the unrecognised
 * cases are tested as carefully as the recognised ones.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCcUrl, classifyCc, ccAttribution } from "../src/cc-licence.js";

const cc = (code, version = "4.0") => `https://creativecommons.org/licenses/${code}/${version}/`;

/* ------------------------------------------------- the commercial question */

test("every licence containing NC is blocked in a commercial venue", () => {
  // The one clause that decides whether a venue may perform it at all.
  for (const code of ["by-nc", "by-nc-sa", "by-nc-nd"]) {
    const { licenceClass, licence } = classifyCc(cc(code));
    assert.equal(licence.commercial, false, `${code} must be non-commercial`);
    assert.equal(
      licenceClass,
      "cc_noncommercial",
      `${code} must map to the class policy blocks — a venue is a commercial setting`
    );
  }
});

test("every licence without NC permits commercial performance", () => {
  for (const code of ["by", "by-sa", "by-nd"]) {
    const { licenceClass, licence } = classifyCc(cc(code));
    assert.equal(licence.commercial, true, `${code} permits commercial use`);
    assert.notEqual(licenceClass, "cc_noncommercial");
    assert.notEqual(licenceClass, "unknown");
  }
});

test("no-derivatives does not restrict unmodified playback", () => {
  // A venue plays the track as released. `nd` constrains derivative works, not
  // performance — treating it as unsafe would discard a large slice of legitimate
  // catalogue for no legal reason.
  const nd = classifyCc(cc("by-nd"));
  assert.equal(nd.licenceClass, "cc_attribution");
  assert.equal(nd.licence.derivatives, false, "but the restriction is still recorded");
  assert.match(nd.reason, /does not restrict unmodified playback/);
});

test("share-alike is distinguished, because attribution differs", () => {
  const sa = classifyCc(cc("by-sa"));
  assert.equal(sa.licenceClass, "cc_sharealike");
  assert.equal(sa.licence.shareAlike, true);

  // by-nc-sa is non-commercial first: the NC clause dominates.
  assert.equal(classifyCc(cc("by-nc-sa")).licenceClass, "cc_noncommercial");
});

test("public domain needs neither attribution nor a PRO licence", () => {
  for (const url of [
    "https://creativecommons.org/publicdomain/zero/1.0/",
    "https://creativecommons.org/publicdomain/mark/1.0/"
  ]) {
    const r = classifyCc(url);
    assert.equal(r.licenceClass, "owned_local");
    assert.equal(r.licence.attribution, false);
    assert.equal(ccAttribution({ artist: "X", title: "Y" }, r.licence), null);
  }
});

/* ----------------------------------------- the conservative direction */

test("anything unrecognised is unknown, never assumed playable", () => {
  // The failure that matters is the permissive one. Each of these must land on
  // `unknown`, which a commercial venue blocks.
  const notLicences = [
    "",
    null,
    undefined,
    "not a url",
    "https://example.com/licence",
    "https://creativecommons.org/", // the site, not a licence
    "https://creativecommons.org/licenses/", // no code
    "https://creativecommons.org/licenses/invented/4.0/", // plausible shape, unreal code
    "https://creativecommons.org/licenses/nc/4.0/", // no `by` — not a real CC licence
    "https://spotify.com/licenses/by/4.0/" // right path, wrong host
  ];

  for (const url of notLicences) {
    const r = classifyCc(url);
    assert.equal(r.licenceClass, "unknown", `${JSON.stringify(url)} must not be assumed playable`);
    assert.equal(r.licence, null);
    assert.ok(r.reason.length > 10, "and the refusal must be explainable");
  }
});

test("a lookalike host is not trusted", () => {
  // Three shapes, because they fail for different reasons and a single example
  // would have left two untested. Probing found the third: with both the host
  // check and the regex anchors removed, only this one would have slipped
  // through, so the earlier single-case test was passing for an incidental
  // reason rather than because the guard worked.
  const impostors = [
    // The name is a prefix of a longer host.
    "https://creativecommons.org.evil.example/licenses/by/4.0/",
    // The name is a suffix of a longer host.
    "https://not-creativecommons.org/licenses/by/4.0/",
    // The name is in the path, not the host — the case an unanchored search
    // would happily match.
    "https://evil.example/creativecommons.org/licenses/by/4.0/"
  ];

  for (const url of impostors) {
    assert.equal(parseCcUrl(url), null, `${url} must not be read as a CC licence`);
    assert.equal(classifyCc(url).licenceClass, "unknown");
  }
});

test("real-world URL variations are accepted", () => {
  // Metadata in the wild is inconsistent: http, no www, no version, locale
  // suffixes, missing trailing slash. Rejecting these would push legitimate
  // tracks into `unknown` and quietly shrink the catalogue.
  const variants = [
    "http://creativecommons.org/licenses/by/3.0/",
    "https://www.creativecommons.org/licenses/by/4.0/",
    "creativecommons.org/licenses/by/4.0",
    "https://creativecommons.org/licenses/by/2.0/uk/",
    "https://creativecommons.org/licenses/by/4.0/?ref=jamendo",
    "  https://creativecommons.org/licenses/by/4.0/  ",
    "https://CreativeCommons.org/Licenses/BY/4.0/"
  ];

  for (const url of variants) {
    const r = classifyCc(url);
    assert.equal(r.licenceClass, "cc_attribution", `failed to recognise ${JSON.stringify(url)}`);
  }
});

test("the version is preserved when present and null when not", () => {
  assert.equal(parseCcUrl(cc("by", "4.0")).version, "4.0");
  assert.equal(parseCcUrl(cc("by", "3.0")).version, "3.0");
  assert.equal(parseCcUrl("https://creativecommons.org/licenses/by/").version, null);
});

/* --------------------------------------------------------- attribution */

test("attribution names the artist, the work and the licence — REQ-DAT-11", () => {
  const { licence } = classifyCc(cc("by"));
  const text = ccAttribution({ artist: "Ora Marsh", title: "Tidal Flats" }, licence);

  assert.match(text, /Tidal Flats/);
  assert.match(text, /Ora Marsh/);
  assert.match(text, /CC BY 4\.0/);
});

test("attribution copes with missing metadata", () => {
  const { licence } = classifyCc(cc("by-sa"));
  assert.match(ccAttribution({ title: "Untitled" }, licence), /Unknown artist/);
  assert.match(ccAttribution({ artist: "Someone" }, licence), /Someone/);
  assert.equal(ccAttribution({}, null), null);
});

/* ------------------------------------------------- the full matrix, pinned */

test("the whole licence matrix maps as documented", () => {
  const expected = {
    by: "cc_attribution",
    "by-sa": "cc_sharealike",
    "by-nd": "cc_attribution",
    "by-nc": "cc_noncommercial",
    "by-nc-sa": "cc_noncommercial",
    "by-nc-nd": "cc_noncommercial"
  };

  for (const [code, licenceClass] of Object.entries(expected)) {
    assert.equal(classifyCc(cc(code)).licenceClass, licenceClass, `${code} mapped wrongly`);
  }

  // And every mapped class is one the rest of the system knows about.
  const known = new Set([
    "owned_local",
    "cc_attribution",
    "cc_sharealike",
    "cc_noncommercial",
    "record_pool",
    "licensed_stream",
    "unknown"
  ]);
  for (const code of Object.keys(expected)) {
    assert.ok(known.has(classifyCc(cc(code)).licenceClass));
  }
});
