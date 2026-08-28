// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Local library provider — REQ-CON-5, REQ-CON-6, REQ-NFR-3.
 *
 * The venue's own files, served from the `data/` track store. This is the provider
 * that makes the no-WAN guarantee real: it has no network dependency of any kind,
 * so an internet outage cannot touch it.
 *
 * ## Why this reads from the database rather than the filesystem
 *
 * Scanning a directory on every search would be slow and, more importantly, would
 * have nowhere to put the licence class. A file on disk does not know whether the
 * venue has the right to perform it in public; the track store does, because
 * ingest recorded it (`REQ-DAT-8`). Reading from the store keeps one answer to the
 * licensing question rather than two that can disagree.
 *
 * Filesystem ingest — fingerprinting, MusicBrainz tagging, de-duplication — is
 * `CON-2` and populates that store. This provider consumes it.
 */

import { Provider, ProviderError } from "./provider.js";

export class LocalProvider extends Provider {
  /**
   * @param {object} args
   * @param {import("../../data/src/tracks.js").TrackStore} args.tracks
   * @param {string} [args.mediaRoot] Prefix for relative paths recorded at ingest.
   */
  constructor({ tracks, mediaRoot = "" } = {}) {
    super({ id: "local", name: "Venue library", remote: false });
    if (!tracks) throw new TypeError("LocalProvider requires a TrackStore");
    this.tracks = tracks;
    this.mediaRoot = mediaRoot;
  }

  /** @param {string} query @param {{limit?: number}} [opts] */
  async search(query, opts = {}) {
    const limit = opts.limit ?? 50;
    const q = String(query ?? "").trim();
    const rows = q ? this.tracks.search(q, limit) : this.tracks.all().slice(0, limit);
    return rows.map((t) => this.#project(t));
  }

  /** @param {string} trackId */
  async resolve(trackId) {
    const t = this.tracks.get(trackId);
    return t ? this.#project(t) : null;
  }

  /** @param {string} trackId */
  async streamUrl(trackId) {
    const t = this.tracks.get(trackId);
    if (!t) throw new ProviderError(this.id, `no local track "${trackId}"`, { code: "not_found" });
    if (!t.source) {
      // A track in the library with no path is an ingest bug. Saying so is more
      // useful than returning a URL that will fail at load time, when the room is
      // waiting and the cause is three layers away.
      throw new ProviderError(this.id, `local track "${trackId}" has no file path recorded`, {
        code: "no_media_path"
      });
    }
    return this.mediaRoot ? `${this.mediaRoot.replace(/\/$/, "")}/${t.source.replace(/^\//, "")}` : t.source;
  }

  /** @param {string} trackId */
  async licenceClass(trackId) {
    const t = this.tracks.get(trackId);
    if (!t) throw new ProviderError(this.id, `no local track "${trackId}"`, { code: "not_found" });
    return t.licenceClass;
  }

  /** Always true: no network, nothing to be unreachable. */
  async healthy() {
    return true;
  }

  #project(t) {
    return {
      id: t.id,
      title: t.title,
      artist: t.artist,
      duration: t.duration,
      licenceClass: t.licenceClass,
      attribution: t.attribution,
      explicit: t.explicit,
      playable: t.playable,
      source: t.source
    };
  }
}
