// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Venue API tests — SPECIFICATION §5.
 *
 * Driven over real HTTP and a real WebSocket, so they cover routing, auth,
 * policy scoping and live push together rather than in isolation.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { Scheduler, Mode } from "../../core/src/scheduler.js";
import { VenueApi } from "../src/server.js";
import { DemoCatalog } from "../src/demo-catalog.js";
import { WebSocketConnection, acceptKey } from "../src/ws.js";
import crypto from "node:crypto";
import net from "node:net";

const STAFF_KEY = "test-staff-key";
const VENUE = "test-venue";

async function boot(opts = {}) {
  const catalog = new DemoCatalog();
  const scheduler = new Scheduler({
    venueId: VENUE,
    mode: Mode.ATTENDED, // keeps tests deterministic: nothing auto-promotes
    ...opts.scheduler
  });
  const api = new VenueApi({
    scheduler,
    catalog,
    venueId: VENUE,
    venueName: "Test Venue",
    staffKey: STAFF_KEY
  });
  await api.listen(0);

  const base = `${api.url}/v1/venues/${VENUE}`;

  const call = async (method, path, { body, token, staff } = {}) => {
    const headers = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    if (staff) headers["x-staff-key"] = STAFF_KEY;
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: res.status, body: await res.json() };
  };

  const join = async () => (await call("POST", "/join", { body: {} })).body;

  return { api, scheduler, catalog, base, call, join, stop: () => api.close() };
}

/* ------------------------------------------------------------ discovery */

test("health and venue metadata are public", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const health = await fetch(`${h.api.url}/v1/health`);
  assert.equal(health.status, 200);

  const venue = await h.call("GET", "");
  assert.equal(venue.status, 200);
  assert.equal(venue.body.id, VENUE);
  assert.equal(venue.body.mode, Mode.ATTENDED);
});

test("a token issued for one venue does not work at another", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const { token } = await h.join();
  const res = await fetch(`${h.api.url}/v1/venues/some-other-venue/queue`, {
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 404, "this appliance serves exactly one venue — ADR-004");
});

/* ---------------------------------------------------------------- patron */

test("joining returns an opaque token and no personal data — REQ-NFR-7", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const session = await h.join();
  assert.ok(session.token.length > 20);
  assert.match(session.patronId, /^p_/);
  assert.notEqual(session.patronId, session.token, "the id must not be the credential");
});

test("search is scoped by venue policy — AC-7, REQ-POL-2", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const { body } = await h.call("GET", "/search?q=");
  const ids = body.results.map((r) => r.id);

  assert.ok(ids.includes("cc-001"), "compliant tracks are offered");
  assert.ok(!ids.includes("exp-001"), "explicit content is not offered");
  assert.ok(!ids.includes("nc-001"), "non-commercial CC is not offered in a commercial venue");
  assert.ok(!ids.includes("unk-001"), "unknown provenance is not offered");
});

test("requesting requires a session", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const res = await h.call("POST", "/queue", { body: { trackId: "cc-001" } });
  assert.equal(res.status, 401);
  assert.equal(res.body.error, "no_session");
});

test("a request enters the queue with a position — AC-4", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const { token } = await h.join();
  const res = await h.call("POST", "/queue", { body: { trackId: "cc-001" }, token });
  assert.equal(res.status, 200);
  assert.equal(res.body.position, 1);
  assert.equal(res.body.entry.track.id, "cc-001");
  assert.equal(res.body.entry.state, "staged", "it lands in the staging lane, not on air");
});

test("a refused request explains itself with a machine-readable reason", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const { token } = await h.join();
  await h.call("POST", "/queue", { body: { trackId: "cc-001" }, token });
  await h.call("POST", "/queue", { body: { trackId: "cc-003" }, token });
  const third = await h.call("POST", "/queue", { body: { trackId: "cc-005" }, token });

  assert.equal(third.status, 409);
  assert.equal(third.body.error, "patron_limit");
  assert.ok(third.body.message.length > 0);
});

test("an unknown track is a 404, a missing trackId a 400", async (t) => {
  const h = await boot();
  t.after(() => h.stop());
  const { token } = await h.join();

  assert.equal((await h.call("POST", "/queue", { body: { trackId: "nope" }, token })).status, 404);
  assert.equal((await h.call("POST", "/queue", { body: {}, token })).status, 400);
});

