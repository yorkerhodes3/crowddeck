// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Credits — DJX-26.
 *
 * The obligation is legal, not cosmetic: CC BY and CC BY-SA require attribution
 * as a condition of use. The failure mode is silent — a set plays perfectly and
 * the licence is breached — so the rules are pinned here.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { CreditLog, nowPlayingCredit } from "../src/credits.js";

const track = (over = {}) => ({
  id: "t1",
  title: "Fantasy",
  artist: "Snabisch",
  attribution: '"Fantasy" by Snabisch — CC BY-SA 3.0',
  licenceClass: "cc_sharealike",
  provider: "openverse",
  ...over
});

test("a played track is credited once, however many times it is played", () => {
  const log = new CreditLog();
  assert.equal(log.add(track()), true);
  assert.equal(log.add(track()), false, "the same track must not be listed twice");
  assert.equal(log.size, 1);
});

test("credits keep play order, because a set list reads chronologically", () => {
  const log = new CreditLog();
  log.add(track({ id: "a", title: "First" }));
  log.add(track({ id: "b", title: "Second" }));
  log.add(track({ id: "c", title: "Third" }));
  assert.deepEqual(log.list().map((e) => e.title), ["First", "Second", "Third"]);
});

test("public domain is not given a fabricated attribution", () => {
  // CC0 and the Public Domain Mark impose no obligation. Inventing a credit
  // misrepresents the licence just as much as omitting a real one.
  const log = new CreditLog();
  log.add(track({ id: "pd", attribution: null, licenceClass: "owned_local" }));
  assert.equal(log.size, 1, "it is still part of the set list");
  assert.equal(log.required().length, 0, "but carries no attribution obligation");
});

test("the required list contains exactly the tracks that oblige a credit", () => {
  const log = new CreditLog();
  log.add(track({ id: "by" }));
  log.add(track({ id: "pd", attribution: null, licenceClass: "owned_local" }));
  log.add(track({ id: "by2", attribution: '"X" by Y — CC BY 4.0', licenceClass: "cc_attribution" }));
  assert.deepEqual(log.required().map((e) => e.id), ["by", "by2"]);
});

test("the pasteable text carries every required credit", () => {
  const log = new CreditLog();
  log.add(track({ id: "a", attribution: '"A" by One — CC BY 4.0' }));
  log.add(track({ id: "b", attribution: '"B" by Two — CC BY-SA 3.0' }));
  const text = log.toText();
  assert.match(text, /"A" by One — CC BY 4\.0/);
  assert.match(text, /"B" by Two — CC BY-SA 3\.0/);
  assert.match(text, /via openverse/);
});

test("a landing URL is included, because 'in the manner specified' often means a link", () => {
  const log = new CreditLog();
  log.add(track({ landingUrl: "https://www.jamendo.com/track/576941" }));
  assert.match(log.toText(), /jamendo\.com\/track\/576941/);
});

test("an empty log produces empty text, not a heading with nothing under it", () => {
  assert.equal(new CreditLog().toText(), "");
  const onlyPd = new CreditLog();
  onlyPd.add(track({ attribution: null, licenceClass: "owned_local" }));
  assert.equal(onlyPd.toText(), "", "public domain alone obliges nothing");
});

test("public domain can be listed explicitly when asked for", () => {
  const log = new CreditLog();
  log.add(track({ id: "pd", title: "Speech", attribution: null, licenceClass: "owned_local" }));
  const text = log.toText({ includePublicDomain: true });
  assert.match(text, /"Speech".*public domain/);
});

test("the text is plain, because destinations mangle formatting", () => {
  // A credit that arrives as literal asterisks is worse than a plain one.
  const log = new CreditLog();
  log.add(track());
  const text = log.toText();
  assert.ok(!/[*_`]|<[a-z]/i.test(text), `found markup in: ${text}`);
});

test("a malformed track does not corrupt the log", () => {
  const log = new CreditLog();
  assert.equal(log.add(null), false);
  assert.equal(log.add({}), false, "no id means it cannot be de-duplicated");
  assert.equal(log.size, 0);
});

test("missing metadata still produces a usable credit", () => {
  const log = new CreditLog();
  log.add({ id: "x", licenceClass: "cc_attribution" });
  const [entry] = log.list();
  assert.equal(entry.title, "Untitled");
  assert.equal(entry.artist, "Unknown artist");
});

/* --------------------------------------------------------- on-screen form */

test("the on-screen credit uses the licence's own wording when there is one", () => {
  assert.equal(nowPlayingCredit(track()), '"Fantasy" by Snabisch — CC BY-SA 3.0');
});

test("public domain is labelled rather than credited", () => {
  const s = nowPlayingCredit(track({ attribution: null, licenceClass: "owned_local", title: "Speech" }));
  assert.match(s, /public domain/);
  assert.ok(!/CC /.test(s), "must not imply a CC licence");
});

test("an unknown licence still names the track rather than showing nothing", () => {
  const s = nowPlayingCredit(track({ attribution: null, licenceClass: "unknown" }));
  assert.match(s, /Fantasy/);
});

test("no track is an empty string, not the word undefined", () => {
  assert.equal(nowPlayingCredit(null), "");
  assert.equal(nowPlayingCredit(undefined), "");
});
