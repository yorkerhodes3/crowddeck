// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

import { test } from "node:test";
import assert from "node:assert/strict";
import { CdepError, ErrorCode, isErrorCode } from "../src/errors.js";
import { coerceValue, control, controlKey, deckGroup } from "../src/controls.js";
import { PROTOCOL_VERSION, negotiate, optionalId } from "../src/messages.js";

test("deckGroup follows the [ChannelN] convention", () => {
  assert.equal(deckGroup(1), "[Channel1]");
  assert.equal(deckGroup(4), "[Channel4]");
  assert.throws(() => deckGroup(0), RangeError);
  assert.throws(() => deckGroup(1.5), RangeError);
});

test("controlKey separates group and item unambiguously", () => {
  // A naive join on "/" would collide for odd but legal item names.
  assert.notEqual(controlKey("[a]", "b/c"), controlKey("[a]/b", "c"));
});

test("coerceValue rejects out-of-range rather than clamping", () => {
  const c = control({ group: "[Channel1]", item: "volume", label: "Volume", min: 0, max: 1 });
  assert.equal(coerceValue(c, 0.5), 0.5);
  assert.throws(() => coerceValue(c, 1.5), CdepError);
  assert.throws(() => coerceValue(c, -0.1), CdepError);
});

test("coerceValue enforces bool and int types", () => {
  const b = control({ group: "[Channel1]", item: "play", label: "Play", type: "bool" });
  assert.equal(coerceValue(b, 1), 1);
  assert.throws(() => coerceValue(b, 0.5), CdepError);

  const i = control({ group: "[Master]", item: "n", label: "N", type: "int", min: 0, max: 8 });
  assert.equal(coerceValue(i, 3), 3);
  assert.throws(() => coerceValue(i, 3.5), CdepError);
});

test("coerceValue rejects non-finite and non-numeric values", () => {
  const c = control({ group: "[Channel1]", item: "rate", label: "Rate", min: -1, max: 1 });
  assert.throws(() => coerceValue(c, NaN), CdepError);
  assert.throws(() => coerceValue(c, Infinity), CdepError);
  assert.throws(() => coerceValue(c, "0.5"), CdepError);
});

test("negotiate picks a mutually supported version", () => {
  assert.equal(negotiate({ accept: [PROTOCOL_VERSION] }), PROTOCOL_VERSION);
  // A minimal client may send only `protocol`.
  assert.equal(negotiate({ protocol: PROTOCOL_VERSION }), PROTOCOL_VERSION);
  // Unknown versions alongside a known one still negotiate.
  assert.equal(negotiate({ accept: ["cdep/9", PROTOCOL_VERSION] }), PROTOCOL_VERSION);
});

test("negotiate fails fatally when there is no common version", () => {
  try {
    negotiate({ accept: ["cdep/99"] });
    assert.fail("expected a CdepError");
  } catch (err) {
    assert.ok(err instanceof CdepError);
    assert.equal(err.code, ErrorCode.UNSUPPORTED_PROTOCOL);
    assert.equal(err.fatal, true, "must close the connection");
  }
});

test("optionalId accepts absent ids but rejects non-integers", () => {
  assert.equal(optionalId({}), undefined);
  assert.equal(optionalId({ id: 7 }), 7);
  assert.throws(() => optionalId({ id: "7" }), CdepError);
  assert.throws(() => optionalId({ id: 1.5 }), CdepError);
});

test("every declared error code is recognised", () => {
  for (const code of Object.values(ErrorCode)) assert.ok(isErrorCode(code));
  assert.equal(isErrorCode("not_a_real_code"), false);
});
