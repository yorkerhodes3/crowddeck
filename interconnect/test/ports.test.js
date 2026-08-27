// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FakeMidiBackend,
  PortRegistry,
  Status,
  decodeMessage,
  portIdentity
} from "../src/ports.js";

test("port identity is derived from device metadata, never the OS index", () => {
  const a = portIdentity({ manufacturer: "Pioneer DJ", product: "DDJ-FLX4", serial: "AB12" });
  const b = portIdentity({ manufacturer: "Pioneer DJ", product: "DDJ-FLX4", serial: "AB12" });
  assert.equal(a, b, "the same device must yield the same identity");
  assert.match(a, /pioneer-dj:ddj-flx4:ab12/);

  const other = portIdentity({ manufacturer: "Pioneer DJ", product: "DDJ-FLX4", serial: "CD34" });
  assert.notEqual(a, other, "serial numbers distinguish identical models");
});

test("identity survives the plug order changing — AC-10", () => {
  const backend = new FakeMidiBackend();
  const registry = new PortRegistry(backend);

  const id = backend.attach({ manufacturer: "Native Instruments", product: "S4", serial: "X1" });
  assert.ok(registry.isAttached(id));

  // Something else is plugged in first this time; on an index-based system the
  // controller would now be at a different position and its mapping would break.
  backend.detach(id);
  backend.attach({ manufacturer: "Focusrite", product: "Scarlett", serial: "Z9" });
  const idAgain = backend.attach({ manufacturer: "Native Instruments", product: "S4", serial: "X1" });

  assert.equal(idAgain, id, "identity is stable regardless of enumeration order");
  assert.ok(registry.isAttached(id));
});

test("detach and reattach are observable so mappings can rebind — REQ-MIDI-3", () => {
  const backend = new FakeMidiBackend();
  const registry = new PortRegistry(backend);

  const events = [];
  registry.on("attach", (p) => events.push(["attach", p.identity]));
  registry.on("detach", (p) => events.push(["detach", p.identity]));

  const id = backend.attach({ manufacturer: "Akai", product: "MPK", serial: "1" });
  backend.detach(id);
  backend.attach({ manufacturer: "Akai", product: "MPK", serial: "1" });

  assert.deepEqual(events, [["attach", id], ["detach", id], ["attach", id]]);
  assert.ok(registry.isAttached(id), "the mapping's device is available again");
});

test("a device with no serial still gets a usable identity", () => {
  const id = portIdentity({ manufacturer: "Generic", product: "MIDI Keyboard" });
  assert.equal(id, "generic:midi-keyboard");
});

test("an unknown device does not throw", () => {
  assert.equal(portIdentity({}), "unknown:unknown");
  assert.equal(portIdentity({ name: "Some Port" }), "unknown:some-port");
});

/* -------------------------------------------------------------- decoding */

test("control change decodes to a normalised value", () => {
  const e = decodeMessage([Status.CONTROL_CHANGE | 2, 7, 127]);
  assert.equal(e.kind, "cc");
  assert.equal(e.channel, 2);
  assert.equal(e.id, 7);
  assert.equal(e.value, 1);
});

test("note-on with velocity zero is treated as note-off", () => {
  // A very common controller behaviour; treating it as a press is a classic bug.
  const e = decodeMessage([Status.NOTE_ON | 0, 60, 0]);
  assert.equal(e.kind, "note");
  assert.equal(e.value, 0, "velocity 0 means release, not a press at zero force");
});

test("note-off decodes as a release", () => {
  const e = decodeMessage([Status.NOTE_OFF | 0, 60, 64]);
  assert.equal(e.kind, "note");
  assert.equal(e.value, 0);
});

test("pitch bend uses the full 14-bit range", () => {
  const centre = decodeMessage([Status.PITCH_BEND | 0, 0x00, 0x40]);
  assert.ok(Math.abs(centre.value - 0.5) < 0.01, "centre should be about 0.5");

  const max = decodeMessage([Status.PITCH_BEND | 0, 0x7f, 0x7f]);
  assert.equal(max.value, 1);
});

test("clock and system messages are not decoded as controls", () => {
  assert.equal(decodeMessage([Status.CLOCK]), null);
  assert.equal(decodeMessage([]), null);
  assert.equal(decodeMessage(null), null);
});

test("the fake backend records what was sent, so output is assertable", () => {
  const backend = new FakeMidiBackend();
  const id = backend.attach({ manufacturer: "Test", product: "Out" });
  backend.send(id, [Status.CLOCK]);
  assert.deepEqual(backend.sent, [{ identity: id, data: [Status.CLOCK] }]);
});
