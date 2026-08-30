// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The sources CrowdDeck can actually play — DJX-22, DJX-23.
 *
 * Each is a `BrowserProvider`, which is a `Provider`, which is the contract
 * `REQ-CON-5` defines and the venue-side adapters already implement. Adding a
 * source means adding one of these and registering it — no change to the deck.
 *
 * ## What is here, and what is deliberately not
 *
 * | provider | catalogue | licence basis | key needed |
 * |---|---|---|---|
 * | `archive` | netlabel music | per-item CC URL | no |
 * | `openverse` | Jamendo + Freesound via Openverse | per-item CC URL | no* |
 * | `librivox` | public-domain spoken word | collection policy | no |
 *
 * \* Anonymous works and is what ships. A registered key raises the limits — see
 * `openverse.js`.
 *
 * **The Great 78 Project is deliberately absent.** It is 187,031 digitised 78rpm
 * recordings on the Archive and would be a tempting addition. Universal and Sony
 * sued the Internet Archive over it in 2023; the case settled confidentially in
 * September 2025 and contested works were removed. A catalogue whose copyright
 * status was litigated and resolved on undisclosed terms is not something to put
 * in front of a venue on the strength of "the metadata looked fine" — and its
 * items carry no licence URL at all, so the classifier would mark every one
 * `unknown` regardless.
 *
 * **Old-time radio is absent for a duller reason**: sampled, its items are
 * overwhelmingly tagged `by-nc`, which the policy engine blocks in a commercial
 * venue. The filter would drop nearly everything, so offering it would be a
 * source that looks broken.
 */

import { BrowserProvider, LicenceBasis } from "./browser-provider.js";
import { ArchiveLibrary, COLLECTIONS } from "../library.js";
import { OpenverseLibrary } from "../openverse.js";

/**
 * Netlabel music from the Internet Archive.
 *
 * The original source and still the broadest: openly-licensed electronic music
 * with per-item licence URLs, no key, and CORS on both search and audio.
 */
export class ArchiveProvider extends BrowserProvider {
  constructor(opts = {}) {
    super({
      id: "archive",
      name: "Internet Archive · netlabels",
      cache: opts.cache,
      fetch: opts.fetch,
      licenceBasis: LicenceBasis.PER_ITEM,
      attribution: "Internet Archive"
    });
    this.library = opts.library ?? new ArchiveLibrary({ fetch: opts.fetch });
  }

  async search(query, opts = {}) {
    const releases = await this.library.search(query, opts);
    return releases.map((r) => this.remember({ ...r, provider: this.id, kind: "music" }));
  }

  async streamUrl(trackId) {
    const files = await this.library.tracks(trackId);
    return files[0]?.url ?? null;
  }

  async licenceClass(trackId) {
    return this.rows.get(trackId)?.licenceClass ?? "unknown";
  }

  async art(trackId) {
    return this.library.coverArt(trackId).catch(() => null);
  }

  async detectTempo(row, opts) {
    return this.library.detectTempo(row, opts);
  }
}

/**
 * Public-domain spoken word — DJX-23.
 *
 * Asked for directly: *"story and history speeches useful for mixing"*. Spoken
 * word is genuinely useful over a beat — an intro, a breakdown, a bridge between
 * two records — and it is the one category where public-domain material is
 * abundant and unambiguous.
 *
 * ## The licence basis here is different, and weaker, and that is stated
 *
 * LibriVox items on the Archive mostly carry **no licence URL**, so the
 * per-item classifier returns `unknown` for them. That is not evidence they are
 * restricted; it is evidence the Archive's metadata does not repeat what
 * LibriVox's own policy already establishes — every LibriVox recording is
 * dedicated to the public domain, as a condition of acceptance, and that is the
 * project's entire stated purpose.
 *
 * So this provider declares `COLLECTION_POLICY` and cites the policy. It is the
 * only provider here that does not rely on per-item metadata, and the contract
 * forces it to say so rather than quietly presenting a weaker claim as a
 * stronger one.
 */
export class LibriVoxProvider extends BrowserProvider {
  constructor(opts = {}) {
    super({
      id: "librivox",
      name: "LibriVox · public-domain speech",
      cache: opts.cache,
      fetch: opts.fetch,
      licenceBasis: LicenceBasis.COLLECTION_POLICY,
      licenceEvidence: "https://librivox.org/pages/public-domain/",
      attribution: "LibriVox (public domain)"
    });
    this.library = opts.library ?? new ArchiveLibrary({
      fetch: opts.fetch,
      collections: [COLLECTIONS.librivox, COLLECTIONS.audio],
      // The licence-URL filter would exclude the entire collection, because
      // these items carry no CC URL. The collection policy is the basis instead,
      // and it is cited above.
      commercialOnly: false
    });
  }

  async search(query, opts = {}) {
    const releases = await this.library.search(query, opts);
    return releases.map((r) =>
      this.remember({
        ...r,
        provider: this.id,
        kind: "speech",
        // Overridden deliberately, on the collection policy rather than on the
        // absent per-item metadata. `owned_local` is this codebase's class for
        // public domain: no attribution obligation, no PRO licence needed.
        licenceClass: "owned_local",
        licenceReason:
          "public domain — every LibriVox recording is dedicated to the public domain " +
          "as a condition of acceptance (librivox.org/pages/public-domain/)"
      })
    );
  }

  async streamUrl(trackId) {
    const files = await this.library.tracks(trackId);
    return files[0]?.url ?? null;
  }

  async licenceClass() {
    return "owned_local";
  }

  async art(trackId) {
    return this.library.coverArt(trackId).catch(() => null);
  }

  /**
   * Speech has no tempo, and saying so is better than measuring noise.
   *
   * The BPM detector's crest-factor gate would reject most of this anyway, but
   * refusing up front avoids downloading an hour of audiobook to discover it.
   */
  async detectTempo() {
    return null;
  }
}

/** Creative Commons music aggregated by Openverse — Jamendo, Freesound and peers. */
export class OpenverseProvider extends BrowserProvider {
  constructor(opts = {}) {
    super({
      id: "openverse",
      name: "Openverse · Creative Commons",
      cache: opts.cache,
      fetch: opts.fetch,
      licenceBasis: LicenceBasis.PER_ITEM,
      attribution: "Openverse (WordPress Foundation)"
    });
    this.library = opts.library ?? new OpenverseLibrary({ fetch: opts.fetch, apiToken: opts.apiToken });
  }

  async search(query, opts = {}) {
    const results = await this.library.search(query, opts);
    return results.map((r) => {
      this.library.remember(r);
      return this.remember({ ...r, provider: this.id, kind: "music" });
    });
  }

  async streamUrl(trackId) {
    return this.rows.get(trackId)?.audioUrl ?? null;
  }

  async licenceClass(trackId) {
    return this.rows.get(trackId)?.licenceClass ?? "unknown";
  }

  async detectTempo(row, opts) {
    return this.library.detectTempo(row, opts);
  }
}
