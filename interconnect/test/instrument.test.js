// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Live MIDI instruments as queueable sources — REQ-INST-1, REQ-INST-2.
 *
 * The last test is the important one: it puts a live instrument through the
 * *actual* scheduler alongside recorded tracks, proving the "instrument as a
 * source" idea is real rather than a parallel code path.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SLOT_SEC,
  IDLE_TIMEOUT_SEC,
  InstrumentRegistry,
  InstrumentSource
} from "../src/instrument.js";
import { Status } from "../src/ports.js";
import { Scheduler, Mode } from "../../core/src/scheduler.js";
import { LicenceClass } from "../../core/src/policy.js";
import { State } from "../../core/src/queue.js";

function clock(start = 0) {
  let t = start;
  const fn = () => t;
  fn.advance = (ms) => (t += ms);
  return fn;
}

const noteOn = (n = 60) => [Status.NOTE_ON | 0, n, 100];

test("an instrument presents itself as a track — REQ-INST-1", () => {
  const inst = new InstrumentSource({
    portIdentity: "akai:mpk-mini:1",
    name: "Live — Nina's SP-404",
    performer: "Nina",
    durationSec: 300
  });

  const track = inst.toTrack();
  // The scheduler, the policy engine and every client can treat this exactly
  // like a recording. That is the whole point: no special cases.
  assert.equal(track.id, "live:akai:mpk-mini:1");
  assert.equal(track.title, "Live — Nina's SP-404");
  assert.equal(track.artist, "Nina");
  assert.equal(track.duration, 300);
  assert.equal(track.isLive, true);
  assert.equal(track.licenceClass, LicenceClass.OWNED_LOCAL);
  assert.equal(track.explicit, false);
});

test("a slot without a stated duration gets a sensible default", () => {
  const inst = new InstrumentSource({ portIdentity: "p", name: "Live" });
  assert.equal(inst.durationSec, DEFAULT_SLOT_SEC);
});

test("a performance ends when its booked duration elapses — REQ-INST-2", () => {
  const now = clock();
  const inst = new InstrumentSource({ portIdentity: "p", name: "Live", durationSec: 60, now });

  inst.begin();
  assert.equal(inst.check().done, false);

  now.advance(30000);
  inst.observe(noteOn());
  assert.equal(inst.check().done, false, "still within the slot");

  now.advance(31000);
  const status = inst.check();
  assert.equal(status.done, true);
  assert.equal(status.reason, "duration_elapsed");
});

test("a performer who stops playing releases the room — REQ-INST-2", () => {
  const now = clock();
  const inst = new InstrumentSource({ portIdentity: "p", name: "Live", durationSec: 600, now });

  inst.begin();
  inst.observe(noteOn());
  now.advance(10000);
  inst.observe(noteOn());
  assert.equal(inst.check().done, false, "still playing");

  // Silence. A human forgetting to finish must not become dead air.
  now.advance((IDLE_TIMEOUT_SEC + 1) * 1000);
  const status = inst.check();
  assert.equal(status.done, true);
  assert.equal(status.reason, "performer_idle");
});

test("activity is tracked from real note events", () => {
  const now = clock();
  const inst = new InstrumentSource({ portIdentity: "p", name: "Live", now });
  inst.begin();

  inst.observe(noteOn(60));
  inst.observe(noteOn(64));
  assert.equal(inst.noteCount, 2);

  // Note-off must not count as playing, or an idle performer would look active.
  inst.observe([Status.NOTE_OFF | 0, 60, 0]);
  assert.equal(inst.noteCount, 2);

  // Nor should clock traffic passing through.
  inst.observe([Status.CLOCK]);
  assert.equal(inst.noteCount, 2);
});

test("an inactive instrument ignores incoming MIDI", () => {
  const inst = new InstrumentSource({ portIdentity: "p", name: "Live" });
  inst.observe(noteOn());
  assert.equal(inst.noteCount, 0);
  assert.equal(inst.check().done, false);
});

/* ------------------------------------------------------------ registry */

test("registered instruments appear as queueable tracks", () => {
  const reg = new InstrumentRegistry();
  reg.register({ portIdentity: "a", name: "Live — Decks" });
  reg.register({ portIdentity: "b", name: "Live — Drum machine" });

  const tracks = reg.asTracks();
  assert.equal(tracks.length, 2);
  assert.ok(tracks.every((t) => t.isLive));
  assert.ok(reg.isInstrument("live:a"));
  assert.ok(!reg.isInstrument("cc-001"), "recordings are not instruments");
});

