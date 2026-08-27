// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Stub engine integration tests, driven over a real socket.
 *
 * These exercise the same path a real client uses, so they cover framing,
 * handshake, dispatch and the engine model together.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { CdepClient, ErrorCode, PROTOCOL_VERSION } from "../../protocol/src/index.js";
import { startEngine, waitFor } from "./helpers.js";

test("handshake returns a welcome describing the engine", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  assert.equal(h.client.welcome.protocol, PROTOCOL_VERSION);
  assert.match(h.client.welcome.engine, /^crowddeck-engine-stub\//);
  assert.equal(h.client.welcome.decks, 4);
  assert.equal(h.client.welcome.sample_rate, 48000);
  assert.ok(Array.isArray(h.client.welcome.capabilities), "capabilities advertised — REQ-CDEP-11");
});

test("describe returns descriptors rich enough to build a UI — REQ-CDEP-12/13", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const controls = await h.client.describe();
  assert.ok(controls.length > 40, `expected a full control set, got ${controls.length}`);

  for (const c of controls) {
    assert.equal(typeof c.group, "string");
    assert.equal(typeof c.item, "string");
    assert.ok(["bool", "int", "float", "enum"].includes(c.type), `bad type ${c.type}`);
    assert.equal(typeof c.min, "number");
    assert.equal(typeof c.max, "number");
    assert.equal(typeof c.default, "number");
    assert.equal(typeof c.readonly, "boolean");
    assert.ok(c.label.length > 0, `${c.group}/${c.item} needs a label`);
  }

  // The §2.10 minimum set must be present.
  const has = (g, i) => controls.some((c) => c.group === g && c.item === i);
  for (const item of ["play", "rate", "bpm", "keylock", "volume", "playposition", "sync_leader"]) {
    assert.ok(has("[Channel1]", item), `missing [Channel1]/${item}`);
  }
  for (const item of ["crossfader", "gain", "mode", "num_decks"]) {
    assert.ok(has("[Master]", item), `missing [Master]/${item}`);
  }

  // An enum must publish its members or a UI cannot render it.
  const mode = controls.find((c) => c.group === "[Master]" && c.item === "mode");
  assert.deepEqual(mode.values, ["autonomous", "attended"]);
});

test("get and set round-trip a control", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  assert.equal(await h.client.get("[Master]", "crossfader"), 0);
  await h.client.set("[Master]", "crossfader", 0.25);
  assert.equal(await h.client.get("[Master]", "crossfader"), 0.25);
});

test("set rejects unknown, readonly and out-of-range writes", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await assert.rejects(
    () => h.client.set("[Channel9]", "play", 1),
    (e) => e.code === ErrorCode.UNKNOWN_CONTROL
  );
  await assert.rejects(
    () => h.client.set("[Channel1]", "bpm", 128),
    (e) => e.code === ErrorCode.READONLY_CONTROL
  );
  await assert.rejects(
    () => h.client.set("[Master]", "crossfader", 5),
    (e) => e.code === ErrorCode.VALUE_OUT_OF_RANGE
  );
});

test("messages before hello are rejected", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const raw = new CdepClient({ path: h.socketPath });
  // Bypass connect()'s handshake by talking to the socket directly.
  const net = await import("node:net");
  const socket = net.createConnection({ path: h.socketPath });
  await new Promise((r) => socket.once("connect", r));

  const reply = await new Promise((resolve) => {
    socket.setEncoding("utf8");
    socket.once("data", (d) => resolve(JSON.parse(d.trim().split("\n")[0])));
    socket.write(JSON.stringify({ t: "get", id: 1, group: "[Master]", item: "gain" }) + "\n");
  });
  socket.destroy();
  raw.close();

  assert.equal(reply.t, "error");
  assert.equal(reply.code, ErrorCode.NOT_HANDSHAKEN);
});

test("an unsupported protocol version is fatal — REQ-CDEP-10", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const net = await import("node:net");
  const socket = net.createConnection({ path: h.socketPath });
  await new Promise((r) => socket.once("connect", r));
  socket.setEncoding("utf8");

  const closed = new Promise((r) => socket.once("close", r));
  const reply = await new Promise((resolve) => {
    socket.once("data", (d) => resolve(JSON.parse(d.trim().split("\n")[0])));
    socket.write(JSON.stringify({ t: "hello", accept: ["cdep/99"], client: "x" }) + "\n");
  });

  assert.equal(reply.t, "error");
  assert.equal(reply.code, ErrorCode.UNSUPPORTED_PROTOCOL);
  await closed; // the engine must hang up
});

