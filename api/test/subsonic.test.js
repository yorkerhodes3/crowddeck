// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The OpenSubsonic surface — API-2, REQ-API-10 … REQ-API-12.
 *
 * Driven over a real socket with real HTTP, because the whole value of this story
 * is that *other people's clients* work against it. A test that called the handler
 * directly would prove the branching and none of the protocol: not the `.view`
 * suffix every client sends, not query-string auth, not that a failure still
 * arrives as HTTP 200.
 *
 * Response shapes are checked against the published specification — the
 * `subsonic-response` envelope, the numbered error codes, `jukeboxStatus` and
 * `jukeboxPlaylist`, and the `OpenSubsonicExtension` `{name, versions}` shape.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { Scheduler, Mode } from "../../core/src/scheduler.js";
import { VenueApi } from "../src/server.js";
import { DemoCatalog } from "../src/demo-catalog.js";
import { SubsonicSurface, MEDIA_TYPES_EXTENSION, SubsonicError } from "../src/subsonic.js";
import { InstrumentSource } from "../../interconnect/src/instrument.js";

const VENUE = "test-venue";
const STAFF_KEY = "test-staff-key";
const SUB_PASSWORD = "jukebox-password";
const SUB_API_KEY = "sub-api-key-0001";

async function boot(t, opts = {}) {
  const catalog = new DemoCatalog();
  const scheduler = new Scheduler({ venueId: VENUE, mode: Mode.ATTENDED });
  const api = new VenueApi({
    scheduler,
    catalog,
    venueId: VENUE,
    venueName: "Test Venue",
    staffKey: STAFF_KEY,
    // A venue that holds a PRO licence, so the demo catalogue is playable and the
    // tests exercise the jukebox rather than the policy gate.
    assumeProLicence: true,
    subsonic: { password: SUB_PASSWORD, apiKey: SUB_API_KEY, ...(opts.subsonic ?? {}) },
    ...opts.api
  });
  await api.listen(0);
  t.after(() => api.close());

  const auth = () => {
    const salt = "abc123def";
    return `u=joe&s=${salt}&t=${createHash("md5").update(`${SUB_PASSWORD}${salt}`, "utf8").digest("hex")}`;
  };

  /** @returns {Promise<{status: number, env: any, res: Response}>} */
  const rest = async (method, params = "", { withAuth = true } = {}) => {
    const qs = [withAuth ? auth() : "", "v=1.16.1", "c=TestClient", "f=json", params]
      .filter(Boolean)
      .join("&");
    const res = await fetch(`${api.url}/rest/${method}?${qs}`);
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("json")) return { status: res.status, env: null, res };
    const body = await res.json();
    return { status: res.status, env: body["subsonic-response"], res };
  };

  return { api, scheduler, catalog, rest, auth };
}

/* -------------------------------------------------------------- the basics */

test("ping answers with a well-formed OpenSubsonic envelope", async (t) => {
  const { rest } = await boot(t);
  const { status, env } = await rest("ping");
  assert.equal(status, 200);
  assert.equal(env.status, "ok");
  assert.equal(env.version, "1.16.1");
  assert.equal(env.openSubsonic, true);
  assert.ok(env.type, "clients show the server type");
});

test("the .view suffix every client still sends is accepted", async (t) => {
  const { rest } = await boot(t);
  assert.equal((await rest("ping.view")).env.status, "ok");
});

test("a failure is HTTP 200 with the error inside — not a 401", async (t) => {
  const { api } = await boot(t);
  const res = await fetch(`${api.url}/rest/ping?u=joe&p=wrong&v=1.16.1&c=T&f=json`);
  // A Subsonic client reads the envelope, not the status line. Returning 401 here
  // would make every client report "server unreachable" instead of "bad password".
  assert.equal(res.status, 200);
  const env = (await res.json())["subsonic-response"];
  assert.equal(env.status, "failed");
  assert.equal(env.error.code, SubsonicError.WRONG_CREDENTIALS);
});

