// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Jamendo provider — CON-5, REQ-CON-5, REQ-CON-6.
 *
 * > v1 MUST ship local, opensubsonic and at least one CC provider (Jamendo), so a
 * > fresh install has legally playable music on first run.
 *
 * That requirement is doing more work than it looks. A venue appliance that arrives
 * with an empty catalogue cannot be evaluated: you cannot tell whether the queue,
 * the fairness rules or the crossfade work until something is playing. Jamendo
 * gives a fresh install real music that a commercial venue may lawfully perform,
 * which turns the first ten minutes from "now import your library" into "it works".
 *
 * ## The part that carries legal weight
 *
 * Jamendo hosts every Creative Commons variant, including the non-commercial ones a
 * venue must not perform. So this provider does **not** treat "it came from
 * Jamendo" as meaning "it is safe": every track is classified from its
 * `license_ccurl` by `cc-licence.js`, and anything not positively recognised
 * becomes `unknown`, which policy blocks.
 *
 * By default the provider goes further and asks the API for commercial-use
 * repertoire only (`ccsa`/`ccnd` families via `include=licenses`), so
 * non-commercial tracks are filtered server-side as well as classified client-side.
 * Two independent mechanisms, because the consequence of getting this wrong lands
 * on the venue rather than on us.
 *
 * ## No API key, no provider
 *
 * Jamendo requires a client ID. Rather than shipping one or silently disabling
 * itself, the provider refuses to construct without one — an appliance that appears
 * to have a music source but returns nothing is worse than one that says the source
 * is not configured.
 */

import { Provider, ProviderError } from "./provider.js";
import { classifyCc, ccAttribution } from "./cc-licence.js";

const API_ROOT = "https://api.jamendo.com/v3.0";

/**
 * Licence families to request. `ccsa` and `ccnd` are Jamendo's groupings for
 * share-alike and no-derivatives repertoire; both permit commercial use. The
 * non-commercial family is deliberately absent.
 */
const COMMERCIAL_LICENCE_FAMILIES = "ccsa+ccnd";

export class JamendoProvider extends Provider {
  /**
   * @param {object} args
   * @param {string} args.clientId Jamendo API client ID.
   * @param {typeof globalThis.fetch} [args.fetch] Injected for testing.
   * @param {string} [args.apiRoot]
   * @param {boolean} [args.commercialOnly] Ask the API for commercial-use tracks only.
   */
  constructor({ clientId, fetch: fetchImpl, apiRoot = API_ROOT, commercialOnly = true } = {}) {
    super({ id: "jamendo", name: "Jamendo (Creative Commons)", remote: true });

    if (!clientId || typeof clientId !== "string") {
      throw new TypeError(
        "JamendoProvider requires a clientId. A provider that silently returns nothing is " +
          "worse than one that says it is not configured."
      );
    }
    this.clientId = clientId;
    this.apiRoot = apiRoot.replace(/\/$/, "");
    this.commercialOnly = commercialOnly;
    this.fetch = fetchImpl ?? globalThis.fetch;
    /** Cache resolved tracks so `resolve`, `streamUrl` and `licenceClass` need not re-fetch. */
    this.cache = new Map();
  }

