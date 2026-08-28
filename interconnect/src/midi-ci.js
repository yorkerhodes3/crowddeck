// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * MIDI-CI Property Exchange — MID-7, REQ-MIDI-8, REQ-MIDI-9.
 *
 * > Where a device supports MIDI-CI, the system SHOULD use Property Exchange to
 * > auto-populate a mapping, reducing hand-authoring.
 *
 * Every incumbent DJ application ships hand-authored mapping files, one per
 * controller, maintained forever. A device that can describe itself should not
 * need one, and this is the piece of the plan with the clearest lead over the
 * closed products.
 *
 * ## What is verified, and what is not
 *
 * The wire format here is taken from the primary specification, not from memory
 * or a search result — **M2-101-UM, MIDI-CI v1.2, 11-May-2023**, Appendix D for
 * the Sub-ID#2 assignments and Table 33 for the chunked Get Property Data layout.
 * That mattered: a search result confidently stated `0x35` was *Set Property
 * Data*. It is **Reply to Get Property Data**; `0x36` is Set. Building on that
 * would have produced a client that talked past every real device.
 *
 * `ResourceList`, `DeviceInfo` and `ChannelList` are the Foundational Resources
 * of **M2-105-UM v1.01**, also read directly.
 *
 * **The controller-list resource is deliberately not hard-coded.** Neither
 * document defines one, so this module does not pretend to know its schema. It
 * discovers the resource from the device's own `ResourceList`, and any control it
 * cannot confidently interpret produces **no binding at all**. That is the whole
 * discipline of this file: in a venue, a fader silently bound to the wrong deck
 * control is far worse than a fader that is not bound yet. An unmapped control is
 * a five-second MIDI-learn; a mis-mapped one is a mistake made in front of people.
 */

import { Mapping } from "./mapping.js";

/* ------------------------------------------------------------ wire constants */

export const SYSEX_START = 0xf0;
export const SYSEX_END = 0xf7;
export const UNIVERSAL_NON_REALTIME = 0x7e;
/** Sub-ID#1 for every MIDI-CI message. */
export const SUB_ID_1_MIDI_CI = 0x0d;
/** Property Exchange is always addressed to the whole Function Block. */
export const DESTINATION_FUNCTION_BLOCK = 0x7f;
/** MIDI-CI v1.2. */
export const CI_MESSAGE_VERSION = 0x02;

/** Sub-ID#2 assignments — M2-101-UM Appendix D. */
export const CiMessage = Object.freeze({
  DISCOVERY: 0x70,
  REPLY_TO_DISCOVERY: 0x71,
  INVALIDATE_MUID: 0x7e,
  NAK: 0x7f,

  PE_CAPABILITIES: 0x30,
  REPLY_PE_CAPABILITIES: 0x31,
  GET_PROPERTY_DATA: 0x34,
  REPLY_GET_PROPERTY_DATA: 0x35,
  SET_PROPERTY_DATA: 0x36,
  REPLY_SET_PROPERTY_DATA: 0x37,
  SUBSCRIPTION: 0x38,
  REPLY_SUBSCRIPTION: 0x39,
  NOTIFY: 0x3f
});

/** Broadcast MUID — M2-101-UM §3.3.3. */
export const BROADCAST_MUID = 0x0fffffff;
/** A MUID is 28 bits, carried as four 7-bit bytes. */
export const MUID_MAX = 0x0fffffff;

export class MidiCiError extends Error {
  constructor(message, code = "midi_ci_error") {
    super(message);
    this.name = "MidiCiError";
    this.code = code;
  }
}

/* ----------------------------------------------------------------- encoding */

/**
 * A 28-bit MUID as four 7-bit bytes, least significant first.
 *
 * Nothing inside a SysEx may have bit 7 set — a byte >= 0x80 is a status byte and
 * would terminate the message early. That is why MIDI-CI carries a 28-bit value
 * in four bytes rather than a 32-bit one.
 *
 * @param {number} muid
 */
export function encodeMuid(muid) {
  if (!Number.isInteger(muid) || muid < 0 || muid > MUID_MAX) {
    throw new MidiCiError(`MUID must be a 28-bit integer, got ${muid}`, "bad_muid");
  }
  return [muid & 0x7f, (muid >> 7) & 0x7f, (muid >> 14) & 0x7f, (muid >> 21) & 0x7f];
}

