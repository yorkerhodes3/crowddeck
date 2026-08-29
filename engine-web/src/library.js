// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Openly-licensed music the deck can load on first run — DJX-10.
 *
 * A DJ application with an empty library cannot be evaluated: you cannot tell
 * whether the crossfader, the loops or the beatgrid work until something is
 * playing. Asking someone to import their collection before they can see the
 * software work is the wrong order.
 *
 * ## Why the Internet Archive, and not the obvious alternatives
 *
 * The constraint that decides this is **CORS**. A browser can only decode audio
 * it is allowed to fetch cross-origin, and most music APIs are built for servers,
 * not pages. Tested from a real browser against a real origin:
 *
 * | source | search API | audio fetch | verdict |
 * |---|---|---|---|
 * | **Internet Archive** | no key, CORS ok | **CORS ok, decodes** | **usable** |
 * | ccMixter | no key, **CORS blocked** | — | unusable from a page |
 * | Jamendo | requires a client ID | — | needs configuration first |
 * | Free Music Archive | API requires a key | — | needs configuration first |
 *
 * So the Archive is the only one of these that gives a working library with no
 * account, no key and no proxy. Jamendo remains supported through the venue-side
 * provider (`providers/src/jamendo.js`) where a server can hold the credential.
 *
 * ## The licence filter is the point, not a detail
 *
 * The Archive hosts everything from public domain to all-rights-reserved. The
 * search is therefore restricted to licences that **permit commercial use**, and
 * every result is classified again on the way out by the same `cc-licence.js`
 * used venue-side. Two independent filters, because the Archive's `licenseurl`
 * field is operator-supplied metadata and is sometimes absent or wrong.
 *
 * Anything not positively recognised is `unknown`, which is a claim about our
 * knowledge rather than a verdict about the track.
 */

import { classifyCc, ccAttribution } from "../../providers/src/cc-licence.js";

const SEARCH_ENDPOINT = "https://archive.org/advancedsearch.php";
const METADATA_ENDPOINT = "https://archive.org/metadata/";

/**
 * Collections worth searching.
 *
 * `netlabels` is the Archive's curated home for netlabel releases — music
 * published for free distribution under open licences. It is the closest thing
 * the Archive has to a DJ-usable catalogue, as opposed to its much larger
 * holdings of live recordings, spoken word and radio.
 */
export const COLLECTIONS = Object.freeze({
  netlabels: "collection:netlabels",
  audio: "mediatype:audio"
});

/**
 * Licence patterns the search asks for.
 *
 * `by` and `by-sa` permit commercial use; `nc` does not. The Archive's Lucene
 * syntax needs the slash escaped, which is easy to get wrong and produces zero
 * results rather than an error — the failure mode is an empty library, not a
 * message.
 */
const COMMERCIAL_LICENCE_QUERY =
  '(licenseurl:*licenses\\/by\\/* OR licenseurl:*licenses\\/by-sa\\/* OR licenseurl:*publicdomain*)';

/** Audio a browser can be expected to decode. */
const PLAYABLE = /\.(mp3|ogg|oga|opus|flac|wav|m4a)$/i;

/**
 * Preferred ceiling for a first download.
 *
 * The Archive hosts continuous DJ mixes of 60 MB and more. They are legitimate
 * content and a poor first impression: nobody waits a minute to hear whether a
 * crossfader works. Anything at or below this plays first; larger files are still
 * reachable, just ranked below.
 */
const PREFERRED_MAX_BYTES = 12 * 1024 * 1024;

export class ArchiveLibraryError extends Error {
  constructor(message, code = "archive_error", cause) {
    super(message, { cause });
    this.name = "ArchiveLibraryError";
    this.code = code;
  }
}

export class ArchiveLibrary {
  /**
   * @param {{fetch?: typeof globalThis.fetch, rows?: number, commercialOnly?: boolean}} [opts]
   */
  constructor(opts = {}) {
    this.fetch = opts.fetch ?? globalThis.fetch?.bind(globalThis);
    this.rows = opts.rows ?? 40;
    this.commercialOnly = opts.commercialOnly !== false;
    /** Resolved file lists, so picking a track twice does not re-fetch. */
    this.cache = new Map();
  }

  /**
   * Build the query string. Exposed for testing, because a malformed Lucene query
   * returns an empty result set rather than an error — a silent failure that
   * looks exactly like "there is no music".
   *
   * Searching `title` and `creator` alone is not enough, and the difference is
   * large: measured against the live API, "chiptune" matches **0** releases by
   * title or creator and **66** once `subject` and `description` are included.
   * Genre is how a DJ looks for music, and on the Archive genre lives in the
   * subject tags rather than in the title.
   *
   * @param {string} term
   */
  buildQuery(term) {
    const parts = [COLLECTIONS.netlabels, COLLECTIONS.audio];
    if (this.commercialOnly) parts.push(COMMERCIAL_LICENCE_QUERY);
    const clean = String(term ?? "").trim();
    if (clean) {
      // Quoted so a stray colon or bracket cannot alter the structure of the
      // query — the search equivalent of parameter binding.
      const q = escapeLucene(clean);
      parts.push(
        `(title:"${q}" OR creator:"${q}" OR subject:"${q}" OR description:"${q}")`
      );
    }
    return parts.join(" AND ");
  }

