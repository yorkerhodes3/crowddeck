// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Controller mapping and MIDI learn — REQ-MIDI-4, REQ-MIDI-5, REQ-MIDI-6.
 *
 * ## Mappings target CDEP controls, not engine internals
 *
 * A binding names a `(group, item)` pair — `[Channel1]`/`rate`. The list of
 * legal targets is generated from CDEP `describe` (REQ-CDEP-13), so the mapping
 * layer holds **no hard-coded knowledge of any engine**. Swap the stub for the
 * Mixxx-derived engine and existing mappings keep working, provided the control
 * names match.
 *
 * ## Soft-takeover, and why it is not optional
 *
 * A physical fader sits where the DJ last left it. Software state moves on —
 * another controller, the autonomous mixer, a loaded track. Touch the fader now
 * and, without protection, the parameter *jumps* to the fader's position. In a
 * venue that is an audible glitch in front of people.
 *
 * Soft-takeover (REQ-MIDI-4, AC-11) suppresses the control until its physical
 * position crosses the current software value. From then on it tracks normally.
 */

import { decodeMessage } from "./ports.js";

/** How close counts as "caught up", as a fraction of full range. */
export const TAKEOVER_EPSILON = 0.02;

/**
 * @typedef {object} Binding
 * @property {string} id
 * @property {string} portIdentity  which device this binding belongs to
 * @property {"cc"|"note"|"pitchbend"} kind
 * @property {number} channel
 * @property {number} controller    CC number or note number
 * @property {string} group         CDEP group, e.g. "[Channel1]"
 * @property {string} item          CDEP item, e.g. "rate"
 * @property {"absolute"|"toggle"|"trigger"|"relative"} behaviour
 * @property {boolean} [softTakeover] defaults true for absolute controls
 * @property {boolean} [invert]
 */

let seq = 0;

/**
 * A set of bindings for one controller, serialisable to a single file
 * (REQ-MIDI-6) so mappings can be shared, diffed and forked.
 */
export class Mapping {
  /**
   * @param {{name: string, portIdentity: string, bindings?: Binding[]}} opts
   */
  constructor(opts) {
    this.name = opts.name;
    this.portIdentity = opts.portIdentity;
    /** @type {Binding[]} */
    this.bindings = opts.bindings ?? [];
  }

  /** @param {Omit<Binding, "id"|"portIdentity">} b */
  add(b) {
    const binding = {
      id: `b_${(seq++).toString(36)}`,
      portIdentity: this.portIdentity,
      behaviour: "absolute",
      softTakeover: b.behaviour === undefined || b.behaviour === "absolute",
      ...b
    };
    this.bindings.push(binding);
    return binding;
  }

  remove(id) {
    const i = this.bindings.findIndex((b) => b.id === id);
    if (i === -1) return false;
    this.bindings.splice(i, 1);
    return true;
  }

  /** Find the binding a decoded message belongs to. */
  find(event) {
    return (
      this.bindings.find(
        (b) => b.kind === event.kind && b.channel === event.channel && b.controller === event.id
      ) ?? null
    );
  }

  /** Human-readable, diffable, shareable — REQ-MIDI-6. */
  toJSON() {
    return {
      format: "crowddeck-mapping/1",
      name: this.name,
      portIdentity: this.portIdentity,
      bindings: this.bindings
    };
  }

  /** @param {object} json */
  static fromJSON(json) {
    if (json?.format !== "crowddeck-mapping/1") {
      throw new Error(`unsupported mapping format "${json?.format}"`);
    }
    return new Mapping({
      name: json.name,
      portIdentity: json.portIdentity,
      bindings: json.bindings ?? []
    });
  }
}

/**
 * Applies incoming MIDI to CDEP controls, enforcing soft-takeover.
 *
 * Pure with respect to the engine: it returns the writes to perform rather than
 * performing them, so it can be unit-tested without a socket and reused by any
 * transport.
 */
export class MappingEngine {
  /**
   * @param {{descriptors?: Map<string, object>|object[]}} [opts]
   *   Control descriptors from CDEP `describe`, used to scale values into each
   *   control's declared range.
   */
  constructor(opts = {}) {
    /** @type {Map<string, object>} */
    this.descriptors = new Map();
    if (Array.isArray(opts.descriptors)) {
      for (const d of opts.descriptors) this.descriptors.set(key(d.group, d.item), d);
    } else if (opts.descriptors instanceof Map) {
      this.descriptors = opts.descriptors;
    }

    /** Last known software value per control. */
    this.softwareValues = new Map();
    /** Controls currently suppressed pending takeover. */
    this.pendingTakeover = new Set();
    /** @type {Mapping[]} */
    this.mappings = [];
  }

  /** @param {Mapping} mapping */
  addMapping(mapping) {
    this.mappings.push(mapping);
    // A newly loaded mapping must not fling parameters to wherever the hardware
    // happens to be sitting, so every absolute control starts suppressed.
    for (const b of mapping.bindings) {
      if (b.softTakeover) this.pendingTakeover.add(key(b.group, b.item));
    }
    return mapping;
  }

  removeMapping(portIdentity) {
    this.mappings = this.mappings.filter((m) => m.portIdentity !== portIdentity);
  }

  /** Record engine state so takeover can be judged against reality. */
  setSoftwareValue(group, item, value) {
    this.softwareValues.set(key(group, item), value);
  }