test("voting is one per patron per entry — REQ-SCH-17", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const a = await h.join();
  const b = await h.join();
  const req = await h.call("POST", "/queue", { body: { trackId: "cc-001" }, token: a.token });
  const entryId = req.body.entry.id;

  const first = await h.call("POST", `/queue/${entryId}/votes`, { token: b.token });
  assert.equal(first.status, 200);
  assert.equal(first.body.votes, 1);

  const second = await h.call("POST", `/queue/${entryId}/votes`, { token: b.token });
  assert.equal(second.status, 409);
  assert.equal(second.body.error, "duplicate_vote");
});

test("votes change position in line", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const a = await h.join();
  const b = await h.join();
  const c = await h.join();

  const first = await h.call("POST", "/queue", { body: { trackId: "cc-001" }, token: a.token });
  const second = await h.call("POST", "/queue", { body: { trackId: "cc-003" }, token: b.token });
  assert.equal(second.body.position, 2);

  const voted = await h.call("POST", `/queue/${second.body.entry.id}/votes`, { token: c.token });
  assert.equal(voted.body.position, 1, "a vote moves it up the queue");

  const queue = await h.call("GET", "/queue");
  assert.equal(queue.body.queue[0].id, second.body.entry.id);
  assert.equal(queue.body.queue[1].id, first.body.entry.id);
});

test("/me lists only this patron's requests", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const a = await h.join();
  const b = await h.join();
  await h.call("POST", "/queue", { body: { trackId: "cc-001" }, token: a.token });
  await h.call("POST", "/queue", { body: { trackId: "cc-003" }, token: b.token });

  const mine = await h.call("GET", "/me", { token: a.token });
  assert.equal(mine.body.requests.length, 1);
  assert.equal(mine.body.requests[0].track.id, "cc-001");
});

/* ----------------------------------------------------------------- staff */

test("staff endpoints reject patron credentials — REQ-NFR-8", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const { token } = await h.join();
  const res = await h.call("GET", "/staging", { token });
  assert.equal(res.status, 401);
  assert.equal(res.body.error, "not_staff");
});

test("a DJ promotes from the staging lane — AC-1", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const { token } = await h.join();
  const req = await h.call("POST", "/queue", { body: { trackId: "cc-001" }, token });
  const entryId = req.body.entry.id;

  const staging = await h.call("GET", "/staging", { staff: true });
  assert.equal(staging.body.staging.length, 1);

  const promoted = await h.call("POST", `/staging/${entryId}/promote`, { staff: true });
  assert.equal(promoted.status, 200);
  assert.equal(promoted.body.entry.state, "cued");
});

test("staff can pin, reject and change mode", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const { token } = await h.join();
  const first = await h.call("POST", "/queue", { body: { trackId: "cc-001" }, token });
  const id = first.body.entry.id;

  const pinned = await h.call("POST", `/queue/${id}/pin`, { staff: true, body: {} });
  assert.equal(pinned.body.entry.staffPinned, true);

  const rejected = await h.call("POST", `/staging/${id}/reject`, {
    staff: true,
    body: { reason: "nope" }
  });
  assert.equal(rejected.body.entry.state, "rejected");

  const mode = await h.call("POST", "/mode", { staff: true, body: { mode: "autonomous" } });
  assert.equal(mode.body.mode, "autonomous");
});

test("a cued entry cannot be rejected, only skipped", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const { token } = await h.join();
  const req = await h.call("POST", "/queue", { body: { trackId: "cc-001" }, token });
  const id = req.body.entry.id;

  await h.call("POST", `/staging/${id}/promote`, { staff: true });

  // Rejection is a staging-lane action. Once cued, the correct verb is skip —
  // the state machine refuses the wrong one rather than quietly allowing it.
  const rejected = await h.call("POST", `/staging/${id}/reject`, { staff: true, body: {} });
  assert.equal(rejected.status, 500, "an illegal transition must not silently succeed");

  const skipped = await h.call("POST", `/queue/${id}/skip`, { staff: true, body: {} });
  assert.equal(skipped.status, 200);
  assert.equal(skipped.body.entry.state, "skipped");
});

test("an invalid mode is refused", async (t) => {
  const h = await boot();
  t.after(() => h.stop());
  const res = await h.call("POST", "/mode", { staff: true, body: { mode: "disco" } });
  assert.equal(res.status, 400);
});

