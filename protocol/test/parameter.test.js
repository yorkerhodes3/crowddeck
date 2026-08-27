// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Parameter space — the CDEP amendment SPIKE-1 produced.
 *
 * These tests exist to pin down *why* the protocol changed, not just that it
 * did. The short version: CDEP originally required `min` and `max` on every
 * descriptor so clients could scale a control into its range. Reading the Mixxx
 * source showed that is both unimplementable and, more interestingly, wrong.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { control, parameterToValue, valueToParameter, coerceParameter } from "../src/controls.js";
import { CdepError } from "../src/errors.js";
import { startEngine } from "../../engine-stub/test/helpers.js";

const gain = control({
  group: "[Master]",
  item: "gain",
  label: "Master gain",
  // The real Mixxx range, as found in enginemixer.cpp:67 — decibels, not the
  // 0..4 linear multiplier the specification originally guessed.
  min: -14,
  max: 14,
  default: 0
});

test("parameter space is normalised regardless of the control's real range", () => {
  assert.equal(valueToParameter(gain, -14), 0);
  assert.equal(valueToParameter(gain, 14), 1);
  assert.equal(valueToParameter(gain, 0), 0.5);

  const bipolar = control({ group: "[Master]", item: "crossfader", label: "X", min: -1, max: 1 });
  assert.equal(valueToParameter(bipolar, -1), 0);
  assert.equal(valueToParameter(bipolar, 0), 0.5);
  assert.equal(valueToParameter(bipolar, 1), 1);
});

test("parameter and value round-trip", () => {
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const v = parameterToValue(gain, p);
    assert.ok(Math.abs(valueToParameter(gain, v) - p) < 1e-9, `round-trip failed at ${p}`);
  }
});

test("a parameter outside 0..1 is refused rather than clamped", () => {
  assert.equal(coerceParameter(0.5), 0.5);
  assert.throws(() => coerceParameter(1.5), CdepError);
  assert.throws(() => coerceParameter(-0.1), CdepError);
  assert.throws(() => coerceParameter(NaN), CdepError);
  assert.throws(() => coerceParameter("0.5"), CdepError);
});

test("valueToParameter clamps a value that escaped its declared range", () => {
  // Some Mixxx controls allow out-of-bounds values; the parameter is still 0..1.
  assert.equal(valueToParameter(gain, 100), 1);
  assert.equal(valueToParameter(gain, -100), 0);
});

test("a control with no declared range still yields a parameter", () => {
  // The case SPIKE-1 found: ControlEncoderBehavior is unbounded by design, so a
  // descriptor may legitimately carry no min/max at all.
  const encoder = control({ group: "[Channel1]", item: "jog", label: "Jog" });
  assert.equal(typeof valueToParameter(encoder, 0.5), "number");
  assert.equal(typeof parameterToValue(encoder, 0.5), "number");
});

test("the whole point: scaling from min/max would have produced wrong gain", () => {
  // The specification originally declared [Master]/gain as 0..4 linear. Mixxx
  // actually uses -14..14 dB on an audio taper (enginemixer.cpp:67).
  //
  // A client that trusted the spec and sent a MIDI fader at 50% would compute
  // 2.0 and mean "double gain". The engine, reading its own control, means
  // 0 dB — unity. Same wire value, opposite intent.
  const specGuess = control({ group: "[Master]", item: "gain", label: "g", min: 0, max: 4 });
  const clientWouldSend = parameterToValue(specGuess, 0.5);
  const engineActuallyMeans = parameterToValue(gain, 0.5);

  assert.equal(clientWouldSend, 2);
  assert.equal(engineActuallyMeans, 0);
  assert.notEqual(
    clientWouldSend,
    engineActuallyMeans,
    "this divergence is exactly what parameter space removes"
  );

  // In parameter space the client sends 0.5 and the engine applies its own
  // curve. There is nothing left to get wrong.
});

test("an engine accepts writes in parameter space over the wire", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await h.client.setParameter("[Master]", "crossfader", 0.75);
  const p = await h.client.getParameter("[Master]", "crossfader");
  assert.ok(Math.abs(p - 0.75) < 0.02);

  // crossfader is -1..1, so parameter 0.75 is value 0.5.
  assert.ok(Math.abs((await h.client.get("[Master]", "crossfader")) - 0.5) < 0.02);
});

test("get returns both representations, so either client style works", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await h.client.set("[Master]", "crossfader", -1);
  const reply = await h.client.request({ t: "get", group: "[Master]", item: "crossfader" });

  assert.equal(reply.value, -1, "value space for clients that know the range");
  assert.equal(reply.parameter, 0, "parameter space for everything else");
});

test("changed notifications carry the parameter too", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  const seen = [];
  h.client.on("changed", (m) => seen.push(m));
  await h.client.subscribe([{ group: "[Master]", item: "crossfader" }], 50);
  await h.client.set("[Master]", "crossfader", 1);

  const deadline = Date.now() + 2000;
  while (Date.now() < deadline && seen.length === 0) {
    await new Promise((r) => setTimeout(r, 10));
  }

  assert.ok(seen.length > 0, "expected a change notification");
  assert.equal(seen[0].value, 1);
  assert.equal(seen[0].parameter, 1, "a subscriber can follow a fader without knowing its range");
});

test("readonly controls refuse parameter writes as well as value writes", async (t) => {
  const h = await startEngine();
  t.after(() => h.stop());

  await assert.rejects(
    () => h.client.setParameter("[Channel1]", "bpm", 0.5),
    (e) => e.code === "readonly_control"
  );
});
