// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Transport and gapless-continuation tests — CDEP-3, REQ-FALL-3.
 *
 * Durations here are deliberately short (fractions of a second) so the suite
 * stays fast. The simulated sink models a real playhead, so the assertions are
 * about ordering and continuity rather than audio quality.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { ErrorCode } from "../../protocol/src/index.js";
import { startEngine, waitFor } from "./helpers.js";

test("loading a track populates deck state and emits track_loaded", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const events = [];
  h.client.on("event", (e) => events.push(e));

  await h.client.load("[Channel1]", { id: "song-a", duration: 210, bpm: 128 });

  assert.equal(await h.client.get("[Channel1]", "track_loaded"), 1);
  assert.equal(await h.client.get("[Channel1]", "duration"), 210);
  assert.equal(await h.client.get("[Channel1]", "bpm"), 128);
  assert.equal(await h.client.get("[Channel1]", "play"), 0, "loads paused");

  await waitFor(() => events.some((e) => e.event === "track_loaded"));
  const loaded = events.find((e) => e.event === "track_loaded");
  assert.equal(loaded.track, "song-a");
  assert.equal(loaded.group, "[Channel1]");
});

test("load rejects a non-deck group and a missing id", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await assert.rejects(
    () => h.client.load("[Master]", { id: "x" }),
    (e) => e.code === ErrorCode.UNKNOWN_CONTROL
  );
  await assert.rejects(
    () => h.client.request({ t: "load", group: "[Channel1]", track: {} }),
    (e) => e.code === ErrorCode.INVALID_FIELD
  );
});

test("play advances the playhead and pause holds it", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await h.client.load("[Channel1]", { id: "song-a", duration: 10 });
  await h.client.set("[Channel1]", "play", 1);

  const advanced = await waitFor(async () => (await h.client.get("[Channel1]", "playposition")) > 0, {
    timeoutMs: 2000
  });
  assert.ok(advanced, "playhead should advance while playing");

  await h.client.set("[Channel1]", "play", 0);
  const atPause = await h.client.get("[Channel1]", "playposition");
  await new Promise((r) => setTimeout(r, 150));
  const afterWait = await h.client.get("[Channel1]", "playposition");
  assert.equal(afterWait, atPause, "playhead must not move while paused");
});

test("playing an empty deck is refused rather than silently ignored", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await assert.rejects(
    () => h.client.set("[Channel2]", "play", 1),
    (e) => e.code === ErrorCode.UNAVAILABLE
  );
  assert.equal(await h.client.get("[Channel2]", "play"), 0, "state must reflect reality");
});

test("a track that ends with nothing queued empties the deck", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const events = [];
  h.client.on("event", (e) => events.push(e));

  await h.client.load("[Channel1]", { id: "short", duration: 0.25 });
  await h.client.set("[Channel1]", "play", 1);

  const empty = await waitFor(() => events.some((e) => e.event === "deck_empty"), {
    timeoutMs: 3000
  });
  assert.ok(empty, "expected deck_empty");

  const order = events.map((e) => e.event);
  assert.ok(
    order.indexOf("track_ended") < order.indexOf("deck_empty"),
    "track_ended must precede deck_empty"
  );
  assert.equal(await h.client.get("[Channel1]", "track_loaded"), 0);
});

test("a queued next track continues gaplessly — CDEP-3, REQ-FALL-3", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const events = [];
  h.client.on("event", (e) => events.push(e));

  await h.client.request({
    t: "load",
    group: "[Channel1]",
    track: { id: "first", duration: 0.3 },
    next: { id: "second", duration: 5 }
  });
  await h.client.set("[Channel1]", "play", 1);

  const continued = await waitFor(
    () => events.some((e) => e.event === "track_loaded" && e.track === "second"),
    { timeoutMs: 3000 }
  );
  assert.ok(continued, "the queued track should load automatically");

  // The defining property: no deck_empty between the two tracks.
  assert.ok(
    !events.some((e) => e.event === "deck_empty"),
    "gapless continuation must not empty the deck"
  );
  assert.equal(await h.client.get("[Channel1]", "play"), 1, "playback continues");
  assert.equal(await h.client.get("[Channel1]", "track_loaded"), 1);
  assert.equal(await h.client.get("[Channel1]", "duration"), 5);
});

test("cue_gotoandplay restarts from the top and self-clears", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await h.client.load("[Channel1]", { id: "song", duration: 10 });
  await h.client.set("[Channel1]", "play", 1);
  await waitFor(async () => (await h.client.get("[Channel1]", "playposition")) > 0);

  await h.client.set("[Channel1]", "cue_gotoandplay", 1);
  assert.equal(await h.client.get("[Channel1]", "cue_gotoandplay"), 0, "momentary control resets");
  assert.equal(await h.client.get("[Channel1]", "play"), 1);
  assert.ok((await h.client.get("[Channel1]", "playposition")) < 0.05, "restarted near zero");
});

test("only one deck can be sync leader — REQ-CLK-1", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await h.client.set("[Channel1]", "sync_leader", 1);
  assert.equal(await h.client.get("[Channel1]", "sync_leader"), 1);

  await h.client.set("[Channel2]", "sync_leader", 1);
  assert.equal(await h.client.get("[Channel2]", "sync_leader"), 1);
  assert.equal(
    await h.client.get("[Channel1]", "sync_leader"),
    0,
    "electing a new leader must demote the previous one"
  );
});

test("the leader deck's BPM becomes the master tempo — REQ-CLK-1", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await h.client.load("[Channel2]", { id: "song", duration: 60, bpm: 124 });
  await h.client.set("[Channel2]", "sync_leader", 1);
  assert.equal(await h.client.get("[Master]", "bpm"), 124);
});
