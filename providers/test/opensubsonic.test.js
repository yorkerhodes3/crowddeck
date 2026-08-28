// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * OpenSubsonic consumer provider — CON-4, REQ-CON-5, REQ-CON-6.
 *
 * Response shapes are taken from the OpenSubsonic specification rather than
 * invented: the `Child` object, the `ReplayGain` object, the `subsonic-response`
 * envelope and the numbered error codes all match the published schema. The
 * details that matter here — that failure arrives inside a 200, that peaks are
 * linear, that duration is in seconds, that an apiKey excludes `u` — are
 * behaviours of the real protocol, so a test that got them wrong would pass while
 * the provider failed against every real server.
 *
 * `fetch` is injected so these run offline; `opensubsonic-http.test.js` covers the
 * same provider over a real socket.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { OpenSubsonicProvider, isLoopback } from "../src/opensubsonic.js";
import { ProviderError } from "../src/provider.js";
import { computeGain, LoudnessSource } from "../../core/src/loudness.js";

/** A Subsonic `Child`, in the shape the specification documents. */
const song = (over = {}) => ({
  id: "300",
  parent: "200",
  isDir: false,
  title: "Harbour Lights",
  album: "Slack Water",
  artist: "Ora Marsh",
  track: 4,
  year: 2019,
  genre: "Ambient",
  duration: 245,
  bitRate: 880,
  contentType: "audio/flac",
  suffix: "flac",
  type: "music",
  mediaType: "song",
  isVideo: false,
  ...over
});

function fakeServer(handlers, opts = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const parsed = new URL(url);
    const method = parsed.pathname.split("/").pop();
    calls.push({ url, parsed, method, params: parsed.searchParams, init });

    if (opts.networkError) throw new Error(opts.networkError);
    if (opts.httpStatus && opts.httpStatus !== 200) {
      return { ok: false, status: opts.httpStatus, json: async () => ({}) };
    }
    if (opts.notJson) {
      return {
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON at position 0");
        }
      };
    }

    const base = { status: "ok", version: "1.16.1", type: "navidrome", serverVersion: "0.53.3", openSubsonic: true };
    if (opts.error) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ "subsonic-response": { ...base, status: "failed", error: opts.error } })
      };
    }
    const payload = typeof handlers === "function" ? handlers(method, parsed) : handlers[method];
    return { ok: true, status: 200, json: async () => ({ "subsonic-response": { ...base, ...payload } }) };
  };
  return { fetchImpl, calls };
}

const make = (handlers, { providerOpts = {}, ...opts } = {}) => {
  const { fetchImpl, calls } = fakeServer(handlers, opts);
  const provider = new OpenSubsonicProvider({
    url: "https://music.example.test",
    licenceClass: "owned_local",
    declaredBy: "Dana Okoye, venue manager",
    username: "joe",
    password: "sesame",
    fetch: fetchImpl,
    salt: () => "c19b2d",
    now: () => "2026-02-01T12:00:00.000Z",
    ...providerOpts
  });
  return { provider, calls };
};

const searchFor = (songs) => ({ search3: { searchResult3: { song: songs } } });

/* ------------------------------------------------------------ construction */

test("the operator must declare a licence class — the server cannot", () => {
  assert.throws(
    () =>
      new OpenSubsonicProvider({
        url: "https://music.example.test",
        username: "joe",
        password: "sesame"
      }),
    /explicit licenceClass/
  );
});

test("a nonsense licence class is refused rather than passed through", () => {
  assert.throws(
    () =>
      new OpenSubsonicProvider({
        url: "https://music.example.test",
        licenceClass: "probably_fine",
        username: "joe",
        password: "sesame"
      }),
    /one of:/
  );
});

test("an apiKey and a username together are refused, as the spec requires", () => {
  assert.throws(
    () =>
      new OpenSubsonicProvider({
        url: "https://music.example.test",
        licenceClass: "owned_local",
        apiKey: "abc123",
        username: "joe",
        password: "sesame"
      }),
    /not both/
  );
});

