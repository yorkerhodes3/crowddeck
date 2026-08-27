// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * CDEP — the CrowdDeck Engine Protocol.
 *
 * The contract between the Apache-2.0 fusion core and the GPL performance
 * engine. Specified in SPECIFICATION.md §2 and written before either engine
 * existed, so it is shaped by its consumer rather than by the fork (ADR-002).
 */

export * from "./errors.js";
export * from "./framing.js";
export * from "./controls.js";
export * from "./messages.js";
export { CdepClient } from "./client.js";

/** Default socket path for a local engine. */
export function defaultSocketPath(name = "crowddeck-engine") {
  return process.platform === "win32"
    ? `\\\\.\\pipe\\${name}`
    : `/tmp/${name}.sock`;
}
