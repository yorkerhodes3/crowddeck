// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Where music comes from — REQ-CON-5 … REQ-CON-7.
 *
 * One interface, several sources, and a hard rule about which sources are
 * admissible. See `providers/README.md` for why consumer streaming accounts and
 * downloaders are excluded, and `tools/check-content-sources.mjs` for the check
 * that keeps them out.
 */

export {
  Provider,
  ProviderError,
  LICENCE_CLASSES,
  parseUri,
  toUri,
  validateTrack
} from "./provider.js";

export { ProviderRouter, DEFAULT_TIMEOUT_MS } from "./router.js";
export { LocalProvider } from "./local.js";
export { JamendoProvider } from "./jamendo.js";
export {
  OpenSubsonicProvider,
  API_VERSION as OPENSUBSONIC_API_VERSION,
  CLIENT_NAME as OPENSUBSONIC_CLIENT_NAME,
  isLoopback
} from "./opensubsonic.js";
export { parseCcUrl, classifyCc, ccAttribution } from "./cc-licence.js";