test("no credentials at all is a configuration error, not a public library", () => {
  assert.throws(
    () => new OpenSubsonicProvider({ url: "https://music.example.test", licenceClass: "owned_local" }),
    /requires an apiKey/
  );
});

test("a password over plain HTTP to a remote host is refused", () => {
  assert.throws(
    () =>
      new OpenSubsonicProvider({
        url: "http://music.example.test",
        licenceClass: "owned_local",
        username: "joe",
        password: "sesame"
      }),
    /plain HTTP/
  );
});

test("plain HTTP to loopback is allowed — there is no wire to listen on", () => {
  for (const host of ["localhost", "127.0.0.1", "127.1.2.3"]) {
    assert.doesNotThrow(
      () =>
        new OpenSubsonicProvider({
          url: `http://${host}:4533`,
          licenceClass: "owned_local",
          username: "joe",
          password: "sesame"
        }),
      `${host} should be treated as loopback`
    );
  }
});

test("an operator who insists can override the insecure-transport refusal", () => {
  assert.doesNotThrow(
    () =>
      new OpenSubsonicProvider({
        url: "http://music.example.test",
        licenceClass: "owned_local",
        username: "joe",
        password: "sesame",
        allowInsecureAuth: true
      })
  );
});

test("loopback detection is not fooled by lookalike hostnames", () => {
  assert.equal(isLoopback("localhost"), true);
  assert.equal(isLoopback("localhost."), true);
  assert.equal(isLoopback("::1"), true);
  assert.equal(isLoopback("[::1]"), true);
  assert.equal(isLoopback("::ffff:127.0.0.1"), true);
  assert.equal(isLoopback("127.0.0.1"), true);
  assert.equal(isLoopback("127.1.2.3"), true);
  // Every one of these is a routable host an attacker can control. A prefix or
  // substring check would hand them the venue's password in cleartext.
  assert.equal(isLoopback("localhost.evil.test"), false);
  assert.equal(isLoopback("notlocalhost"), false);
  assert.equal(isLoopback("1127.0.0.1"), false);
  assert.equal(isLoopback("127.0.0.1.evil.test"), false);
  assert.equal(isLoopback("evil.test/127.0.0.1"), false);
  assert.equal(isLoopback("127.0.0.256"), false);
  assert.equal(isLoopback("1270.0.0.1"), false);
  assert.equal(isLoopback(""), false);
  assert.equal(isLoopback(undefined), false);
});

test("a url copied out of a client, with /rest already on it, still works", async () => {
  const { fetchImpl, calls } = fakeServer(searchFor([song()]));
  const provider = new OpenSubsonicProvider({
    url: "https://music.example.test/rest/",
    licenceClass: "owned_local",
    apiKey: "k",
    fetch: fetchImpl
  });
  await provider.search("harbour");
  assert.equal(calls[0].parsed.pathname, "/rest/search3");
});

/* ----------------------------------------------------------------- request */

test("the token is md5(password + salt), and the password never crosses the wire", async () => {
  const { provider, calls } = make(searchFor([song()]));
  await provider.search("harbour");

  const p = calls[0].params;
  const expected = createHash("md5").update("sesamec19b2d", "utf8").digest("hex");
  assert.equal(p.get("t"), expected);
  assert.equal(p.get("s"), "c19b2d");
  assert.equal(p.get("u"), "joe");
  assert.equal(p.get("p"), null);
  assert.ok(!calls[0].url.includes("sesame"), "the raw password must not appear in the URL");
});

test("the salt is fresh per request — a replayed pair should not work twice", async () => {
  const { fetchImpl, calls } = fakeServer(searchFor([song()]));
  const provider = new OpenSubsonicProvider({
    url: "https://music.example.test",
    licenceClass: "owned_local",
    username: "joe",
    password: "sesame",
    fetch: fetchImpl
  });
  await provider.search("a");
  await provider.search("b");
  assert.notEqual(calls[0].params.get("s"), calls[1].params.get("s"));
  assert.notEqual(calls[0].params.get("t"), calls[1].params.get("t"));
});

