// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Provider router — fans search out, merges results, and isolates failures.
 *
 * ## The requirement that shapes this
 *
 * REQ-NFR-3: the appliance MUST be fully functional with no WAN connectivity. That
 * is the single clearest advantage over cloud jukeboxes, whose music stops when the
 * venue's connection drops.
 *
 * A router that awaited every provider in turn would hand that advantage straight
 * back: one unreachable remote service and search hangs, taking the local library
 * with it. So every provider is called concurrently, under a timeout, and whatever
 * arrives in time is returned.
 *
 * ## Failures are reported, never swallowed
 *
 * The tempting implementation is `Promise.allSettled` and quietly drop the
 * rejections. That produces a venue where the catalogue silently shrinks and nobody
 * knows why — staff conclude the jukebox is broken and stop using it.
 *
 * `search()` therefore returns `{ tracks, errors, degraded }`. The venue console can
 * say "Jamendo is unreachable, showing 3 of 4 sources"; patrons see a working search
 * either way. A partial answer labelled as partial is useful; a partial answer
 * presented as complete is a lie the software is telling.
 *
 * ## Ordering
 *
 * Results are grouped by provider priority, not interleaved by relevance. Relevance
 * ranking across heterogeneous sources needs score normalisation nobody has built
 * yet, and a plausible-looking merge would be quietly arbitrary. Priority order is
 * at least honest about what it is: the venue's own library first, then whatever
 * else is configured.
 */

import { Provider, ProviderError, validateTrack, parseUri } from "./provider.js";

/** How long any one provider gets before the rest go on without it. */
export const DEFAULT_TIMEOUT_MS = 2000;

export class ProviderRouter {
  /**
   * @param {object} [opts]
   * @param {number} [opts.timeoutMs]
   * @param {(id: string) => void} [opts.onError]
   */
  constructor(opts = {}) {
    /** @type {Array<{provider: Provider, priority: number}>} */
    this.entries = [];
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * @param {Provider} provider
   * @param {{priority?: number}} [opts] Lower sorts first. The local library
   *   should outrank remote services: it is faster, always available, and its
   *   licensing is already established.
   */
  register(provider, opts = {}) {
    if (!(provider instanceof Provider)) {
      throw new TypeError("providers must extend Provider — the contract is not optional");
    }
    if (this.entries.some((e) => e.provider.id === provider.id)) {
      throw new RangeError(`a provider with id "${provider.id}" is already registered`);
    }
    this.entries.push({ provider, priority: opts.priority ?? 100 });
    this.entries.sort((a, b) => a.priority - b.priority);
    return this;
  }

  /** @param {string} id */
  get(id) {
    return this.entries.find((e) => e.provider.id === id)?.provider ?? null;
  }

  get providers() {
    return this.entries.map((e) => e.provider);
  }

  /**
   * Race a promise against the timeout.
   *
   * The provider is also passed an `AbortSignal`, so a well-behaved one can stop
   * work it will not be credited for. Providers that ignore it are not punished —
   * their result is simply discarded — because a router that required cooperation
   * to stay responsive would not be robust at all.
   */
  async #withTimeout(provider, fn) {
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(
          new ProviderError(provider.id, `${provider.name} timed out after ${this.timeoutMs}ms`, {
            code: "provider_timeout",
            retryable: true
          })
        );
      }, this.timeoutMs);
    });

    try {
      return await Promise.race([fn(controller.signal), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Search every provider concurrently.
   *
   * @param {string} query
   * @param {{limit?: number}} [opts]
   * @returns {Promise<{tracks: object[], errors: Array<{provider: string, message: string, code: string}>, degraded: boolean}>}
   */
  async search(query, opts = {}) {
    const limit = opts.limit ?? 50;

    const settled = await Promise.allSettled(
      this.entries.map(async ({ provider }) => {
        const raw = await this.#withTimeout(provider, (signal) =>
          provider.search(query, { limit, signal })
        );
        if (!Array.isArray(raw)) {
          throw new ProviderError(provider.id, "search() did not return an array");
        }
        // Validate here, not at the call site: a provider returning a track with no
        // licence class is a provider bug, and it should be attributed to that
        // provider rather than surfacing later as a mysterious policy refusal.
        return { provider, tracks: raw.map((t) => validateTrack(provider.id, t)) };
      })
    );

    const tracks = [];
    const errors = [];

    settled.forEach((result, i) => {
      const { provider } = this.entries[i];
      if (result.status === "fulfilled") {
        tracks.push(...result.value.tracks);
      } else {
        const e = result.reason;
        errors.push({
          provider: provider.id,
          name: provider.name,
          message: e?.message ?? String(e),
          code: e?.code ?? "provider_error",
          retryable: e?.retryable ?? false
        });
      }
    });

    return {
      tracks: tracks.slice(0, limit),
      errors,
      // `degraded` exists so callers do not have to remember that a non-empty
      // errors array means "these results are incomplete".
      degraded: errors.length > 0,
      providersQueried: this.entries.length,
      providersAnswered: this.entries.length - errors.length
    };
  }

  /** @param {string} uri A provider URI, or a bare id if only one provider exists. */
  #locate(uri) {
    const parsed = parseUri(uri);
    if (parsed) {
      const provider = this.get(parsed.provider);
      if (!provider) {
        throw new ProviderError(parsed.provider, `no provider registered as "${parsed.provider}"`, {
          code: "unknown_provider"
        });
      }
      return { provider, id: parsed.id };
    }
    // A bare id is unambiguous only with one provider. Guessing with several would
    // resolve to whichever happened to be first, which is worse than refusing.
    if (this.entries.length === 1) {
      return { provider: this.entries[0].provider, id: String(uri) };
    }
    throw new ProviderError("router", `"${uri}" is not a provider URI, and several providers are registered`, {
      code: "ambiguous_uri"
    });
  }

  /** @param {string} uri */
  async resolve(uri) {
    const { provider, id } = this.#locate(uri);
    const track = await this.#withTimeout(provider, () => provider.resolve(id));
    return track ? validateTrack(provider.id, track) : null;
  }

  /** @param {string} uri */
  async streamUrl(uri) {
    const { provider, id } = this.#locate(uri);
    return this.#withTimeout(provider, () => provider.streamUrl(id));
  }

  /** @param {string} uri */
  async licenceClass(uri) {
    const { provider, id } = this.#locate(uri);
    return this.#withTimeout(provider, () => provider.licenceClass(id));
  }

  /** Per-provider health, for the venue console. */
  async health() {
    const settled = await Promise.allSettled(
      this.entries.map(({ provider }) =>
        this.#withTimeout(provider, () => provider.healthy()).then((ok) => ({ provider, ok }))
      )
    );

    return settled.map((r, i) => {
      const { provider } = this.entries[i];
      if (r.status === "fulfilled") {
        return { id: provider.id, name: provider.name, remote: provider.remote, healthy: r.value.ok };
      }
      return {
        id: provider.id,
        name: provider.name,
        remote: provider.remote,
        healthy: false,
        error: r.reason?.message ?? String(r.reason)
      };
    });
  }
}
