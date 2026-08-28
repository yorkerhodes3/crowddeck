// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * MIDI-CI Property Exchange — MID-7, REQ-MIDI-8, REQ-MIDI-9.
 *
 * The byte-level expectations here are written out longhand from **M2-101-UM,
 * MIDI-CI v1.2**, rather than derived from the encoder. A test that builds its
 * expectation by calling the code it is testing proves only self-consistency, and
 * self-consistency with a wrong constant is exactly the failure this file exists
 * to prevent — a search result confidently reported `0x35` as *Set Property Data*
 * when it is *Reply to Get Property Data*.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CiMessage,
  BROADCAST_MUID,
  MUID_MAX,
  MidiCiError,
  PropertyExchangeAssembler,
  autoMap,
  decode14,
  decodeCiMessage,
  decodeMuid,
  encode14,
  encodeCiMessage,
  encodeGetPropertyData,
  encodeMuid,
  encodePeCapabilitiesInquiry,
  findControllerResource,
  generateMuid,
  mergeMappings,
  parsePropertyBody
} from "../src/midi-ci.js";
import { Mapping } from "../src/mapping.js";

/* -------------------------------------------------------- the wire constants */

test("the Property Exchange sub-IDs match the specification, not a plausible guess", () => {
  // M2-101-UM Appendix D, Category 3: Property Exchange Messages.
  assert.equal(CiMessage.PE_CAPABILITIES, 0x30);
  assert.equal(CiMessage.REPLY_PE_CAPABILITIES, 0x31);
  assert.equal(CiMessage.GET_PROPERTY_DATA, 0x34);
  // The one a search result got wrong. 0x35 is the *reply*, 0x36 is Set.
  assert.equal(CiMessage.REPLY_GET_PROPERTY_DATA, 0x35);
  assert.equal(CiMessage.SET_PROPERTY_DATA, 0x36);
  assert.equal(CiMessage.REPLY_SET_PROPERTY_DATA, 0x37);
  assert.equal(CiMessage.SUBSCRIPTION, 0x38);
  assert.equal(CiMessage.NOTIFY, 0x3f);
  assert.equal(CiMessage.DISCOVERY, 0x70);
});

/* -------------------------------------------------------------------- MUIDs */

test("a MUID is four 7-bit bytes, least significant first", () => {
  // 0x0FFFFFFF is 28 ones, so every byte is 0x7F.
  assert.deepEqual(encodeMuid(MUID_MAX), [0x7f, 0x7f, 0x7f, 0x7f]);
  assert.deepEqual(encodeMuid(0), [0, 0, 0, 0]);
  // 1 in the least significant position proves the byte order.
  assert.deepEqual(encodeMuid(1), [1, 0, 0, 0]);
  // 0x80 = 128 = one step past a 7-bit byte, so it lands in the second.
  assert.deepEqual(encodeMuid(128), [0, 1, 0, 0]);
});

test("no MUID byte ever has bit 7 set — it would end the SysEx early", () => {
  for (const muid of [0, 1, 127, 128, 0x3fff, 0x0fffffff, 12345678]) {
    for (const b of encodeMuid(muid)) {
      assert.ok(b <= 0x7f, `MUID ${muid} produced byte 0x${b.toString(16)}`);
    }
  }
});

test("MUIDs round-trip", () => {
  for (const muid of [0, 1, 127, 128, 999, 0x0fffffff]) {
    assert.equal(decodeMuid(encodeMuid(muid)), muid);
  }
});

test("a MUID that does not fit in 28 bits is refused, not truncated", () => {
  assert.throws(() => encodeMuid(MUID_MAX + 1), MidiCiError);
  assert.throws(() => encodeMuid(-1), MidiCiError);
  assert.throws(() => encodeMuid(1.5), MidiCiError);
});

test("a generated MUID is in range and never the broadcast value", () => {
  for (let i = 0; i < 200; i++) {
    const m = generateMuid();
    assert.ok(m >= 0 && m <= MUID_MAX);
    assert.notEqual(m, BROADCAST_MUID);
  }
  // The one input that would otherwise produce the reserved broadcast MUID.
  let calls = 0;
  const rand = () => (calls++ === 0 ? 1 : 0.5);
  assert.notEqual(generateMuid(rand), BROADCAST_MUID);
});

