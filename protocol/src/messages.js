// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * CDEP message constructors and validation — SPECIFICATION §2.4–§2.6.
 *
 * Two rules shape everything here:
 *   - Receivers ignore unknown fields, so the protocol extends without a major
 *     bump (REQ-CDEP-7). Validation therefore checks only what it needs.
 *   - The protocol is versioned `cdep/<major>` (REQ-CDEP-9).
 */

import { CdepError, ErrorCode } from "./errors.js";

export const PROTOCOL_VERSION = "cdep/1";

/** Every message type this version defines. */
export const MessageType = Object.freeze({
  HELLO: "hello",
  WELCOME: "welcome",
  DESCRIBE: "describe",
  DESCRIPTION: "description",
  GET: "get",
  VALUE: "value",
  SET: "set",
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
  CHANGED: "changed",
  LOAD: "load",
  EVENT: "event",
  PING: "ping",
  PONG: "pong",
  OK: "ok",
  ERROR: "error"
});

/** Engine-originated event names — SPECIFICATION §2.5. */
export const EventName = Object.freeze({
  TRACK_LOADED: "track_loaded",
  TRACK_ENDED: "track_ended",
  DECK_EMPTY: "deck_empty",
  BEAT: "beat",
  PHASE: "phase",
  XRUN: "xrun",
  DEVICE_ERROR: "device_error"
});

/* -------------------------------------------------------------- helpers */

/**
 * @param {object} msg
 * @param {string} field
 * @returns {string}
 */
export function requireString(msg, field) {
  const v = msg[field];
  if (typeof v !== "string" || v.length === 0) {
    throw new CdepError(ErrorCode.INVALID_FIELD, `"${field}" must be a non-empty string`);
  }
  return v;
}

/**
 * @param {object} msg
 * @param {string} field
 * @returns {number}
 */
export function requireNumber(msg, field) {
  const v = msg[field];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new CdepError(ErrorCode.INVALID_FIELD, `"${field}" must be a finite number`);
  }
  return v;
}

/**
 * Request ids are optional (notifications omit them) but must be numeric when present.
 * @param {object} msg
 * @returns {number|undefined}
 */
export function optionalId(msg) {
  if (msg.id === undefined || msg.id === null) return undefined;
  if (typeof msg.id !== "number" || !Number.isInteger(msg.id)) {
    throw new CdepError(ErrorCode.INVALID_FIELD, `"id" must be an integer when present`);
  }
  return msg.id;
}

/* --------------------------------------------------------- constructors */

/** @param {{client: string, accept?: string[]}} o */
export const hello = (o) => ({
  t: MessageType.HELLO,
  protocol: PROTOCOL_VERSION,
  client: o.client,
  accept: o.accept ?? [PROTOCOL_VERSION]
});

/** @param {{engine: string, decks: number, sampleRate: number, latencyMs: number, capabilities?: string[]}} o */
export const welcome = (o) => ({
  t: MessageType.WELCOME,
  protocol: PROTOCOL_VERSION,
  engine: o.engine,
  decks: o.decks,
  sample_rate: o.sampleRate,
  latency_ms: o.latencyMs,
  capabilities: o.capabilities ?? []
});

export const ok = (id) => (id === undefined ? { t: MessageType.OK } : { t: MessageType.OK, id });

/** @param {string} code @param {string} message @param {number} [id] */
export const error = (code, message, id) => ({
  t: MessageType.ERROR,
  ...(id === undefined ? {} : { id }),
  code,
  message
});

export const value = (id, group, item, v) => ({
  t: MessageType.VALUE,
  ...(id === undefined ? {} : { id }),
  group,
  item,
  value: v
});

export const changed = (group, item, v) => ({
  t: MessageType.CHANGED,
  group,
  item,
  value: v
});

export const description = (id, controls) => ({
  t: MessageType.DESCRIPTION,
  ...(id === undefined ? {} : { id }),
  controls
});

/** @param {string} name @param {object} [data] */
export const event = (name, data = {}) => ({
  t: MessageType.EVENT,
  event: name,
  ...data
});

export const pong = (id) => (id === undefined ? { t: MessageType.PONG } : { t: MessageType.PONG, id });

/* ---------------------------------------------------------- negotiation */

/**
 * Pick a mutually supported protocol version — REQ-CDEP-10.
 *
 * Accepts either the modern `accept` array or a bare `protocol` string, so a
 * minimal client can hand-write a one-field hello.
 *
 * @param {object} msg the parsed `hello`
 * @param {string[]} supported versions this engine implements
 * @returns {string}
 * @throws {CdepError} `unsupported_protocol`, fatal
 */
export function negotiate(msg, supported = [PROTOCOL_VERSION]) {
  const offered = Array.isArray(msg.accept) && msg.accept.length > 0
    ? msg.accept
    : typeof msg.protocol === "string"
      ? [msg.protocol]
      : [];

  const match = offered.find((v) => supported.includes(v));
  if (!match) {
    throw new CdepError(
      ErrorCode.UNSUPPORTED_PROTOCOL,
      `no common protocol version; client offered [${offered.join(", ")}], ` +
        `engine supports [${supported.join(", ")}]`,
      { fatal: true }
    );
  }
  return match;
}