  #searchUrl(term, rows) {
    const p = new URLSearchParams();
    p.set("q", this.buildQuery(term));
    for (const f of ["identifier", "title", "creator", "licenseurl", "year", "downloads"]) {
      p.append("fl[]", f);
    }
    p.set("rows", String(rows ?? this.rows));
    p.set("page", "1");
    p.set("output", "json");
    // Popular first: on a service with 77,000 audio items, obscurity is not a
    // useful default for someone who just wants to hear the mixer work.
    p.set("sort[]", "downloads desc");
    return `${SEARCH_ENDPOINT}?${p.toString()}`;
  }

  /**
   * Search for releases.
   *
   * @param {string} [term]
   * @param {{signal?: AbortSignal, rows?: number}} [opts]
   * @returns {Promise<Array<object>>}
   */
  async search(term = "", opts = {}) {
    let res;
    try {
      res = await this.fetch(this.#searchUrl(term, opts.rows), { signal: opts.signal });
    } catch (cause) {
      throw new ArchiveLibraryError(
        "The Internet Archive is unreachable. Local files still work.",
        "network_error",
        cause
      );
    }
    if (!res.ok) {
      throw new ArchiveLibraryError(`Archive search returned HTTP ${res.status}`, "http_error");
    }

    let body;
    try {
      body = await res.json();
    } catch (cause) {
      throw new ArchiveLibraryError("Archive search did not return JSON", "bad_response", cause);
    }

    const docs = body?.response?.docs ?? [];
    return docs.map((d) => this.#projectRelease(d)).filter(Boolean);
  }

  /**
   * A search result as a release we might play from.
   *
   * Classified a second time here rather than trusting the query, because
   * `licenseurl` is operator-supplied and the Archive does not validate it.
   */
  #projectRelease(doc) {
    if (!doc?.identifier) return null;

    const { licenceClass, licence, reason } = classifyCc(doc.licenseurl);
    // Non-commercial material is dropped even though the query excluded it: the
    // two filters are independent on purpose, since a metadata error upstream
    // would otherwise put unplayable music in front of someone.
    if (licenceClass === "cc_noncommercial") return null;

    const creator = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator;
    return {
      id: doc.identifier,
      title: doc.title || doc.identifier,
      artist: creator || "Unknown artist",
      year: doc.year ?? null,
      licenceClass,
      licenceUrl: doc.licenseurl ?? null,
      licenceReason: reason,
      attribution: ccAttribution({ artist: creator, title: doc.title }, licence),
      provider: "archive",
      // A release is a container; the playable files are fetched on demand,
      // because doing it during search would be dozens of extra round trips for
      // results nobody opens.
      tracks: null
    };
  }

  /**
   * The playable files inside one release.
   *
   * @param {string} identifier
   * @param {{signal?: AbortSignal}} [opts]
   */
  async tracks(identifier, opts = {}) {
    if (this.cache.has(identifier)) return this.cache.get(identifier);

    let res;
    try {
      res = await this.fetch(METADATA_ENDPOINT + encodeURIComponent(identifier), {
        signal: opts.signal
      });
    } catch (cause) {
      throw new ArchiveLibraryError("Could not reach the Archive", "network_error", cause);
    }
    if (!res.ok) {
      throw new ArchiveLibraryError(`Archive metadata returned HTTP ${res.status}`, "http_error");
    }

    const meta = await res.json();
    if (!meta?.server || !meta?.dir) {
      throw new ArchiveLibraryError(`No file server for "${identifier}"`, "not_found");
    }

    const files = (meta.files ?? [])
      .filter((f) => PLAYABLE.test(f.name || "") && Number(f.size) > 0)
      .map((f) => ({
        id: `${identifier}/${f.name}`,
        name: stripExtension(f.name),
        file: f.name,
        bytes: Number(f.size),
        // Built from `server` + `dir` rather than the /download/ redirect, so the
        // browser makes one request instead of following a 302 that can lose the
        // CORS headers on some paths.
        url: buildFileUrl(meta.server, meta.dir, f.name),
        durationSec: Number(f.length) || parseClock(f.length)
      }))
      .sort((a, b) => {
        // Reasonable downloads first, then smallest within each band: a 60 MB
        // continuous mix is legitimate content and a poor first impression,
        // because nobody waits a minute to hear whether a crossfader works.
        const aBig = a.bytes > PREFERRED_MAX_BYTES;
        const bBig = b.bytes > PREFERRED_MAX_BYTES;
        if (aBig !== bBig) return aBig ? 1 : -1;
        if (!aBig && a.bytes !== b.bytes) return a.bytes - b.bytes;
        return a.file.localeCompare(b.file, undefined, { numeric: true });
      });

    this.cache.set(identifier, files);
    return files;
  }
}

/** `https://ia800708.us.archive.org/18/items/Foo/02 Bar.mp3`, encoded per segment. */
export function buildFileUrl(server, dir, name) {
  const path = String(name)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `https://${server}${dir}/${path}`;
}

/**
 * Escape the Lucene metacharacters that would change a query's structure.
 *
 * Not a security boundary — it is a public read-only search — but a stray quote
 * silently returns zero results, and "no music" is indistinguishable from "the
 * search is broken" to whoever is looking at it.
 */
export function escapeLucene(term) {
  return String(term).replace(/["\\]/g, "\\$&");
}

function stripExtension(name) {
  return String(name).replace(/\.[a-z0-9]+$/i, "").replace(/^\d+[\s._-]+/, "");
}

/** The Archive reports `length` as either seconds or `M:SS`. */
function parseClock(value) {
  if (typeof value !== "string") return null;
  const m = /^(\d+):(\d{2})(?:\.\d+)?$/.exec(value.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}