test("14-bit lengths are two 7-bit bytes, LSB first", () => {
  assert.deepEqual(encode14(0), [0, 0]);
  assert.deepEqual(encode14(1), [1, 0]);
  assert.deepEqual(encode14(128), [0, 1]);
  assert.deepEqual(encode14(0x3fff), [0x7f, 0x7f]);
  assert.throws(() => encode14(0x4000), MidiCiError);
  for (const n of [0, 1, 127, 128, 1000, 0x3fff]) {
    assert.equal(decode14(encode14(n), 0), n);
  }
});

/* ------------------------------------------------------- message envelope */

test("a MIDI-CI message has the envelope the specification describes", () => {
  const bytes = encodeCiMessage({
    subId2: CiMessage.DISCOVERY,
    sourceMuid: 1,
    destinationMuid: BROADCAST_MUID
  });

  assert.equal(bytes[0], 0xf0, "System Exclusive Start");
  assert.equal(bytes[1], 0x7e, "Universal System Exclusive, non-realtime");
  assert.equal(bytes[2], 0x7f, "addressed to the whole Function Block");
  assert.equal(bytes[3], 0x0d, "Sub-ID#1: MIDI-CI");
  assert.equal(bytes[4], 0x70, "Sub-ID#2: Discovery");
  assert.equal(bytes[5], 0x02, "MIDI-CI v1.2 message format");
  assert.deepEqual(bytes.slice(6, 10), [1, 0, 0, 0], "source MUID");
  assert.deepEqual(bytes.slice(10, 14), [0x7f, 0x7f, 0x7f, 0x7f], "broadcast destination");
  assert.equal(bytes.at(-1), 0xf7, "System Exclusive End");
});

test("every byte of an encoded message is legal inside a SysEx", () => {
  const bytes = encodeGetPropertyData({
    sourceMuid: 0x0fffffff,
    destinationMuid: 0x0abcdef,
    requestId: 127,
    header: { resource: "ResourceList" }
  });
  for (let i = 1; i < bytes.length - 1; i++) {
    assert.ok(bytes[i] <= 0x7f, `byte ${i} is 0x${bytes[i].toString(16)}`);
  }
});

test("a non-MIDI-CI SysEx decodes to null rather than throwing", () => {
  // A port carries all sorts of manufacturer traffic; that is not our error.
  assert.equal(decodeCiMessage([0xf0, 0x43, 0x10, 0x4c, 0xf7]), null);
  assert.equal(decodeCiMessage([0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]), null, "identity request");
  assert.equal(decodeCiMessage([]), null);
  assert.equal(decodeCiMessage([0xf0, 0x7e, 0x7f, 0x0d, 0x70]), null, "no terminator");
});

test("a message round-trips through encode and decode", () => {
  const original = {
    subId2: CiMessage.GET_PROPERTY_DATA,
    sourceMuid: 0x1234567,
    destinationMuid: 0x7654321,
    body: [1, 2, 3, 0x7f]
  };
  const decoded = decodeCiMessage(encodeCiMessage(original));
  assert.equal(decoded.subId2, original.subId2);
  assert.equal(decoded.sourceMuid, original.sourceMuid);
  assert.equal(decoded.destinationMuid, original.destinationMuid);
  assert.deepEqual(decoded.body, original.body);
});

test("a body with a status byte in it is refused rather than silently truncating", () => {
  assert.throws(
    () => encodeCiMessage({ subId2: 0x34, sourceMuid: 1, body: [0x41, 0xf7, 0x42] }),
    /not 7-bit safe/
  );
});

/* --------------------------------------------------------- property exchange */

test("a Get Property Data inquiry carries a JSON header and one empty chunk", () => {
  const bytes = encodeGetPropertyData({
    sourceMuid: 1,
    destinationMuid: 2,
    requestId: 5,
    header: { resource: "ResourceList" }
  });
  const { body } = decodeCiMessage(bytes);
  const parsed = parsePropertyBody(body);

  assert.equal(parsed.requestId, 5);
  assert.deepEqual(parsed.header, { resource: "ResourceList" });
  assert.equal(parsed.totalChunks, 1);
  // Chunk numbering starts at 1, not 0 — an easy and invisible off-by-one.
  assert.equal(parsed.chunkNumber, 1);
  assert.deepEqual(parsed.data, []);
});

test("a request id outside a 7-bit byte is refused", () => {
  const args = { sourceMuid: 1, destinationMuid: 2, header: {} };
  assert.throws(() => encodeGetPropertyData({ ...args, requestId: 128 }), MidiCiError);
  assert.throws(() => encodeGetPropertyData({ ...args, requestId: -1 }), MidiCiError);
});

