// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

import { test } from "node:test";
import assert from "node:assert/strict";
import { LineDecoder, decode, encode } from "../src/framing.js";
import { CdepError } from "../src/errors.js";

test("encode produces one newline-terminated JSON line", () => {
  const line = encode({ t: "ping", id: 1 });
  assert.equal(line.at(-1), "\n");
  assert.equal(line.split("\n").length, 2);
  assert.deepEqual(JSON.parse(line), { t: "ping", id: 1 });
});

test("decode rejects non-objects", () => {
  assert.throws(() => decode("[1,2]"), CdepError);
  assert.throws(() => decode("42"), CdepError);
  assert.throws(() => decode("null"), CdepError);
  assert.throws(() => decode("not json"), CdepError);
});

test("LineDecoder reassembles a message split across chunks", () => {
  const d = new LineDecoder();
  assert.deepEqual(d.push('{"t":"pi'), []);
  assert.deepEqual(d.push('ng"}\n'), ['{"t":"ping"}']);
});

test("LineDecoder returns multiple messages from one chunk", () => {
  const d = new LineDecoder();
  const lines = d.push('{"a":1}\n{"b":2}\n{"c":3}\n');
  assert.equal(lines.length, 3);
});

test("LineDecoder holds an incomplete trailing line", () => {
  const d = new LineDecoder();
  const lines = d.push('{"a":1}\n{"partial":');
  assert.deepEqual(lines, ['{"a":1}']);
  assert.deepEqual(d.push("2}\n"), ['{"partial":2}']);
});

test("LineDecoder skips blank lines", () => {
  const d = new LineDecoder();
  assert.deepEqual(d.push('\n\n{"a":1}\n\n'), ['{"a":1}']);
});

test("LineDecoder rejects an unbounded line rather than growing forever", () => {
  const d = new LineDecoder();
  assert.throws(() => d.push("x".repeat((1 << 20) + 1)), CdepError);
});