/** @param {number[]|Uint8Array} bytes @param {number} offset */
export function decodeMuid(bytes, offset = 0) {
  return (
    (bytes[offset] & 0x7f) |
    ((bytes[offset + 1] & 0x7f) << 7) |
    ((bytes[offset + 2] & 0x7f) << 14) |
    ((bytes[offset + 3] & 0x7f) << 21)
  );
}

/** A 14-bit length as two 7-bit bytes, LSB first — the spec's convention. */
export function encode14(n) {
  if (!Number.isInteger(n) || n < 0 || n > 0x3fff) {
    throw new MidiCiError(`value ${n} does not fit in 14 bits`, "bad_length");
  }
  return [n & 0x7f, (n >> 7) & 0x7f];
}

/** @param {number[]|Uint8Array} bytes @param {number} offset */
export function decode14(bytes, offset) {
  return (bytes[offset] & 0x7f) | ((bytes[offset + 1] & 0x7f) << 7);
}

/**
 * Generate a MUID.
 *
 * Random rather than sequential, per M2-101-UM Appendix A: two devices choosing
 * the same MUID must be improbable, and the protocol resolves the rare collision
 * with Invalidate MUID.
 *
 * @param {() => number} [rand] injected so tests are deterministic
 */
export function generateMuid(rand = Math.random) {
  // Broadcast is reserved, so it must never be generated.
  let m;
  do {
    m = Math.floor(rand() * (MUID_MAX + 1)) & MUID_MAX;
  } while (m === BROADCAST_MUID);
  return m;
}

/** ASCII-safe check: SysEx bodies may not contain a byte with bit 7 set. */
function assert7Bit(bytes, what) {
  for (const b of bytes) {
    if (b > 0x7f) {
      throw new MidiCiError(
        `${what} contains byte 0x${b.toString(16)}, which is not 7-bit safe and would ` +
          `terminate the SysEx early. Non-ASCII payloads must be Mcoded7-encoded first.`,
        "not_7bit"
      );
    }
  }
}

/**
 * Encode one MIDI-CI message.
 *
 * Layout from M2-101-UM Table 33:
 *   F0 7E <dest> 0D <subId2> <ver> <srcMUID×4> <dstMUID×4> <body…> F7
 *
 * @param {{subId2: number, sourceMuid: number, destinationMuid?: number,
 *          destination?: number, version?: number, body?: number[]}} msg
 */
export function encodeCiMessage(msg) {
  const body = msg.body ?? [];
  assert7Bit(body, "MIDI-CI message body");
  return [
    SYSEX_START,
    UNIVERSAL_NON_REALTIME,
    msg.destination ?? DESTINATION_FUNCTION_BLOCK,
    SUB_ID_1_MIDI_CI,
    msg.subId2,
    msg.version ?? CI_MESSAGE_VERSION,
    ...encodeMuid(msg.sourceMuid),
    ...encodeMuid(msg.destinationMuid ?? BROADCAST_MUID),
    ...body,
    SYSEX_END
  ];
}

/**
 * Decode a MIDI-CI message, or return null if this is not one.
 *
 * Returns null rather than throwing for a non-CI SysEx: a MIDI port carries all
 * sorts of manufacturer traffic, and a device sending its own SysEx is not an
 * error on our side.
 *
 * @param {number[]|Uint8Array} bytes
 */
export function decodeCiMessage(bytes) {
  const b = Array.from(bytes);
  if (b.length < 14) return null;
  if (b[0] !== SYSEX_START || b[1] !== UNIVERSAL_NON_REALTIME) return null;
  if (b[3] !== SUB_ID_1_MIDI_CI) return null;
  if (b[b.length - 1] !== SYSEX_END) return null;

  return {
    destination: b[2],
    subId2: b[4],
    version: b[5],
    sourceMuid: decodeMuid(b, 6),
    destinationMuid: decodeMuid(b, 10),
    body: b.slice(14, b.length - 1)
  };
}

/* ------------------------------------------------------ property exchange */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Build an `Inquiry: Get Property Data` message.
 *
 * The body is, per Table 33: request id, header length + header, total chunks,
 * this chunk, property-data length + property data. An inquiry carries the JSON
 * header and no property data, and is a single chunk.
 *
 * @param {{sourceMuid: number, destinationMuid: number, requestId: number,
 *          header: object}} args
 */