test("a capabilities inquiry states how many simultaneous requests we support", () => {
  const { subId2, body } = decodeCiMessage(
    encodePeCapabilitiesInquiry({ sourceMuid: 1, destinationMuid: 2, simultaneousRequests: 4 })
  );
  assert.equal(subId2, 0x30);
  assert.equal(body[0], 4);
});

test("a truncated property body is an error, not a partial read", () => {
  // Claims a 50-byte header and supplies none.
  assert.throws(() => parsePropertyBody([1, 50, 0]), /runs past the end/);
  assert.throws(() => parsePropertyBody([]), /empty/);
});

test("a header that is not JSON is reported as such", () => {
  const bad = [1, 5, 0, ...[..."hello"].map((c) => c.charCodeAt(0)), 1, 0, 1, 0, 0, 0];
  assert.throws(() => parsePropertyBody(bad), /not JSON/);
});

/* ------------------------------------------------------------- reassembly */

const chunkOf = (requestId, total, n, text, header = null) => ({
  requestId,
  header,
  totalChunks: total,
  chunkNumber: n,
  data: [...Buffer.from(text, "utf8")]
});

test("a payload split across chunks is reassembled in order", () => {
  const a = new PropertyExchangeAssembler();
  const json = JSON.stringify([{ resource: "DeviceInfo" }, { resource: "ChannelList" }]);
  const mid = Math.floor(json.length / 2);

  assert.equal(a.accept(chunkOf(1, 2, 1, json.slice(0, mid), { status: 200 })), null);
  const done = a.accept(chunkOf(1, 2, 2, json.slice(mid)));

  assert.deepEqual(done.body, [{ resource: "DeviceInfo" }, { resource: "ChannelList" }]);
  assert.deepEqual(done.header, { status: 200 });
});

test("chunks arriving out of order still assemble correctly", () => {
  const a = new PropertyExchangeAssembler();
  const json = '{"manufacturer":"Acme","model":"Deck One"}';
  const mid = Math.floor(json.length / 2);

  // The second chunk overtakes the first. Reassembly is by chunk number, not by
  // arrival: concatenating in arrival order would produce a *plausible* document
  // with the wrong contents, which is far harder to notice than a parse error.
  assert.equal(a.accept(chunkOf(7, 2, 2, json.slice(mid))), null);
  const done = a.accept(chunkOf(7, 2, 1, json.slice(0, mid)));
  assert.equal(done.body.model, "Deck One");
});

test("two transactions can interleave — that is what the request id is for", () => {
  const a = new PropertyExchangeAssembler();
  assert.equal(a.accept(chunkOf(1, 2, 1, '{"a":')), null);
  assert.equal(a.accept(chunkOf(2, 2, 1, '{"b":')), null);
  assert.deepEqual(a.accept(chunkOf(2, 2, 2, "2}")).body, { b: 2 });
  assert.deepEqual(a.accept(chunkOf(1, 2, 2, "1}")).body, { a: 1 });
});

test("a duplicate chunk is an error, not a silent overwrite", () => {
  const a = new PropertyExchangeAssembler();
  a.accept(chunkOf(1, 3, 1, "{"));
  assert.throws(() => a.accept(chunkOf(1, 3, 1, "{")), /arrived twice/);
});

test("an impossible chunk number is refused", () => {
  const a = new PropertyExchangeAssembler();
  assert.throws(() => a.accept(chunkOf(1, 2, 0, "x")), /below 1/);
  assert.throws(() => a.accept(chunkOf(1, 2, 3, "x")), /of a 2-chunk message/);
});

test("an unknown chunk count never completes, rather than completing early", () => {
  // 0 means "unknown" in the spec. Guessing it was finished would truncate the
  // document at whatever happened to arrive first.
  const a = new PropertyExchangeAssembler();
  assert.equal(a.accept(chunkOf(1, 0, 1, "{}")), null);
  assert.equal(a.cancel(1), true);
  assert.equal(a.cancel(1), false);
});

test("a single-chunk reply completes immediately", () => {
  const a = new PropertyExchangeAssembler();
  const done = a.accept(chunkOf(3, 1, 1, '{"family":"MPK"}', { status: 200 }));
  assert.deepEqual(done.body, { family: "MPK" });
});

/* ------------------------------------------------- discovering the resource */

