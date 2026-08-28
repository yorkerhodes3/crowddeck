// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Track duration must mean one thing — API-2.
 *
 * Found while mapping queue entries to Subsonic `Child` objects, which need
 * seconds. Two halves of the system disagreed:
 *
 *   providers/ and data/  ->  milliseconds  (jamendo `* 1000`, `duration_ms`)
 *   engine-stub/ and instruments -> seconds
 *
 * So a Jamendo or OpenSubsonic track handed to the engine was loaded as a
 * *245,000 second* track — sixty-eight hours — and the deck would never reach its
 * end. Nothing crashed, which is why it survived: the failure is a track that
 * simply never finishes.
 *
 * These tests pin the contract in the two places it is crossed, so the next person
 * to add a provider or an engine cannot reintroduce it quietly.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { startEngine } from "../../engine-stub/test/helpers.js";
import { Scheduler, Mode } from "../../core/src/scheduler.js";
import { EngineAdapter, PRIMARY_DECK, toCdepSeconds } from "../../core/src/engine-adapter.js";
import { toChild } from "../src/subsonic.js";
import { DemoCatalog } from "../src/demo-catalog.js";
import { InstrumentSource } from "../../interconnect/src/instrument.js";

/** What a provider returns: REQ-CON-5 tracks carry milliseconds. */
const providerTrack = {
  id: "cc-1",
  title: "Tidal Flats",
  duration: 245_000,
  licenceClass: "cc_attribution"
};

test("a provider track reaches the deck as four minutes, not sixty-eight hours", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const scheduler = new Scheduler({ venueId: "v1", mode: Mode.ATTENDED });
  const adapter = new EngineAdapter({ scheduler, client: h.client, deck: PRIMARY_DECK });

  const result = scheduler.request({
    track: providerTrack,
    patronId: "p1",
    context: { venueMinuteOfDay: 720, nowMs: Date.now(), holdsPro: true }
  });
  assert.equal(result.ok, true, `the track was refused: ${result.detail ?? result.reason}`);
  scheduler.promote(result.entry.id, { deckGroup: PRIMARY_DECK });
  await adapter.onCue(result.entry);

  // Read it back off the deck rather than trusting the call: this is the number
  // the engine will actually count up to before it reports the track ended.
  const duration = await h.client.get(PRIMARY_DECK, "duration");
  assert.ok(
    duration > 200 && duration < 300,
    `the deck reports ${duration}s for a 245,000 ms track — the unit boundary is broken`
  );
});

test("the conversion refuses to invent a duration it does not have", () => {
  assert.equal(toCdepSeconds(245_000), 245);
  // Not 0: an absent duration must stay absent, so the engine applies its own
  // default instead of being told the track is zero seconds long.
  assert.equal(toCdepSeconds(undefined), undefined);
  assert.equal(toCdepSeconds(null), undefined);
  assert.equal(toCdepSeconds(0), undefined);
  assert.equal(toCdepSeconds(-5), undefined);
  assert.equal(toCdepSeconds(NaN), undefined);
});

test("a queue entry becomes a Subsonic duration in seconds", () => {
  const child = toChild(providerTrack);
  assert.equal(child.duration, 245, "Subsonic durations are seconds");
});

test("the demo catalogue speaks the same unit as the providers", () => {
  const track = new DemoCatalog().byId.get("cc-001");
  const child = toChild(track);
  // 212 seconds. If the catalogue were still storing seconds this would be 0.
  assert.equal(child.duration, 212);
});

test("a live instrument's booked slot survives the round trip", () => {
  const inst = new InstrumentSource({ portIdentity: "p1", name: "Rhodes", durationSec: 300 });
  const child = toChild(inst.toTrack());
  assert.equal(child.duration, 300, "a five-minute slot must read as five minutes");
});

test("an unknown duration stays unknown rather than becoming zero", () => {
  assert.equal(toChild({ id: "x", title: "?" }).duration, null);
});
