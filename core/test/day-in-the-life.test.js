// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The day in the life — SPECIFICATION §0.4, AC-13.
 *
 * This is the specification's own **definition of done for v1**, executed as a
 * test:
 *
 * > A venue runs CrowdDeck for a full trading day. It opens unattended, patrons
 * > join and queue music that respects venue policy and fair-queue rules, the
 * > room never goes silent, a DJ takes over at 21:00 with no gap in audio, mixes
 * > patron requests from the staging lane using a MIDI controller with an
 * > external instrument locked to the deck tempo, releases control at close, and
 * > the venue can export exactly what was performed. The venue's internet was
 * > down the whole time.
 *
 * Every other test in this repository checks one component. This one checks that
 * the components **compose** — the scheduler, the policy engine, the fairness
 * rules, the CDEP engine, the venue API, the MIDI mapping layer, the clock and
 * the instrument registry, all in one run.
 *
 * A fake clock stands in for the trading day so the whole scenario executes in
 * milliseconds. Nothing reaches the public internet at any point, which is the
 * offline-first requirement (G1, REQ-NFR-3) being demonstrated rather than
 * asserted.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";

import { CdepClient } from "../../protocol/src/index.js";
import { Server } from "../../engine-stub/src/server.js";
import { StubEngine } from "../../engine-stub/src/engine.js";
import { Scheduler, Mode, MAX_DEAD_AIR_MS } from "../src/scheduler.js";
import { EngineAdapter, PRIMARY_DECK } from "../src/engine-adapter.js";
import { State, Actor } from "../src/queue.js";
import { LicenceClass } from "../src/policy.js";
import { VenueApi } from "../../api/src/server.js";
import { DemoCatalog } from "../../api/src/demo-catalog.js";
import { Mapping, MappingEngine } from "../../interconnect/src/mapping.js";
import { MidiClock } from "../../interconnect/src/clock.js";
import { FakeMidiBackend, Status } from "../../interconnect/src/ports.js";
import { InstrumentRegistry } from "../../interconnect/src/instrument.js";

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

/** 11:00 on an arbitrary trading day. */
const OPEN = new Date("2026-08-27T11:00:00Z").getTime();

