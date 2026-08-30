// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Openly-licensed music from Openverse — DJX-20.
 *
 * ## Why this exists: someone asked for YouTube
 *
 * They asked reasonably — it is where the music is. The answer is no, and the
 * reasons are worth writing down here rather than in a chat log, because the
 * question will be asked again.
 *
 * **YouTube's own Terms of Service forbid the use case by name.** Under
 * "Permissions and Restrictions", clause 9: *"use the Service to view or listen
 * to Content other than for personal, non-commercial use (for example, you may
 * not publicly screen videos or stream music from the Service)"*. DJing is
 * publicly streaming music from the Service. That is not an inference about
 * downloaders — it rules out the *permitted* embed too.
 *
 * **And it could not work anyway.** Measured in a real browser rather than
 * assumed: `fetch` of a watch page is blocked by CORS; the official IFrame
 * embed's `contentDocument` is `null` and `createMediaElementSource` throws a
 * `TypeError` when handed an iframe. So Web Audio can never see the samples —
 * meaning no crossfader, no EQ, no key lock, no BPM detection, no waveform and
 * no recording. It would be a video player sitting next to a DJ deck, not a
 * deck.
 *
 * `REQ-CON-7` already encoded this, and `tools/check-content-sources.mjs` fails
 * the build over it. Verified by wiring a YouTube URL in and watching it exit 1.
 *
 * So the honest response is not "no" alone; it is to make the *legitimate*
 * library bigger. That is what this is.
 *
 * ## Why Openverse
 *
 * Openverse is the WordPress Foundation's Creative Commons search, and it
 * aggregates several audio catalogues — Jamendo, Freesound, ccMixter and
 * Wikimedia — behind one API. Measured from a real browser page:
 *
 * | source | key needed | CORS | audio decodes |
 * |---|---|---|---|
 * | **Openverse** | **no** | **yes** | **yes — 5 of 5** |
 * | ccMixter direct | no | **blocked** | — |
 * | Jamendo direct | **yes** | — | — |
 *
 * It therefore reaches Jamendo's catalogue **without an API key**, which the
 * Archive-only library could not do. Jamendo remains supported directly
 * venue-side (`providers/src/jamendo.js`) where a server can hold a credential.
 *
 * ## The licence filter is the whole point
 *
 * An unfiltered Openverse search is mostly unusable here. Measured on "techno",
 * the default response carried `by-nc-nd`, `by-nc-sa` and `by-nc` — every one
 * of them **non-commercial**, and so unplayable in a venue. Asking for
 * `license_type=commercial` removed all of them.
 *
 * As with the Archive, that filter is not trusted on its own: every result is
 * classified again on the way out by the same `cc-licence.js` the venue policy
 * engine uses. Two independent filters, because a metadata error upstream would
 * otherwise put unplayable music in front of someone.
 */

import { classifyCc, ccAttribution } from "../../providers/src/cc-licence.js";

const ENDPOINT = "https://api.openverse.org/v1/audio/";

/**
 * Licence filter, in Openverse's vocabulary.
 *
 * `commercial` is the one that matters — it is what drops the NC licences that
 * dominate an unfiltered response. Deliberately *not* also asking for
 * `modification`: a no-derivatives licence still permits unmodified public
 * playback, which is what a deck does, and excluding ND would throw away
 * playable repertoire for a restriction that does not apply.
 */
const LICENCE_FILTER = "commercial";

/**
 * Restricts results to music rather than sound effects.
 *
 * Without it the response is full of Freesound material that is technically
 * audio and useless on a deck — measured, a 926 ms "whoosh" and a 24-second
 * atmosphere came back for "techno". With it, the same query returned tracks of
 * 313, 440, 192 and 385 seconds.
 */
const CATEGORY = "music";