test("an apiKey is sent alone, with no username alongside it", async () => {
  const { fetchImpl, calls } = fakeServer(searchFor([song()]));
  const provider = new OpenSubsonicProvider({
    url: "https://music.example.test",
    licenceClass: "owned_local",
    apiKey: "43504ab8",
    fetch: fetchImpl
  });
  await provider.search("harbour");
  const p = calls[0].params;
  assert.equal(p.get("apiKey"), "43504ab8");
  for (const forbidden of ["u", "p", "t", "s"]) {
    assert.equal(p.get(forbidden), null, `${forbidden} must not accompany an apiKey`);
  }
});

test("every request carries the version, client name and json format", async () => {
  const { provider, calls } = make(searchFor([]));
  await provider.search("x");
  const p = calls[0].params;
  assert.equal(p.get("v"), "1.16.1");
  assert.equal(p.get("c"), "CrowdDeck");
  assert.equal(p.get("f"), "json");
});

test("search asks only for songs, and always sends a query", async () => {
  const { provider, calls } = make(searchFor([]));
  await provider.search("", { limit: 10 });
  const p = calls[0].params;
  assert.equal(p.get("query"), "");
  assert.equal(p.get("songCount"), "10");
  assert.equal(p.get("artistCount"), "0");
  assert.equal(p.get("albumCount"), "0");
});

/* ---------------------------------------------------------------- mapping */

test("a song maps to a track, with seconds converted to milliseconds", async () => {
  const { provider } = make(searchFor([song()]));
  const [t] = await provider.search("harbour");
  assert.equal(t.id, "300");
  assert.equal(t.title, "Harbour Lights");
  assert.equal(t.artist, "Ora Marsh");
  assert.equal(t.duration, 245_000);
  assert.equal(t.playable, true);
});

test("displayArtist wins over artist when the server supplies it", async () => {
  const { provider } = make(
    searchFor([song({ displayArtist: "Ora Marsh feat. Kite", artist: "Ora Marsh" })])
  );
  const [t] = await provider.search("harbour");
  assert.equal(t.artist, "Ora Marsh feat. Kite");
});

test("every track carries the operator's declared licence class", async () => {
  const { provider } = make(searchFor([song()]));
  const [t] = await provider.search("harbour");
  assert.equal(t.licenceClass, "owned_local");
});

test("the licence claim carries who declared it and when — REQ-DAT-8", async () => {
  const { provider } = make(searchFor([song()]));
  const [t] = await provider.search("harbour");
  assert.equal(t.licenceAttestation.declaredBy, "Dana Okoye, venue manager");
  assert.equal(t.licenceAttestation.declaredAt, "2026-02-01T12:00:00.000Z");
  assert.equal(t.licenceAttestation.server, "music.example.test");
  assert.match(t.licenceAttestation.basis, /operator declaration/);
});

test("explicitStatus maps three ways, and absent is not 'clean'", async () => {
  const { provider } = make(
    searchFor([
      song({ id: "1", explicitStatus: "explicit" }),
      song({ id: "2", explicitStatus: "clean" }),
      song({ id: "3" })
    ])
  );
  const [a, b, c] = await provider.search("x");
  assert.equal(a.explicit, true);
  assert.equal(b.explicit, false);
  assert.equal(c.explicit, undefined, "no signal must not be reported as clean");
});

test("videos and directories are filtered out of a music search", async () => {
  const { provider } = make(
    searchFor([song({ id: "1" }), song({ id: "2", isVideo: true }), song({ id: "3", isDir: true })])
  );
  const tracks = await provider.search("x");
  assert.deepEqual(
    tracks.map((t) => t.id),
    ["1"]
  );
});

test("the OpenSubsonic genres array is read when the legacy genre string is absent", async () => {
  const { provider } = make(
    searchFor([song({ genre: undefined, genres: [{ name: "Hip-Hop" }, { name: "East coast" }] })])
  );
  const [t] = await provider.search("x");
  assert.equal(t.genre, "Hip-Hop");
});

/* -------------------------------------------------------------- ReplayGain */