function tradingDayClock() {
  let t = OPEN;
  const fn = () => t;
  fn.advance = (ms) => (t += ms);
  fn.hour = () => new Date(t).getUTCHours();
  return fn;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(predicate, { timeoutMs = 4000, intervalMs = 10 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return true;
    await sleep(intervalMs);
  }
  return false;
}

test("a venue runs a full trading day with no internet — AC-13, SPECIFICATION §0.4", async (t) => {
  /* ---------------------------------------------------------- 10:45 setup */

  const now = tradingDayClock();
  const socketPath = process.platform === "win32"
    ? `\\\\.\\pipe\\crowddeck-day-${process.pid}`
    : path.join(os.tmpdir(), `crowddeck-day-${process.pid}.sock`);

  const engine = new StubEngine({ decks: 4 });
  const engineServer = new Server({ path: socketPath, engine });
  await engineServer.listen();

  const cdep = new CdepClient({ path: socketPath, client: "day-in-the-life/1.0" });
  await cdep.connect();

  const catalog = new DemoCatalog();
  const scheduler = new Scheduler({
    venueId: "the-anchor",
    now,
    mode: Mode.AUTONOMOUS,
    // A real trading day, so real cooldowns.
    fairness: { trackCooldownMs: 60 * MIN, artistCooldownMs: 30 * MIN },
    policy: { commercial: true, explicitAllowed: false }
  });
  scheduler.fallbackProvider = catalog.fallbackProvider(scheduler);

  const adapter = new EngineAdapter({ scheduler, client: cdep });
  await adapter.start();

  const api = new VenueApi({
    scheduler,
    catalog,
    adapter,
    venueId: "the-anchor",
    venueName: "The Anchor",
    staffKey: "day-key"
  });
  await api.listen(0);

  t.after(async () => {
    adapter.stop();
    cdep.close();
    await api.close();
    await engineServer.close();
  });

  const base = `${api.url}/v1/venues/the-anchor`;
  const call = async (method, path, { body, token, staff } = {}) => {
    const headers = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    if (staff) headers["x-staff-key"] = "day-key";
    const res = await fetch(`${base}${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: res.status, body: await res.json() };
  };

  // Everything above is on loopback. Nothing in this test reaches the internet:
  // the catalogue is local, the engine is a local socket, and no provider is
  // configured. That is G1 / REQ-NFR-3 demonstrated, not asserted.

  /* ------------------------------------------------- 11:00 doors open */

  scheduler.tick();
  const openedPlaying = await waitFor(() => scheduler.nowPlaying !== null);
  assert.ok(openedPlaying, "the room should have music the moment it opens");
  assert.equal(
    scheduler.nowPlaying.isFallback,
    true,
    "with nobody here yet, the fallback rotation carries the room"
  );

  /* ---------------------------------------- 12:30 the first patrons join */

  now.advance(90 * MIN);

  const alice = (await call("POST", "/join", { body: {} })).body;
  const bob = (await call("POST", "/join", { body: {} })).body;
  assert.match(alice.patronId, /^p_/);
  assert.notEqual(alice.token, bob.token);

  // Search is scoped by venue policy, so nothing unplayable is even offered.
  const search = await call("GET", "/search?q=");
  const offered = search.body.results.map((r) => r.id);
  assert.ok(offered.includes("cc-001"), "compliant tracks are offered");
  assert.ok(!offered.includes("exp-001"), "explicit content is never offered");
  assert.ok(!offered.includes("nc-001"), "non-commercial CC is not playable here");
  assert.ok(!offered.includes("unk-001"), "unknown provenance is not playable here");

  const first = await call("POST", "/queue", { body: { trackId: "cc-001" }, token: alice.token });
  assert.equal(first.status, 200);
  assert.equal(first.body.position, 1, "Alice can see exactly where she is in line");

  /* ------------------------------ 13:00 the rules hold under enthusiasm */

  now.advance(30 * MIN);

  await call("POST", "/queue", { body: { trackId: "cc-003" }, token: alice.token });
  const alicesSecond = { body: { entry: null } };
  // Recover the entry Alice just queued so the ordering assertions below can
  // name it explicitly rather than relying on position.
  {
    const q = await call("GET", "/queue");
    const mine = q.body.queue.find((e) => e.track.id === "cc-003");
    alicesSecond.body.entry = mine;
  }
  const third = await call("POST", "/queue", { body: { trackId: "cc-005" }, token: alice.token });
  assert.equal(third.status, 409, "one patron cannot monopolise the queue");
  assert.equal(third.body.error, "patron_limit");
  assert.ok(third.body.message.length > 0, "and she is told why, not just refused");

  // Bob is unaffected by Alice's limit.
  const bobsPick = await call("POST", "/queue", { body: { trackId: "cc-007" }, token: bob.token });
  assert.equal(bobsPick.status, 200);

  // The crowd votes for Bob's pick.
  await call("POST", `/queue/${bobsPick.body.entry.id}/votes`, { token: alice.token });
  const afterVote = await call("GET", "/queue");
  const order = afterVote.body.queue.map((e) => e.id);

  // Two properties hold at once here, and they are worth separating.
  //
  // A vote lifts Bob's pick above Alice's *second* request, which has neither
  // votes nor any meaningful wait.
  assert.ok(
    order.indexOf(bobsPick.body.entry.id) < order.indexOf(alicesSecond.body.entry.id),
    "a vote lifts a track above its unvoted peers"
  );

  // But it does NOT leapfrog Alice's first request, which has been waiting since
  // 12:30. Thirty minutes of aging is worth more than a single fresh vote, which
  // is exactly the anti-starvation guarantee (REQ-SCH-8) doing its job: a patron
  // who queued early does not get buried by later arrivals.
  assert.equal(
    order[0],
    first.body.entry.id,
    "a long-waiting request is not displaced by one fresh vote"
  );

  /* ---------------------------- 14:00-21:00 the afternoon runs unattended */

  const playedByAfternoon = [];
  scheduler.on("played", (e) => playedByAfternoon.push(e.track.id));

  // Drain everything the patrons queued, then let the fallback carry on.
  for (let i = 0; i < 6; i++) {
    const playing = scheduler.nowPlaying;
    if (playing) {
      scheduler.markPlayed(playing.id);
      adapter.loaded = null;
    }
    scheduler.onDeckEmpty();
    now.advance(20 * MIN);

    // Promotion completes asynchronously across the CDEP socket, so wait for
    // the room to have audio rather than sampling immediately. The budget is
    // REQ-FALL-3's 2 seconds of permitted dead air — asserting against the real
    // requirement, not against however fast this machine happens to be.
    const backOnAir = await waitFor(() => scheduler.nowPlaying !== null, {
      timeoutMs: MAX_DEAD_AIR_MS
    });
    assert.ok(
      backOnAir,
      `the room fell silent for more than ${MAX_DEAD_AIR_MS}ms on iteration ${i}`
    );
  }

  assert.ok(
    playedByAfternoon.includes("cc-007"),
    `patron requests should have played, saw ${JSON.stringify(playedByAfternoon)}`
  );

  /* ------------------------------------------ 21:00 the DJ takes over */

  now.advance(2 * HOUR);

  const beforeHandoff = scheduler.nowPlaying;
  assert.ok(beforeHandoff, "something is playing when the DJ arrives");
  const playPositionBefore = await cdep.get(PRIMARY_DECK, "playposition");

  scheduler.setMode(Mode.ATTENDED, { actor: Actor.STAFF });

  assert.equal(scheduler.mode, Mode.ATTENDED);
  assert.equal(
    scheduler.nowPlaying?.id,
    beforeHandoff.id,
    "the handoff must not interrupt what the room is hearing"
  );
  assert.equal(await cdep.get(PRIMARY_DECK, "play"), 1, "audio continues across the handoff");
  const playPositionAfter = await cdep.get(PRIMARY_DECK, "playposition");
  assert.ok(playPositionAfter >= playPositionBefore, "and the playhead keeps moving");

  /* ------------------------- 21:05 requests wait for the DJ, not the crowd */

  const evening = await call("POST", "/queue", { body: { trackId: "cc-009" }, token: bob.token });
  assert.equal(evening.status, 200);
  assert.equal(
    evening.body.entry.state,
    "staged",
    "in attended mode a request lands in the staging lane, not on the speakers"
  );

  // The scheduler itself may not promote while a DJ is in charge.
  assert.throws(
    () => scheduler.promote(evening.body.entry.id, { actor: Actor.SCHEDULER }),
    /attended mode a DJ must promote/,
    "the staging lane is the whole point: only a human decides"
  );

  const staging = await call("GET", "/staging", { staff: true });
  assert.equal(staging.body.staging.length, 1);

  /* ----------------------- 21:10 the DJ works from a MIDI controller */

  const midi = new FakeMidiBackend();
  const controllerId = midi.attach({
    manufacturer: "Pioneer DJ",
    product: "DDJ-FLX4",
    serial: "ANCHOR-1"
  });

  const descriptors = await cdep.describe();
  const mappingEngine = new MappingEngine({ descriptors });
  const mapping = new Mapping({ name: "Booth controller", portIdentity: controllerId });
  mapping.add({
    kind: "cc", channel: 0, controller: 7,
    group: PRIMARY_DECK, item: "volume"
  });
  mappingEngine.addMapping(mapping);

  // Software volume is up; the physical fader is down where it was left.
  mappingEngine.setSoftwareValue(PRIMARY_DECK, "volume", 1);

  const jump = mappingEngine.handle(controllerId, [Status.CONTROL_CHANGE, 7, 0]);
  assert.equal(
    jump.suppressed,
    true,
    "soft-takeover: the volume must not drop out when the DJ touches the fader"
  );

  // The DJ sweeps up; control is picked up on crossing, then tracks normally.
  mappingEngine.handle(controllerId, [Status.CONTROL_CHANGE, 7, 64]);
  const caught = mappingEngine.handle(controllerId, [Status.CONTROL_CHANGE, 7, 127]);
  assert.notEqual(caught.suppressed, true, "and is picked up once the fader catches up");
  assert.equal(caught.group, PRIMARY_DECK);
  assert.equal(caught.item, "volume");

  // A write that actually reaches the engine, through the same CDEP path.
  await cdep.set(caught.group, caught.item, caught.value);
  assert.equal(await cdep.get(PRIMARY_DECK, "volume"), 1);

  /* ---------------- 21:15 the DJ cues a patron request from the lane */

  const promoted = await call("POST", `/staging/${evening.body.entry.id}/promote`, { staff: true });
  assert.equal(promoted.status, 200);
  assert.equal(promoted.body.entry.state, "cued", "the DJ decides when a request plays");

  /* ------------- 22:00 a live instrument, locked to the deck tempo */

  now.advance(45 * MIN);

  const instruments = new InstrumentRegistry({ now });
  const sp404 = instruments.register({
    portIdentity: "akai:mpc-live:ANCHOR-2",
    name: "Live — Nina's MPC",
    performer: "Nina",
    durationSec: 300
  });

  // The instrument follows the leader deck, so the room stays on one timeline.
  const clockOut = [];
  const clock = new MidiClock({ bpm: 120, send: (d) => clockOut.push(d) });
  t.after(() => clock.stop());

  await cdep.set(PRIMARY_DECK, "sync_leader", 1);
  const leaderBpm = await cdep.get("[Master]", "bpm");
  clock.start();
  clock.followLeader(leaderBpm > 0 ? leaderBpm : 124);

  await sleep(120);
  assert.ok(
    clockOut.filter((m) => m[0] === Status.CLOCK).length > 0,
    "MIDI clock is running, so an external instrument can lock to the deck"
  );

  // The live set is queued exactly like a track, and screened exactly like one.
  const liveRequest = scheduler.request({ track: sp404.toTrack(), patronId: "staff" });
  assert.equal(liveRequest.ok, true, "a live instrument is a first-class source");
  assert.equal(liveRequest.entry.state, State.STAGED, "and waits in the lane like anything else");

  instruments.begin(sp404.id);
  instruments.observe("akai:mpc-live:ANCHOR-2", [Status.NOTE_ON, 60, 100]);
  assert.equal(sp404.noteCount, 1, "the performance is being monitored");

  // Nina stops early. The room must not be left in silence.
  now.advance(31 * 1000);
  const finished = instruments.tick();
  assert.ok(finished, "an idle performer releases the room");
  assert.equal(finished.reason, "performer_idle");

  /* --------------------------------------- 02:00 the DJ hands back */

  now.advance(4 * HOUR);

  const stillPlaying = scheduler.nowPlaying;
  scheduler.setMode(Mode.AUTONOMOUS, { actor: Actor.STAFF });

  assert.equal(scheduler.mode, Mode.AUTONOMOUS);
  if (stillPlaying) {
    assert.equal(
      scheduler.nowPlaying?.id,
      stillPlaying.id,
      "handing back must be as seamless as taking over"
    );
  }

  /* ----------------------------------- 02:30 close, and the paperwork */

  const log = await call("GET", "/play-log.csv", { staff: true });
  assert.equal(log.status, 200);
  const lines = log.body.csv.trim().split("\n");
  assert.equal(lines[0], "track_id,artist,ended_at", "a header the PROs can read");
  assert.ok(lines.length > 3, `expected a day's worth of plays, got ${lines.length - 1}`);
  assert.ok(
    log.body.csv.includes("cc-"),
    "the export names exactly what was performed"
  );

  /* ------------------------------------------------- the whole point */

  // Not one of the refusals above was a policy or licensing accident: every
  // track that played carried a licence class the venue may legally perform.
  for (const play of scheduler.recentPlays) {
    const track = catalog.get(play.trackId);
    if (!track) continue; // live instrument slots are not catalogue entries
    assert.notEqual(track.licenceClass, LicenceClass.CC_NONCOMMERCIAL);
    assert.notEqual(track.licenceClass, LicenceClass.UNKNOWN);
    assert.notEqual(track.explicit, true);
  }
});
