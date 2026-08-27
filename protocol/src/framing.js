// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * NDJSON framing — REQ-CDEP-2.
 *
 * One JSON object per line, UTF-8. Deliberately a text protocol so the boundary
 * between the Apache-2.0 core and the GPL engine plane stays arms-length:
 * no shared memory, no structures whose layout is defined by GPL headers
 * (REQ-CDEP-3, ADR-001).
 */

import { CdepError, ErrorCode } from "./errors.js";

/** Guard against a peer that never sends a newline. */
export const MAX_LINE_BYTES = 1 << 20; // 1 MiB

/**
 * @param {object} msg
 * @returns {string} a single NDJSON line, newline included
 */
export function encode(msg) {
  return JSON.stringify(msg) + "\n";
}

/**
 * @param {string} line
 * @returns {object}
 * @throws {CdepError} with code `malformed`
 */
export function decode(line) {
  let parsed;
  try {
    parsed = JSON.parse(line);
  } catch {
    throw new CdepError(ErrorCode.MALFORMED, "line is not valid JSON");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new CdepError(ErrorCode.MALFORMED, "message must be a JSON object");
  }
  return parsed;
}

/**
 * Incremental line splitter for a byte stream.
 *
 * Kept separate from any socket so it can be unit-tested directly and reused by
 * both the engine server and the client.
 */
export class LineDecoder {
  #buffer = "";

  /**
   * @param {Buffer|string} chunk
   * @returns {string[]} complete lines, empty lines skipped
   * @throws {CdepError} if a single line exceeds {@link MAX_LINE_BYTES}
   */
  push(chunk) {
    this.#buffer += typeof chunk === "string" ? chunk : chunk.toString("utf8");

    if (this.#buffer.length > MAX_LINE_BYTES && !this.#buffer.includes("\n")) {
      this.#buffer = "";
      throw new CdepError(ErrorCode.MALFORMED, "line exceeds maximum length", { fatal: true });
    }

    const parts = this.#buffer.split("\n");
    this.#buffer = parts.pop() ?? "";
    return parts.map((l) => l.trim()).filter((l) => l.length > 0);
  }
}
