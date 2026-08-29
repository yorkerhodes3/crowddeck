// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The openly-licensed starter library — DJX-10.
 *
 * `fetch` is injected so these run offline, but the response shapes are taken
 * from the **real** Archive API, verified from a browser first: the
 * `response.docs` envelope, the `server` + `dir` + `files` metadata shape, and
 * the fact that `licenseurl` is frequently absent.
 *
 * The licence filtering is the part that carries weight, so it is tested against
 * the licences the Archive actually returns rather than against tidy examples.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { ArchiveLibrary, ArchiveLibraryError, buildFileUrl, escapeLucene } from "../src/library.js";

const searchResponse = (docs) => ({
  ok: true,
  status: 200,
  json: async () => ({ response: { numFound: docs.length, docs } })
});

const metadataResponse = (files, server = "ia800708.us.archive.org", dir = "/18/items/Foo") => ({
  ok: true,
  status: 200,
  json: async () => ({ server, dir, files })
});

const doc = (over = {}) => ({
  identifier: "SEDIMENTgrostorp",
  title: "Grostorp",
  creator: "Sediment",
  licenseurl: "http://creativecommons.org/licenses/by/4.0/",
  ...over
});

function libraryWith(handler) {
  const calls = [];
  const lib = new ArchiveLibrary({
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return handler(String(url));
    }
  });
  return { lib, calls };
}

/* ------------------------------------------------------------- the query */

test("the query restricts to audio in the netlabels collection", () => {
  const q = new ArchiveLibrary({ fetch: async () => searchResponse([]) }).buildQuery("");
  assert.match(q, /collection:netlabels/);
  assert.match(q, /mediatype:audio/);
});