  /** Every control a mapping could target, straight from `describe`. */
  targets() {
    return [...this.descriptors.values()]
      .filter((d) => !d.readonly)
      .map((d) => ({ group: d.group, item: d.item, label: d.label, type: d.type }));
  }

  /**
   * Handle one inbound MIDI message.
   *
   * @param {string} portIdentity
   * @param {number[]} data
   * @returns {{group: string, item: string, value: number, suppressed?: boolean, reason?: string}|null}
   */
  handle(portIdentity, data) {
    const event = decodeMessage(data);
    if (!event) return null;

    const mapping = this.mappings.find((m) => m.portIdentity === portIdentity);
    if (!mapping) return null;

    const binding = mapping.find(event);
    if (!binding) return null;

    const k = key(binding.group, binding.item);
    const desc = this.descriptors.get(k);
    let normalised = binding.invert ? 1 - event.value : event.value;

    switch (binding.behaviour) {
      case "trigger": {
        // Momentary: fire on press, ignore release.
        if (normalised === 0) return null;
        return { group: binding.group, item: binding.item, value: 1 };
      }

      case "toggle": {
        if (normalised === 0) return null; // act on press only
        const current = this.softwareValues.get(k) ?? 0;
        const next = current > 0.5 ? 0 : 1;
        this.softwareValues.set(k, next);
        return { group: binding.group, item: binding.item, value: next };
      }

      case "relative": {
        // Two's-complement style encoders: 1..63 clockwise, 65..127 anticlockwise.
        const raw = event.raw[2] ?? 0;
        const delta = raw < 64 ? raw : raw - 128;
        const current = this.softwareValues.get(k) ?? 0;
        const stepped = clamp01(current + delta / 127);
        this.softwareValues.set(k, stepped);
        return { group: binding.group, item: binding.item, value: scale(stepped, desc) };
      }

      default: {
        // Absolute, with soft-takeover.
        if (binding.softTakeover && this.pendingTakeover.has(k)) {
          const current = this.softwareValues.get(k);
          if (current !== undefined && !hasCrossed(normalised, current, desc)) {
            return {
              group: binding.group,
              item: binding.item,
              value: current,
              suppressed: true,
              reason: "soft_takeover"
            };
          }
          // Caught up: hand control over from here on.
          this.pendingTakeover.delete(k);
        }
        this.softwareValues.set(k, normalised);
        // `parameter` is the value the engine should actually be given: it knows
        // the right curve for this control, which scaling from min/max cannot
        // reproduce (SPIKE-1 §4.3). `value` is retained for engines that predate
        // parameter space and for readable test assertions.
        return {
          group: binding.group,
          item: binding.item,
          parameter: normalised,
          value: scale(normalised, desc)
        };
      }
    }
  }

  /**
   * Re-arm soft-takeover for a control.
   *
   * Called when software changes a value behind the hardware's back — a track
   * loads, another controller moves, the autonomous mixer adjusts something.
   * Without this the next physical touch would jump.
   */
  armTakeover(group, item) {
    this.pendingTakeover.add(key(group, item));
  }

  isAwaitingTakeover(group, item) {
    return this.pendingTakeover.has(key(group, item));
  }
}

/**
 * MIDI learn — bind the next control a user touches.
 *
 * Deliberately ignores the flood a controller emits when a fader is swept: it
 * waits for a message, then binds the *first* control seen, so a stray value
 * during the sweep does not create the wrong binding.
 */
export class MidiLearn {
  constructor() {
    this.active = null;
  }

  /**
   * @param {{group: string, item: string, behaviour?: string}} target
   */
  begin(target) {
    this.active = { target, seen: null };
    return this;
  }

  cancel() {
    this.active = null;
  }

  get learning() {
    return this.active !== null;
  }

  /**
   * @param {string} portIdentity
   * @param {number[]} data
   * @param {Mapping} mapping
   * @returns {Binding|null} the created binding, once a control is identified
   */
  observe(portIdentity, data, mapping) {
    if (!this.active) return null;
    const event = decodeMessage(data);
    if (!event) return null;
    if (mapping.portIdentity !== portIdentity) return null;

    const { target } = this.active;
    this.active = null;

    const behaviour =
      target.behaviour ?? (event.kind === "note" ? "trigger" : "absolute");

    return mapping.add({
      kind: event.kind,
      channel: event.channel,
      controller: event.id,
      group: target.group,
      item: target.item,
      behaviour
    });
  }
}

/* ------------------------------------------------------------- helpers */

function key(group, item) {
  return `${group}\u0000${item}`;
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Map a 0..1 normalised value into a control's declared range. */
function scale(normalised, desc) {
  if (!desc) return normalised;
  if (desc.type === "bool") return normalised > 0.5 ? 1 : 0;
  const v = desc.min + normalised * (desc.max - desc.min);
  return desc.type === "int" ? Math.round(v) : v;
}

/**
 * Has the physical control reached the software value?
 *
 * Compared in normalised space so the epsilon means the same thing for a 0..1
 * volume and a -1..1 rate.
 */
function hasCrossed(physical, software, desc) {
  const softwareNormalised = desc && desc.max !== desc.min
    ? (software - desc.min) / (desc.max - desc.min)
    : software;
  return Math.abs(physical - softwareNormalised) <= TAKEOVER_EPSILON;
}

export { key as controlKey };