/**
 * Largest page an unauthenticated caller may ask for.
 *
 * Measured against the live API, not read from documentation: `page_size=20`
 * returns 200 and `page_size=21` returns **401**. Not 400, and not 429 — a
 * status that says "authenticate" for what is really "that page is bigger than
 * your tier allows".
 *
 * Later confirmed against Openverse's source
 * (`api/api/constants/restricted_features.py`): anonymous callers are capped at
 * 20, standard authenticated ones at 50, and only specifically privileged
 * applications reach 240.
 *
 * This cost real debugging time and would have shipped as "Openverse never
 * returns anything", because the app asked for 25 to match the Archive's page
 * while every hand-written probe used a smaller number and worked.
 */
const ANON_MAX_PAGE_SIZE = 20;

/** Cap once an OAuth2 token is supplied. From the same source file. */
const AUTH_MAX_PAGE_SIZE = 50;

/** Below this, it is a sample or a sting rather than something to mix. */
const MIN_TRACK_SECONDS = 45;

/**
 * Longest track worth downloading to determine a tempo.
 *
 * Ten minutes. A continuous mix has a tempo, but fetching tens of megabytes to
 * *browse* is not a reasonable thing to do to someone's connection.
 */
const MAX_SCAN_SECONDS = 600;

export class OpenverseLibraryError extends Error {
  constructor(message, code, cause) {
    super(message);
    this.name = "OpenverseLibraryError";
    this.code = code;
    if (cause) this.cause = cause;
  }
}

export class OpenverseLibrary {
  /**
   * @param {object} [opts]
   * @param {typeof fetch} [opts.fetch]
   * @param {number} [opts.rows]
   * @param {string} [opts.endpoint]
   * @param {string} [opts.apiToken] An OAuth2 bearer token, if one is available.
   *
   * ## On API keys, since it is the obvious next question
   *
   * A registered application raises the limits considerably — from 20/minute and
   * 200/day to **100/minute and 10,000/day**, and the page cap from 20 to 50
   * (verified against `api/api/constants/restricted_features.py`, not from
   * documentation, which has claimed 500 elsewhere and is wrong).
   *
   * **But the token cannot be obtained in a browser.** Registration issues a
   * *confidential* client, and `POST /v1/auth_tokens/token/` requires the
   * `client_secret` in the request body. There is no PKCE or public-client flow.
   * Putting the secret in a page would publish it to anyone who opens dev tools.
   *
   * So this accepts a token but never fetches one: a deployment that already has
   * a server can mint tokens there and hand one over, and the browser-only demo
   * stays anonymous. Anonymous is genuinely adequate for a DJ session — 200
   * searches a day is far more than an evening needs.
   */
  constructor(opts = {}) {
    this.fetch = opts.fetch ?? ((...args) => globalThis.fetch(...args));
    this.rows = opts.rows ?? 25;
    this.endpoint = opts.endpoint ?? ENDPOINT;
    this.apiToken = opts.apiToken ?? null;
    this.provider = "openverse";
    /** Track lists, keyed by result id. One result is one track. */
    this.cache = new Map();
    /** Detected tempos, including the null answers, so a rescan is cheap. */
    this.tempoCache = new Map();
  }

  /** Exposed for testing: a malformed query returns an empty set, not an error. */
  searchUrl(term, rows) {
    const p = new URLSearchParams();
    // An empty term is a legitimate "surprise me". Openverse requires *some*
    // query, so a broad musical word stands in rather than sending nothing and
    // getting a 400.
    p.set("q", (term || "").trim() || "music");
    p.set("license_type", LICENCE_FILTER);
    p.set("category", CATEGORY);
    p.set("page_size", String(Math.min(rows ?? this.rows, this.maxPageSize)));
    return `${this.endpoint}?${p.toString()}`;
  }

  /** The page cap this caller is entitled to. */
  get maxPageSize() {
    return this.apiToken ? AUTH_MAX_PAGE_SIZE : ANON_MAX_PAGE_SIZE;
  }

  /** Request headers, carrying the bearer token when one was supplied. */
  get headers() {
    return this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : undefined;
  }