export function encodeGetPropertyData({ sourceMuid, destinationMuid, requestId, header }) {
  if (!Number.isInteger(requestId) || requestId < 0 || requestId > 0x7f) {
    throw new MidiCiError(`request id must be 0..127, got ${requestId}`, "bad_request_id");
  }
  const headerBytes = Array.from(encoder.encode(JSON.stringify(header)));
  assert7Bit(headerBytes, "property exchange header");

  return encodeCiMessage({
    subId2: CiMessage.GET_PROPERTY_DATA,
    sourceMuid,
    destinationMuid,
    body: [
      requestId,
      ...encode14(headerBytes.length),
      ...headerBytes,
      // One chunk, and this is chunk 1 — chunk numbering starts at 1, not 0.
      ...encode14(1),
      ...encode14(1),
      ...encode14(0)
    ]
  });
}

/** Ask what a device can do before asking it for anything — M2-101-UM §8.5. */
export function encodePeCapabilitiesInquiry({
  sourceMuid,
  destinationMuid,
  simultaneousRequests = 1,
  majorVersion = 0,
  minorVersion = 0
}) {
  return encodeCiMessage({
    subId2: CiMessage.PE_CAPABILITIES,
    sourceMuid,
    destinationMuid,
    body: [simultaneousRequests & 0x7f, majorVersion & 0x7f, minorVersion & 0x7f]
  });
}

/**
 * Parse the body of a Get/Set Property Data message or its reply.
 *
 * @param {number[]} body
 */
export function parsePropertyBody(body) {
  if (body.length < 1) throw new MidiCiError("empty property exchange body", "truncated");
  let i = 0;
  const requestId = body[i++];

  const headerLen = decode14(body, i);
  i += 2;
  if (i + headerLen > body.length) {
    throw new MidiCiError("header runs past the end of the message", "truncated");
  }
  const headerText = decoder.decode(Uint8Array.from(body.slice(i, i + headerLen)));
  i += headerLen;

  const totalChunks = decode14(body, i);
  i += 2;
  const chunkNumber = decode14(body, i);
  i += 2;
  const dataLen = decode14(body, i);
  i += 2;
  if (i + dataLen > body.length) {
    throw new MidiCiError("property data runs past the end of the message", "truncated");
  }
  const data = body.slice(i, i + dataLen);

  let header = null;
  if (headerText.length > 0) {
    try {
      header = JSON.parse(headerText);
    } catch (cause) {
      throw new MidiCiError(`property exchange header is not JSON: ${headerText}`, "bad_header", {
        cause
      });
    }
  }

  return { requestId, header, totalChunks, chunkNumber, data };
}

/**
 * Reassembles a chunked Property Exchange reply.
 *
 * Property data larger than one SysEx arrives split across chunks, and the spec
 * allows several transactions to interleave — that is what the Request ID is for.
 * So chunks are accumulated per request id, not into one buffer.
 *
 * Out-of-order and duplicate chunks are rejected rather than merged optimistically:
 * a JSON document silently assembled in the wrong order is not a parse error, it is
 * a *plausible* document with the wrong contents, which is far harder to notice.
 */
export class PropertyExchangeAssembler {
  constructor() {
    /** @type {Map<number, {chunks: Map<number, number[]>, total: number, header: object|null}>} */
    this.pending = new Map();
  }

  /**
   * Feed one decoded reply. Returns the completed payload, or null while more
   * chunks are outstanding.
   *
   * @param {{requestId: number, header: object|null, totalChunks: number,
   *          chunkNumber: number, data: number[]}} part
   */
  accept(part) {
    const { requestId, header, totalChunks, chunkNumber, data } = part;

    // Chunk numbering starts at 1. A 0 means the device is confused, and a chunk
    // beyond the declared total means we would silently drop data.
    if (chunkNumber < 1) {
      throw new MidiCiError(`chunk number ${chunkNumber} is below 1`, "bad_chunk");
    }
    if (totalChunks > 0 && chunkNumber > totalChunks) {
      throw new MidiCiError(
        `chunk ${chunkNumber} of a ${totalChunks}-chunk message`,
        "bad_chunk"
      );
    }

    let entry = this.pending.get(requestId);
    if (!entry) {
      entry = { chunks: new Map(), total: totalChunks, header };
      this.pending.set(requestId, entry);
    }
    // The header travels on the first chunk; later chunks repeat it or leave it
    // empty. Keep the first non-null one.
    if (entry.header === null && header !== null) entry.header = header;
    if (totalChunks > 0) entry.total = totalChunks;

    if (entry.chunks.has(chunkNumber)) {
      throw new MidiCiError(`chunk ${chunkNumber} arrived twice`, "duplicate_chunk");
    }
    entry.chunks.set(chunkNumber, data);

    // A declared total of 0 means "unknown", so completion cannot be detected and
    // the caller must end the transaction another way.
    if (entry.total === 0 || entry.chunks.size < entry.total) return null;

    const bytes = [];
    for (let n = 1; n <= entry.total; n++) {
      const chunk = entry.chunks.get(n);
      if (!chunk) throw new MidiCiError(`chunk ${n} never arrived`, "missing_chunk");
      bytes.push(...chunk);
    }
    this.pending.delete(requestId);

    const text = decoder.decode(Uint8Array.from(bytes));
    let body = null;
    if (text.trim().length > 0) {
      try {
        body = JSON.parse(text);
      } catch (cause) {
        throw new MidiCiError("reassembled property data is not JSON", "bad_payload", { cause });
      }
    }
    return { requestId, header: entry.header, body };
  }