test("the play log exports as CSV — REQ-DAT-13", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  h.scheduler.recentPlays.push({ trackId: "cc-001", artist: "Wavelet", endedAt: Date.now() });
  const res = await h.call("GET", "/play-log.csv", { staff: true });
  assert.equal(res.status, 200);
  assert.match(res.body.csv, /track_id,artist,ended_at/);
  assert.match(res.body.csv, /cc-001/);
});

/* ------------------------------------------------------------- websocket */

/** Minimal browser-style WebSocket client, so we test our server for real. */
async function connectWs(api, venueId, token) {
  const url = new URL(api.url);
  const socket = net.createConnection({ host: url.hostname, port: Number(url.port) });
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });

  const key = crypto.randomBytes(16).toString("base64");
  const path = `/v1/venues/${venueId}/events` + (token ? `?token=${token}` : "");
  socket.write(
    `GET ${path} HTTP/1.1\r\n` +
      `Host: ${url.host}\r\n` +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Key: ${key}\r\n` +
      "Sec-WebSocket-Version: 13\r\n\r\n"
  );

  const head = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("no handshake response")), 3000);
    socket.once("data", (d) => {
      clearTimeout(timer);
      resolve(d);
    });
  });

  // The server may pack the 101 response and the first frame into one TCP
  // segment. Consuming the whole chunk would silently swallow that frame, so
  // split at the header boundary and push the remainder back for the decoder.
  const sep = head.indexOf("\r\n\r\n");
  assert.ok(sep !== -1, "handshake response should contain a header terminator");
  const headText = head.subarray(0, sep + 4).toString("utf8");
  const leftover = head.subarray(sep + 4);

  assert.match(headText, /HTTP\/1\.1 101/);
  assert.ok(headText.includes(acceptKey(key)), "handshake accept value must be correct");

  if (leftover.length > 0) socket.unshift(leftover);

  const messages = [];
  const conn = new WebSocketConnection(socket, { role: "client" });
  conn.on("message", (m) => messages.push(JSON.parse(m)));

  return {
    messages,
    close: () => socket.destroy(),
    waitFor: async (predicate, timeoutMs = 3000) => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const hit = messages.find(predicate);
        if (hit) return hit;
        await new Promise((r) => setTimeout(r, 20));
      }
      return null;
    }
  };
}

test("a websocket client receives current state on connect", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const ws = await connectWs(h.api, VENUE);
  t.after(() => ws.close());

  const hello = await ws.waitFor((m) => m.type === "hello");
  assert.ok(hello, "expected an immediate hello so a client never renders empty");
  assert.equal(hello.venue.id, VENUE);
  assert.ok(Array.isArray(hello.queue));
});

test("queue changes are pushed live — REQ-SCH-12, AC-4", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const ws = await connectWs(h.api, VENUE);
  t.after(() => ws.close());
  await ws.waitFor((m) => m.type === "hello");

  const { token } = await h.join();
  await h.call("POST", "/queue", { body: { trackId: "cc-001" }, token });

  const update = await ws.waitFor((m) => m.type === "queue" && m.queue.length === 1);
  assert.ok(update, "the queue update should arrive without polling");
  assert.equal(update.queue[0].track.id, "cc-001");
  assert.equal(update.queue[0].position, 1);
});

test("the events socket is rejected on a wrong path", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const url = new URL(h.api.url);
  const socket = net.createConnection({ host: url.hostname, port: Number(url.port) });
  await new Promise((r) => socket.once("connect", r));
  socket.write(
    "GET /v1/venues/wrong/events HTTP/1.1\r\n" +
      `Host: ${url.host}\r\n` +
      "Upgrade: websocket\r\nConnection: Upgrade\r\n" +
      `Sec-WebSocket-Key: ${crypto.randomBytes(16).toString("base64")}\r\n` +
      "Sec-WebSocket-Version: 13\r\n\r\n"
  );
  const head = await new Promise((resolve) => socket.once("data", (d) => resolve(d.toString())));
  socket.destroy();
  assert.match(head, /404/);
});

test("an unknown route is a clean 404", async (t) => {
  const h = await boot();
  t.after(() => h.stop());
  const res = await h.call("GET", "/nope");
  assert.equal(res.status, 404);
  assert.equal(res.body.error, "not_found");
});
