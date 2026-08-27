// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Keeps `cdep-1.schema.json` and the implementation from drifting apart.
 *
 * A published schema that disagrees with the code is worse than no schema:
 * other-language implementations would be written against a lie. There is no
 * JSON Schema validator dependency here (the repo is deliberately
 * zero-dependency), so instead we assert the two sources agree on the things
 * that actually drift — the closed enumerations and the message-type list.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ErrorCode } from "../src/errors.js";
import { EventName, MessageType, PROTOCOL_VERSION } from "../src/messages.js";

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "..", "cdep-1.schema.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

test("the schema is valid JSON with the expected shape", () => {
  assert.equal(typeof schema.$id, "string");
  assert.ok(Array.isArray(schema.oneOf), "schema must enumerate message variants");
  assert.ok(schema.oneOf.length > 10, "expected a variant per message type");
});

test("schema error codes match the ErrorCode enumeration — REQ-CDEP-8", () => {
  const inSchema = [...schema.$defs.errorCode.enum].sort();
  const inCode = Object.values(ErrorCode).sort();
  assert.deepEqual(inSchema, inCode, "error codes have drifted between schema and code");
});

test("schema event names match the EventName enumeration", () => {
  const inSchema = [...schema.$defs.eventName.enum].sort();
  const inCode = Object.values(EventName).sort();
  assert.deepEqual(inSchema, inCode, "event names have drifted between schema and code");
});

test("every message type has a schema variant", () => {
  const variants = new Set(
    schema.oneOf
      .map((v) => v.properties?.t?.const)
      .filter((c) => typeof c === "string")
  );
  for (const t of Object.values(MessageType)) {
    assert.ok(variants.has(t), `schema is missing a variant for message type "${t}"`);
  }
});

test("the schema declares the current protocol version in its examples", () => {
  const helloVariant = schema.oneOf.find((v) => v.properties?.t?.const === "hello");
  assert.ok(helloVariant, "no hello variant");
  assert.ok(
    helloVariant.properties.protocol.examples.includes(PROTOCOL_VERSION),
    `schema hello examples should mention ${PROTOCOL_VERSION}`
  );
});

test("every message variant stays open to unknown fields — REQ-CDEP-7", () => {
  for (const variant of schema.oneOf) {
    assert.notEqual(
      variant.additionalProperties,
      false,
      `${variant.title} closes additionalProperties, which breaks forward compatibility`
    );
  }
});

test("control descriptors require everything a UI needs — REQ-CDEP-12", () => {
  const required = new Set(schema.$defs.controlDescriptor.required);
  for (const field of ["group", "item", "type", "min", "max", "default", "readonly", "label"]) {
    assert.ok(required.has(field), `controlDescriptor must require "${field}"`);
  }
});
