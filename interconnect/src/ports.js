// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * MIDI port abstraction — REQ-MIDI-1, REQ-MIDI-2, REQ-MIDI-3.
 *
 * ## Why ports are addressed by identity, not index
 *
 * RtMidi and the Web MIDI API both enumerate ports by position. That is a known
 * defect class: unplug a controller, plug in a different one, reboot — and the
 * indices shift, so every saved mapping silently targets the wrong hardware.
 *
 * CrowdDeck binds mappings to a **stable identity** derived from manufacturer,
 * product and serial where available (REQ-MIDI-2), so a mapping survives a
 * reboot and re-binds automatically on reattach (REQ-MIDI-3, AC-10).
 *
 * ## Why the backend is pluggable
 *
 * Real MIDI I/O needs a native binding (libremidi, per the OSS triage). That
 * lands with the engine plane. Everything *interesting* — identity, hot-plug
 * rebinding, mapping, soft-takeover, clock — is transport-independent logic that
 * can be built and tested now against a fake backend, exactly as the audio sink
 * was. `MidiBackend` is the seam the native driver drops into.
 */

import { EventEmitter } from "node:events";

/** MIDI status bytes we care about. */
export const Status = Object.freeze({
  NOTE_OFF: 0x80,
  NOTE_ON: 0x90,
  CONTROL_CHANGE: 0xb0,
  PROGRAM_CHANGE: 0xc0,
  PITCH_BEND: 0xe0,
  CLOCK: 0xf8,
  START: 0xfa,
  CONTINUE: 0xfb,
  STOP: 0xfc
});

/**
 * A stable, human-meaningful identity for a port.
 *
 * Deliberately does **not** include the OS index. Two identical controllers
 * without serial numbers will collide; that is preferable to the alternative,
 * where every mapping breaks whenever anything is replugged.
 *
 * @param {{manufacturer?: string, product?: string, serial?: string, name?: string}} info
 * @returns {string}
 */
export function portIdentity(info) {
  const parts = [
    info.manufacturer ?? "unknown",
    info.product ?? info.name ?? "unknown",
    info.serial ?? ""
  ]
    .map((p) => String(p).trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean);
  return parts.join(":");
}

/**
 * @abstract
 * Contract a native MIDI driver must satisfy.
 *
 * Emits:
 *   - `attach` ({identity, info})
 *   - `detach` ({identity})
 *   - `message` ({identity, data: number[], timestamp})
 */
export class MidiBackend extends EventEmitter {
  /* eslint-disable no-unused-vars */
  /** @returns {Array<{identity: string, info: object, direction: "in"|"out"|"both"}>} */
  listPorts() { throw new Error("not implemented"); }
  /** @param {string} _identity @param {number[]} _data */
  send(_identity, _data) { throw new Error("not implemented"); }
  open() { throw new Error("not implemented"); }
  close() { throw new Error("not implemented"); }
  /* eslint-enable no-unused-vars */
}

/**
 * An in-memory backend for tests and for running without hardware.
 *
 * Being able to simulate attach, detach and inbound messages is what lets the
 * hot-plug rebinding requirement (AC-10) be tested at all — reproducing it with
 * real hardware in CI is not possible.
 */
export class FakeMidiBackend extends MidiBackend {
  constructor() {
    super();
    /** @type {Map<string, {identity: string, info: object, direction: string}>} */
    this.ports = new Map();
    /** @type {Array<{identity: string, data: number[]}>} */
    this.sent = [];
    this.opened = false;
  }

  open() { this.opened = true; }
  close() { this.opened = false; this.ports.clear(); }

  listPorts() { return [...this.ports.values()]; }

  send(identity, data) {
    this.sent.push({ identity, data: [...data] });
  }

  /* ---- simulation helpers ---- */

  /** @param {{manufacturer?: string, product?: string, serial?: string, direction?: string}} info */
  attach(info) {
    const identity = portIdentity(info);
    const port = { identity, info, direction: info.direction ?? "both" };
    this.ports.set(identity, port);
    this.emit("attach", port);
    return identity;
  }

  detach(identity) {
    if (!this.ports.delete(identity)) return false;
    this.emit("detach", { identity });
    return true;
  }

  /** Simulate an inbound message from a device. */
  receive(identity, data) {
    this.emit("message", { identity, data: [...data], timestamp: Date.now() });
  }

  /** Convenience: a control-change message. */
  cc(identity, channel, controller, value) {
    this.receive(identity, [Status.CONTROL_CHANGE | (channel & 0x0f), controller & 0x7f, value & 0x7f]);
  }

  /** Convenience: a note-on message. */
  noteOn(identity, channel, note, velocity = 127) {
    this.receive(identity, [Status.NOTE_ON | (channel & 0x0f), note & 0x7f, velocity & 0x7f]);
  }
}

/**
 * Decode a raw MIDI message into a control-shaped event.
 *
 * Note-on with velocity 0 is normalised to note-off, because a great many
 * controllers send it that way and treating it as a press is a classic bug.
 *
 * @param {number[]} data
 * @returns {{kind: string, channel: number, id: number, value: number, raw: number[]}|null}
 */
export function decodeMessage(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const status = data[0] & 0xf0;
  const channel = data[0] & 0x0f;

  switch (status) {
    case Status.CONTROL_CHANGE:
      return { kind: "cc", channel, id: data[1], value: data[2] / 127, raw: data };

    case Status.NOTE_ON: {
      const velocity = data[2] ?? 0;
      if (velocity === 0) return { kind: "note", channel, id: data[1], value: 0, raw: data };
      return { kind: "note", channel, id: data[1], value: velocity / 127, raw: data };
    }

    case Status.NOTE_OFF:
      return { kind: "note", channel, id: data[1], value: 0, raw: data };

    case Status.PITCH_BEND: {
      const raw14 = ((data[2] & 0x7f) << 7) | (data[1] & 0x7f);
      return { kind: "pitchbend", channel, id: 0, value: raw14 / 16383, raw: data };
    }

    default:
      return null; // clock and system messages are handled elsewhere
  }
}

/**
 * Tracks which mappings are bound to which currently-attached ports.
 *
 * A mapping for an absent device stays registered and simply becomes active
 * again when the device reappears — that is the whole point of identity-based
 * binding (AC-10).
 */
export class PortRegistry extends EventEmitter {
  /** @param {MidiBackend} backend */
  constructor(backend) {
    super();
    this.backend = backend;
    /** identity -> port */
    this.attached = new Map();

    backend.on("attach", (port) => {
      this.attached.set(port.identity, port);
      this.emit("attach", port);
    });
    backend.on("detach", ({ identity }) => {
      this.attached.delete(identity);
      this.emit("detach", { identity });
    });
  }

  isAttached(identity) {
    return this.attached.has(identity);
  }

  list() {
    return [...this.attached.values()];
  }
}