  #url(path, params) {
    const url = new URL(`${this.apiRoot}${path}`);
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("format", "json");
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    return url.toString();
  }

  async #get(path, params, signal) {
    let res;
    try {
      res = await this.fetch(this.#url(path, params), { signal });
    } catch (cause) {
      throw new ProviderError(this.id, `Jamendo is unreachable: ${cause.message}`, {
        code: "network_error",
        retryable: true,
        cause
      });
    }

    if (!res.ok) {
      throw new ProviderError(this.id, `Jamendo returned HTTP ${res.status}`, {
        code: "http_error",
        // 5xx and 429 are worth retrying; a 4xx means our request is wrong.
        retryable: res.status >= 500 || res.status === 429
      });
    }

    const body = await res.json();

    // Jamendo signals failure inside a 200 response, so checking `res.ok` alone
    // would treat an auth failure as an empty catalogue — the venue would see a
    // working search that never returns anything.
    if (body?.headers?.status !== "success") {
      const message = body?.headers?.error_message || "unknown Jamendo API error";
      throw new ProviderError(this.id, `Jamendo API error: ${message}`, {
        code: "api_error",
        retryable: false
      });
    }

    return body.results ?? [];
  }

  /** @param {string} query @param {{limit?: number, signal?: AbortSignal}} [opts] */
  async search(query, opts = {}) {
    const rows = await this.#get(
      "/tracks/",
      {
        limit: Math.min(opts.limit ?? 50, 200),
        search: query || undefined,
        // Without a search term, return something worth listening to rather than
        // an arbitrary slice.
        order: query ? undefined : "popularity_total",
        include: "licenses musicinfo",
        audioformat: "mp32",
        ...(this.commercialOnly ? { ccsa: "true", license_cc: COMMERCIAL_LICENCE_FAMILIES } : {})
      },
      opts.signal
    );

    return rows.map((r) => this.#project(r)).filter((t) => t !== null);
  }

  /** @param {string} trackId */
  async resolve(trackId) {
    if (this.cache.has(trackId)) return this.cache.get(trackId);

    const rows = await this.#get("/tracks/", {
      id: trackId,
      include: "licenses musicinfo",
      audioformat: "mp32"
    });
    if (rows.length === 0) return null;

    const track = this.#project(rows[0]);
    if (track) this.cache.set(trackId, track);
    return track;
  }

  /** @param {string} trackId */
  async streamUrl(trackId) {
    const track = await this.resolve(trackId);
    if (!track) {
      throw new ProviderError(this.id, `no Jamendo track "${trackId}"`, { code: "not_found" });
    }
    if (!track.source) {
      throw new ProviderError(this.id, `Jamendo track "${trackId}" has no audio URL`, {
        code: "no_media_path"
      });
    }
    return track.source;
  }

  /** @param {string} trackId */
  async licenceClass(trackId) {
    const track = await this.resolve(trackId);
    if (!track) {
      throw new ProviderError(this.id, `no Jamendo track "${trackId}"`, { code: "not_found" });
    }
    return track.licenceClass;
  }

  /** Cheap: one track, so the venue console can distinguish "down" from "slow". */
  async healthy() {
    try {
      await this.#get("/tracks/", { limit: 1 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Turn a Jamendo row into a CrowdDeck track.
   *
   * Returns null for anything a commercial venue must not perform, so
   * non-commercial repertoire never reaches the catalogue even if the server-side
   * filter is bypassed or changes.
   */
  #project(row) {
    if (!row?.id) return null;

    const { licenceClass, licence, reason } = classifyCc(row.license_ccurl);

    // Filtered here as well as server-side. Two independent mechanisms, because a
    // silent API change would otherwise put unplayable music in front of patrons.
    if (licenceClass === "cc_noncommercial") return null;

    const track = {
      id: String(row.id),
      title: row.name,
      artist: row.artist_name,
      duration: row.duration ? row.duration * 1000 : null,
      licenceClass,
      licenceUrl: row.license_ccurl ?? null,
      licenceReason: reason,
      attribution: ccAttribution({ artist: row.artist_name, title: row.name }, licence),
      source: row.audio || row.audiodownload || null,
      // Jamendo has no explicit-content flag. Absent evidence, do not claim it is
      // clean: the venue's own policy decides, and a false `false` would slip
      // explicit material past a daypart rule.
      explicit: undefined,
      bpm: row.musicinfo?.bpm ? Number(row.musicinfo.bpm) : undefined,
      genre: row.musicinfo?.tags?.genres?.[0],
      playable: Boolean(row.audio || row.audiodownload)
    };

    return track;
  }
}
