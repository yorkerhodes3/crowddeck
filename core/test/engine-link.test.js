// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * REQ-NFR-5 — a fusion-core crash must not stop audio.
 *
 * These tests kill the *core side* of the link while the engine keeps running, and
 * assert that the audio was never interrupted and that the core adopts reality when
 * it comes back. That is the property the whole two-plane architecture is for, so it
 * is tested against a real engine process over a real socket rather than a mock.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { EngineLink } from "../src/engine-link.js";
import { EngineAdapter } from "../src/engine-adapter.js";
import { startEngine } from "../../engine-stub/test/helpers.js";

const waitFor = async (fn, timeoutMs = 2000, label = "condition") => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error(`timed out waiting for ${label}`);
};

test("the engine keeps playing when the core's connection dies — REQ-NFR-5", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await h.client.load("[Channel1]", { id: "t1", duration: 300000 });
  await h.client.set("[Channel1]", "play", 1);
  assert.equal(await h.client.get("[Channel1]", "play"), 1);

  const posBefore = await h.client.get("[Channel1]", "playposition");

  // The core dies. Not a graceful shutdown — the socket simply goes away.
  h.client.close();
  await new Promise((r) => setTimeout(r, 120));

  // A second client stands in for the restarted core.
  const revived = await h.connect();
  t.after(() => revived.close());

  assert.equal(
    await revived.get("[Channel1]", "play"),
    1,
    "the deck must still be playing — the room does not go silent because the core fell over"
  );
  assert.equal(await revived.get("[Channel1]", "track_loaded"), 1);

  const posAfter = await revived.get("[Channel1]", "playposition");
  assert.ok(
    posAfter >= posBefore,
    `playback must have continued, not restarted (before=${posBefore} after=${posAfter})`
  );
});

test("the link reconnects on its own and reports it", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());
  h.client.close();

  const link = new EngineLink({
    connect: () => h.connect(),
    backoff: { initialMs: 1, maxMs: 5 },
    sleep: () => Promise.resolve()
  });
  t.after(() => link.stop());

  const events = [];
  link.on("connected", (e) => events.push(["connected", e.reconnects]));
  link.on("disconnected", (e) => events.push(["disconnected", e.reconnects]));

  await link.start();
  assert.equal(link.connected, true);

  // Kill the socket underneath it. Waiting on `connected` alone would be a no-op:
  // it is still true at this instant, so the wait would pass before the drop was
  // even observed. Wait for the reconnect *count* to move as well.
  link.client.close();
  await waitFor(
    () => link.reconnects >= 1 && link.connected,
    2000,
    "a drop followed by a reconnection"
  );

  assert.ok(link.reconnects >= 1, "the drop must be observed, not silently swallowed");
  assert.deepEqual(events[0], ["connected", 0]);
  assert.ok(events.some(([n]) => n === "disconnected"));
});

test("resync adopts a playing deck instead of restarting it — REQ-NFR-5", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await h.client.load("[Channel1]", { id: "t1", duration: 300000 });
  await h.client.set("[Channel1]", "play", 1);
  await new Promise((r) => setTimeout(r, 60));
  const posBefore = await h.client.get("[Channel1]", "playposition");
  h.client.close();

  // A fresh core with an empty memory: it has never heard of t1.
  const scheduler = { tick: () => {}, playingEntry: () => null };
  const adapter = new EngineAdapter({ scheduler, client: null });

  const link = new EngineLink({
    connect: () => h.connect(),
    adapter,
    sleep: () => Promise.resolve()
  });
  t.after(() => link.stop());

  let adopted = null;
  link.on("adopted", (e) => (adopted = e));

  await link.start();

  assert.ok(adopted, "a playing deck must be adopted");
  assert.equal(await link.client.get("[Channel1]", "play"), 1, "still playing after resync");

  const posAfter = await link.client.get("[Channel1]", "playposition");
  assert.ok(
    posAfter >= posBefore,
    `resync must not restart the track (before=${posBefore} after=${posAfter})`
  );
});

test("resync takes over an idle deck rather than leaving the room silent", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());
  h.client.close();

  let ticks = 0;
  const scheduler = { tick: () => ticks++, playingEntry: () => null };
  const adapter = new EngineAdapter({ scheduler, client: null });
  adapter.loaded = { id: "stale-memory" };

  const link = new EngineLink({
    connect: () => h.connect(),
    adapter,
    sleep: () => Promise.resolve()
  });
  t.after(() => link.stop());

  let resumed = false;
  link.on("resumed", () => (resumed = true));

  await link.start();

  assert.equal(resumed, true);
  assert.equal(adapter.loaded, null, "a stale memory of a loaded deck must be dropped");
  assert.ok(ticks > 0, "the scheduler must be asked what to play next");
});

test("backoff grows, is capped, and is jittered", () => {
  const link = new EngineLink({
    connect: async () => ({}),
    backoff: { initialMs: 100, maxMs: 1000, factor: 2, jitter: 0 },
    random: () => 0.5
  });

  assert.equal(link.delayFor(1), 100);
  assert.equal(link.delayFor(2), 200);
  assert.equal(link.delayFor(3), 400);
  assert.equal(link.delayFor(10), 1000, "capped");

  // With jitter, two clients retrying at the same attempt must not agree.
  const jittered = new EngineLink({
    connect: async () => ({}),
    backoff: { initialMs: 100, maxMs: 1000, factor: 2, jitter: 0.5 },
    random: () => 0
  });
  assert.equal(jittered.delayFor(1), 50, "lower edge of the jitter window");
  const jittered2 = new EngineLink({
    connect: async () => ({}),
    backoff: { initialMs: 100, maxMs: 1000, factor: 2, jitter: 0.5 },
    random: () => 1
  });
  assert.equal(jittered2.delayFor(1), 150, "upper edge");
});

test("a link that cannot connect keeps trying and does not throw", async (t) => {
  let attempts = 0;
  const link = new EngineLink({
    connect: async () => {
      attempts++;
      if (attempts < 3) throw new Error("ECONNREFUSED");
      return { once() {}, close() {} };
    },
    backoff: { initialMs: 1, maxMs: 1 },
    sleep: () => Promise.resolve()
  });
  t.after(() => link.stop());

  const errors = [];
  link.on("connectError", (e) => errors.push(e));

  await link.start();
  assert.equal(link.connected, true);
  assert.equal(attempts, 3);
  assert.equal(errors.length, 2, "each failure is reported, not swallowed");
});

test("stop() ends the retry loop", async (t) => {
  let attempts = 0;
  const link = new EngineLink({
    connect: async () => {
      attempts++;
      throw new Error("nope");
    },
    backoff: { initialMs: 1, maxMs: 1 },
    sleep: async () => {
      link.stop();
    }
  });

  await link.start();
  assert.equal(link.connected, false);
  assert.equal(attempts, 1, "stopping mid-backoff must not start another attempt");
});
