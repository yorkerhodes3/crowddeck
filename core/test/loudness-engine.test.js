// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Loudness reaches the engine — REQ-CON-4, CON-6.
 *
 * `loudness.test.js` checks the arithmetic. This checks the wiring: that the gain
 * is actually written to the deck, on the right control, at the right moment, and
 * that a stale trim from the previous track cannot leak into the next one.
 *
 * Run against a real engine over a real socket, because "we computed a number" and
 * "the deck is at that level" are different claims.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { EngineAdapter, PRIMARY_DECK } from "../src/engine-adapter.js";
import { computeGain, dbToLinear } from "../src/loudness.js";
import { startEngine } from "../../engine-stub/test/helpers.js";

/** Records every control write, so we can assert on what the deck was told. */
function recordingClient(inner) {
  const writes = [];
  return {
    writes,
    supportsGapless: inner.supportsGapless,
    async load(...a) {
      writes.push({ op: "load", group: a[0], track: a[1]?.id });
      return inner.load(...a);
    },
    async set(group, item, value) {
      writes.push({ op: "set", group, item, value });
      return inner.set(group, item, value);
    },
    async get(...a) {
      return inner.get(...a);
    },
    async queueNext(...a) {
      return inner.queueNext(...a);
    },
    on() {},
    off() {}
  };
}

function harness(t, client, opts = {}) {
  const events = [];
  const scheduler = {
    policy: {},
    emit: (name, payload) => events.push({ name, payload }),
    markPlaying: () => {},
    skip: () => {},
    tick: () => {}
  };
  const adapter = new EngineAdapter({ scheduler, client, ...opts });
  return { adapter, events };
}

const entry = (track) => ({ id: "qe1", track, state: "cued", deckGroup: null });

test("the deck is trimmed before the track is audible — REQ-CON-4", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());
  const client = recordingClient(h.client);
  const { adapter } = harness(t, client);

  // -20 LUFS with plenty of headroom: wants a clean +6 dB.
  await adapter.onCue(entry({ id: "t1", duration: 200000, loudnessLufs: -20, truePeakDb: -12 }));

  const ops = client.writes.map((w) => `${w.op}:${w.item ?? w.track}`);
  const pregainAt = ops.indexOf("set:pregain");
  const playAt = ops.indexOf("set:play");

  assert.ok(pregainAt >= 0, "pregain must be written");
  assert.ok(playAt >= 0, "play must be written");
  assert.ok(
    pregainAt < playAt,
    `pregain was set after play (${ops.join(", ")}) — the room would hear the correction`
  );
});

test("the value written is the computed gain, in linear terms", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());
  const client = recordingClient(h.client);
  const { adapter } = harness(t, client);

  const track = { id: "t1", duration: 200000, loudnessLufs: -20, truePeakDb: -12 };
  await adapter.onCue(entry(track));

  const written = client.writes.find((w) => w.item === "pregain").value;
  const expected = dbToLinear(computeGain(track).gainDb);

  assert.ok(Math.abs(written - expected) < 1e-9, `wrote ${written}, expected ${expected}`);
  assert.ok(written > 1, "a quiet track should be boosted above unity");
});

test("gain goes to pregain, never to the DJ's volume fader", async (t) => {
  // volume belongs to whoever is mixing. Writing to it would fight a human hand
  // and silently undo their moves mid-set.
  const h = await startEngine();
  t.after(() => h.stop());
  const client = recordingClient(h.client);
  const { adapter } = harness(t, client);

  await adapter.onCue(entry({ id: "t1", duration: 200000, loudnessLufs: -20, truePeakDb: -12 }));

  assert.ok(client.writes.some((w) => w.item === "pregain"));
  assert.ok(
    !client.writes.some((w) => w.item === "volume"),
    "normalisation must not touch the fader"
  );
});

test("a peak-limited track is trimmed to the safe gain, not the ideal one", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());
  const client = recordingClient(h.client);
  const { adapter } = harness(t, client);

  // Wants +6 dB but peaks at -2 dBTP, so only +1 dB fits under the ceiling.
  await adapter.onCue(entry({ id: "t1", duration: 200000, loudnessLufs: -20, truePeakDb: -2 }));

  const written = client.writes.find((w) => w.item === "pregain").value;
  assert.ok(
    Math.abs(written - dbToLinear(1)) < 1e-9,
    "the engine must receive the peak-limited gain, or normalisation causes clipping"
  );
});