test("ReplayGain feeds the loudness path, so a library normalises on first run", async () => {
  const { provider } = make(
    searchFor([song({ replayGain: { trackGain: -6.2, trackPeak: 0.98, baseGain: 0 } })])
  );
  const [t] = await provider.search("x");
  assert.equal(t.replayGainDb, -6.2);
  assert.equal(t.replayGainPeak, 0.98);

  // The point of the mapping: CON-6 can act on it without an analysis pass.
  const decision = computeGain(t);
  assert.equal(decision.applied, true);
  assert.equal(decision.source, LoudnessSource.TAGS);
});

test("album gain is used when the operator prefers it", async () => {
  const { provider } = make(
    searchFor([
      song({ replayGain: { trackGain: -6.2, albumGain: -4.1, trackPeak: 0.98, albumPeak: 0.99 } })
    ]),
    { providerOpts: { useAlbumGain: true } }
  );
  const [t] = await provider.search("x");
  assert.equal(t.replayGainDb, -4.1);
  assert.equal(t.replayGainPeak, 0.99);
});

test("baseGain is added to the track gain, per the specification", async () => {
  const { provider } = make(
    searchFor([song({ replayGain: { trackGain: -6.0, baseGain: -2.5, trackPeak: 0.9 } })])
  );
  const [t] = await provider.search("x");
  assert.equal(t.replayGainDb, -8.5);
});

test("fallbackGain is used only when there is no real measurement", async () => {
  const { provider } = make(
    searchFor([
      song({ id: "1", replayGain: { fallbackGain: -8.1 } }),
      song({ id: "2", replayGain: { trackGain: -3.0, fallbackGain: -8.1 } })
    ])
  );
  const [a, b] = await provider.search("x");
  assert.equal(a.replayGainDb, -8.1);
  assert.equal(b.replayGainDb, -3.0, "a real measurement must beat the server's estimate");
});

test("a track with no ReplayGain reports no loudness, rather than a guessed one", async () => {
  const { provider } = make(searchFor([song()]));
  const [t] = await provider.search("x");
  assert.equal(t.replayGainDb, undefined);
  assert.equal(computeGain(t).gainDb, 0);
  assert.equal(computeGain(t).applied, false);
});

test("a non-physical peak is dropped instead of becoming -Infinity dB", async () => {
  // A zero peak converts to -Infinity dB, which would clamp every gain to the
  // floor and silence the library. The spec says peaks must be positive.
  const { provider } = make(
    searchFor([song({ replayGain: { trackGain: -6.0, trackPeak: 0 } })])
  );
  const [t] = await provider.search("x");
  assert.equal(t.replayGainPeak, undefined);
  const decision = computeGain(t);
  assert.ok(Number.isFinite(decision.gainDb));
  assert.equal(decision.peakLimited, false);
});

/* ----------------------------------------------------------------- errors */

test("a failure inside a 200 is an error, not an empty library", async () => {
  const { provider } = make({}, { error: { code: 40, message: "Wrong username or password" } });
  await assert.rejects(provider.search("x"), (err) => {
    assert.ok(err instanceof ProviderError);
    assert.equal(err.code, "auth_error");
    assert.match(err.message, /Wrong username or password/);
    return true;
  });
});

test("bad credentials are not retried — they will not fix themselves", async () => {
  const { provider } = make({}, { error: { code: 40, message: "Wrong username or password" } });
  await assert.rejects(provider.search("x"), (err) => err.retryable === false);
});

test("an unreachable server is retryable, and does not quote the URL", async () => {
  const { provider } = make({}, { networkError: "ECONNREFUSED" });
  await assert.rejects(provider.search("x"), (err) => {
    assert.equal(err.code, "network_error");
    assert.equal(err.retryable, true);
    assert.match(err.message, /music\.example\.test/);
    return true;
  });
});

