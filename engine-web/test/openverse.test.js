// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Openverse as a second music source — DJX-20.
 *
 * The load-bearing test here is the licence filter. An unfiltered Openverse
 * response is dominated by non-commercial material, and a venue that plays it is
 * in breach — so "the query asked for commercial" is not good enough, because a
 * metadata edit upstream would silently defeat it.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  OpenverseLibrary,
  OpenverseLibraryError,
  detectConsumerService
} from "../src/openverse.js";

const ok = (results) => ({ ok: true, status: 200, json: async () => ({ results }) });

const item = (over = {}) => ({
  id: "abc-123",
  title: "Fantasy - Techno",
  creator: "Snabisch",
  url: "https://prod-1.storage.jamendo.com/?trackid=576941&format=mp31",
  license: "by-sa",
  license_version: "3.0",
  license_url: "https://creativecommons.org/licenses/by-sa/3.0/",
  duration: 313000,
  filesize: 5000000,
  genres: ["dance"],
  tags: [{ name: "instrumental" }],
  source: "jamendo",
  foreign_landing_url: "https://www.jamendo.com/track/576941",
  ...over
});

/* --------------------------------------------------------------- querying */

test("the query asks for commercially-usable music, not everything", () => {
  // Both filters were measured to matter: without `commercial` the response is
  // mostly NC, and without `category` it is full of sound effects.
  const url = new OpenverseLibrary().searchUrl("techno");
  assert.match(url, /license_type=commercial/);
  assert.match(url, /category=music/);
  assert.match(url, /q=techno/);
});

test("an empty search is a valid 'surprise me', not a 400", () => {
  // Openverse requires a query term; sending none returns an error rather than
  // a random selection, so a broad word stands in.
  const url = new OpenverseLibrary().searchUrl("");
  assert.match(url, /q=music/);
});

test("a page size is capped at what anonymous access actually permits", () => {
  // Measured, not read from docs: page_size=20 returns 200 and page_size=21
  // returns 401. Asking for 25 — the Archive's page size — made every Openverse
  // search fail silently while every hand-written probe with a smaller number
  // worked. This is the guard against that returning.
  assert.match(new OpenverseLibrary().searchUrl("x", 500), /page_size=20/);
  assert.match(new OpenverseLibrary().searchUrl("x", 25), /page_size=20/);
  assert.match(new OpenverseLibrary().searchUrl("x", 10), /page_size=10/);
  // And the default must already be within the cap, or the default is broken.
  const size = Number(/page_size=(\d+)/.exec(new OpenverseLibrary().searchUrl("x"))[1]);
  assert.ok(size <= 20, `default page size ${size} exceeds the anonymous cap`);
});

/* -------------------------------------------------------- the licence gate */

test("a share-alike track is classified and kept", async () => {
  const lib = new OpenverseLibrary({ fetch: async () => ok([item()]) });
  const [track] = await lib.search("techno");
  assert.equal(track.licenceClass, "cc_sharealike");
  assert.equal(track.title, "Fantasy - Techno");
  assert.equal(track.artist, "Snabisch");
});

test("non-commercial material is dropped even though the query excluded it", async () => {
  // THE test. The query filter is upstream metadata; this one is ours. Measured
  // against the live API, an unfiltered "techno" search returned by-nc-nd,
  // by-nc-sa and by-nc — every one unplayable in a venue.
  const lib = new OpenverseLibrary({
    fetch: async () => ok([
      item({ id: "nc", license_url: "https://creativecommons.org/licenses/by-nc/4.0/" }),
      item({ id: "ncnd", license_url: "https://creativecommons.org/licenses/by-nc-nd/3.0/" }),
      item({ id: "ncsa", license_url: "https://creativecommons.org/licenses/by-nc-sa/3.0/" }),
      item({ id: "keep" })
    ])
  });
  const results = await lib.search("techno");
  assert.equal(results.length, 1, "only the commercially-usable track should survive");
  assert.equal(results[0].id, "openverse:keep");
});

test("no-derivatives is kept, because unmodified playback is not a derivative", async () => {
  // Excluding ND would throw away playable repertoire for a restriction that
  // does not apply to playing a record.
  const lib = new OpenverseLibrary({
    fetch: async () => ok([item({ license_url: "https://creativecommons.org/licenses/by-nd/2.0/" })])
  });
  const [track] = await lib.search("techno");
  assert.ok(track, "an ND track should be playable");
  assert.equal(track.licenceClass, "cc_attribution");
});

test("a track with no licence at all is unknown, not assumed", async () => {
  const lib = new OpenverseLibrary({ fetch: async () => ok([item({ license_url: null })]) });
  const [track] = await lib.search("techno");
  assert.equal(track.licenceClass, "unknown");
});

/* ------------------------------------------------------------- projection */

test("duration is converted from milliseconds exactly once", async () => {
  // This repository has already shipped one duration-unit bug. 313000 ms is a
  // 313-second track, not a 313000-second one.
  const lib = new OpenverseLibrary({ fetch: async () => ok([item({ duration: 313000 })]) });
  const [track] = await lib.search("techno");
  assert.equal(track.durationSec, 313);
});

test("sound effects are dropped — they are audio, but not something to mix", async () => {
  // Measured: an unfiltered search returned a 926 ms "whoosh" and a 24-second
  // atmosphere alongside real tracks.
  const lib = new OpenverseLibrary({
    fetch: async () => ok([
      item({ id: "whoosh", duration: 926 }),
      item({ id: "atmos", duration: 24000 }),
      item({ id: "track", duration: 190000 })
    ])
  });
  const results = await lib.search("techno");
  assert.deepEqual(results.map((r) => r.id), ["openverse:track"]);
});

