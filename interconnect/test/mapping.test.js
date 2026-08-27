// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

import { test } from "node:test";
import assert from "node:assert/strict";
import { Mapping, MappingEngine, MidiLearn } from "../src/mapping.js";
import { FakeMidiBackend, Status } from "../src/ports.js";

const DESCRIPTORS = [
  { group: "[Channel1]", item: "volume", type: "float", min: 0, max: 1, default: 1, readonly: false, label: "Volume" },
  { group: "[Channel1]", item: "rate", type: "float", min: -1, max: 1, default: 0, readonly: false, label: "Tempo" },
  { group: "[Channel1]", item: "play", type: "bool", min: 0, max: 1, default: 0, readonly: false, label: "Play" },
  { group: "[Channel1]", item: "bpm", type: "float", min: 0, max: 300, default: 0, readonly: true, label: "BPM" },
  { group: "[Master]", item: "crossfader", type: "float", min: -1, max: 1, default: 0, readonly: false, label: "Crossfader" }
];

const PORT = "pioneer-dj:ddj-flx4:ab12";

function setup() {
  const engine = new MappingEngine({ descriptors: DESCRIPTORS });
  const mapping = new Mapping({ name: "DDJ-FLX4", portIdentity: PORT });
  engine.addMapping(mapping);
  return { engine, mapping };
}

const cc = (channel, controller, value) => [Status.CONTROL_CHANGE | channel, controller, value];

/* ------------------------------------------------------- mapping format */

test("mapping targets are generated from CDEP descriptors — REQ-MIDI-5", () => {
  const engine = new MappingEngine({ descriptors: DESCRIPTORS });
  const targets = engine.targets();

  assert.ok(targets.length > 0);
  assert.ok(
    !targets.some((t) => t.item === "bpm"),
    "readonly controls are not mappable targets"
  );
  assert.ok(targets.some((t) => t.group === "[Channel1]" && t.item === "volume"));
  // Nothing here is engine-specific: the list came entirely from `describe`.
});

test("a mapping round-trips through JSON — REQ-MIDI-6", () => {
  const { mapping } = setup();
  mapping.add({ kind: "cc", channel: 0, controller: 7, group: "[Channel1]", item: "volume" });
  mapping.add({ kind: "note", channel: 0, controller: 60, group: "[Channel1]", item: "play", behaviour: "toggle" });

  const json = JSON.parse(JSON.stringify(mapping));
  const restored = Mapping.fromJSON(json);

  assert.equal(restored.name, mapping.name);
  assert.equal(restored.portIdentity, mapping.portIdentity);
  assert.equal(restored.bindings.length, 2);
  assert.equal(restored.bindings[0].item, "volume");
});

test("an unknown mapping format is refused rather than half-loaded", () => {
  assert.throws(() => Mapping.fromJSON({ format: "someone-elses/2", bindings: [] }), /unsupported/);
});

/* ------------------------------------------------------- soft-takeover */

test("an absolute control is suppressed until the fader catches up — AC-11", () => {
  const { engine, mapping } = setup();
  mapping.add({ kind: "cc", channel: 0, controller: 7, group: "[Channel1]", item: "volume" });

  // Software is at 0.8; the physical fader is down at 0.
  engine.setSoftwareValue("[Channel1]", "volume", 0.8);
  engine.armTakeover("[Channel1]", "volume");

  const low = engine.handle(PORT, cc(0, 7, 0));
  assert.equal(low.suppressed, true, "must not jump to the fader position");
  assert.equal(low.value, 0.8, "the parameter holds its software value");
  assert.equal(low.reason, "soft_takeover");

  const halfway = engine.handle(PORT, cc(0, 7, 64));
  assert.equal(halfway.suppressed, true, "still short of 0.8");

  // Crossing the software value hands control over.
  const caught = engine.handle(PORT, cc(0, 7, 102)); // ~0.803
  assert.notEqual(caught.suppressed, true, "control is picked up on crossing");

  const after = engine.handle(PORT, cc(0, 7, 127));
  assert.equal(after.value, 1, "and tracks normally from then on");
  assert.notEqual(after.suppressed, true);
});