test("no error message ever contains the authentication token", async () => {
  const token = createHash("md5").update("sesamec19b2d", "utf8").digest("hex");
  const cases = [
    { networkError: "ECONNREFUSED" },
    { httpStatus: 502 },
    { notJson: true },
    { error: { code: 40, message: "Wrong username or password" } }
  ];
  for (const opts of cases) {
    const { provider } = make({}, opts);
    const err = await provider.search("x").then(
      () => null,
      (e) => e
    );
    assert.ok(err, `${JSON.stringify(opts)} should have thrown`);
    const text = `${err.message} ${err.stack}`;
    assert.ok(!text.includes(token), `token leaked into an error for ${JSON.stringify(opts)}`);
    assert.ok(!text.includes("sesame"), `password leaked into an error for ${JSON.stringify(opts)}`);
    assert.ok(!text.includes("c19b2d"), `salt leaked into an error for ${JSON.stringify(opts)}`);
  }
});

test("an HTML login page from a reverse proxy is diagnosed, not swallowed", async () => {
  const { provider } = make({}, { notJson: true });
  await assert.rejects(provider.search("x"), (err) => {
    assert.equal(err.code, "bad_response");
    assert.match(err.message, /not JSON/);
    return true;
  });
});

test("JSON without the subsonic envelope is rejected", async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ hello: "world" }) });
  const provider = new OpenSubsonicProvider({
    url: "https://music.example.test",
    licenceClass: "owned_local",
    apiKey: "k",
    fetch: fetchImpl
  });
  await assert.rejects(provider.search("x"), /no subsonic-response envelope/);
});

test("a 5xx is retryable and a 4xx is not", async () => {
  const a = make({}, { httpStatus: 503 });
  await assert.rejects(a.provider.search("x"), (err) => err.retryable === true);
  const b = make({}, { httpStatus: 404 });
  await assert.rejects(b.provider.search("x"), (err) => err.retryable === false);
});

/* -------------------------------------------------------- resolve / stream */

test("a deleted track resolves to null rather than throwing", async () => {
  const { provider } = make({}, { error: { code: 70, message: "Song not found" } });
  assert.equal(await provider.resolve("300"), null);
});

test("a stream url is playable, authenticated and asks for no transcode", async () => {
  const { provider } = make({ getSong: { song: song() } });
  const url = new URL(await provider.streamUrl("300"));
  assert.equal(url.pathname, "/rest/stream");
  assert.equal(url.searchParams.get("id"), "300");
  assert.equal(url.searchParams.get("format"), "raw");
  assert.ok(url.searchParams.get("t"), "the engine cannot fetch it without credentials");
});

test("stream urls are minted fresh, never reused from a cache", async () => {
  const { fetchImpl } = fakeServer({ getSong: { song: song() } });
  const provider = new OpenSubsonicProvider({
    url: "https://music.example.test",
    licenceClass: "owned_local",
    username: "joe",
    password: "sesame",
    fetch: fetchImpl
  });
  const first = new URL(await provider.streamUrl("300"));
  const second = new URL(await provider.streamUrl("300"));
  assert.notEqual(first.searchParams.get("s"), second.searchParams.get("s"));
});

test("streaming a track that is gone is a not_found, not a broken url", async () => {
  const { provider } = make({}, { error: { code: 70, message: "Song not found" } });
  await assert.rejects(provider.streamUrl("300"), (err) => err.code === "not_found");
});

test("licenceClass() returns the declaration, and resolve is cached", async () => {
  const { provider, calls } = make({ getSong: { song: song() } });
  assert.equal(await provider.licenceClass("300"), "owned_local");
  assert.equal(await provider.licenceClass("300"), "owned_local");
  assert.equal(calls.length, 1, "the second lookup should come from the cache");
});

/* ------------------------------------------------------------------ health */

test("ping backs the health check, and identifies the server", async () => {
  const { provider, calls } = make({ ping: {} });
  assert.equal(await provider.healthy(), true);
  assert.equal(calls[0].method, "ping");
  assert.equal(provider.serverType, "navidrome");
  assert.equal(provider.openSubsonic, true);
});

test("an unhealthy server reports false rather than throwing at the console", async () => {
  const { provider } = make({}, { networkError: "ECONNREFUSED" });
  assert.equal(await provider.healthy(), false);
});
