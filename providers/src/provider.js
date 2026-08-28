// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The provider contract — REQ-CON-5, CON-1.
 *
 * > Provider adapters MUST implement one interface: search, resolve, stream URL,
 * > licence class.
 *
 * Shaped after Mopidy's backend API, the best prior art for this: a small surface,
 * providers registered under a URI scheme, a router that fans a search out and
 * merges results. Two things are deliberately different.
 *
 * ## 1. `licenceClass` is part of the contract, not metadata
 *
 * Mopidy providers return tracks; ours must say what licence each track carries.
 * There is no default and no inference. A provider that cannot establish a licence
 * returns `unknown`, which the policy engine blocks in a commercial venue
 * (REQ-DAT-10).
 *
 * That looks pedantic until you consider the alternative: a provider omits the
 * field, a router fills in something reasonable, and a venue publicly performs
 * music nobody ever checked. "Nobody checked" and "checked and it's fine" must
 * never be the same value, so `validateTrack` throws rather than guessing.
 *
 * ## 2. A slow provider must not stall the venue
 *
 * A patron searching a four-provider catalogue where one is a network service on a
 * flaky connection should get three sets of results quickly, not four eventually.
 * `ProviderRouter` applies a per-provider timeout and returns what arrived, with
 * failures reported rather than swallowed — the venue console can show "Jamendo is
 * unreachable" instead of silently offering a smaller catalogue.
 *
 * REQ-NFR-3 is why this matters: the appliance must work with no WAN connectivity.
 * If a dead remote provider could block search, an internet outage would take the
 * local library down with it — the exact failure mode cloud jukeboxes have and this
 * product exists to avoid.
 */

import { LicenceClass } from "../../core/src/policy.js";

/** Valid licence classes, re-exported so providers need not reach into core/. */
export const LICENCE_CLASSES = Object.freeze(Object.values(LicenceClass));

export class ProviderError extends Error {
  /** @param {string} provider @param {string} message @param {object} [opts] */
  constructor(provider, message, opts = {}) {
    super(message, { cause: opts.cause });
    this.name = "ProviderError";
    this.provider = provider;
    this.code = opts.code ?? "provider_error";
    this.retryable = opts.retryable ?? false;
  }
}

/**
 * Base class every adapter extends.
 *
 * Unimplemented methods throw rather than returning empty, so a half-written
 * provider fails loudly at the seam instead of quietly serving nothing.
 */
export class Provider {
  /**
   * @param {object} args
   * @param {string} args.id Stable identifier, also the URI scheme: `local:track:123`.
   * @param {string} [args.name] Human-readable, for the venue console.
   * @param {boolean} [args.remote] Needs the network. Drives REQ-NFR-3 behaviour.
   */
  constructor({ id, name, remote = false } = {}) {
    if (!id || typeof id !== "string") throw new TypeError("provider id is required");
    if (!/^[a-z][a-z0-9_-]*$/.test(id)) {
      throw new RangeError(
        `provider id "${id}" must be lowercase and URI-safe — it becomes a URI scheme`
      );
    }
    this.id = id;
    this.name = name ?? id;
    this.remote = remote;
  }

  /**
   * @param {string} query
   * @param {{limit?: number, signal?: AbortSignal}} [opts]
   * @returns {Promise<Array<object>>} tracks, each carrying a licenceClass
   */
  async search(query, opts) {
    void query;
    void opts;
    throw new ProviderError(this.id, `${this.id} does not implement search()`);
  }

  /**
   * Full metadata for one track. May be slower than `search`, which is allowed to
   * return a lighter projection.
   * @param {string} trackId @returns {Promise<object|null>}
   */
  async resolve(trackId) {
    void trackId;
    throw new ProviderError(this.id, `${this.id} does not implement resolve()`);
  }

  /**
   * Something the engine can load: a local path, a file URI, or an HTTP URL.
   *
   * Separate from `resolve` because some providers must mint a short-lived or
   * signed URL, and doing that during search — for every result, most of which are
   * never played — would be wasteful and, on metered services, expensive.
   *
   * @param {string} trackId @returns {Promise<string>}
   */
  async streamUrl(trackId) {
    void trackId;
    throw new ProviderError(this.id, `${this.id} does not implement streamUrl()`);
  }

  /**
   * What licence this track carries — REQ-CON-5, REQ-DAT-8.
   *
   * No default. A provider that cannot establish the licence returns `unknown`,
   * which is blocked in a commercial venue. That is the correct outcome: it means
   * a human has to look, rather than the system assuming on their behalf.
   *
   * @param {string} trackId @returns {Promise<string>}
   */
  async licenceClass(trackId) {
    void trackId;
    throw new ProviderError(this.id, `${this.id} does not implement licenceClass()`);
  }

  /** Cheap liveness check for the venue console. Local providers are always up. */
  async healthy() {
    return true;
  }
}

/** `local:track:abc` → `{ provider: "local", id: "abc" }`, or null. */
export function parseUri(uri) {
  const m = /^([a-z][a-z0-9_-]*):track:(.+)$/.exec(String(uri ?? ""));
  return m ? { provider: m[1], id: m[2] } : null;
}

/** @param {string} providerId @param {string} trackId */
export function toUri(providerId, trackId) {
  return `${providerId}:track:${trackId}`;
}

/**
 * Validates a track a provider returned.
 *
 * Checked on every result rather than trusted, because a provider bug that omits a
 * licence class would otherwise surface as a venue performing unlicensed music — a
 * failure discovered by a PRO inspector rather than by a stack trace.
 *
 * @param {string} providerId @param {object} track
 */
export function validateTrack(providerId, track) {
  if (!track || typeof track !== "object") {
    throw new ProviderError(providerId, "returned a non-object track");
  }
  if (!track.id || typeof track.id !== "string") {
    throw new ProviderError(providerId, "returned a track with no id");
  }
  if (!LICENCE_CLASSES.includes(track.licenceClass)) {
    throw new ProviderError(
      providerId,
      `track "${track.id}" has licenceClass ${JSON.stringify(track.licenceClass)}. ` +
        `Every provider must declare one of: ${LICENCE_CLASSES.join(", ")} (REQ-CON-5). ` +
        `Use "unknown" if it genuinely cannot be established — that is a claim, not a gap.`
    );
  }
  return {
    ...track,
    provider: providerId,
    uri: track.uri ?? toUri(providerId, track.id)
  };
}