  /** Abandon a transaction — a device that stops replying must not leak memory. */
  cancel(requestId) {
    return this.pending.delete(requestId);
  }
}

/* --------------------------------------------------------------- auto-map */

/**
 * MIDI-CI control types that behave like a continuous absolute control.
 *
 * Anything not listed produces no binding. See the note at the top of the file:
 * an unmapped control costs a MIDI-learn, a mis-mapped one costs a mistake in
 * front of a room.
 */
const ABSOLUTE_TYPES = new Set(["cc", "control", "controller", "absolute", "continuous", "fader", "knob"]);
const TRIGGER_TYPES = new Set(["note", "button", "pad", "trigger", "momentary"]);
const TOGGLE_TYPES = new Set(["toggle", "switch", "latching"]);

/**
 * Find the resource in a device's ResourceList that describes its controls.
 *
 * Discovered rather than hard-coded. `ResourceList`, `DeviceInfo` and
 * `ChannelList` are the Foundational Resources defined in M2-105-UM; a controller
 * list is **not** defined in the documents this was written against, so guessing
 * its name — or worse, its schema — is exactly the kind of unverified assumption
 * that produced a requirement citing an extension that never existed.
 *
 * @param {Array<{resource?: string}>} resourceList
 */
export function findControllerResource(resourceList) {
  if (!Array.isArray(resourceList)) return null;
  const named = resourceList
    .map((r) => (typeof r === "string" ? { resource: r } : r))
    .filter((r) => typeof r?.resource === "string");

  // Ordered by how specific the name is, so a device offering several wins with
  // the most precise.
  const preferred = ["AllCtrlList", "ChCtrlList", "CtrlList"];
  for (const name of preferred) {
    const hit = named.find((r) => r.resource === name);
    if (hit) return hit.resource;
  }
  // Anything else that plausibly names a controller list, including the X- prefix
  // the spec reserves for manufacturer-specific resources.
  const fuzzy = named.find((r) => /ctrl|controller/i.test(r.resource));
  return fuzzy ? fuzzy.resource : null;
}

/**
 * Turn one device-described control into a binding, or null.
 *
 * @param {object} ctrl
 * @param {(ctrl: object) => {group: string, item: string}|null} resolveTarget
 */
function bindingFor(ctrl, resolveTarget) {
  if (!ctrl || typeof ctrl !== "object") return null;

  const rawType = String(ctrl.ctrlType ?? ctrl.type ?? "").toLowerCase();
  const number = firstFinite(ctrl.ctrlIndex, ctrl.index, ctrl.number, ctrl.cc, ctrl.note);
  if (number === null || number < 0 || number > 127) return null;

  // Channel is 1-based in the device's description and 0-based on the wire.
  const channel1 = firstFinite(ctrl.channel, ctrl.ch);
  const channel = channel1 === null ? 0 : channel1 - 1;
  if (channel < 0 || channel > 15) return null;

  let kind;
  let behaviour;
  if (ABSOLUTE_TYPES.has(rawType)) {
    kind = "cc";
    behaviour = "absolute";
  } else if (TOGGLE_TYPES.has(rawType)) {
    kind = "note";
    behaviour = "toggle";
  } else if (TRIGGER_TYPES.has(rawType)) {
    kind = "note";
    behaviour = "trigger";
  } else if (rawType === "pitchbend" || rawType === "pitch") {
    kind = "pitchbend";
    behaviour = "absolute";
  } else {
    // Unrecognised control type: no binding, deliberately.
    return null;
  }

  const target = resolveTarget(ctrl);
  if (!target?.group || !target?.item) return null;

  return {
    kind,
    channel,
    controller: number,
    group: target.group,
    item: target.item,
    behaviour,
    // Absolute controls always start under soft-takeover (REQ-MIDI-4). An
    // auto-generated mapping is *more* likely to need it, not less: nobody has
    // touched these controls yet, so the hardware is wherever it was left.
    softTakeover: behaviour === "absolute",
    // Provenance, so a console can show which bindings the device described and
    // which a human wrote — and so REQ-MIDI-9's override is explicable.
    origin: "midi-ci",
    describedAs: ctrl.title ?? ctrl.name ?? null
  };
}

