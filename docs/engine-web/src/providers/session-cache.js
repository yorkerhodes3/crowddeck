// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Session cache for fetched audio — DJX-22.
 *
 * A DJ loads the same record onto the other deck, or reloads it after a mistake,
 * constantly. Without a cache each of those is a fresh download of several
 * megabytes from a charity's servers, and a two-to-four second wait while the
 * deck sits dead.
 *
 * ## What is cached, and why it is not the obvious thing
 *
 * The obvious cache holds decoded `AudioBuffer`s — they are what the deck
 * actually plays, so caching them skips decoding too. Measured on real tracks,
 * that is a trap:
 *
 * | track | encoded | decoded | ratio | fetch | decode |
 * |---|---:|---:|---:|---:|---:|
 * | 165 s | 6.3 MB | 55.5 MB | 8.8x | 3745 ms | 1207 ms |
 * | 209 s | 2.2 MB | 70.5 MB | 31.4x | 1323 ms | 2361 ms |
 * | 33 s | 0.3 MB | 11.2 MB | 43.9x | 978 ms | 532 ms |
 *
 * Three tracks cost **137 MB decoded and 8.8 MB encoded**. A decoded cache large
 * enough to be useful would exhaust a tab; an encoded one holds a whole night's
 * set in the space of a single decoded track.
 *
 * And the saving lands in the right place. Fetching is the slow, variable,
 * network-dependent part — and the part that costs someone else bandwidth.
 * Decoding is local, predictable, and roughly a second. Trading a second of CPU
 * for two-to-four seconds of network, and for a repeat download from a
 * stranger's server, is the right way round.
 *
 * ## Bounded, because a cache that grows without limit is a leak
 *
 * Evicted least-recently-used and measured in **bytes rather than entries**:
 * counting entries would give a hundred short samples and one long DJ mix equal
 * weight, and it is the mix that fills the tab.
 */

/** Default ceiling. Roughly a dozen tracks, comfortably inside a tab's budget. */
export const DEFAULT_MAX_BYTES = 64 * 1024 * 1024;

export class SessionCache {
  /**
   * @param {{maxBytes?: number}} [opts]
   */
  constructor(opts = {}) {
    this.maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
    /** @type {Map<string, ArrayBuffer>} Insertion order *is* the LRU order. */
    this.entries = new Map();
    this.bytes = 0;
    this.hits = 0;
    this.misses = 0;
  }

  /** Number of cached items. */
  get size() {
    return this.entries.size;
  }

  /**
   * Fetch through the cache.
   *
   * @param {string} key
   * @param {() => Promise<ArrayBuffer>} loader
   * @returns {Promise<ArrayBuffer>}
   */
  async get(key, loader) {
    if (this.entries.has(key)) {
      const hit = this.entries.get(key);
      // Re-insert to mark it most-recently-used. `Map` preserves insertion
      // order, so delete-then-set is the whole LRU implementation.
      this.entries.delete(key);
      this.entries.set(key, hit);
      this.hits += 1;
      // A COPY, because the caller hands this to `decodeAudioData`, which
      // *detaches* the buffer it is given. Returning the cached instance would
      // leave a zero-length husk behind and the second play would be silence.
      return hit.slice(0);
    }

    this.misses += 1;
    const value = await loader();
    this.put(key, value);
    // Also a copy: `put` stored one, and the caller is about to detach this one.
    return value.slice(0);
  }

  /**
   * Store a value, evicting until it fits.
   *
   * @param {string} key
   * @param {ArrayBuffer} value
   */
  put(key, value) {
    if (!(value instanceof ArrayBuffer) || value.byteLength === 0) return;

    // Something larger than the entire budget is not cached at all, rather than
    // evicting everything to make room for what would be evicted next anyway.
    if (value.byteLength > this.maxBytes) return;

    if (this.entries.has(key)) {
      this.bytes -= this.entries.get(key).byteLength;
      this.entries.delete(key);
    }

    this.entries.set(key, value.slice(0));
    this.bytes += value.byteLength;

    while (this.bytes > this.maxBytes && this.entries.size > 0) {
      const oldest = this.entries.keys().next().value;
      this.bytes -= this.entries.get(oldest).byteLength;
      this.entries.delete(oldest);
    }
  }

  /** True when the key is held. Does not disturb recency. */
  has(key) {
    return this.entries.has(key);
  }

  clear() {
    this.entries.clear();
    this.bytes = 0;
  }

  /** For the UI: what the cache is currently saving. */
  stats() {
    return {
      items: this.entries.size,
      bytes: this.bytes,
      megabytes: Math.round((this.bytes / 1048576) * 10) / 10,
      hits: this.hits,
      misses: this.misses
    };
  }
}