test("getLicense is about the server software, never about music rights", async (t) => {
  const { rest } = await boot(t);
  const { env } = await rest("getLicense");
  assert.equal(env.license.valid, true);
  // Conflating this with music licensing would be genuinely dangerous, so the
  // envelope carries nothing that could be read as a performance right.
  assert.equal(env.license.licenceClass, undefined);
});

/* ------------------------------------------------------------------- auth */

test("token auth works, and the password never appears in the request", async (t) => {
  const { rest, auth } = await boot(t);
  assert.equal((await rest("ping")).env.status, "ok");
  assert.ok(!auth().includes(SUB_PASSWORD));
});

test("plaintext and hex-encoded passwords are both accepted", async (t) => {
  const { rest } = await boot(t);
  const plain = await rest("ping", `u=joe&p=${SUB_PASSWORD}`, { withAuth: false });
  assert.equal(plain.env.status, "ok");
  const enc = Buffer.from(SUB_PASSWORD, "utf8").toString("hex");
  const hex = await rest("ping", `u=joe&p=enc:${enc}`, { withAuth: false });
  assert.equal(hex.env.status, "ok");
});

test("an api key is accepted, and a wrong one is code 44", async (t) => {
  const { rest } = await boot(t);
  assert.equal((await rest("ping", `apiKey=${SUB_API_KEY}`, { withAuth: false })).env.status, "ok");
  const bad = await rest("ping", "apiKey=nope", { withAuth: false });
  assert.equal(bad.env.error.code, SubsonicError.INVALID_API_KEY);
});

test("conflicting auth mechanisms are refused with code 43, as the spec requires", async (t) => {
  const { rest } = await boot(t);
  const { env } = await rest("ping", `apiKey=${SUB_API_KEY}&u=joe&p=x`, { withAuth: false });
  assert.equal(env.error.code, SubsonicError.CONFLICTING_AUTH);
});

test("a half-supplied token is a missing-parameter error, not a wrong password", async (t) => {
  const { rest } = await boot(t);
  const { env } = await rest("ping", "u=joe&t=abc", { withAuth: false });
  assert.equal(env.error.code, SubsonicError.MISSING_PARAMETER);
});

test("the surface is absent unless an operator configures a credential — REQ-API-12", async (t) => {
  const { api } = await boot(t, { subsonic: { password: null, apiKey: null } });
  const res = await fetch(`${api.url}/rest/ping?u=joe&p=x&v=1.16.1&c=T&f=json`);
  // 404, not 403: an unconfigured appliance should not confirm to a scanner that
  // there is a Subsonic surface here at all.
  assert.equal(res.status, 404);
});

test("the Subsonic credential may not be the staff key", async () => {
  assert.throws(
    () => new SubsonicSurface({ scheduler: {}, staffKey: "k", password: "k" }),
    /must not be the staff key/
  );
  assert.throws(
    () => new SubsonicSurface({ scheduler: {}, staffKey: "k", apiKey: "k" }),
    /must not be the staff key/
  );
});

/* -------------------------------------------------------------- extensions */

test("getOpenSubsonicExtensions is public, as the specification demands", async (t) => {
  const { rest } = await boot(t);
  // Explicitly exempt from auth: a client must be able to discover extensions
  // before it knows how to authenticate.
  const { env } = await rest("getOpenSubsonicExtensions", "", { withAuth: false });
  assert.equal(env.status, "ok");
  for (const ext of env.openSubsonicExtensions) {
    assert.equal(typeof ext.name, "string");
    assert.ok(Array.isArray(ext.versions), "the shape is {name, versions[]}");
  }
});

