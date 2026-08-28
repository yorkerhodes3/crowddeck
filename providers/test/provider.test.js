// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Provider interface and router — REQ-CON-5, REQ-NFR-3, CON-1.
 *
 * The load-bearing tests here are the failure ones. Any router can merge results
 * from two working providers; what decides whether this is fit for a venue is what
 * happens when one of them is a network service on a hotel wifi connection.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Provider,
  ProviderError,
  ProviderRouter,
  LocalProvider,
  validateTrack,
  parseUri,
  toUri
} from "../src/index.js";
import { openDatabase } from "../../data/src/db.js";
import { TrackStore } from "../../data/src/tracks.js";

/** A provider with controllable behaviour, for exercising the router. */
class FakeProvider extends Provider {
  constructor(id, tracks = [], opts = {}) {
    super({ id, name: opts.name ?? id, remote: opts.remote ?? false });
    this.tracks = tracks;
    this.delayMs = opts.delayMs ?? 0;
    this.failWith = opts.failWith ?? null;
    this.searchCalls = 0;
    this.abortedAt = null;
  }

  async search(query, opts = {}) {
    this.searchCalls++;
    if (this.failWith) throw this.failWith;
    if (this.delayMs) {
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, this.delayMs);
        opts.signal?.addEventListener("abort", () => {
          clearTimeout(t);
          this.abortedAt = Date.now();
          reject(new Error("aborted"));
        });
      });
    }
    const q = String(query ?? "").toLowerCase();
    return this.tracks.filter((t) => !q || t.title.toLowerCase().includes(q));
  }

  async resolve(id) {
    return this.tracks.find((t) => t.id === id) ?? null;
  }

  async streamUrl(id) {
    return `https://${this.id}.example/${id}.mp3`;
  }

  async licenceClass(id) {
    return this.tracks.find((t) => t.id === id)?.licenceClass ?? "unknown";
  }
}

const track = (id, over = {}) => ({
  id,
  title: over.title ?? `Track ${id}`,
  artist: "Someone",
  duration: 200000,
  licenceClass: "cc_attribution",
  ...over
});

/* ------------------------------------------------------------- the contract */

test("the base class refuses to pretend it works", async () => {
  // A half-written provider must fail at the seam, not quietly serve nothing.
  const p = new Provider({ id: "stub" });
  for (const method of ["search", "resolve", "streamUrl", "licenceClass"]) {
    await assert.rejects(() => p[method]("x"), ProviderError, `${method} should throw`);
  }
});

test("a provider id must be usable as a URI scheme", () => {
  assert.throws(() => new Provider({}), TypeError);
  assert.throws(() => new Provider({ id: "Has Spaces" }), RangeError);
  assert.throws(() => new Provider({ id: "UPPER" }), RangeError);
  assert.doesNotThrow(() => new Provider({ id: "open-subsonic" }));
});

test("URIs round-trip", () => {
  assert.equal(toUri("local", "abc123"), "local:track:abc123");
  assert.deepEqual(parseUri("local:track:abc123"), { provider: "local", id: "abc123" });
  // Ids containing colons must survive — MusicBrainz IDs and paths both do.
  assert.deepEqual(parseUri("local:track:a:b:c"), { provider: "local", id: "a:b:c" });
  assert.equal(parseUri("not-a-uri"), null);
  assert.equal(parseUri(null), null);
});

test("a track without a licence class is rejected — REQ-CON-5", () => {
  assert.doesNotThrow(() => validateTrack("p", track("1")));

  // The failure this prevents is a venue publicly performing music nobody checked.
  assert.throws(() => validateTrack("p", { id: "1" }), /must declare one of/);
  assert.throws(() => validateTrack("p", { id: "1", licenceClass: "probably-fine" }), /must declare one of/);
  assert.throws(() => validateTrack("p", { id: "1", licenceClass: null }), /must declare one of/);

  // "unknown" is allowed — it is a claim someone made, and policy blocks it.
  assert.doesNotThrow(() => validateTrack("p", track("1", { licenceClass: "unknown" })));
});

test("validation attributes the track to its provider", () => {
  const v = validateTrack("jamendo", track("42"));
  assert.equal(v.provider, "jamendo");
  assert.equal(v.uri, "jamendo:track:42");
});

/* ----------------------------------------------------------------- routing */

test("search merges results from every provider", async () => {
  const router = new ProviderRouter();
  router.register(new FakeProvider("local", [track("a"), track("b")]), { priority: 0 });
  router.register(new FakeProvider("jamendo", [track("c")]), { priority: 10 });

  const res = await router.search("");
  assert.equal(res.tracks.length, 3);
  assert.equal(res.degraded, false);
  assert.deepEqual(res.errors, []);
  assert.equal(res.providersAnswered, 2);
});

test("local results come before remote ones", async () => {
  const router = new ProviderRouter();
  router.register(new FakeProvider("jamendo", [track("remote")], { remote: true }), { priority: 50 });
  router.register(new FakeProvider("local", [track("mine")]), { priority: 0 });

  const res = await router.search("");
  assert.equal(res.tracks[0].id, "mine", "the venue's own library outranks a remote service");
});