test("a missing duration does not drop the track", async () => {
  // Unknown length is not evidence of being a sound effect, and discarding it
  // would silently shrink the library.
  const lib = new OpenverseLibrary({ fetch: async () => ok([item({ duration: null })]) });
  assert.equal((await lib.search("x")).length, 1);
});

test("genres and tags are merged and deduplicated", async () => {
  // `genres` is often null while `tags` is populated, and vice versa; to a DJ
  // browsing they mean the same thing.
  const lib = new OpenverseLibrary({
    fetch: async () => ok([item({ genres: ["Dance", "techno"], tags: [{ name: "dance" }, { name: "loop" }] })])
  });
  const [track] = await lib.search("x");
  assert.deepEqual(track.tags, ["Dance", "techno", "loop"]);
});

test("a result with no audio url is dropped rather than offered as unplayable", async () => {
  const lib = new OpenverseLibrary({ fetch: async () => ok([item({ url: null }), item({ id: "good" })]) });
  const results = await lib.search("x");
  assert.deepEqual(results.map((r) => r.id), ["openverse:good"]);
});

test("one result is one track, and needs no second round trip", async () => {
  const lib = new OpenverseLibrary({ fetch: async () => ok([item()]) });
  const [track] = await lib.search("techno");
  lib.remember(track);
  const files = await lib.tracks(track.id);
  assert.equal(files.length, 1);
  assert.equal(files[0].url, track.audioUrl);
  assert.equal(files[0].durationSec, 313);
});

/* ---------------------------------------------------------------- failure */

test("an unreachable Openverse says so, and says what still works", async () => {
  const lib = new OpenverseLibrary({ fetch: async () => { throw new Error("offline"); } });
  await assert.rejects(() => lib.search("x"), (err) => {
    assert.ok(err instanceof OpenverseLibraryError);
    assert.equal(err.code, "network_error");
    // A dead source must never look like an empty library.
    assert.match(err.message, /Archive and local files still work/);
    return true;
  });
});

test("an HTTP error is an error, not an empty library", async () => {
  const lib = new OpenverseLibrary({ fetch: async () => ({ ok: false, status: 503 }) });
  await assert.rejects(() => lib.search("x"), /HTTP 503/);
});

test("rate limiting is named for what it is, not reported as 'unauthorised'", async () => {
  // Anonymous use is metered at 20/minute and 200/day per IP, and exhaustion is
  // signalled with 401 rather than 429. Telling someone who supplied no
  // credential that they are unauthorised sends them hunting for an API key
  // they do not need.
  for (const status of [401, 429]) {
    const lib = new OpenverseLibrary({ fetch: async () => ({ ok: false, status }) });
    await assert.rejects(() => lib.search("x"), (err) => {
      assert.equal(err.code, "rate_limited");
      assert.match(err.message, /limiting/);
      assert.match(err.message, /Archive results are still shown/);
      return true;
    });
  }
});

test("a non-JSON body is reported rather than read as no results", async () => {
  const lib = new OpenverseLibrary({
    fetch: async () => ({ ok: true, status: 200, json: async () => { throw new Error("html"); } })
  });
  await assert.rejects(() => lib.search("x"), /did not return JSON/);
});

/* ------------------------------------------- explaining the refusal (DJX-20) */

test("a pasted YouTube link is explained, not silently unmatched", () => {
  // Someone who pastes a link and gets "nothing found" concludes the search is
  // broken. This is the difference between a dead end and an explanation.
  const hit = detectConsumerService("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.ok(hit);
  assert.equal(hit.service, "YouTube");
  assert.match(hit.why, /publicly screen videos or stream music/);
  assert.match(hit.why, /LOAD FILE/);
});

test("the short and music hosts are recognised too", () => {
  assert.equal(detectConsumerService("https://youtu.be/abc123").service, "YouTube");
  assert.equal(detectConsumerService("https://music.youtube.com/watch?v=x").service, "YouTube");
});

test("the other consumer services are recognised, for the same reason", () => {
  assert.equal(detectConsumerService("https://open.spotify.com/track/x").service, "Spotify");
  assert.equal(detectConsumerService("https://soundcloud.com/artist/track").service, "SoundCloud");
  assert.equal(detectConsumerService("https://music.apple.com/album/x").service, "Apple Music");
});

test("an ordinary search is not mistaken for a link", () => {
  // A record legitimately called "youtube" — or a search for the word — must
  // still search. The match is on host, not on the word appearing anywhere.
  assert.equal(detectConsumerService("youtube"), null);
  assert.equal(detectConsumerService("techno"), null);
  assert.equal(detectConsumerService(""), null);
  assert.equal(detectConsumerService(null), null);
  assert.equal(detectConsumerService("my youtube channel theme"), null);
});

test("a lookalike host does not slip through as a legitimate search", () => {
  // The inverse of the above: `notyoutube.com` should not be treated as YouTube,
  // but `evil.youtube.com.example` should not be treated as safe either. The
  // separator classes decide it, and getting them wrong is silent.
  assert.equal(detectConsumerService("https://notyoutube.com/x"), null);
  assert.ok(detectConsumerService("https://m.youtube.com/watch?v=x"), "subdomains are still YouTube");
});