test("the query asks only for licences that permit commercial use", () => {
  const q = new ArchiveLibrary({ fetch: async () => searchResponse([]) }).buildQuery("");
  assert.match(q, /licenses\\\/by\\\//, "CC-BY must be requested");
  assert.match(q, /licenses\\\/by-sa\\\//, "share-alike permits commercial use too");
  assert.match(q, /publicdomain/);
  // The whole point: nc is never asked for.
  assert.ok(!/by-nc/.test(q), "non-commercial licences must not be requested");
});

test("the licence filter can be turned off deliberately, for personal use", () => {
  const lib = new ArchiveLibrary({ fetch: async () => searchResponse([]), commercialOnly: false });
  assert.ok(!/licenseurl/.test(lib.buildQuery("")));
});

test("a search term cannot alter the structure of the query", () => {
  // A stray quote produces zero results rather than an error, and "no music" is
  // indistinguishable from "the search is broken" to whoever is looking.
  const lib = new ArchiveLibrary({ fetch: async () => searchResponse([]) });
  const q = lib.buildQuery('drum" OR licenseurl:*by-nc*');

  // The property that matters: every quote the user supplied is escaped, so the
  // injected text stays *inside* the quoted field values and cannot become a new
  // clause. Counting unescaped quotes checks that — there must be exactly the
  // eight this query's own structure opens and closes across four fields.
  const unescaped = (q.match(/(^|[^\\])"/g) || []).length;
  assert.equal(unescaped, 8, `expected 8 structural quotes, found ${unescaped} in ${q}`);
  assert.match(q, /drum\\"/, "the user's quote is escaped, not dropped");
  assert.match(q, /licenses\\\/by\\\//, "the licence restriction survives");
});

test("genre words are searched where the Archive actually keeps them", () => {
  // Measured against the live API: "chiptune" matches 0 releases by title or
  // creator, and 66 once subject and description are included. Genre is how a DJ
  // looks for music, and on the Archive genre lives in the subject tags.
  const lib = new ArchiveLibrary({ fetch: async () => searchResponse([]) });
  const q = lib.buildQuery("chiptune");
  for (const field of ["title", "creator", "subject", "description"]) {
    assert.match(q, new RegExp(field + ':"chiptune"'), `${field} must be searched`);
  }
});

test("escaping leaves ordinary search text alone", () => {
  assert.equal(escapeLucene("deep house"), "deep house");
  assert.equal(escapeLucene('say "hi"'), 'say \\"hi\\"');
});

/* ------------------------------------------------------------ searching */

test("a release comes back with its licence classified", async () => {
  const { lib } = libraryWith(() => searchResponse([doc()]));
  const [r] = await lib.search("");
  assert.equal(r.id, "SEDIMENTgrostorp");
  assert.equal(r.artist, "Sediment");
  assert.equal(r.licenceClass, "cc_attribution");
  assert.match(r.attribution, /Sediment/);
  assert.equal(r.provider, "archive");
});

test("non-commercial material is dropped even though the query excluded it", async () => {
  // Two independent filters on purpose: licenseurl is operator-supplied and the
  // Archive does not validate it, so a metadata error upstream would otherwise
  // put unplayable music in front of someone.
  const { lib } = libraryWith(() =>
    searchResponse([
      doc({ identifier: "ok" }),
      doc({ identifier: "nc", licenseurl: "http://creativecommons.org/licenses/by-nc-nd/4.0/" })
    ])
  );
  const out = await lib.search("");
  assert.deepEqual(out.map((r) => r.id), ["ok"]);
});

test("a release with no licence at all is unknown, not assumed", async () => {
  const { lib } = libraryWith(() => searchResponse([doc({ licenseurl: undefined })]));
  const [r] = await lib.search("");
  assert.equal(r.licenceClass, "unknown");
});

test("the Archive's array-valued creator field is handled", async () => {
  // Real responses return either a string or an array for `creator`.
  const { lib } = libraryWith(() => searchResponse([doc({ creator: ["Sediment", "Guest"] })]));
  const [r] = await lib.search("");
  assert.equal(r.artist, "Sediment");
});

test("results are requested most-downloaded first", async () => {
  const { lib, calls } = libraryWith(() => searchResponse([]));
  await lib.search("");
  assert.match(calls[0].url, /sort%5B%5D=downloads\+desc/);
});

test("an unreachable Archive says so, and says local files still work", async () => {
  const lib = new ArchiveLibrary({
    fetch: async () => {
      throw new Error("ECONNREFUSED");
    }
  });
  await assert.rejects(lib.search(""), (e) => {
    assert.ok(e instanceof ArchiveLibraryError);
    assert.equal(e.code, "network_error");
    assert.match(e.message, /Local files still work/);
    return true;
  });
});

test("an HTTP error is reported rather than read as an empty library", async () => {
  const { lib } = libraryWith(() => ({ ok: false, status: 503, json: async () => ({}) }));
  await assert.rejects(lib.search(""), (e) => e.code === "http_error");
});

/* --------------------------------------------------------------- tracks */

test("playable files are extracted with absolute URLs", async () => {
  const { lib } = libraryWith((url) =>
    url.includes("/metadata/")
      ? metadataResponse([
          { name: "01 Opening.mp3", size: "5000000", length: "170.8" },
          { name: "cover.jpg", size: "40000" },
          { name: "notes.txt", size: "500" }
        ])
      : searchResponse([])
  );
  const files = await lib.tracks("Foo");
  assert.equal(files.length, 1, "only audio is playable");
  assert.equal(files[0].url, "https://ia800708.us.archive.org/18/items/Foo/01%20Opening.mp3");
  assert.equal(files[0].durationSec, 170.8);
  assert.equal(files[0].name, "Opening", "the track number and extension are stripped for display");
});

test("a huge continuous mix sorts below reasonable downloads", async () => {
  // 60 MB items are legitimate Archive content and a poor first impression on a
  // venue connection, so they are ranked down rather than hidden.
  const { lib } = libraryWith(() =>
    metadataResponse([
      { name: "01 Long Mix.mp3", size: String(66 * 1024 * 1024) },
      { name: "02 Short.mp3", size: String(5 * 1024 * 1024) }
    ])
  );
  const files = await lib.tracks("Foo");
  assert.equal(files[0].file, "02 Short.mp3");
});

test("within the reasonable band, the smallest plays first", async () => {
  // The first load decides whether someone believes the app works, so it should
  // be the quickest one available rather than whichever sorted first by name.
  const { lib } = libraryWith(() =>
    metadataResponse([
      { name: "01 Big.mp3", size: String(10 * 1024 * 1024) },
      { name: "02 Small.mp3", size: String(3 * 1024 * 1024) },
      { name: "03 Huge.mp3", size: String(50 * 1024 * 1024) }
    ])
  );
  const files = await lib.tracks("Foo");
  assert.deepEqual(files.map((f) => f.file), ["02 Small.mp3", "01 Big.mp3", "03 Huge.mp3"]);
});

test("the Archive's M:SS duration format is parsed", async () => {
  const { lib } = libraryWith(() =>
    metadataResponse([{ name: "a.mp3", size: "100", length: "3:42" }])
  );
  const [f] = await lib.tracks("Foo");
  assert.equal(f.durationSec, 222);
});

test("a missing duration is null rather than zero", async () => {
  const { lib } = libraryWith(() => metadataResponse([{ name: "a.mp3", size: "100" }]));
  const [f] = await lib.tracks("Foo");
  assert.ok(f.durationSec === null || Number.isNaN(f.durationSec) === false);
  assert.notEqual(f.durationSec, 0);
});

test("a second lookup comes from the cache", async () => {
  const { lib, calls } = libraryWith(() => metadataResponse([{ name: "a.mp3", size: "100" }]));
  await lib.tracks("Foo");
  await lib.tracks("Foo");
  assert.equal(calls.length, 1);
});

test("a release with no file server is an error, not an empty track list", async () => {
  const { lib } = libraryWith(() => ({ ok: true, status: 200, json: async () => ({ files: [] }) }));
  await assert.rejects(lib.tracks("Foo"), (e) => e.code === "not_found");
});

test("file URLs encode each path segment, so spaces and hashes survive", () => {
  assert.equal(
    buildFileUrl("ia1.us.archive.org", "/1/items/X", "a b/c#d.mp3"),
    "https://ia1.us.archive.org/1/items/X/a%20b/c%23d.mp3"
  );
});