test("takeover is judged in normalised space, so it works on bipolar controls", () => {
  const { engine, mapping } = setup();
  mapping.add({ kind: "cc", channel: 0, controller: 20, group: "[Channel1]", item: "rate" });

  // rate runs -1..1; software sits at 0, which is normalised 0.5.
  engine.setSoftwareValue("[Channel1]", "rate", 0);
  engine.armTakeover("[Channel1]", "rate");

  assert.equal(engine.handle(PORT, cc(0, 20, 0)).suppressed, true);
  const caught = engine.handle(PORT, cc(0, 20, 64)); // ~0.504 normalised
  assert.notEqual(caught.suppressed, true, "0.5 normalised corresponds to rate 0");
});

test("takeover re-arms when software moves behind the hardware's back", () => {
  const { engine, mapping } = setup();
  mapping.add({ kind: "cc", channel: 0, controller: 7, group: "[Channel1]", item: "volume" });

  engine.setSoftwareValue("[Channel1]", "volume", 0);
  engine.handle(PORT, cc(0, 7, 0)); // pick up at the bottom
  assert.equal(engine.handle(PORT, cc(0, 7, 64)).suppressed, undefined, "tracking normally");

  // A track loads and the engine resets volume; the fader has not moved.
  engine.setSoftwareValue("[Channel1]", "volume", 1);
  engine.armTakeover("[Channel1]", "volume");
  assert.equal(engine.isAwaitingTakeover("[Channel1]", "volume"), true);
  assert.equal(engine.handle(PORT, cc(0, 7, 70)).suppressed, true, "must not jump again");
});

test("a freshly loaded mapping starts suppressed", () => {
  const engine = new MappingEngine({ descriptors: DESCRIPTORS });
  const mapping = new Mapping({ name: "M", portIdentity: PORT });
  mapping.add({ kind: "cc", channel: 0, controller: 7, group: "[Channel1]", item: "volume" });
  engine.addMapping(mapping);

  assert.equal(
    engine.isAwaitingTakeover("[Channel1]", "volume"),
    true,
    "loading a mapping must not fling parameters to wherever the hardware sits"
  );
});

/* ---------------------------------------------------------- behaviours */

test("values are scaled into each control's declared range", () => {
  const { engine, mapping } = setup();
  mapping.add({ kind: "cc", channel: 0, controller: 20, group: "[Channel1]", item: "rate", softTakeover: false });

  assert.equal(engine.handle(PORT, cc(0, 20, 0)).value, -1);
  assert.equal(engine.handle(PORT, cc(0, 20, 127)).value, 1);
  assert.ok(Math.abs(engine.handle(PORT, cc(0, 20, 64)).value) < 0.02, "centre is about 0");
});

test("a trigger fires on press and ignores release", () => {
  const { engine, mapping } = setup();
  mapping.add({ kind: "note", channel: 0, controller: 60, group: "[Channel1]", item: "play", behaviour: "trigger" });

  const press = engine.handle(PORT, [Status.NOTE_ON | 0, 60, 127]);
  assert.equal(press.value, 1);
  assert.equal(engine.handle(PORT, [Status.NOTE_OFF | 0, 60, 0]), null, "release does nothing");
});

test("a toggle alternates on each press", () => {
  const { engine, mapping } = setup();
  mapping.add({ kind: "note", channel: 0, controller: 61, group: "[Channel1]", item: "play", behaviour: "toggle" });

  assert.equal(engine.handle(PORT, [Status.NOTE_ON | 0, 61, 127]).value, 1);
  assert.equal(engine.handle(PORT, [Status.NOTE_ON | 0, 61, 127]).value, 0);
  assert.equal(engine.handle(PORT, [Status.NOTE_ON | 0, 61, 127]).value, 1);
});

test("a relative encoder moves the value up and down", () => {
  const { engine, mapping } = setup();
  mapping.add({ kind: "cc", channel: 0, controller: 30, group: "[Channel1]", item: "volume", behaviour: "relative" });
  engine.setSoftwareValue("[Channel1]", "volume", 0.5);

  const up = engine.handle(PORT, cc(0, 30, 5)); // clockwise
  assert.ok(up.value > 0.5);
  const down = engine.handle(PORT, cc(0, 30, 123)); // 123 - 128 = -5
  assert.ok(down.value < up.value);
});

test("an inverted binding flips the sense of the control", () => {
  const { engine, mapping } = setup();
  mapping.add({ kind: "cc", channel: 0, controller: 7, group: "[Channel1]", item: "volume", invert: true, softTakeover: false });
  assert.equal(engine.handle(PORT, cc(0, 7, 0)).value, 1);
  assert.equal(engine.handle(PORT, cc(0, 7, 127)).value, 0);
});