test("a duplicate provider id is refused", () => {
  const router = new ProviderRouter();
  router.register(new FakeProvider("local"));
  assert.throws(() => router.register(new FakeProvider("local")), RangeError);
});

test("only real providers can register", () => {
  const router = new ProviderRouter();
  assert.throws(() => router.register({ id: "duck", search: async () => [] }), TypeError);
});

/* ------------------------------------------- the tests that actually matter */

test("one dead provider does not take the venue down — REQ-NFR-3", async () => {
  // The failure mode this product exists to avoid: an internet outage stopping
  // the music. The local library must keep answering.
  const router = new ProviderRouter({ timeoutMs: 100 });
  router.register(new FakeProvider("local", [track("mine")]), { priority: 0 });
  router.register(
    new FakeProvider("jamendo", [track("remote")], {
      remote: true,
      failWith: new ProviderError("jamendo", "ENOTFOUND api.jamendo.com", { retryable: true })
    }),
    { priority: 50 }
  );

  const res = await router.search("");

  assert.equal(res.tracks.length, 1, "the local library still answers");
  assert.equal(res.tracks[0].id, "mine");
  assert.equal(res.degraded, true, "and the caller is told the results are partial");
  assert.equal(res.errors.length, 1);
  assert.equal(res.errors[0].provider, "jamendo");
  assert.match(res.errors[0].message, /ENOTFOUND/);
});

test("a slow provider is timed out rather than waited for", async () => {
  const TIMEOUT_MS = 80;
  const PROVIDER_DELAY_MS = 5000;

  const router = new ProviderRouter({ timeoutMs: TIMEOUT_MS });
  router.register(new FakeProvider("local", [track("fast")]), { priority: 0 });
  router.register(new FakeProvider("slow", [track("late")], { delayMs: PROVIDER_DELAY_MS }), {
    priority: 50
  });

  const started = Date.now();
  const res = await router.search("");
  const elapsed = Date.now() - started;

  // Bound derived from the injected delay, not a magic number. The property being
  // tested is "the timeout fired instead of waiting for the slow provider", and
  // anything comfortably under the provider's own delay proves that.
  //
  // An earlier version asserted `elapsed < 1000`, which is only ~12x the timeout
  // and turned out to be flaky: the suite runs ten files in parallel on four
  // cores, and a scheduling spike could exceed it while the code was entirely
  // correct. A test that fails on machine load rather than on behaviour teaches
  // people to re-run until green, which is how real regressions get waved through.
  assert.ok(
    elapsed < PROVIDER_DELAY_MS / 2,
    `search took ${elapsed}ms — it waited for the slow provider instead of timing out at ${TIMEOUT_MS}ms`
  );
  assert.equal(res.tracks.length, 1);
  assert.equal(res.errors[0].code, "provider_timeout");
  assert.equal(res.errors[0].retryable, true, "a timeout is worth retrying; a bad id is not");
});

test("a timed-out provider is told to stop working", async () => {
  // Courtesy rather than correctness: the router does not depend on cooperation,
  // but a provider that respects the signal stops burning a socket it will not be
  // credited for.
  const router = new ProviderRouter({ timeoutMs: 50 });
  const slow = new FakeProvider("slow", [track("x")], { delayMs: 5000 });
  router.register(slow);

  await router.search("");
  assert.ok(slow.abortedAt, "the provider should have received an abort signal");
});

test("failures are reported, never silently swallowed", async () => {
  // The tempting implementation drops rejections and returns fewer results. That
  // gives a venue whose catalogue shrinks for no visible reason, and staff who
  // conclude the jukebox is broken.
  const router = new ProviderRouter({ timeoutMs: 50 });
  router.register(new FakeProvider("a", [], { failWith: new Error("boom") }));
  router.register(new FakeProvider("b", [], { failWith: new Error("bang") }));

  const res = await router.search("");
  assert.equal(res.tracks.length, 0);
  assert.equal(res.errors.length, 2, "both failures are named");
  assert.equal(res.degraded, true);
  assert.equal(res.providersAnswered, 0);
});

test("a provider returning a track with no licence class is blamed by name", async () => {
  // Otherwise this surfaces much later as a mysterious policy refusal, and the
  // provider that caused it is three layers away.
  const router = new ProviderRouter();
  router.register(new FakeProvider("sloppy", [{ id: "x", title: "No Licence" }]));

  const res = await router.search("");
  assert.equal(res.errors.length, 1);
  assert.equal(res.errors[0].provider, "sloppy");
  assert.match(res.errors[0].message, /must declare one of/);
});

test("results are capped at the requested limit", async () => {
  const many = Array.from({ length: 40 }, (_, i) => track(`t${i}`));
  const router = new ProviderRouter();
  router.register(new FakeProvider("a", many));
  router.register(new FakeProvider("b", many));

  const res = await router.search("", { limit: 10 });
  assert.equal(res.tracks.length, 10);
});