test("starting a performance supersedes any other in progress", () => {
  const reg = new InstrumentRegistry();
  const a = reg.register({ portIdentity: "a", name: "A" });
  const b = reg.register({ portIdentity: "b", name: "B" });

  const ended = [];
  a.on("end", (e) => ended.push(["a", e.reason]));

  reg.begin(a.id);
  assert.equal(reg.performing.id, a.id);

  reg.begin(b.id);
  assert.equal(reg.performing.id, b.id);
  assert.deepEqual(ended, [["a", "superseded"]], "two instruments cannot hold the room at once");
});

test("the registry routes MIDI only to the performing instrument", () => {
  const reg = new InstrumentRegistry();
  const a = reg.register({ portIdentity: "a", name: "A" });
  const b = reg.register({ portIdentity: "b", name: "B" });
  reg.begin(a.id);

  reg.observe("a", noteOn());
  reg.observe("b", noteOn());

  assert.equal(a.noteCount, 1);
  assert.equal(b.noteCount, 0, "a device that is not performing must not register activity");
});

test("tick emits finished so the queue can take the room back", () => {
  const now = clock();
  const reg = new InstrumentRegistry({ now });
  const inst = reg.register({ portIdentity: "a", name: "A", durationSec: 10 });

  const finished = [];
  reg.on("finished", (f) => finished.push(f.reason));

  reg.begin(inst.id);
  assert.equal(reg.tick(), null, "nothing to do yet");

  now.advance(11000);
  const result = reg.tick();
  assert.ok(result);
  assert.equal(result.reason, "duration_elapsed");
  assert.deepEqual(finished, ["duration_elapsed"]);
  assert.equal(reg.performing, null, "the room is free again");
});

test("unregistering ends an active performance", () => {
  const reg = new InstrumentRegistry();
  const inst = reg.register({ portIdentity: "a", name: "A" });
  reg.begin(inst.id);

  const ended = [];
  inst.on("end", (e) => ended.push(e.reason));

  assert.equal(reg.unregister(inst.id), true);
  assert.deepEqual(ended, ["unregistered"]);
  assert.equal(reg.unregister("nope"), false);
});

/* --------------------------------------------- the point of all of this */

test("a live instrument is scheduled by the real scheduler like any track", () => {
  const now = clock();
  const scheduler = new Scheduler({ now, mode: Mode.AUTONOMOUS });
  const reg = new InstrumentRegistry({ now: () => now() });

  const inst = reg.register({
    portIdentity: "akai:mpk-mini:1",
    name: "Live — Nina's SP-404",
    performer: "Nina",
    durationSec: 180
  });

  const recorded = {
    id: "cc-001",
    title: "Neon Harbour",
    artist: "Wavelet",
    duration: 200,
    genre: "House",
    explicit: false,
    licenceClass: LicenceClass.OWNED_LOCAL
  };

  // Both go through the same request path: same policy screen, same fairness
  // rules, same priority function, same queue.
  const live = scheduler.request({ track: inst.toTrack(), patronId: "staff" });
  const song = scheduler.request({ track: recorded, patronId: "p1" });

  assert.equal(live.ok, true, "a live instrument passes policy like any track");
  assert.equal(song.ok, true);
  assert.equal(live.position, 1);
  assert.equal(song.position, 2);

  // And it appears to patrons in the same queue, with a position in line.
  const queue = scheduler.publicQueue();
  assert.equal(queue.length, 2);
  assert.equal(queue[0].track.title, "Live — Nina's SP-404");

  // Votes apply to it exactly as they would to a recording.
  scheduler.vote(song.entry.id, "p2");
  scheduler.vote(song.entry.id, "p3");
  assert.equal(scheduler.positionOf(song.entry.id), 1, "the crowd can vote a song above the live set");

  // And it drains through the normal lifecycle.
  scheduler.tick();
  assert.equal(song.entry.state, State.CUED);
});

test("an unlicensed-looking live source is still screened, not waved through", () => {
  const scheduler = new Scheduler({ mode: Mode.AUTONOMOUS, policy: { explicitAllowed: false } });
  const reg = new InstrumentRegistry();
  const inst = reg.register({ portIdentity: "a", name: "Live" });

  const track = { ...inst.toTrack(), explicit: true };
  const result = scheduler.request({ track, patronId: "p1" });

  assert.equal(result.ok, false, "live sources go through the same policy gate");
  assert.equal(result.reason, "explicit_content");
});