test("the controller resource is discovered from the device, not hard-coded", () => {
  assert.equal(
    findControllerResource([{ resource: "DeviceInfo" }, { resource: "AllCtrlList" }]),
    "AllCtrlList"
  );
  // Plain strings, which some devices send instead of objects.
  assert.equal(findControllerResource(["ChannelList", "ChCtrlList"]), "ChCtrlList");
  // A manufacturer-specific resource still counts — X- is the spec's own escape
  // hatch, and refusing it would exclude exactly the devices worth supporting.
  assert.equal(findControllerResource([{ resource: "X-AcmeControllerMap" }]), "X-AcmeControllerMap");
});

test("a device with no controller resource says so, rather than a default being assumed", () => {
  assert.equal(findControllerResource([{ resource: "DeviceInfo" }]), null);
  assert.equal(findControllerResource([]), null);
  assert.equal(findControllerResource(null), null);
});

/* ---------------------------------------------------------------- auto-map */

const target = (ctrl) => {
  const t = { "Deck 1 Tempo": { group: "[Channel1]", item: "rate" },
              "Deck 1 Volume": { group: "[Channel1]", item: "volume" },
              "Deck 1 Play": { group: "[Channel1]", item: "play" },
              "Crossfader": { group: "[Master]", item: "crossfader" } }[ctrl.title];
  return t ?? null;
};

test("a described fader becomes a soft-takeover binding — REQ-MIDI-8", () => {
  const { mapping } = autoMap({
    portIdentity: "akai:mpk-mini:1",
    controls: [{ title: "Deck 1 Tempo", ctrlType: "cc", ctrlIndex: 21, channel: 1 }],
    resolveTarget: target
  });

  assert.equal(mapping.bindings.length, 1);
  const b = mapping.bindings[0];
  assert.equal(b.kind, "cc");
  assert.equal(b.controller, 21);
  // The device says channel 1; the wire is 0-based.
  assert.equal(b.channel, 0);
  assert.equal(b.group, "[Channel1]");
  assert.equal(b.item, "rate");
  assert.equal(b.behaviour, "absolute");
  // An auto-mapping needs soft-takeover more than a hand-written one: nobody has
  // touched these controls, so the hardware is wherever it was left.
  assert.equal(b.softTakeover, true);
  assert.equal(b.origin, "midi-ci");
});

test("buttons and toggles get the right behaviour, and no soft-takeover", () => {
  const { mapping } = autoMap({
    portIdentity: "p",
    controls: [
      { title: "Deck 1 Play", ctrlType: "button", ctrlIndex: 40, channel: 1 },
      { title: "Crossfader", ctrlType: "toggle", ctrlIndex: 41, channel: 1 }
    ],
    resolveTarget: target
  });
  assert.equal(mapping.bindings[0].behaviour, "trigger");
  assert.equal(mapping.bindings[0].softTakeover, false);
  assert.equal(mapping.bindings[1].behaviour, "toggle");
  assert.equal(mapping.bindings[1].softTakeover, false);
});

test("an unrecognised control produces no binding, and is reported", () => {
  // The core discipline: in a venue, a fader silently bound to the wrong control
  // is worse than one that is not bound yet.
  const { mapping, skipped } = autoMap({
    portIdentity: "p",
    controls: [{ title: "Deck 1 Tempo", ctrlType: "quantum-flux", ctrlIndex: 21, channel: 1 }],
    resolveTarget: target
  });
  assert.equal(mapping.bindings.length, 0);
  assert.equal(skipped.length, 1);
  assert.match(skipped[0].reason, /unrecognised control type/);
});

test("a control with no engine target is skipped with a reason an operator can act on", () => {
  const { mapping, skipped } = autoMap({
    portIdentity: "p",
    controls: [{ title: "Arpeggiator Gate", ctrlType: "cc", ctrlIndex: 30, channel: 1 }],
    resolveTarget: target
  });
  assert.equal(mapping.bindings.length, 0);
  assert.match(skipped[0].reason, /no engine control/);
});

test("out-of-range numbers and channels are refused", () => {
  const { mapping, skipped } = autoMap({
    portIdentity: "p",
    controls: [
      { title: "Deck 1 Tempo", ctrlType: "cc", ctrlIndex: 200, channel: 1 },
      { title: "Deck 1 Tempo", ctrlType: "cc", channel: 1 },
      { title: "Deck 1 Tempo", ctrlType: "cc", ctrlIndex: 21, channel: 99 },
      null
    ],
    resolveTarget: target
  });
  assert.equal(mapping.bindings.length, 0);
  assert.equal(skipped.length, 4);
  assert.match(skipped[1].reason, /no controller number/);
});

