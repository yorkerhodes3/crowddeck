// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Jamendo provider — CON-5, REQ-CON-6.
 *
 * `fetch` is injected, so these run offline and deterministically. The API's real
 * response shape was confirmed against the live endpoint first — including that it
 * signals failure inside a 200 response, which is the behaviour that would
 * otherwise turn an auth error into a silently empty catalogue.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { JamendoProvider } from "../src/jamendo.js";
import { ProviderRouter } from "../src/router.js";
import { ProviderError } from "../src/provider.js";

const CC_BY = "https://creativecommons.org/licenses/by/4.0/";
const CC_BY_NC = "https://creativecommons.org/licenses/by-nc/4.0/";
const CC_BY_SA = "https://creativecommons.org/licenses/by-sa/3.0/";

/** A Jamendo row, in the shape the real API returns. */
const row = (over = {}) => ({
  id: "1234",
  name: "Tidal Flats",
  artist_name: "Ora Marsh",
  duration: 240,
  license_ccurl: CC_BY,
  audio: "https://prod-1.storage.jamendo.com/?trackid=1234&format=mp31",
  audiodownload: "https://mp3l.jamendo.com/?trackid=1234&format=mp31",
  musicinfo: { bpm: "120", tags: { genres: ["ambient"] } },
  ...over
});

/** A fake fetch returning Jamendo's real envelope. */
function fakeApi(rows, opts = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (opts.networkError) throw new Error(opts.networkError);
    if (opts.httpStatus && opts.httpStatus !== 200) {
      return { ok: false, status: opts.httpStatus, json: async () => ({}) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        headers: opts.apiError
          ? { status: "failed", code: 5, error_message: opts.apiError, results_count: 0 }
          : { status: "success", code: 0, error_message: "", results_count: rows.length },
        results: rows
      })
    };
  };
  return { fetchImpl, calls };
}

const make = (rows, opts = {}) => {
  const { fetchImpl, calls } = fakeApi(rows, opts);
  const provider = new JamendoProvider({ clientId: "test-id", fetch: fetchImpl });
  return { provider, calls };
};

/* ---------------------------------------------------------- configuration */

test("a provider with no client ID refuses to exist", () => {
  // An appliance that appears to have a music source but returns nothing is worse
  // than one that says the source is not configured.
  assert.throws(() => new JamendoProvider({}), TypeError);
  assert.throws(() => new JamendoProvider({ clientId: "" }), TypeError);
  assert.doesNotThrow(() => new JamendoProvider({ clientId: "abc", fetch: async () => ({}) }));
});

test("the client ID and format are sent on every request", async () => {
  const { provider, calls } = make([row()]);
  await provider.search("tidal");

  const url = new URL(calls[0].url);
  assert.equal(url.searchParams.get("client_id"), "test-id");
  assert.equal(url.searchParams.get("format"), "json");
  assert.equal(url.searchParams.get("search"), "tidal");
});

/* ------------------------------------------------- the legally important bit */

test("non-commercial tracks never reach the catalogue — REQ-DAT-10", async () => {
  // Filtered client-side as well as server-side. Two independent mechanisms,
  // because a silent API change would otherwise put unplayable music in front of
  // patrons and the consequence lands on the venue.
  const { provider } = make([
    row({ id: "ok", license_ccurl: CC_BY }),
    row({ id: "nope", license_ccurl: CC_BY_NC }),
    row({ id: "sa", license_ccurl: CC_BY_SA })
  ]);

  const results = await provider.search("");
  const ids = results.map((t) => t.id);

  assert.ok(ids.includes("ok"));
  assert.ok(ids.includes("sa"));
  assert.ok(!ids.includes("nope"), "a CC BY-NC track must not be offered to a commercial venue");
});

test("the API is asked for commercial repertoire only", async () => {
  const { provider, calls } = make([row()]);
  await provider.search("x");
  const url = new URL(calls[0].url);
  assert.ok(url.searchParams.has("license_cc"), "server-side filter is requested");
});

test("an unrecognised licence becomes unknown, not a guess", async () => {
  const { provider } = make([
    row({ id: "weird", license_ccurl: "https://example.com/our-own-terms" })
  ]);

  const [track] = await provider.search("");
  assert.equal(track.licenceClass, "unknown", "policy will block this, which is correct");
  assert.match(track.licenceReason, /not a recognised Creative Commons/);
});

test("attribution is built for the venue display — REQ-DAT-11", async () => {
  const { provider } = make([row({ license_ccurl: CC_BY })]);
  const [track] = await provider.search("");

  assert.match(track.attribution, /Tidal Flats/);
  assert.match(track.attribution, /Ora Marsh/);
  assert.match(track.attribution, /CC BY 4\.0/);
});

