// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The walking skeleton — M1 + M2 end to end.
 *
 * A patron request goes through policy screening, fairness rules and the
 * priority queue, into the staging lane, out through the scheduler, across the
 * CDEP socket, and onto a real (if silent) engine deck.
 *
 * These are the tests that prove the two planes actually meet. Everything else
 * in `core/` is unit-tested against a fake clock; this exercises the boundary.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { CdepClient } from "../../protocol/src/index.js";
import { Server } from "../../engine-stub/src/server.js";
import { StubEngine } from "../../engine-stub/src/engine.js";
import { Scheduler, Mode } from "../src/scheduler.js";
import { EngineAdapter, PRIMARY_DECK } from "../src/engine-adapter.js";
import { LicenceClass } from "../src/policy.js";
import { State } from "../src/queue.js";

let counter = 0;

function socketPath() {
  const name = `crowddeck-core-${process.pid}-${counter++}`;
  return process.platform === "win32"
    ? `\\\\.\\pipe\\${name}`
    : path.join(os.tmpdir(), `${name}.sock`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(predicate, { timeoutMs = 4000, intervalMs = 15 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return true;
    await sleep(intervalMs);
  }
  return false;
}

const track = (id, over = {}) => ({
  id,
  title: `Title ${id}`,
  artist: `Artist ${id}`,
  duration: 0.4,
  genre: "House",
  explicit: false,
  licenceClass: LicenceClass.OWNED_LOCAL,
  ...over
});

/** Boot a stub engine, a scheduler and the adapter joining them. */
async function boot(opts = {}) {
  const sock = socketPath();
  const engine = new StubEngine({ decks: 4 });
  const server = new Server({ path: sock, engine });
  await server.listen();

  const client = new CdepClient({ path: sock, client: "crowddeck-core/test" });
  await client.connect();

  const scheduler = new Scheduler({ mode: Mode.AUTONOMOUS, ...opts });
  const adapter = new EngineAdapter({ scheduler, client });
  await adapter.start();

  return {
    scheduler,
    adapter,
    client,
    engine,
    async stop() {
      adapter.stop();
      client.close();
      await server.close();
    }
  };
}

test("a patron request reaches a real engine deck and plays", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const r = h.scheduler.request({ track: track("a", { duration: 5 }), patronId: "p1" });
  assert.equal(r.ok, true);

  h.scheduler.tick();

  const playing = await waitFor(async () => (await h.client.get(PRIMARY_DECK, "play")) === 1);
  assert.ok(playing, "the engine should be playing");

  assert.equal(await h.client.get(PRIMARY_DECK, "track_loaded"), 1);
  assert.equal(await h.client.get(PRIMARY_DECK, "duration"), 5);
  assert.equal(r.entry.state, State.PLAYING);
  assert.equal(h.scheduler.nowPlaying.id, r.entry.id);
});

test("in attended mode nothing reaches the deck until a DJ promotes — AC-1", async (t) => {
  const h = await boot({ mode: Mode.ATTENDED });
  t.after(() => h.stop());

  const r = h.scheduler.request({ track: track("a", { duration: 5 }), patronId: "p1" });
  h.scheduler.tick();
  await sleep(200);

  assert.equal(
    await h.client.get(PRIMARY_DECK, "track_loaded"),
    0,
    "a crowd request must not reach the output on its own"
  );
  assert.equal(r.entry.state, State.STAGED);

  // The DJ promotes from the staging lane.
  h.scheduler.promote(r.entry.id, { actor: "dj" });
  const playing = await waitFor(async () => (await h.client.get(PRIMARY_DECK, "play")) === 1);
  assert.ok(playing, "after promotion it plays");
});

test("the queue drains track to track without going silent — AC-2, AC-8", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const a = h.scheduler.request({ track: track("a"), patronId: "p1" }).entry;
  const b = h.scheduler.request({ track: track("b"), patronId: "p2" }).entry;

  const played = [];
  h.scheduler.on("played", (e) => played.push(e.track.id));

  h.scheduler.tick();

  const bothPlayed = await waitFor(() => played.length >= 2, { timeoutMs: 6000 });
  assert.ok(bothPlayed, `expected both tracks to play, saw ${JSON.stringify(played)}`);
  assert.deepEqual(played.slice(0, 2), ["a", "b"], "in queue order");
  assert.equal(a.state, State.PLAYED);
  assert.equal(b.state, State.PLAYED);
});