test("messages from an unmapped port or control are ignored", () => {
  const { engine, mapping } = setup();
  mapping.add({ kind: "cc", channel: 0, controller: 7, group: "[Channel1]", item: "volume" });

  assert.equal(engine.handle("some-other-device", cc(0, 7, 64)), null);
  assert.equal(engine.handle(PORT, cc(0, 99, 64)), null, "unmapped CC");
  assert.equal(engine.handle(PORT, cc(5, 7, 64)), null, "right CC, wrong channel");
});

/* -------------------------------------------------------------- learn */

test("MIDI learn binds the next control touched", () => {
  const { mapping } = setup();
  const learn = new MidiLearn();

  assert.equal(learn.learning, false);
  learn.begin({ group: "[Master]", item: "crossfader" });
  assert.equal(learn.learning, true);

  const binding = learn.observe(PORT, cc(3, 42, 100), mapping);
  assert.ok(binding, "a binding should be created");
  assert.equal(binding.group, "[Master]");
  assert.equal(binding.item, "crossfader");
  assert.equal(binding.channel, 3);
  assert.equal(binding.controller, 42);
  assert.equal(learn.learning, false, "learn mode ends after one binding");
});

test("learn infers a sensible behaviour from the control type", () => {
  const { mapping } = setup();
  const learn = new MidiLearn();

  learn.begin({ group: "[Channel1]", item: "play" });
  const fromNote = learn.observe(PORT, [Status.NOTE_ON | 0, 60, 127], mapping);
  assert.equal(fromNote.behaviour, "trigger", "a pad should trigger");

  learn.begin({ group: "[Channel1]", item: "volume" });
  const fromCc = learn.observe(PORT, cc(0, 7, 64), mapping);
  assert.equal(fromCc.behaviour, "absolute", "a fader should be absolute");
});

test("learn ignores messages from a different device", () => {
  const { mapping } = setup();
  const learn = new MidiLearn();
  learn.begin({ group: "[Channel1]", item: "volume" });

  assert.equal(learn.observe("another-device", cc(0, 7, 64), mapping), null);
  assert.equal(learn.learning, true, "still waiting for the right device");
});

test("learn can be cancelled", () => {
  const { mapping } = setup();
  const learn = new MidiLearn();
  learn.begin({ group: "[Channel1]", item: "volume" });
  learn.cancel();
  assert.equal(learn.learning, false);
  assert.equal(learn.observe(PORT, cc(0, 7, 64), mapping), null);
});

test("a mapping can be removed when its device goes away", () => {
  const { engine, mapping } = setup();
  mapping.add({ kind: "cc", channel: 0, controller: 7, group: "[Channel1]", item: "volume", softTakeover: false });
  assert.ok(engine.handle(PORT, cc(0, 7, 64)));

  engine.removeMapping(PORT);
  assert.equal(engine.handle(PORT, cc(0, 7, 64)), null);
});

test("bindings can be removed individually", () => {
  const { mapping } = setup();
  const b = mapping.add({ kind: "cc", channel: 0, controller: 7, group: "[Channel1]", item: "volume" });
  assert.equal(mapping.bindings.length, 1);
  assert.equal(mapping.remove(b.id), true);
  assert.equal(mapping.bindings.length, 0);
  assert.equal(mapping.remove("nope"), false);
});

test("an end-to-end sweep from a fake device reaches the right control", () => {
  const backend = new FakeMidiBackend();
  const id = backend.attach({ manufacturer: "Pioneer DJ", product: "DDJ-FLX4", serial: "AB12" });
  assert.equal(id, PORT);

  const { engine, mapping } = setup();
  mapping.add({ kind: "cc", channel: 0, controller: 7, group: "[Channel1]", item: "volume", softTakeover: false });

  const writes = [];
  backend.on("message", (m) => {
    const w = engine.handle(m.identity, m.data);
    if (w && !w.suppressed) writes.push(w);
  });

  backend.cc(id, 0, 7, 0);
  backend.cc(id, 0, 7, 64);
  backend.cc(id, 0, 7, 127);

  assert.equal(writes.length, 3);
  assert.equal(writes[0].value, 0);
  assert.equal(writes[2].value, 1);
  assert.ok(writes.every((w) => w.group === "[Channel1]" && w.item === "volume"));
});