test("explicit is left undefined rather than claimed false", async () => {
  // Jamendo has no explicit-content flag. Asserting `false` would slip explicit
  // material past a daypart rule; leaving it undefined lets venue policy decide.
  const { provider } = make([row()]);
  const [track] = await provider.search("");
  assert.equal(track.explicit, undefined);
});

/* ------------------------------------------------------------ error paths */

test("an API error inside a 200 response is still an error", async () => {
  // Jamendo returns HTTP 200 with `headers.status === "failed"`. Checking `res.ok`
  // alone would turn an invalid client ID into a silently empty catalogue — a
  // venue with a search box that never finds anything and no explanation.
  const { provider } = make([], { apiError: "Your credential is not authorized." });

  await assert.rejects(
    () => provider.search("x"),
    (e) => e instanceof ProviderError && e.code === "api_error" && /not authorized/.test(e.message)
  );
});

test("a network failure is retryable; a bad request is not", async () => {
  const down = make([], { networkError: "ENOTFOUND api.jamendo.com" });
  await assert.rejects(
    () => down.provider.search("x"),
    (e) => e.code === "network_error" && e.retryable === true
  );

  const badRequest = make([], { httpStatus: 400 });
  await assert.rejects(
    () => badRequest.provider.search("x"),
    (e) => e.code === "http_error" && e.retryable === false
  );

  const serverError = make([], { httpStatus: 503 });
  await assert.rejects(
    () => serverError.provider.search("x"),
    (e) => e.code === "http_error" && e.retryable === true
  );
});

test("health reports false rather than throwing", async () => {
  const ok = make([row()]);
  assert.equal(await ok.provider.healthy(), true);

  const down = make([], { networkError: "offline" });
  assert.equal(await down.provider.healthy(), false, "the console needs a boolean, not an exception");
});

/* ---------------------------------------------------------- resolve/stream */

test("resolve, streamUrl and licenceClass agree", async () => {
  const { provider } = make([row({ id: "42" })]);

  const track = await provider.resolve("42");
  assert.equal(track.title, "Tidal Flats");
  assert.equal(track.duration, 240000, "seconds are converted to milliseconds");
  assert.equal(await provider.licenceClass("42"), "cc_attribution");
  assert.match(await provider.streamUrl("42"), /^https:\/\/prod-1\.storage\.jamendo\.com/);
});

test("resolve caches, so playing a track does not re-fetch it three times", async () => {
  const { provider, calls } = make([row({ id: "42" })]);

  await provider.resolve("42");
  await provider.licenceClass("42");
  await provider.streamUrl("42");

  assert.equal(calls.length, 1, "resolve/licenceClass/streamUrl share one fetch");
});

test("a missing track is null, and streaming it is an error", async () => {
  const { provider } = make([]);
  assert.equal(await provider.resolve("nope"), null);
  await assert.rejects(() => provider.streamUrl("nope"), (e) => e.code === "not_found");
});

test("a track with no audio URL is not playable", async () => {
  const { provider } = make([row({ id: "silent", audio: "", audiodownload: "" })]);
  const [track] = await provider.search("");
  assert.equal(track.playable, false);
  await assert.rejects(() => provider.streamUrl("silent"), (e) => e.code === "no_media_path");
});

/* ------------------------------------------------------- through the router */

test("Jamendo being down does not stop the venue — REQ-NFR-3", async () => {
  const { provider } = make([], { networkError: "ENOTFOUND api.jamendo.com" });
  const router = new ProviderRouter({ timeoutMs: 200 });
  router.register(provider, { priority: 50 });

  const res = await router.search("anything");
  assert.equal(res.tracks.length, 0);
  assert.equal(res.degraded, true);
  assert.equal(res.errors[0].provider, "jamendo");
  assert.equal(res.errors[0].retryable, true, "so the console can suggest trying again");
});

test("results carry a jamendo URI that resolves", async () => {
  const { provider } = make([row({ id: "42" })]);
  const router = new ProviderRouter();
  router.register(provider);

  const res = await router.search("");
  assert.equal(res.tracks[0].uri, "jamendo:track:42");
  assert.equal((await router.resolve("jamendo:track:42")).title, "Tidal Flats");
});

test("a fresh install has legally playable music — REQ-CON-6", async () => {
  // The point of shipping this provider: an appliance out of the box can be
  // evaluated, because there is something a commercial venue may lawfully play.
  const { provider } = make([
    row({ id: "1", license_ccurl: CC_BY }),
    row({ id: "2", license_ccurl: CC_BY_SA }),
    row({ id: "3", license_ccurl: CC_BY_NC })
  ]);

  const results = await provider.search("");
  assert.ok(results.length >= 2, "there is music on first run");
  assert.ok(
    results.every((t) => t.licenceClass !== "cc_noncommercial" && t.licenceClass !== "unknown"),
    "and all of it is performable in a commercial venue"
  );
  assert.ok(results.every((t) => t.attribution), "with the attribution the licence requires");
});
