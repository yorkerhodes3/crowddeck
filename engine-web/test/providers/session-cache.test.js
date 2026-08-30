// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Session cache and the browser provider harness — DJX-22.
 *
 * The trap this file exists to pin is detachment. `decodeAudioData` *detaches*
 * the ArrayBuffer it is given, so a cache that hands out its own instance is
 * left holding a zero-length husk — and the second play of a track is silence.
 * Nothing throws. It just goes quiet, once, on the second play.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionCache } from "../../src/providers/session-cache.js";
import { BrowserProvider, LicenceBasis } from "../../src/providers/browser-provider.js";
import { Provider } from "../../../providers/src/provider.js";

const buf = (n, fill = 1) => {
  const b = new ArrayBuffer(n);
  new Uint8Array(b).fill(fill);
  return b;
};

/* ------------------------------------------------------------------ cache */

test("a hit does not call the loader again", async () => {
  const cache = new SessionCache();
  let calls = 0;
  const load = async () => { calls += 1; return buf(1024); };

  await cache.get("a", load);
  await cache.get("a", load);
  assert.equal(calls, 1);
  assert.equal(cache.stats().hits, 1);
  assert.equal(cache.stats().misses, 1);
});

test("the cache survives its result being detached — the silent-second-play bug", async () => {
  // `decodeAudioData` detaches the buffer it is handed. If the cache returns its
  // own instance, the entry becomes zero-length and the next play is silence,
  // with nothing thrown anywhere.
  //
  // Note which path this exercises. The first `get` is a MISS and returns a copy
  // of the loader's buffer; detaching that proves nothing about the cache. The
  // bug lives on the HIT path, so the detach has to be applied to a hit — an
  // earlier version of this test detached the miss and passed against a
  // deliberately broken cache.
  const cache = new SessionCache();
  await cache.get("k", async () => buf(2048));

  const fromHit = await cache.get("k", async () => { throw new Error("must not reload"); });
  assert.equal(fromHit.byteLength, 2048);
  structuredClone(fromHit, { transfer: [fromHit] });
  assert.equal(fromHit.byteLength, 0, "sanity: the caller's copy really was detached");

  const third = await cache.get("k", async () => { throw new Error("must not reload"); });
  assert.equal(third.byteLength, 2048, "the cached copy must survive a consumer detaching a hit");
});

test("even the miss path returns a detachable copy", async () => {
  // The first caller detaches too, and stored-equals-returned would corrupt the
  // entry before it was ever read back.
  const cache = new SessionCache();
  const got = await cache.get("k", async () => buf(512));
  structuredClone(got, { transfer: [got] });
  const again = await cache.get("k", async () => { throw new Error("must not reload"); });
  assert.equal(again.byteLength, 512);
});

test("eviction is least-recently-used, and counted in bytes", async () => {
  const cache = new SessionCache({ maxBytes: 3000 });
  await cache.get("a", async () => buf(1000));
  await cache.get("b", async () => buf(1000));
  await cache.get("c", async () => buf(1000));
  // Touch "a" so "b" becomes the coldest.
  await cache.get("a", async () => buf(1000));
  await cache.get("d", async () => buf(1000));

  assert.ok(cache.has("a"), "recently used must survive");
  assert.ok(!cache.has("b"), "least recently used must be evicted");
  assert.ok(cache.bytes <= 3000);
});

test("bytes, not entries — one long mix must not be worth the same as one sample", async () => {
  // Counting entries would let a hundred short samples and one 60 MB DJ mix have
  // equal weight, and it is the mix that fills the tab.
  const cache = new SessionCache({ maxBytes: 10000 });
  await cache.get("small", async () => buf(100));
  await cache.get("huge", async () => buf(9000));
  await cache.get("another", async () => buf(2000));
  assert.ok(cache.bytes <= 10000, `held ${cache.bytes} bytes`);
  assert.ok(!cache.has("huge"), "the large entry should have been evicted to fit");
});