/* ------------------------------------------------------- resolve and stream */

test("a URI routes to the right provider", async () => {
  const router = new ProviderRouter();
  router.register(new FakeProvider("local", [track("a")]));
  router.register(new FakeProvider("jamendo", [track("b")]));

  assert.equal((await router.resolve("jamendo:track:b")).id, "b");
  assert.equal(await router.streamUrl("local:track:a"), "https://local.example/a.mp3");
  assert.equal(await router.licenceClass("jamendo:track:b"), "cc_attribution");
});

test("an unknown provider scheme is refused clearly", async () => {
  const router = new ProviderRouter();
  router.register(new FakeProvider("local", [track("a")]));

  await assert.rejects(
    () => router.resolve("spotify:track:x"),
    (e) => e.code === "unknown_provider"
  );
});

test("a bare id is ambiguous with several providers, and refused", async () => {
  // Guessing would resolve to whichever provider happened to sort first, which is
  // worse than refusing: it would work in development and pick the wrong track in
  // a venue with two libraries.
  const one = new ProviderRouter();
  one.register(new FakeProvider("local", [track("a")]));
  assert.equal((await one.resolve("a")).id, "a", "unambiguous with a single provider");

  const two = new ProviderRouter();
  two.register(new FakeProvider("local", [track("a")]));
  two.register(new FakeProvider("jamendo", [track("a")]));
  await assert.rejects(() => two.resolve("a"), (e) => e.code === "ambiguous_uri");
});

test("health reports each provider separately", async () => {
  const router = new ProviderRouter({ timeoutMs: 50 });
  router.register(new FakeProvider("local", []));
  const broken = new FakeProvider("jamendo", [], { remote: true });
  broken.healthy = async () => {
    throw new Error("unreachable");
  };
  router.register(broken);

  const health = await router.health();
  assert.equal(health.find((h) => h.id === "local").healthy, true);
  const remote = health.find((h) => h.id === "jamendo");
  assert.equal(remote.healthy, false);
  assert.equal(remote.remote, true);
  assert.match(remote.error, /unreachable/);
});

/* ------------------------------------------------------------ local library */

function localSetup(t) {
  const db = openDatabase({ venueId: "v1" });
  t.after(() => db.close());
  const store = new TrackStore(db);
  store.upsert({
    id: "t1",
    title: "Blue Monday",
    artist: "New Order",
    duration: 270000,
    licenceClass: "owned_local",
    source: "music/blue-monday.flac"
  });
  store.upsert({
    id: "t2",
    title: "Tidal Flats",
    artist: "Ora Marsh",
    licenceClass: "cc_attribution",
    attribution: "Ora Marsh — CC BY 4.0",
    source: "music/tidal-flats.mp3"
  });
  return new LocalProvider({ tracks: store, mediaRoot: "/var/lib/crowddeck" });
}

test("the local provider serves the venue's own library", async (t) => {
  const local = localSetup(t);

  const results = await local.search("blue");
  assert.equal(results.length, 1);
  assert.equal(results[0].title, "Blue Monday");
  assert.equal(results[0].licenceClass, "owned_local");

  assert.equal((await local.resolve("t2")).attribution, "Ora Marsh — CC BY 4.0");
  assert.equal(await local.licenceClass("t1"), "owned_local");
});

test("the local provider needs no network — REQ-NFR-3", async (t) => {
  const local = localSetup(t);
  assert.equal(local.remote, false);
  assert.equal(await local.healthy(), true);

  // Read the source: the no-WAN guarantee is a claim about what this code does
  // not do, and the honest way to check it is to confirm there is no transport.
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../src/local.js", import.meta.url), "utf8");
  for (const api of ["fetch(", "node:http", "node:https", "node:net", "XMLHttpRequest"]) {
    assert.ok(!src.includes(api), `local.js must contain no network calls — found "${api}"`);
  }
});

test("stream URLs are rooted at the media directory", async (t) => {
  const local = localSetup(t);
  assert.equal(await local.streamUrl("t1"), "/var/lib/crowddeck/music/blue-monday.flac");
});

test("a library entry with no file path says so", async (t) => {
  const local = localSetup(t);
  local.tracks.upsert({ id: "t3", title: "Ghost", licenceClass: "owned_local" });

  await assert.rejects(
    () => local.streamUrl("t3"),
    (e) => e.code === "no_media_path",
    "a missing path is an ingest bug and should be named as one"
  );
  await assert.rejects(() => local.streamUrl("nope"), (e) => e.code === "not_found");
});

test("the local provider works through the router", async (t) => {
  const local = localSetup(t);
  const router = new ProviderRouter();
  router.register(local, { priority: 0 });
  router.register(
    new FakeProvider("jamendo", [], { remote: true, failWith: new Error("offline") }),
    { priority: 50 }
  );

  const res = await router.search("blue");
  assert.equal(res.tracks.length, 1);
  assert.equal(res.tracks[0].uri, "local:track:t1");
  assert.equal(res.degraded, true, "offline remote is reported, local still works");
});