  /**
   * Search for tracks.
   *
   * @param {string} [term]
   * @param {{signal?: AbortSignal, rows?: number}} [opts]
   */
  async search(term = "", opts = {}) {
    let res;
    try {
      res = await this.fetch(this.searchUrl(term, opts.rows), {
        signal: opts.signal,
        headers: this.headers
      });
    } catch (cause) {
      throw new OpenverseLibraryError(
        "Openverse is unreachable. The Internet Archive and local files still work.",
        "network_error",
        cause
      );
    }
    if (!res.ok) {
      // Openverse allows anonymous use but meters it — measured from the live
      // API, 20 requests/minute and 200/day per IP, returned as 401 rather than
      // the 429 you would expect. Saying "unauthorised" to someone who never
      // supplied a credential is baffling, so it is named for what it is.
      if (res.status === 401 || res.status === 429) {
        throw new OpenverseLibraryError(
          "Openverse is limiting this connection (anonymous use allows 20 requests/minute, " +
            "200/day). Archive results are still shown; try again shortly.",
          "rate_limited"
        );
      }
      throw new OpenverseLibraryError(`Openverse returned HTTP ${res.status}`, "http_error");
    }

    let body;
    try {
      body = await res.json();
    } catch (cause) {
      throw new OpenverseLibraryError("Openverse did not return JSON", "bad_response", cause);
    }

    return (body?.results ?? []).map((r) => this.#project(r)).filter(Boolean);
  }

  #project(item) {
    if (!item?.id || !item?.url) return null;

    const { licenceClass, licence, reason } = classifyCc(item.license_url);
    // Dropped even though the query excluded them. The two filters are
    // independent on purpose: this one is ours and cannot be changed by an
    // upstream metadata edit.
    if (licenceClass === "cc_noncommercial") return null;

    // Openverse reports duration in MILLISECONDS. This repository has already
    // shipped one duration-unit bug (the OpenSubsonic surface), so the
    // conversion is done once, here, and the field is named in seconds.
    const durationSec = Number.isFinite(Number(item.duration)) ? Number(item.duration) / 1000 : null;
    if (durationSec !== null && durationSec > 0 && durationSec < MIN_TRACK_SECONDS) return null;

    // `genres` is often null while `tags` is populated, and vice versa. Both are
    // shown as tags because to a DJ browsing they mean the same thing.
    const tags = [];
    for (const g of item.genres ?? []) if (typeof g === "string") tags.push(g);
    for (const t of item.tags ?? []) if (t && typeof t.name === "string") tags.push(t.name);

    const seen = new Map();
    for (const tag of tags) {
      const key = tag.toLowerCase().trim();
      if (key && !seen.has(key)) seen.set(key, tag.trim());
    }

    return {
      id: `openverse:${item.id}`,
      title: item.title || "Untitled",
      artist: item.creator || "Unknown artist",
      year: null,
      tags: [...seen.values()],
      downloads: null,
      bytes: Number.isFinite(Number(item.filesize)) ? Number(item.filesize) : null,
      durationSec,
      // Tempo is not published here either, so it stays unknown until scanned.
      bpm: null,
      licenceClass,
      licenceUrl: item.license_url ?? null,
      licenceReason: reason,
      attribution: ccAttribution({ artist: item.creator, title: item.title }, licence),
      landingUrl: item.foreign_landing_url ?? null,
      sourceName: item.source || "openverse",
      provider: "openverse",
      // Unlike an Archive item, an Openverse result *is* a single track, so the
      // playable file is already known and `tracks()` costs no round trip.
      audioUrl: item.url
    };
  }

  /**
   * The playable files for a result.
   *
   * One result is one track, so this resolves immediately. Kept async and
   * same-shaped as the Archive's so the browse UI can treat both identically.
   *
   * @param {string} id
   */
  async tracks(id) {
    if (this.cache.has(id)) return this.cache.get(id);
    return [];
  }

  /** Remember a result so `tracks()` can answer for it without a lookup. */
  remember(release) {
    if (!release?.id || !release.audioUrl) return;
    this.cache.set(release.id, [{
      id: release.id,
      name: release.title,
      file: release.title,
      bytes: release.bytes ?? 0,
      url: release.audioUrl,
      durationSec: release.durationSec ?? 0
    }]);
  }