test("something bigger than the whole budget is not cached at all", async () => {
  // Rather than evicting everything to make room for what would go next anyway.
  const cache = new SessionCache({ maxBytes: 1000 });
  await cache.get("a", async () => buf(500));
  await cache.get("enormous", async () => buf(5000));
  assert.ok(cache.has("a"), "the existing entry must not be sacrificed");
  assert.ok(!cache.has("enormous"));
});

test("an empty or non-buffer value is not stored", () => {
  const cache = new SessionCache();
  cache.put("empty", new ArrayBuffer(0));
  cache.put("wrong", "not a buffer");
  assert.equal(cache.size, 0);
});

test("a loader failure is not cached as a success", async () => {
  const cache = new SessionCache();
  await assert.rejects(() => cache.get("x", async () => { throw new Error("network"); }));
  assert.ok(!cache.has("x"), "a failure must not poison the entry");
});

/* -------------------------------------------------------------- contract */

class Stub extends BrowserProvider {
  constructor(opts = {}) {
    super({
      id: opts.id ?? "stub",
      licenceBasis: opts.licenceBasis ?? LicenceBasis.PER_ITEM,
      licenceEvidence: opts.licenceEvidence,
      cache: opts.cache,
      fetch: opts.fetch
    });
    this.url = opts.url ?? "https://example.test/a.mp3";
  }
  async streamUrl() { return this.url; }
  async licenceClass() { return "cc_attribution"; }
}

test("a browser provider IS a Provider — the same contract, not a parallel one", () => {
  // The point of the exercise. If this ever stops being true, the deck and the
  // venue have drifted into two source models again.
  assert.ok(new Stub() instanceof Provider);
});

test("a provider must declare how it establishes licence", () => {
  assert.throws(
    () => new (class extends BrowserProvider {
      constructor() { super({ id: "nope" }); }
    })(),
    /licenceBasis/
  );
});

test("a collection-policy claim without evidence is refused", () => {
  // "This whole catalogue is public domain" is a strong claim. Unsourced, it is
  // an assumption wearing a suit.
  assert.throws(
    () => new Stub({ id: "policy", licenceBasis: LicenceBasis.COLLECTION_POLICY }),
    /cites no evidence/
  );
  assert.ok(new Stub({
    id: "policy",
    licenceBasis: LicenceBasis.COLLECTION_POLICY,
    licenceEvidence: "https://example.test/policy"
  }));
});

test("audio is fetched through the cache, so a reload costs nothing", async () => {
  let fetches = 0;
  const cache = new SessionCache();
  const provider = new Stub({
    cache,
    fetch: async () => { fetches += 1; return { ok: true, arrayBuffer: async () => buf(4096) }; }
  });
  await provider.fetchAudio("t1");
  await provider.fetchAudio("t1");
  assert.equal(fetches, 1);
});

test("two providers serving the same URL share one download", async () => {
  // Openverse indexes catalogues the Archive also mirrors, so this is real
  // rather than theoretical. Keyed by URL, not by track id.
  let fetches = 0;
  const cache = new SessionCache();
  const mk = (id) => new Stub({
    id, cache, url: "https://example.test/shared.mp3",
    fetch: async () => { fetches += 1; return { ok: true, arrayBuffer: async () => buf(2048) }; }
  });
  await mk("one").fetchAudio("a");
  await mk("two").fetchAudio("b");
  assert.equal(fetches, 1);
});

test("an HTTP failure is a ProviderError naming the provider, not a bare throw", async () => {
  const provider = new Stub({ fetch: async () => ({ ok: false, status: 503 }) });
  await assert.rejects(() => provider.fetchAudio("t"), (err) => {
    assert.equal(err.provider, "stub");
    assert.equal(err.retryable, true, "a 5xx is worth retrying");
    return true;
  });
});

test("a 404 is not marked retryable", async () => {
  const provider = new Stub({ fetch: async () => ({ ok: false, status: 404 }) });
  await assert.rejects(() => provider.fetchAudio("t"), (err) => {
    assert.equal(err.retryable, false);
    return true;
  });
});