function firstFinite(...values) {
  for (const v of values) if (Number.isFinite(v)) return v;
  return null;
}

/**
 * Build a mapping from what a device said about itself — REQ-MIDI-8.
 *
 * `resolveTarget` is supplied by the caller and decides which CDEP control a
 * described control should drive. It is not guessed here, because the mapping
 * layer holds no hard-coded knowledge of any engine (REQ-CDEP-13) and a device's
 * idea of "filter" is not necessarily the engine's.
 *
 * @param {{portIdentity: string, name?: string, controls: object[],
 *          resolveTarget: (ctrl: object) => {group: string, item: string}|null}} args
 * @returns {{mapping: Mapping, skipped: Array<{control: object, reason: string}>}}
 */
export function autoMap({ portIdentity, name, controls, resolveTarget }) {
  if (typeof resolveTarget !== "function") {
    throw new MidiCiError(
      "autoMap needs a resolveTarget: which engine control a described control should " +
        "drive is a decision this layer must not make on its own.",
      "no_resolver"
    );
  }

  const mapping = new Mapping({
    name: name ?? `${portIdentity} (auto)`,
    portIdentity
  });
  const skipped = [];

  for (const ctrl of controls ?? []) {
    const binding = bindingFor(ctrl, resolveTarget);
    if (binding) {
      mapping.add(binding);
    } else {
      // Reported, not silently dropped: an operator needs to know which controls
      // still need a MIDI-learn, and "nothing happened" is not an answer.
      skipped.push({ control: ctrl, reason: reasonFor(ctrl, resolveTarget) });
    }
  }

  return { mapping, skipped };
}

function reasonFor(ctrl, resolveTarget) {
  if (!ctrl || typeof ctrl !== "object") return "not a control object";
  const rawType = String(ctrl.ctrlType ?? ctrl.type ?? "").toLowerCase();
  const number = firstFinite(ctrl.ctrlIndex, ctrl.index, ctrl.number, ctrl.cc, ctrl.note);
  if (number === null) return "no controller number";
  if (number < 0 || number > 127) return `controller number ${number} is out of range`;
  const known =
    ABSOLUTE_TYPES.has(rawType) ||
    TOGGLE_TYPES.has(rawType) ||
    TRIGGER_TYPES.has(rawType) ||
    rawType === "pitchbend" ||
    rawType === "pitch";
  if (!known) return `unrecognised control type "${ctrl.ctrlType ?? ctrl.type ?? ""}"`;
  if (!resolveTarget(ctrl)) return "no engine control was chosen for it";
  return "unmappable";
}

/**
 * Lay a human's mapping over an auto-generated one — REQ-MIDI-9.
 *
 * > Auto-generated mappings MUST be editable and MUST be overridable by a user
 * > mapping.
 *
 * Override is per physical control, not whole-file. A DJ who re-binds one knob
 * should not lose the other fifty the device described, and a whole-file
 * replacement would mean exactly that — so people would stop using auto-mapping.
 *
 * A user binding also *removes* the auto binding for that control rather than
 * sitting alongside it, or one turn of the knob would drive two engine controls.
 *
 * @param {Mapping} auto
 * @param {Mapping} user
 */
export function mergeMappings(auto, user) {
  if (auto.portIdentity !== user.portIdentity) {
    throw new MidiCiError(
      `cannot merge mappings for different devices: "${auto.portIdentity}" and ` +
        `"${user.portIdentity}". A mapping is bound to the device that described it.`,
      "port_mismatch"
    );
  }

  const physical = (b) => `${b.kind}:${b.channel}:${b.controller}`;
  const overridden = new Set(user.bindings.map(physical));

  const merged = new Mapping({
    name: user.name ?? auto.name,
    portIdentity: auto.portIdentity
  });

  for (const b of auto.bindings) {
    if (overridden.has(physical(b))) continue;
    merged.bindings.push({ ...b });
  }
  for (const b of user.bindings) {
    merged.bindings.push({ ...b, origin: b.origin ?? "user" });
  }
  return merged;
}
