// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The source registry — DJX-22.
 *
 * One place that says which catalogues the deck can play, in what order, and
 * with what shared cache. Adding a source is one entry here plus one adapter in
 * `sources.js`; the deck itself does not change.
 *
 * The router is the venue-side `ProviderRouter`, unmodified. It already fans a
 * query out concurrently, applies a per-provider timeout, and returns what
 * arrived with failures reported rather than swallowed — so a source that is
 * down costs its own results and nothing else.
 *
 * ## Timeout
 *
 * The router's default is 2000 ms, chosen for a venue appliance on a local
 * network. Measured from a browser, an Archive search alone takes 1–3 seconds,
 * so the default would time out the best source most of the time. Raised here
 * rather than in the router, because the right number is a property of the
 * *deployment*, not of the contract.
 */

import { ProviderRouter } from "../../../providers/src/router.js";
import { SessionCache } from "./session-cache.js";
import { ArchiveProvider, LibriVoxProvider, OpenverseProvider } from "./sources.js";

/** Long enough for a real search over a real connection. */
export const BROWSER_TIMEOUT_MS = 12000;

/**
 * Build the deck's sources.
 *
 * Priority is the order results appear in when scores are equal, and it encodes
 * a judgement: the Archive first because it is the broadest and most reliably
 * CORS-clean, Openverse next because it reaches Jamendo, spoken word last
 * because it is a garnish rather than the meal.
 *
 * @param {object} [opts]
 * @param {SessionCache} [opts.cache]
 * @param {typeof fetch} [opts.fetch]
 * @param {string} [opts.openverseToken] See `openverse.js` — cannot be minted in a browser.
 * @param {string[]} [opts.only] Restrict to these provider ids, for tests.
 * @returns {{router: ProviderRouter, cache: SessionCache, providers: object[]}}
 */
export function buildSources(opts = {}) {
  const cache = opts.cache ?? new SessionCache();
  const shared = { cache, fetch: opts.fetch };

  const all = [
    { provider: new ArchiveProvider(shared), priority: 10 },
    { provider: new OpenverseProvider({ ...shared, apiToken: opts.openverseToken }), priority: 20 },
    { provider: new LibriVoxProvider(shared), priority: 30 }
  ];

  const chosen = opts.only ? all.filter((e) => opts.only.includes(e.provider.id)) : all;

  const router = new ProviderRouter({ timeoutMs: opts.timeoutMs ?? BROWSER_TIMEOUT_MS });
  for (const { provider, priority } of chosen) router.register(provider, { priority });

  return { router, cache, providers: chosen.map((e) => e.provider) };
}

/**
 * What each source is and how it justifies what it serves.
 *
 * Surfaced so the UI can credit them. Attribution is not decoration here: CC BY
 * and CC BY-SA both *require* it, and a player that uses the music without
 * naming the source is in breach of the licence it relies on.
 *
 * @param {object[]} providers
 */
export function describeSources(providers) {
  return providers.map((p) => p.describe());
}
