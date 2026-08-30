// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Browser-side provider harness — DJX-22.
 *
 * ## The model already existed; the deck was not using it
 *
 * `providers/src/provider.js` has defined the adapter contract since M3 —
 * `search`, `resolve`, `streamUrl`, `licenceClass`, per `REQ-CON-5` — with a
 * `ProviderRouter` that fans a query out, applies a per-provider timeout and
 * reports failures instead of silently serving a smaller catalogue. Three
 * adapters implement it: `local`, `opensubsonic`, `jamendo`.
 *
 * The browser deck grew its own `ArchiveLibrary`, then its own
 * `OpenverseLibrary`, then a hand-rolled merge in the page. Two source-selection
 * mechanisms, one tested and one not, diverging.
 *
 * So this is deliberately **not a second contract**. `BrowserProvider extends
 * Provider` — the same base class the venue adapters use, the same
 * `validateTrack` licence enforcement, the same `ProviderRouter`. What it adds
 * is the part that only exists in a browser: fetching and decoding audio, via a
 * shared session cache.
 *
 * ## Why every provider must declare a licence class
 *
 * Inherited from the contract, and worth repeating because it is the reason this
 * project can exist. `validateTrack` throws if a provider omits `licenceClass`.
 * There is no default and no inference: "nobody checked" and "checked, it is
 * fine" must never be the same value. A provider that cannot establish a licence
 * returns `unknown`, and the venue policy engine blocks it.
 */

import { Provider, ProviderError } from "../../../providers/src/provider.js";
import { SessionCache } from "./session-cache.js";

/**
 * How a provider establishes the licence of what it serves.
 *
 * Recorded per provider rather than assumed, because the two mechanisms carry
 * very different weight and a reader deserves to know which one is in play.
 */
export const LicenceBasis = Object.freeze({
  /** Each item carries its own machine-readable licence URL. Strongest. */
  PER_ITEM: "per_item",
  /**
   * The collection's own published policy establishes it.
   *
   * Weaker, and only acceptable where the policy is unambiguous, public and
   * definitional — LibriVox exists to produce public-domain recordings, and
   * every submission is dedicated to the public domain as a condition of being
   * accepted. That is a verifiable fact about the collection, not a guess about
   * an item.
   *
   * A provider using this MUST record `licenceEvidence`: the URL of the policy
   * being relied on. If the claim cannot be sourced, it is not a basis.
   */
  COLLECTION_POLICY: "collection_policy"
});

export class BrowserProvider extends Provider {
  /**
   * @param {object} args
   * @param {string} args.id
   * @param {string} [args.name]
   * @param {SessionCache} [args.cache] Shared across providers on purpose: the
   *   budget belongs to the tab, not to any one source.
   * @param {typeof fetch} [args.fetch]
   * @param {string} args.licenceBasis One of `LicenceBasis`.
   * @param {string} [args.licenceEvidence] Required for `COLLECTION_POLICY`.
   * @param {string} [args.attribution] How the source asks to be credited.
   */
  constructor(args = {}) {
    super({ id: args.id, name: args.name, remote: true });

    if (!Object.values(LicenceBasis).includes(args.licenceBasis)) {
      throw new TypeError(
        `provider "${args.id}" must declare a licenceBasis of ` +
          `${Object.values(LicenceBasis).join(" or ")} — how it knows what it is serving ` +
          "is part of the contract, not documentation"
      );
    }
    if (args.licenceBasis === LicenceBasis.COLLECTION_POLICY && !args.licenceEvidence) {
      throw new TypeError(
        `provider "${args.id}" relies on a collection policy but cites no evidence for it. ` +
          "A policy claim without a source is an assumption wearing a suit."
      );
    }

    this.licenceBasis = args.licenceBasis;
    this.licenceEvidence = args.licenceEvidence ?? null;
    this.attribution = args.attribution ?? null;
    this.cache = args.cache ?? new SessionCache();
    this.fetch = args.fetch ?? ((...a) => globalThis.fetch(...a));
    /** Rows returned by the last search, so `streamUrl` can resolve without a lookup. */
    this.rows = new Map();
  }

  /** Remember a row so later calls can resolve it. */
  remember(row) {
    if (row && row.id) this.rows.set(row.id, row);
    return row;
  }

  /** @param {string} trackId */
  async resolve(trackId) {
    return this.rows.get(trackId) ?? null;
  }

  /**
   * The playable files behind a result.
   *
   * Part of the browser contract rather than the base one because it is where
   * the two worlds genuinely differ: a venue engine is handed a single stream
   * URL, while a browser needs the file's *name* to title the deck and its
   * *size* to show download progress. `streamUrl` is derived from this rather
   * than implemented separately, so the two can never disagree about which file
   * is the one being played.
   *
   * @param {string} trackId
   * @returns {Promise<Array<{url: string, name: string, bytes: number, durationSec: number}>>}
   */
  async files(trackId) {
    void trackId;
    throw new ProviderError(this.id, `${this.id} does not implement files()`);
  }

  /**
   * Something the engine can load — the first playable file.
   *
   * Derived, never overridden: if a provider answered `streamUrl` from one place
   * and `files` from another, the deck would show one track's name while playing
   * another's audio.
   *
   * @param {string} trackId
   */
  async streamUrl(trackId) {
    const list = await this.files(trackId);
    return list[0]?.url ?? null;
  }

  /**
   * Fetch a track's bytes, through the session cache.
   *
   * The cache is keyed by the resolved URL rather than the track id, so two
   * providers that happen to serve the same file — entirely possible, since
   * Openverse indexes catalogues the Archive also mirrors — share one download.
   *
   * @param {string} trackId
   * @param {{signal?: AbortSignal, onProgress?: (loaded: number, total: number|null) => void}} [opts]
   * @returns {Promise<ArrayBuffer>}
   */
  async fetchAudio(trackId, opts = {}) {
    const url = await this.streamUrl(trackId);
    if (!url) throw new ProviderError(this.id, `no audio for "${trackId}"`, { code: "not_found" });

    return this.cache.get(url, async () => {
      const res = await this.fetch(url, { signal: opts.signal });
      if (!res.ok) {
        throw new ProviderError(this.id, `HTTP ${res.status} fetching audio`, {
          code: "http_error",
          retryable: res.status >= 500
        });
      }
      // Streamed rather than awaited whole when a progress callback is given:
      // these are real files over a real connection, and a control that says
      // nothing for four seconds is indistinguishable from a broken one.
      if (!opts.onProgress || !res.body) return res.arrayBuffer();

      const total = Number(res.headers.get("content-length")) || null;
      const reader = res.body.getReader();
      const chunks = [];
      let loaded = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        opts.onProgress(loaded, total);
      }
      const out = new Uint8Array(loaded);
      let at = 0;
      for (const c of chunks) {
        out.set(c, at);
        at += c.length;
      }
      return out.buffer;
    });
  }

  /**
   * Artwork URL, or null.
   *
   * Returned as a URL for an `<img>` and never fetched: reading the pixels needs
   * CORS that art hosts frequently do not send, and displaying them does not.
   */
  async art(trackId) {
    void trackId;
    return null;
  }

  /** What this provider is, for the UI and for an attribution panel. */
  describe() {
    return {
      id: this.id,
      name: this.name,
      licenceBasis: this.licenceBasis,
      licenceEvidence: this.licenceEvidence,
      attribution: this.attribution
    };
  }
}