test("our media-type extension is namespaced, and never claims to be a standard one", async (t) => {
  const { rest } = await boot(t);
  const { env } = await rest("getOpenSubsonicExtensions", "", { withAuth: false });
  const names = env.openSubsonicExtensions.map((e) => e.name);

  assert.ok(names.includes(MEDIA_TYPES_EXTENSION));
  assert.match(MEDIA_TYPES_EXTENSION, /^crowddeck\./, "ours must be unmistakably ours");

  // REQ-API-11 originally named `jukeboxMediaTypes`. No such extension exists in
  // the OpenSubsonic registry; the name came from unverified research. Advertising
  // it would be claiming to implement a standard that was never written.
  assert.ok(!names.includes("jukeboxMediaTypes"));

  // Everything not namespaced must be a real, published extension name.
  const PUBLISHED = new Set([
    "transcodeOffset", "apiKeyAuthentication", "formPost", "getPodcastEpisode",
    "indexBasedQueue", "playbackReport", "songLyrics", "sonicSimilarity",
    "topSongsByArtistId", "transcoding"
  ]);
  for (const name of names) {
    if (name.startsWith("crowddeck.")) continue;
    assert.ok(PUBLISHED.has(name), `"${name}" is not a published OpenSubsonic extension`);
  }
});

/* ---------------------------------------------------------------- browsing */

test("search3 returns songs a Subsonic client can render", async (t) => {
  const { rest } = await boot(t);
  const { env } = await rest("search3", "query=Neon&songCount=10");
  const songs = env.searchResult3.song;
  assert.ok(songs.length >= 1);
  const song = songs[0];
  assert.equal(song.isDir, false);
  assert.equal(song.isVideo, false);
  assert.equal(typeof song.title, "string");
  // 212 seconds, converted from the 212,000 ms a track carries.
  assert.equal(song.duration, 212);
});

test("search3 without a query is a missing-parameter error", async (t) => {
  const { rest } = await boot(t);
  assert.equal((await rest("search3")).env.error.code, SubsonicError.MISSING_PARAMETER);
});

test("an empty album list is returned honestly rather than fabricated", async (t) => {
  const { rest } = await boot(t);
  const { env } = await rest("getAlbumList2");
  assert.deepEqual(env.albumList2.album, []);
});

test("an unimplemented method says so instead of pretending to work", async (t) => {
  const { rest } = await boot(t);
  const { env } = await rest("getPodcasts");
  assert.equal(env.status, "failed");
  assert.equal(env.error.code, SubsonicError.NOT_FOUND);
});

test("a client asking for XML is told plainly, not handed mislabelled JSON", async (t) => {
  const { api, auth } = await boot(t);
  const res = await fetch(`${api.url}/rest/ping?${auth()}&v=1.16.1&c=T&f=xml`);
  const env = (await res.json())["subsonic-response"];
  assert.equal(env.status, "failed");
  assert.match(env.error.message, /JSON only/);
});

/* ---------------------------------------------------------- jukeboxControl */

test("jukeboxControl status has every field a client reads", async (t) => {
  const { rest } = await boot(t);
  const { env } = await rest("jukeboxControl", "action=status");
  const s = env.jukeboxStatus;
  assert.equal(typeof s.currentIndex, "number");
  assert.equal(typeof s.playing, "boolean");
  assert.equal(typeof s.gain, "number");
  assert.equal(typeof s.position, "number");
});

test("add puts a track in the real queue, not a private one", async (t) => {
  const { rest, scheduler } = await boot(t);
  const { env } = await rest("jukeboxControl", "action=add&id=cc-001");
  assert.equal(env.status, "ok");
  // The point: it went through the Unified Scheduler, so fairness and policy saw
  // it and every other client can see it too.
  assert.equal(scheduler.ordered().length, 1);
});

test("add takes multiple ids in one request, as the spec allows", async (t) => {
  const { rest, scheduler } = await boot(t);
  await rest("jukeboxControl", "action=add&id=cc-001&id=cc-002&id=cc-003");
  assert.equal(scheduler.ordered().length, 3);
});

test("a track policy refuses is reported, not silently dropped", async (t) => {
  const { rest, scheduler } = await boot(t);
  // `nc-001` is non-commercial: a commercial venue may not perform it.
  const { env } = await rest("jukeboxControl", "action=add&id=nc-001");
  assert.equal(env.status, "failed");
  assert.equal(env.error.code, SubsonicError.NOT_AUTHORIZED);
  assert.equal(scheduler.ordered().length, 0);
});