test("an unmeasured track resets the deck to unity, not the previous trim", async (t) => {
  // The bug this prevents: track A is boosted +6 dB, track B has no measurement,
  // and B inherits A's trim — one track's correction applied to another, which is
  // worse than not normalising at all.
  const h = await startEngine();
  t.after(() => h.stop());
  const client = recordingClient(h.client);
  const { adapter } = harness(t, client);

  await adapter.onCue(entry({ id: "loud", duration: 200000, loudnessLufs: -20, truePeakDb: -12 }));
  adapter.loaded = null;
  await adapter.onCue({ ...entry({ id: "unknown", duration: 200000 }), id: "qe2" });

  const pregains = client.writes.filter((w) => w.item === "pregain").map((w) => w.value);
  assert.equal(pregains.length, 2, "pregain is written for every track, including unmeasured ones");
  assert.ok(Math.abs(pregains[1] - 1) < 1e-9, "the second track plays at unity, not +6 dB");
});

test("the decision is reported so a console can show it", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());
  const client = recordingClient(h.client);
  const { adapter, events } = harness(t, client);

  await adapter.onCue(entry({ id: "t1", duration: 200000, loudnessLufs: -20, truePeakDb: -2 }));

  const loudness = events.find((e) => e.name === "loudness");
  assert.ok(loudness, "a loudness event must be emitted");
  assert.equal(loudness.payload.peakLimited, true);
  assert.match(loudness.payload.reason, /would clip/);
});

test("normalisation can be switched off", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());
  const client = recordingClient(h.client);
  const { adapter } = harness(t, client, { normaliseLoudness: false });

  await adapter.onCue(entry({ id: "t1", duration: 200000, loudnessLufs: -20, truePeakDb: -12 }));

  assert.ok(
    !client.writes.some((w) => w.item === "pregain"),
    "an operator who wants raw levels must be able to have them"
  );
});

test("a failed gain write does not stop the music — REQ-FALL-3", async (t) => {
  // A track at the wrong level is a lesser problem than a track that does not
  // play. The room must not go silent over a recoverable fault.
  const h = await startEngine();
  t.after(() => h.stop());

  const client = recordingClient(h.client);
  const realSet = client.set.bind(client);
  client.set = async (group, item, value) => {
    if (item === "pregain") throw new Error("engine refused the trim");
    return realSet(group, item, value);
  };

  const { adapter, events } = harness(t, client);
  await adapter.onCue(entry({ id: "t1", duration: 200000, loudnessLufs: -20, truePeakDb: -12 }));

  assert.ok(
    client.writes.some((w) => w.item === "play" && w.value === 1),
    "the track still plays"
  );
  assert.ok(events.some((e) => e.name === "engineError"), "and the failure is reported");
});

test("the target is configurable through the adapter", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());
  const client = recordingClient(h.client);
  const { adapter } = harness(t, client, { loudnessOptions: { targetLufs: -18 } });

  await adapter.onCue(entry({ id: "t1", duration: 200000, loudnessLufs: -20, truePeakDb: -12 }));

  const written = client.writes.find((w) => w.item === "pregain").value;
  assert.ok(
    Math.abs(written - dbToLinear(2)) < 1e-9,
    "a -18 LUFS target needs +2 dB, not the default's +6"
  );
});

test("the deck really is at the level we set", async (t) => {
  // Reads the value back over CDEP rather than trusting the write.
  const h = await startEngine();
  t.after(() => h.stop());
  const { adapter } = harness(t, h.client);

  await adapter.onCue(entry({ id: "t1", duration: 200000, loudnessLufs: -20, truePeakDb: -12 }));

  const actual = await h.client.get(PRIMARY_DECK, "pregain");
  assert.ok(Math.abs(actual - dbToLinear(6)) < 0.01, `deck pregain is ${actual}`);
});