test("an empty queue pulls fallback so the room never goes quiet — AC-8", async (t) => {
  let n = 0;
  const h = await boot({ fallbackProvider: () => track(`filler-${n++}`) });
  t.after(() => h.stop());

  const fallbacks = [];
  h.scheduler.on("fallback", (e) => fallbacks.push(e.track.id));

  h.scheduler.tick();

  const filled = await waitFor(() => fallbacks.length >= 2, { timeoutMs: 6000 });
  assert.ok(filled, `fallback should keep supplying tracks, saw ${JSON.stringify(fallbacks)}`);
  assert.equal(await h.client.get(PRIMARY_DECK, "track_loaded"), 1);
});

test("a patron request pre-empts the fallback rotation", async (t) => {
  const h = await boot({ fallbackProvider: () => track("filler", { duration: 0.3 }) });
  t.after(() => h.stop());

  h.scheduler.tick();
  await waitFor(() => h.scheduler.nowPlaying !== null);

  const real = h.scheduler.request({ track: track("real-request"), patronId: "p1" }).entry;

  const played = [];
  h.scheduler.on("played", (e) => played.push(e.track.id));

  const heard = await waitFor(() => played.includes("real-request"), { timeoutMs: 6000 });
  assert.ok(heard, `the patron request should play, saw ${JSON.stringify(played)}`);
  assert.equal(real.state, State.PLAYED);
});

test("votes reorder what the engine plays next", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  // Get one track playing first, so the reordering applies to what follows.
  const first = h.scheduler.request({
    track: track("first", { duration: 1.2 }),
    patronId: "p1"
  }).entry;
  h.scheduler.tick();
  await waitFor(() => first.state === State.PLAYING);

  // Now two contenders arrive; the later one is voted up.
  const quiet = h.scheduler.request({ track: track("quiet"), patronId: "p2" }).entry;
  const popular = h.scheduler.request({ track: track("popular"), patronId: "p3" }).entry;
  h.scheduler.vote(popular.id, "p4");
  h.scheduler.vote(popular.id, "p5");

  assert.ok(
    h.scheduler.positionOf(popular.id) < h.scheduler.positionOf(quiet.id),
    "votes should move it up the queue"
  );

  const played = [];
  h.scheduler.on("played", (e) => played.push(e.track.id));

  const done = await waitFor(() => played.length >= 3, { timeoutMs: 10000 });
  assert.ok(done, `expected three tracks, saw ${JSON.stringify(played)}`);
  assert.equal(played[0], "first");
  assert.equal(played[1], "popular", "the voted-up track plays before the quiet one");
  assert.equal(played[2], "quiet");
});

test("a mode handoff mid-track does not interrupt audio — AC-3", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  const e = h.scheduler.request({ track: track("a", { duration: 10 }), patronId: "p1" }).entry;
  h.scheduler.tick();

  await waitFor(async () => (await h.client.get(PRIMARY_DECK, "play")) === 1);
  const posBefore = await h.client.get(PRIMARY_DECK, "playposition");

  h.scheduler.setMode(Mode.ATTENDED);
  await sleep(200);

  assert.equal(await h.client.get(PRIMARY_DECK, "play"), 1, "audio continues");
  const posAfter = await h.client.get(PRIMARY_DECK, "playposition");
  assert.ok(posAfter > posBefore, "and the playhead keeps advancing");
  assert.equal(e.state, State.PLAYING);
});

test("the engine is replaceable: the core only speaks CDEP", async (t) => {
  const h = await boot();
  t.after(() => h.stop());

  // The adapter holds a CdepClient and nothing engine-specific. This is the
  // property ADR-001's licence boundary depends on (REQ-LIC-5).
  assert.ok(h.adapter.client instanceof CdepClient);
  assert.equal(typeof h.adapter.client.welcome.engine, "string");
  assert.match(h.adapter.client.welcome.engine, /engine-stub/);
});