test("unknown fields are ignored so the protocol can extend — REQ-CDEP-7", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const reply = await h.client.request({
    t: "get",
    group: "[Master]",
    item: "gain",
    somethingFromTheFuture: { nested: true }
  });
  assert.equal(reply.t, "value");
  assert.equal(reply.value, 1);
});

test("each connection keeps independent subscription state — REQ-CDEP-4", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const b = await h.connect();

  const aSeen = [];
  const bSeen = [];
  h.client.on("changed", (m) => aSeen.push(m));
  b.on("changed", (m) => bSeen.push(m));

  await h.client.subscribe([{ group: "[Master]", item: "crossfader" }], 50);
  await b.subscribe([{ group: "[Master]", item: "gain" }], 50);

  await h.client.set("[Master]", "crossfader", 0.5);
  await h.client.set("[Master]", "gain", 2);

  await waitFor(() => aSeen.length > 0 && bSeen.length > 0);

  assert.ok(aSeen.every((m) => m.item === "crossfader"), "A subscribed only to crossfader");
  assert.ok(bSeen.every((m) => m.item === "gain"), "B subscribed only to gain");
});

test("high-rate controls are silent until subscribed — REQ-CDEP-15", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const seen = [];
  h.client.on("changed", (m) => seen.push(m));

  await h.client.load("[Channel1]", { id: "t1", duration: 2 });
  await h.client.set("[Channel1]", "play", 1);
  await new Promise((r) => setTimeout(r, 250));

  assert.equal(
    seen.filter((m) => m.item === "playposition").length,
    0,
    "playposition must not stream to an unsubscribed client"
  );

  await h.client.subscribe([{ group: "[Channel1]", item: "playposition" }], 50);
  await waitFor(() => seen.some((m) => m.item === "playposition"));
  assert.ok(seen.some((m) => m.item === "playposition"), "should stream once subscribed");
});

test("subscription updates are coalesced to max_hz — REQ-CDEP-14", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const seen = [];
  h.client.on("changed", (m) => {
    if (m.item === "crossfader") seen.push(m);
  });

  await h.client.subscribe([{ group: "[Master]", item: "crossfader" }], 10); // 100ms window

  // 50 rapid writes inside roughly one flush window.
  for (let i = 1; i <= 50; i++) {
    await h.client.set("[Master]", "crossfader", i / 100);
  }
  await new Promise((r) => setTimeout(r, 400));

  assert.ok(seen.length > 0, "expected at least one coalesced update");
  assert.ok(seen.length < 20, `expected coalescing, got ${seen.length} updates for 50 writes`);
  // Coalescing must converge on the latest value, never a stale one.
  assert.equal(seen.at(-1).value, 0.5);
});

test("subscribe rejects an unknown control", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await assert.rejects(
    () => h.client.subscribe([{ group: "[Nope]", item: "x" }]),
    (e) => e.code === ErrorCode.UNKNOWN_CONTROL
  );
});

test("unsubscribe stops delivery", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const seen = [];
  h.client.on("changed", (m) => seen.push(m));

  await h.client.subscribe([{ group: "[Master]", item: "gain" }], 50);
  await h.client.set("[Master]", "gain", 2);
  await waitFor(() => seen.length > 0);
  const afterFirst = seen.length;

  await h.client.unsubscribe([{ group: "[Master]", item: "gain" }]);
  await h.client.set("[Master]", "gain", 3);
  await new Promise((r) => setTimeout(r, 200));

  assert.equal(seen.length, afterFirst, "no further updates after unsubscribe");
});

test("ping is answered with pong", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());
  const r = await h.client.ping();
  assert.equal(r.t, "pong");
});

test("an unknown message type is reported, not ignored", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());
  await assert.rejects(
    () => h.client.request({ t: "teleport" }),
    (e) => e.code === ErrorCode.UNKNOWN_TYPE
  );
});