test("adding a track that does not exist is a not-found", async (t) => {
  const { rest } = await boot(t);
  const { env } = await rest("jukeboxControl", "action=add&id=no-such-track");
  assert.equal(env.error.code, SubsonicError.NOT_FOUND);
});

test("get returns the scheduler's real order, not the order things were added", async (t) => {
  const { rest, scheduler } = await boot(t);
  await rest("jukeboxControl", "action=add&id=cc-001&id=cc-002");

  const { env } = await rest("jukeboxControl", "action=get");
  const entries = env.jukeboxPlaylist.entry;
  assert.equal(entries.length, 2);

  const scheduled = scheduler.ordered().map((o) => scheduler.entries.get(o.id).track.id);
  assert.deepEqual(entries.map((e) => e.id), scheduled, "the client is told the truth");
});

test("remove takes an entry out at the index the client last saw", async (t) => {
  const { rest, scheduler } = await boot(t);
  await rest("jukeboxControl", "action=add&id=cc-001&id=cc-002");
  const before = (await rest("jukeboxControl", "action=get")).env.jukeboxPlaylist.entry;

  await rest("jukeboxControl", "action=remove&index=0");

  const after = scheduler.ordered().map((o) => scheduler.entries.get(o.id).track.id);
  assert.equal(after.length, 1);
  assert.ok(!after.includes(before[0].id));
});

test("remove past the end is a not-found, not a silent success", async (t) => {
  const { rest } = await boot(t);
  await rest("jukeboxControl", "action=add&id=cc-001");
  const { env } = await rest("jukeboxControl", "action=remove&index=9");
  assert.equal(env.error.code, SubsonicError.NOT_FOUND);
});

test("clear empties the queue", async (t) => {
  const { rest, scheduler } = await boot(t);
  await rest("jukeboxControl", "action=add&id=cc-001&id=cc-002");
  await rest("jukeboxControl", "action=clear");
  assert.equal(scheduler.ordered().length, 0);
});

test("set replaces the queue", async (t) => {
  const { rest, scheduler } = await boot(t);
  await rest("jukeboxControl", "action=add&id=cc-001&id=cc-002");
  await rest("jukeboxControl", "action=set&id=cc-005");
  const ids = scheduler.ordered().map((o) => scheduler.entries.get(o.id).track.id);
  assert.deepEqual(ids, ["cc-005"]);
});

test("shuffle does not randomise away a paid boost or someone's place in line", async (t) => {
  const { rest, scheduler } = await boot(t);
  await rest("jukeboxControl", "action=add&id=cc-001&id=cc-002&id=cc-003");
  const before = scheduler.ordered().map((o) => o.id);

  const { env } = await rest("jukeboxControl", "action=shuffle");

  // Reported as success — the client asked for something reasonable — but the
  // order the fairness rules produced is left alone. Honouring it literally would
  // let one client undo every patron's position and any boost they paid for.
  assert.equal(env.status, "ok");
  assert.deepEqual(scheduler.ordered().map((o) => o.id), before);
});

test("setGain accepts 0..1 and rejects anything else", async (t) => {
  const { rest } = await boot(t);
  const ok = await rest("jukeboxControl", "action=setGain&gain=0.6");
  assert.equal(ok.env.jukeboxStatus.gain, 0.6);
  // Subsonic's 0..1 gain is exactly CDEP parameter space (REQ-CDEP-12a), which is
  // why this works without knowing the engine's dB range.
  assert.equal((await rest("jukeboxControl", "action=setGain&gain=1.4")).env.status, "failed");
  assert.equal((await rest("jukeboxControl", "action=setGain&gain=-1")).env.status, "failed");
});

test("an unknown or missing action is refused", async (t) => {
  const { rest } = await boot(t);
  assert.equal((await rest("jukeboxControl")).env.error.code, SubsonicError.MISSING_PARAMETER);
  assert.equal((await rest("jukeboxControl", "action=explode")).env.status, "failed");
});

/* -------------------------------------------------- REQ-API-11a: media types */

