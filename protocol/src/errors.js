// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * CDEP error codes — REQ-CDEP-8.
 *
 * Every `error` reply carries one of these machine-readable codes. The set is
 * closed: adding a code is a protocol change and belongs in the schema.
 */
export const ErrorCode = Object.freeze({
  /** `hello` offered no protocol version this engine implements. Connection is closed. */
  UNSUPPORTED_PROTOCOL: "unsupported_protocol",
  /** A message arrived before a successful `hello`/`welcome` handshake. */
  NOT_HANDSHAKEN: "not_handshaken",
  /** A second `hello` arrived on an already-handshaken connection. */
  ALREADY_HANDSHAKEN: "already_handshaken",
  /** The line was not valid JSON, or was not a JSON object. */
  MALFORMED: "malformed",
  /** The `t` field is missing or names a message type this engine does not implement. */
  UNKNOWN_TYPE: "unknown_type",
  /** A required field is absent or has the wrong JSON type. */
  INVALID_FIELD: "invalid_field",
  /** No control exists at the requested (group, item) address. */
  UNKNOWN_CONTROL: "unknown_control",
  /** The control exists but is declared readonly. */
  READONLY_CONTROL: "readonly_control",
  /** The value is outside the control's declared range, or not a permitted enum member. */
  VALUE_OUT_OF_RANGE: "value_out_of_range",
  /** `load` referenced a track the engine cannot resolve or decode. */
  LOAD_FAILED: "load_failed",
  /** The engine understood the request but cannot service it in its current state. */
  UNAVAILABLE: "unavailable"
});

const ALL = new Set(Object.values(ErrorCode));

/**
 * @param {string} code
 * @returns {boolean}
 */
export function isErrorCode(code) {
  return ALL.has(code);
}

/**
 * A protocol-level failure that maps onto a CDEP `error` reply.
 */
export class CdepError extends Error {
  /**
   * @param {string} code one of {@link ErrorCode}
   * @param {string} message human-readable detail; never parsed by clients
   * @param {{fatal?: boolean}} [opts] fatal errors close the connection after the reply
   */
  constructor(code, message, opts = {}) {
    super(message);
    this.name = "CdepError";
    this.code = code;
    this.fatal = opts.fatal === true;
  }
}
