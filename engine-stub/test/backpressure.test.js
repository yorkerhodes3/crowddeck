// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Back-pressure tests — REQ-CDEP-16, AC-18.
 *
 * This is the most load-bearing test in the repository. The entire two-plane
 * architecture (ADR-001, ADR-005) is justified by one guarantee:
 *
 *   **a client that stops reading its socket cannot stall the engine.**
 *
 * If that guarantee does not hold, a wedged browser tab or a crashed fusion
 * core could glitch the room's audio, and putting the engine in its own process
 * buys nothing.
 *
 * The stub has no real audio device, so "audio is unaffected" is asserted
 * against its transport clock: the playhead must keep advancing on schedule
 * while a peer refuses to read.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { connectStalled, sleep, startEngine, waitFor } from "./helpers.js";

test("a stalled client does not stall the transport — AC-18", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  // A second peer that handshakes, subscribes to a high-rate control, then
  // never reads another byte.
  const stalled = await connectStalled(h.socketPath);
  stalled.write(JSON.stringify({ t: "hello", client: "stalled/1.0", accept: ["cdep/1"] }) + "\n");
  await sleep(50);
  stalled.write(
    JSON.stringify({
      t: "subscribe",
      controls: [{ group: "[Channel1]", item: "playposition" }],
      max_hz: 1000
    }) + "\n"
  );
  await sleep(50);

  // Drive the engine hard while the stalled peer refuses to drain.
  await h.client.load("[Channel1]", { id: "long", duration: 30 });
  await h.client.set("[Channel1]", "play", 1);

  const t0 = Date.now();
  const startPos = await h.client.get("[Channel1]", "playposition");

  // Generate a large volume of updates the stalled peer will never consume.
  for (let i = 0; i < 300; i++) {
    await h.client.set("[Master]", "crossfader", (i % 200) / 100 - 1);
  }

  await sleep(600);

  const elapsedSec = (Date.now() - t0) / 1000;
  const endPos = await h.client.get("[Channel1]", "playposition");
  const advancedSec = (endPos - startPos) * 30;

  // The clock must have advanced roughly in step with wall time. A generous
  // tolerance keeps this stable on a loaded CI box while still catching a stall.
  assert.ok(
    advancedSec > elapsedSec * 0.5,
    `transport stalled: advanced ${advancedSec.toFixed(2)}s of ${elapsedSec.toFixed(2)}s wall time`
  );

  // And the healthy client must still be served.
  const pong = await h.client.ping();
  assert.equal(pong.t, "pong", "a healthy client must remain responsive");

  stalled.destroy();
});

test("updates are dropped, not queued without bound, for a stalled peer — REQ-CDEP-16", async (t) => {
  // A deliberately tiny send budget. With the production 256 KiB limit,
  // coalescing alone keeps the buffer small enough that the drop path is never
  // reached, so the test would pass even with the guard removed — verified by
  // deleting the guard and watching it still pass. Injecting a small limit is
  // what makes this a real test of the guard rather than of coalescing.
  const h = await startEngine({ sendBufferLimitBytes: 2048 });
  t.after(() => h.stop());

  const stalled = await connectStalled(h.socketPath);
  stalled.write(JSON.stringify({ t: "hello", client: "stalled/1.0", accept: ["cdep/1"] }) + "\n");
  await sleep(50);

  // Subscribe to many distinct controls so coalescing cannot collapse the
  // traffic into a single message per flush.
  const controls = [];
  for (let deck = 1; deck <= 4; deck++) {
    for (let hc = 1; hc <= 8; hc++) {
      controls.push({ group: `[Channel${deck}]`, item: `hotcue_${hc}_activate` });
    }
    for (const item of ["volume", "pregain", "filter", "eq_low", "eq_mid", "eq_high", "rate"]) {
      controls.push({ group: `[Channel${deck}]`, item });
    }
  }
  stalled.write(JSON.stringify({ t: "subscribe", controls, max_hz: 1000 }) + "\n");
  await sleep(80);

  const stalledConn = [...h.server.connections].find((c) => c.client === "stalled/1.0");
  assert.ok(stalledConn, "expected the stalled connection to be tracked");

  // Churn every subscribed control repeatedly.
  for (let round = 0; round < 60; round++) {
    for (const c of controls) {
      const desc = h.engine.descriptors.get(`${c.group}\u0000${c.item}`);
      const v = round % 2 === 0 ? desc.min : desc.max;
      try {
        h.engine.set(c.group, c.item, v);
      } catch {
        /* momentary controls may refuse some values; irrelevant here */
      }
    }
    await sleep(5);
  }
  await sleep(200);

  assert.ok(
    stalledConn.droppedUpdates > 0,
    "the drop path must actually execute for a peer that never reads"
  );
  assert.ok(
    stalledConn.socket.writableLength <= stalledConn.sendBufferLimitBytes * 8,
    `send buffer grew unbounded: ${stalledConn.socket.writableLength} bytes`
  );

  // The healthy client is still served throughout.
  assert.equal((await h.client.ping()).t, "pong");

  stalled.destroy();
});

test("coalescing keeps the pending set bounded under a write storm", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await h.client.subscribe([{ group: "[Master]", item: "crossfader" }], 1); // 1s window

  for (let i = 0; i < 500; i++) {
    h.engine.set("[Master]", "crossfader", (i % 200) / 100 - 1);
  }

  const conn = [...h.server.connections].find((c) => c.client === "test/1.0.0");
  assert.ok(conn);
  // 500 writes to one control must collapse to a single pending entry.
  assert.equal(conn.pending.size, 1, "coalescing should keep one entry per control");
});

test("a dropped client is cleaned up and does not affect others", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const b = await h.connect();
  assert.equal(h.server.connections.size, 2);

  b.close();
  const gone = await waitFor(() => h.server.connections.size === 1, { timeoutMs: 2000 });
  assert.ok(gone, "the closed connection should be reaped");

  const pong = await h.client.ping();
  assert.equal(pong.t, "pong", "the surviving client is unaffected");
});