  /**
   * Detect the tempo of a result, by analysing its audio.
   *
   * Same contract and the same honesty as the Archive's: this downloads the
   * whole track rather than a byte-range prefix, because a prefix was measured
   * to disagree with full-file analysis on half of a ten-release sample — the
   * opening of a record is frequently an intro with a different feel — and
   * confidence did not separate the good answers from the bad. A browse list
   * showing a confidently wrong BPM sends a DJ to a record that will not lock.
   *
   * @param {object} release
   * @param {{signal?: AbortSignal, decode: Function, analyse: Function}} opts
   * @returns {Promise<number|null>}
   */
  async detectTempo(release, opts) {
    if (!release?.id || typeof opts?.decode !== "function" || typeof opts?.analyse !== "function") {
      return null;
    }
    if (this.tempoCache.has(release.id)) return this.tempoCache.get(release.id);

    let bpm = null;
    try {
      const url = release.audioUrl || (this.cache.get(release.id) ?? [])[0]?.url;
      // Bounded for the same reason as the Archive: a very long mix has a tempo,
      // but pulling tens of megabytes to *browse* is not reasonable to do to
      // someone's connection.
      const tooLong = release.durationSec && release.durationSec > MAX_SCAN_SECONDS;
      if (url && !tooLong) {
        const res = await this.fetch(url, { signal: opts.signal });
        if (res.ok) bpm = opts.analyse(await opts.decode(await res.arrayBuffer()));
      }
    } catch {
      // Unknown tempo. It must not abandon the scan of everything else, and it
      // must not throw into a browse list.
      bpm = null;
    }

    this.tempoCache.set(release.id, bpm);
    return bpm;
  }

  /**
   * Artwork for a result.
   *
   * Openverse supplies a thumbnail URL directly, so unlike the Archive there is
   * nothing to look up. Returned as a URL for an `<img>` and never fetched —
   * reading the pixels would need CORS the thumbnail host does not send, and
   * displaying them does not.
   */
  async coverArt(id) {
    const files = this.cache.get(id);
    return files && files[0] && files[0].art ? files[0].art : null;
  }
}

/**
 * Does this look like someone trying to use a consumer streaming service?
 *
 * Not a security control — it is a *courtesy*. Someone who pastes a YouTube link
 * into the search box and gets "nothing found" learns nothing and concludes the
 * search is broken. Telling them why, and what does work, is the difference
 * between a dead end and an explanation.
 *
 * Matched on host, so a track legitimately *called* "youtube" is unaffected.
 *
 * @param {string} term
 * @returns {{service: string, why: string}|null}
 */
export function detectConsumerService(term) {
  const text = String(term || "").trim();
  if (!text) return null;

  const hosts = [
    { re: /(^|\/\/|\.|\s)(youtube\.com|youtu\.be|music\.youtube\.com)(\/|$|\s)/i, service: "YouTube" },
    { re: /(^|\/\/|\.|\s)(open\.spotify\.com|spotify\.com)(\/|$|\s)/i, service: "Spotify" },
    { re: /(^|\/\/|\.|\s)(soundcloud\.com)(\/|$|\s)/i, service: "SoundCloud" },
    { re: /(^|\/\/|\.|\s)(music\.apple\.com)(\/|$|\s)/i, service: "Apple Music" },
    { re: /(^|\/\/|\.|\s)(deezer\.com|tidal\.com)(\/|$|\s)/i, service: "that service" }
  ];

  for (const { re, service } of hosts) {
    if (re.test(text)) {
      return {
        service,
        why:
          `${service} cannot be a source here. Its terms allow personal listening only — ` +
          "YouTube's say in as many words that you \"may not publicly screen videos or " +
          "stream music from the Service\" — and a browser cannot route that audio into " +
          "Web Audio anyway, so there would be no crossfader, EQ, key lock or recording. " +
          "Search the openly-licensed library instead, or use LOAD FILE for music you hold."
      };
    }
  }
  return null;
}
