// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Search across providers, through the API — CON-1, REQ-CON-5, REQ-NFR-3.
 *
 * The interesting case is the degraded one. A venue on a flaky connection must get
 * its own library back promptly and be *told* that a remote source is missing —
 * not get a spinner, and not get a silently smaller catalogue that makes staff
 * think the jukebox is broken.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { Provider, ProviderError, ProviderRouter, LocalProvider } from "../../providers/src/index.js";
import { openDatabase } from "../../data/src/db.js";
import { TrackStore } from "../../data/src/tracks.js";
import { filterSearch, resolvePolicy } from "../../core/src/policy.js";

class RemoteStub extends Provider {
  constructor(opts = {}) {
    super({ id: "jamendo", name: "Jamendo", remote: true });
    this.tracks = opts.tracks ?? [];
    this.failWith = opts.failWith ?? null;
    this.delayMs = opts.delayMs ?? 0;
  }
  async search() {
    if (this.failWith) throw this.failWith;
    if (this.delayMs) await new Promise((r) => setTimeout(r, this.delayMs));
    return this.tracks;
  }
}

function venue(t) {
  const db = openDatabase({ venueId: "v1" });
  t.after(() => db.close());
  const store = new TrackStore(db);
  store.upsert({
    id: "owned-1",
    title: "Blue Monday",
    artist: "New Order",
    licenceClass: "owned_local",
    source: "music/bm.flac"
  });
  store.upsert({
    id: "cc-1",
    title: "Tidal Flats",
    artist: "Ora Marsh",
    licenceClass: "cc_attribution",
    attribution: "Ora Marsh — CC BY 4.0",
    source: "music/tf.mp3"
  });
  return new LocalProvider({ tracks: store });
}

test("the local library answers when the remote source is down — REQ-NFR-3", async (t) => {
  const router = new ProviderRouter({ timeoutMs: 100 });
  router.register(venue(t), { priority: 0 });
  router.register(
    new RemoteStub({ failWith: new ProviderError("jamendo", "ENOTFOUND api.jamendo.com") }),
    { priority: 50 }
  );

  const res = await router.search("");

  assert.ok(res.tracks.length >= 2, "the venue's own library is unaffected by an outage");
  assert.equal(res.degraded, true);
  assert.equal(res.errors[0].provider, "jamendo");
});

test("a search that must be honest about being partial", async (t) => {
  // This is what the API returns to a patron client. `degraded` exists so the UI
  // never presents a partial catalogue as a complete one.
  const PROVIDER_DELAY_MS = 5000;

  const router = new ProviderRouter({ timeoutMs: 50 });
  router.register(venue(t), { priority: 0 });
  router.register(new RemoteStub({ delayMs: PROVIDER_DELAY_MS }), { priority: 50 });

  const started = Date.now();
  const res = await router.search("");
  const elapsed = Date.now() - started;

  // Bounded by the injected delay rather than a fixed millisecond figure: the
  // property is "we did not wait for the hanging provider". A tighter bound was
  // flaky under parallel test load, and a test that fails on machine load rather
  // than behaviour is worse than no test.
  assert.ok(
    elapsed < PROVIDER_DELAY_MS / 2,
    `search took ${elapsed}ms — it waited for the hanging provider`
  );

  const payload = {
    results: filterSearch(res.tracks, resolvePolicy({}), { holdsPro: true }),
    degraded: res.degraded,
    sources: {
      queried: res.providersQueried,
      answered: res.providersAnswered,
      unavailable: res.errors.map((e) => ({ provider: e.provider, name: e.name }))
    }
  };

  assert.equal(payload.degraded, true);
  assert.equal(payload.sources.answered, 1);
  assert.equal(payload.sources.queried, 2);
  assert.deepEqual(payload.sources.unavailable, [{ provider: "jamendo", name: "Jamendo" }]);
  assert.ok(payload.results.length > 0, "and the patron still gets a usable catalogue");
});

test("policy still applies to provider results — REQ-POL-2", async (t) => {
  // A provider is not a way around venue policy. A remote source offering a
  // non-commercial track must not make it requestable.
  const router = new ProviderRouter();
  router.register(venue(t), { priority: 0 });
  router.register(
    new RemoteStub({
      tracks: [
        { id: "nc", title: "Study Hall", artist: "Quiet Hours", licenceClass: "cc_noncommercial" },
        { id: "ok", title: "Copper Wire", artist: "Static Bloom", licenceClass: "cc_attribution" }
      ]
    }),
    { priority: 50 }
  );

  const res = await router.search("");
  const visible = filterSearch(res.tracks, resolvePolicy({ commercial: true }), { holdsPro: true }).map(
    (t2) => t2.id
  );

  assert.ok(!visible.includes("nc"), "cc_noncommercial stays out of a commercial venue");
  assert.ok(visible.includes("ok"));
  assert.ok(visible.includes("owned-1"), "the local library is unaffected");
});

test("every provider result carries a resolvable URI", async (t) => {
  const router = new ProviderRouter();
  router.register(venue(t), { priority: 0 });

  const res = await router.search("blue");
  assert.equal(res.tracks[0].uri, "local:track:owned-1");
  assert.equal((await router.resolve(res.tracks[0].uri)).title, "Blue Monday");
});

test("wiring a provider router does not clobber the HTTP route table", async (t) => {
  // A one-line addition that broke every request: the option was called `router`
  // and `VenueApi` already used `this.router` for its route table, so assigning a
  // provider router replaced the routing wholesale. Every endpoint returned 500.
  //
  // The names are now distinct, and this pins that they stay distinct.
  const { VenueApi } = await import("../src/server.js");
  const { DemoCatalog } = await import("../src/demo-catalog.js");
  const { Scheduler } = await import("../../core/src/scheduler.js");

  const providers = new ProviderRouter();
  providers.register(venue(t), { priority: 0 });

  const api = new VenueApi({
    scheduler: new Scheduler({ venueId: "v1" }),
    catalog: new DemoCatalog(),
    venueId: "v1",
    providers
  });
  t.after(() => api.close());
  await api.listen(0);

  assert.notEqual(api.router, providers, "the HTTP route table must not be the provider router");
  assert.equal(typeof api.router.match, "function", "the route table is still a route table");
  assert.equal(api.providers, providers);

  // And the endpoint actually works end to end, which is what nobody checked.
  // `assumeProLicence` is needed because the local fixture is `owned_local`, which
  // a venue with no declared PRO profile correctly refuses to offer (VEN-3).
  const res = await fetch(`${api.url}/v1/venues/v1/search?q=tidal`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.results), "search must return results, not a 500");
  assert.equal(
    body.results[0].uri,
    "local:track:cc-1",
    "served through the provider router, with a CC track needing no PRO licence"
  );
});