test("autoMap refuses to guess which engine control a device means", () => {
  assert.throws(
    () => autoMap({ portIdentity: "p", controls: [] }),
    /must not make on its own/
  );
});

/* ------------------------------------------ REQ-MIDI-9: the human wins */

test("a user binding overrides the auto one for that control — REQ-MIDI-9", () => {
  const { mapping: auto } = autoMap({
    portIdentity: "p",
    controls: [
      { title: "Deck 1 Tempo", ctrlType: "cc", ctrlIndex: 21, channel: 1 },
      { title: "Deck 1 Volume", ctrlType: "cc", ctrlIndex: 22, channel: 1 }
    ],
    resolveTarget: target
  });
  assert.equal(auto.bindings.length, 2);

  const user = new Mapping({ name: "Nina's tweaks", portIdentity: "p" });
  user.add({ kind: "cc", channel: 0, controller: 21, group: "[Master]", item: "crossfader" });

  const merged = mergeMappings(auto, user);

  // The overridden control resolves once, to the human's choice — not twice.
  const forCc21 = merged.bindings.filter((b) => b.controller === 21);
  assert.equal(forCc21.length, 1, "one turn of a knob must not drive two controls");
  assert.equal(forCc21[0].item, "crossfader");
  assert.equal(forCc21[0].origin, "user");

  // And the other forty-nine survive, which is what makes auto-mapping worth using.
  const forCc22 = merged.bindings.filter((b) => b.controller === 22);
  assert.equal(forCc22.length, 1);
  assert.equal(forCc22[0].origin, "midi-ci");
});

test("overriding is per control, not whole-file", () => {
  const { mapping: auto } = autoMap({
    portIdentity: "p",
    controls: [
      { title: "Deck 1 Tempo", ctrlType: "cc", ctrlIndex: 21, channel: 1 },
      { title: "Deck 1 Volume", ctrlType: "cc", ctrlIndex: 22, channel: 1 },
      { title: "Deck 1 Play", ctrlType: "button", ctrlIndex: 40, channel: 1 }
    ],
    resolveTarget: target
  });
  const user = new Mapping({ name: "one change", portIdentity: "p" });
  user.add({ kind: "cc", channel: 0, controller: 22, group: "[Channel1]", item: "pregain" });

  assert.equal(mergeMappings(auto, user).bindings.length, 3);
});

test("a user binding on a different channel does not shadow the auto one", () => {
  const { mapping: auto } = autoMap({
    portIdentity: "p",
    controls: [{ title: "Deck 1 Tempo", ctrlType: "cc", ctrlIndex: 21, channel: 1 }],
    resolveTarget: target
  });
  const user = new Mapping({ name: "ch2", portIdentity: "p" });
  // Same CC number, different channel: a genuinely different physical control.
  user.add({ kind: "cc", channel: 1, controller: 21, group: "[Channel2]", item: "rate" });

  assert.equal(mergeMappings(auto, user).bindings.length, 2);
});

test("mappings for two different devices cannot be merged", () => {
  const a = new Mapping({ name: "a", portIdentity: "akai:mpk" });
  const b = new Mapping({ name: "b", portIdentity: "novation:launch" });
  assert.throws(() => mergeMappings(a, b), /different devices/);
});

test("an auto-generated mapping is editable and serialisable like any other", () => {
  // REQ-MIDI-9 says editable; REQ-MIDI-6 says one shareable file. An auto mapping
  // that could not be exported would be a dead end the moment it was wrong.
  const { mapping } = autoMap({
    portIdentity: "p",
    controls: [{ title: "Deck 1 Tempo", ctrlType: "cc", ctrlIndex: 21, channel: 1 }],
    resolveTarget: target
  });

  const id = mapping.bindings[0].id;
  assert.equal(mapping.remove(id), true);
  assert.equal(mapping.bindings.length, 0);

  mapping.add({ kind: "cc", channel: 0, controller: 21, group: "[Channel1]", item: "volume" });
  const restored = Mapping.fromJSON(JSON.parse(JSON.stringify(mapping.toJSON())));
  assert.equal(restored.portIdentity, "p");
  assert.equal(restored.bindings[0].item, "volume");
});