test("a live instrument appears in the jukebox as a valid Child — REQ-API-11a", async (t) => {
  const { rest, scheduler } = await boot(t);
  const inst = new InstrumentSource({
    portIdentity: "usb:rhodes",
    name: "Rhodes solo",
    performer: "Dana",
    durationSec: 300
  });
  const result = scheduler.request({
    track: inst.toTrack(),
    patronId: "staff",
    context: { venueMinuteOfDay: 720, nowMs: Date.now(), holdsPro: true }
  });
  assert.equal(result.ok, true, result.detail ?? "");

  const { env } = await rest("jukeboxControl", "action=get");
  const entry = env.jukeboxPlaylist.entry.find((e) => e.id === inst.toTrack().id);
  assert.ok(entry, "a live instrument must appear in the queue a client sees");

  // A stock client must be able to render it: the mandatory Child fields are all
  // present and sane. This is the requirement — an entry it cannot understand
  // must still not break it.
  assert.equal(entry.isDir, false);
  assert.equal(entry.isVideo, false);
  assert.equal(typeof entry.title, "string");
  assert.equal(entry.duration, 300);

  // A live performance is not a file. Claiming a suffix would invite a client to
  // stream it, and it would be right to expect that to work.
  assert.equal(entry.suffix, undefined);
  assert.equal(entry.contentType, undefined);

  const ext = entry[MEDIA_TYPES_EXTENSION];
  assert.equal(ext.mediaType, "live-instrument");
  assert.equal(ext.streamable, false);
});

test("a recording is labelled as one, with its licence class carried through", async (t) => {
  const { rest } = await boot(t);
  await rest("jukeboxControl", "action=add&id=cc-001");
  const { env } = await rest("jukeboxControl", "action=get");
  const ext = env.jukeboxPlaylist.entry[0][MEDIA_TYPES_EXTENSION];
  assert.equal(ext.mediaType, "recording");
  assert.equal(ext.streamable, true);
  assert.equal(ext.licenceClass, "cc_attribution");
});

/* ------------------------------------------------------------------ stream */

test("stream serves audio when a resolver is configured", async (t) => {
  const audio = Buffer.from("ID3 pretend-mp3-bytes");
  const { api, auth } = await boot(t, {
    subsonic: { streamResolver: async () => ({ body: audio, contentType: "audio/mpeg" }) }
  });
  const res = await fetch(`${api.url}/rest/stream?${auth()}&v=1.16.1&c=T&f=json&id=cc-001`);
  assert.equal(res.headers.get("content-type"), "audio/mpeg");
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), audio);
});

test("with no resolver, stream explains itself rather than returning silence", async (t) => {
  const { rest } = await boot(t);
  const { env } = await rest("stream", "id=cc-001");
  assert.equal(env.error.code, SubsonicError.NOT_FOUND);
  assert.match(env.error.message, /own hardware/);
});

/* ---------------------------------------------------------------- formPost */

test("the formPost extension works, and is only advertised because it does", async (t) => {
  const { api, rest, scheduler } = await boot(t);
  const { env } = await rest("getOpenSubsonicExtensions", "", { withAuth: false });
  assert.ok(env.openSubsonicExtensions.some((e) => e.name === "formPost"));

  const salt = "zzz999";
  const body = new URLSearchParams({
    u: "joe",
    s: salt,
    t: createHash("md5").update(`${SUB_PASSWORD}${salt}`, "utf8").digest("hex"),
    v: "1.16.1",
    c: "TestClient",
    f: "json",
    action: "add",
    id: "cc-001"
  });
  const res = await fetch(`${api.url}/rest/jukeboxControl`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  assert.equal((await res.json())["subsonic-response"].status, "ok");
  assert.equal(scheduler.ordered().length, 1);
});

/* -------------------------------------------------- the two surfaces coexist */

test("mounting Subsonic does not disturb the venue API", async (t) => {
  const { api } = await boot(t);
  const health = await fetch(`${api.url}/v1/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);

  // And a genuinely unknown path is still a proper 404 with a status code, not a
  // Subsonic envelope — the two error models must not bleed into each other.
  const missing = await fetch(`${api.url}/v1/nope`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error, "not_found");
});
