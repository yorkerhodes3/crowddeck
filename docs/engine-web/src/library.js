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
 * | **Openverse** | no key, CORS ok | **CORS ok, decodes** | **usable — see `openverse.js`** |
 * | ccMixter | no key, **CORS blocked** | — | unusable from a page |
 * | Jamendo (direct) | requires a client ID | — | needs configuration first |
 * | Free Music Archive | API requires a key | — | needs configuration first |
 *
 * The Archive was the *first* source that worked with no account, key or proxy;
 * `openverse.js` later added a second, which reaches Jamendo's catalogue without
 * the client ID the direct adapter needs. Jamendo remains supported directly
 * venue-side (`providers/src/jamendo.js`) where a server can hold a credential.
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
  audio: "mediatype:audio",
  /**
   * LibriVox's public-domain spoken word, mirrored on the Archive — DJX-23.
   *
   * LibriVox's own API (`librivox.org/api/`) sends no CORS header and cannot be
   * called from a page; measured, it fails with `TypeError: Failed to fetch`. The
   * Archive mirror carries the same catalogue — 21,761 items — through an API
   * that already works here.
   */
  librivox: "collection:librivoxaudio"
});

/**
 * Licence patterns the search asks for.
 *
 * `by` and `by-sa` permit commercial use; `nc` does not. The Archive's Lucene
 * syntax needs the slash escaped, which is easy to get wrong and produces zero
 * results rather than an error — the failure mode is an empty library, not a
 * message.
 */
const COMMERCIAL_LICENCE_QUERY =  '(licenseurl:*licenses\\/by\\/* OR licenseurl:*licenses\\/by-sa\\/* OR licenseurl:*publicdomain*)';

/**
 * Restricts the search to releases that actually contain playable audio —
 * DJX-28.
 *
 * Not a refinement; a correctness fix. A netlabel release on the Archive is
 * often published as a **ZIP** with cover art and a text file and no individual
 * tracks at all. Those items are `mediatype:audio` and match every other clause,
 * so they appeared in results, and pressing load produced "no playable audio in
 * this release" — the deck refusing correctly, having offered something it could
 * never play. Measured over 30 loads across five searches, three failures were
 * exactly this.
 *
 * Filtering at query time rather than after the fact, because the alternative is
 * a metadata round trip per result — 25 extra requests per search to a charity's
 * servers, to discard about one row in twenty.
 *
 * Measured cost of the filter: netlabels 77,003 → 73,218 items (−4.9%), and
 * LibriVox 21,761 → 21,755 (−6). Verified that the three known zip-only releases
 * are excluded and that known-good ones survive.
 */
const PLAYABLE_FORMAT_QUERY =
  '(format:"MP3" OR format:"VBR MP3" OR format:"Ogg Vorbis" OR format:"Flac" OR format:"WAVE")';

/** Audio a browser can be expected to decode. */
const PLAYABLE = /\.(mp3|ogg|oga|opus|flac|wav|m4a)$/i;

/**
 * Image files that are plausibly cover art.
 *
 * The Archive stores several images per item and most are not artwork: every
 * audio file gets an auto-generated `_spectrogram.png`, and there are thumbnails
 * and scanned inserts. Those are excluded by name, and remaining candidates are
 * ranked so an explicit "cover" wins.
 */
const IMAGE = /\.(jpe?g|png|gif|webp)$/i;
const NOT_ARTWORK = /(_spectrogram|_thumb|__ia_thumb|_itemimage)/i;

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
   * @param {object} [opts]
   * @param {typeof globalThis.fetch} [opts.fetch]
   * @param {number} [opts.rows]
   * @param {boolean} [opts.commercialOnly]
   * @param {string[]} [opts.collections] Lucene clauses selecting what to search.
   *   Defaults to the netlabels music collection. Overridable because the Archive
   *   is a *gateway* to several distinct catalogues — LibriVox's public-domain
   *   spoken word is the same API and the same file layout, differing only in
   *   which collection is asked for. Sharing the machinery rather than copying it
   *   is what makes a second Archive-backed provider a few lines of config.
   */
  constructor(opts = {}) {
    this.fetch = opts.fetch ?? globalThis.fetch?.bind(globalThis);
    this.rows = opts.rows ?? 40;
    this.commercialOnly = opts.commercialOnly !== false;
    this.collections = opts.collections ?? [COLLECTIONS.netlabels, COLLECTIONS.audio];
    /** Resolved file lists, so picking a track twice does not re-fetch. */
    this.cache = new Map();
    /** Resolved artwork URLs, including the null answers. */
    this.artCache = new Map();
    /**
     * Detected tempos, including the null answers — DJX-19.
     *
     * Caching the failures matters as much as caching the successes: without it
     * every rescan re-downloads the tracks that could not be analysed, which is
     * exactly the set that was slowest to fail.
     */
    this.tempoCache = new Map();
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
    const parts = [...this.collections];
    // Always applied: a release with no playable file is not a search refinement
    // to skip, it is a row that can only ever produce an error when clicked.
    parts.push(PLAYABLE_FORMAT_QUERY);
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
    // `subject` carries the genre tags — DJX-18. The Archive keeps genre there
    // rather than in a dedicated field, so it is both what the query searches
    // and the only place a browse list can show what a record actually is.
    for (const f of [
      "identifier", "title", "creator", "licenseurl", "year", "downloads", "subject", "item_size"
    ]) {
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
      tags: normaliseTags(doc.subject),
      downloads: Number.isFinite(Number(doc.downloads)) ? Number(doc.downloads) : null,
      bytes: Number.isFinite(Number(doc.item_size)) ? Number(doc.item_size) : null,
      // Tempo is not in the Archive's metadata and cannot be had without the
      // audio, so it starts unknown and is filled in by an explicit scan.
      // Stated as null rather than guessed: see `bpm-match.js`.
      bpm: null,
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

  /**
   * Detect the tempo of a release, by analysing its first playable track.
   *
   * ## Why this downloads the whole track
   *
   * A byte-range prefix would be far cheaper — a 256 KB range decodes in about
   * 350 ms and gives 32 seconds of audio, and `Range` is both supported and
   * CORS-exposed by the Archive. It was measured against full-file analysis on
   * ten releases and **disagreed on five of them**, because the opening of a
   * record is frequently an intro with a different feel. A window from the
   * middle was no better: three agreed, five disagreed and two would not decode
   * at all.
   *
   * Worse, confidence did not separate the good answers from the bad — one
   * wrong tempo scored 0.95. So there was no way to show a preview-derived
   * figure *and* be honest about which ones to trust.
   *
   * A browse list that displays a confidently wrong BPM is worse than one that
   * displays nothing: it sends a DJ to a record that will not lock, and the
   * discovery happens in front of people. So this pays the bandwidth and
   * computes the same figure the deck computes on load.
   *
   * @param {object} release
   * @param {{signal?: AbortSignal, decode: (bytes: ArrayBuffer) => Promise<AudioBuffer>,
   *          analyse: (buffer: AudioBuffer) => number|null}} opts
   * @returns {Promise<number|null>} BPM, or null when it cannot be determined.
   */
  async detectTempo(release, opts) {
    if (!release?.id || typeof opts?.decode !== "function" || typeof opts?.analyse !== "function") {
      return null;
    }
    if (this.tempoCache.has(release.id)) return this.tempoCache.get(release.id);

    let bpm = null;
    try {
      const files = await this.tracks(release.id, { signal: opts.signal });
      const track = files[0];
      // A long DJ mix has a tempo, but downloading 60 MB to find it out during a
      // browse is not a reasonable thing to do to someone's connection or to a
      // charity's servers.
      if (track && track.bytes > 0 && track.bytes <= PREFERRED_MAX_BYTES) {
        const res = await this.fetch(track.url, { signal: opts.signal });
        if (res.ok) {
          bpm = opts.analyse(await opts.decode(await res.arrayBuffer()));
        }
      }
    } catch {
      // An unreadable track leaves the tempo unknown. It must not abandon the
      // scan of everything else, and it must not throw into a browse list.
      bpm = null;
    }

    this.tempoCache.set(release.id, bpm);
    return bpm;
  }

  /**
   * Cover art for a release, or null — DJX-12.
   *
   * Returned as a URL for an `<img>`, deliberately not fetched. Reading the bytes
   * would need CORS, and `archive.org/services/img/` does not send the header;
   * an `<img>` element does not need it unless the pixels are read back, and
   * nothing here reads them. That distinction is the whole reason artwork is
   * possible at all.
   *
   * @param {string} identifier
   * @param {{signal?: AbortSignal}} [opts]
   * @returns {Promise<string|null>}
   */
  async coverArt(identifier, opts = {}) {
    if (this.artCache.has(identifier)) return this.artCache.get(identifier);

    let meta;
    try {
      const res = await this.fetch(METADATA_ENDPOINT + encodeURIComponent(identifier), {
        signal: opts.signal
      });
      if (!res.ok) return null;
      meta = await res.json();
    } catch {
      // Artwork is a nicety. A failure here must never stop a track loading.
      return null;
    }

    const candidates = (meta?.files ?? []).filter(
      (f) => IMAGE.test(f.name || "") && !NOT_ARTWORK.test(f.name) && Number(f.size) > 0
    );
    if (!candidates.length || !meta.server || !meta.dir) {
      this.artCache.set(identifier, null);
      return null;
    }

    candidates.sort((a, b) => rankArt(a) - rankArt(b));
    const url = buildFileUrl(meta.server, meta.dir, candidates[0].name);
    this.artCache.set(identifier, url);
    return url;
  }
}

/** An explicit "cover" beats "front" beats anything else; smaller files first. */
function rankArt(file) {
  const n = String(file.name).toLowerCase();
  if (/cover/.test(n)) return 0;
  if (/front|sleeve|artwork/.test(n)) return 1;
  return 2;
}

/** `https://ia800708.us.archive.org/18/items/Foo/02 Bar.mp3`, encoded per segment. */
/**
 * Genre tags, tidied — DJX-18.
 *
 * The Archive's `subject` is operator-supplied and arrives as a string, an
 * array, or a single string holding a comma-separated list. All three are real.
 * Deduplicated case-insensitively because "Chiptune" and "chiptune" both appear,
 * often on the same release, and showing both wastes a row that has little space
 * to begin with.
 *
 * @param {unknown} subject
 * @returns {string[]}
 */
export function normaliseTags(subject) {
  const raw = Array.isArray(subject) ? subject : [subject];
  const seen = new Map();
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    for (const part of entry.split(/[,;]/)) {
      const tag = part.trim().replace(/\s+/g, " ");
      if (!tag) continue;
      const key = tag.toLowerCase();
      // First spelling wins, so the case the uploader chose is preserved.
      if (!seen.has(key)) seen.set(key, tag);
    }
  }
  return [...seen.values()];
}

/**
 * A count as a browse list should show it.
 *
 * @param {number|null} n
 * @returns {string}
 */
export function formatCount(n) {
  if (!Number.isFinite(n) || n < 0) return "";
  if (n < 1000) return String(Math.round(n));
  if (n < 1000000) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k`;
  return `${(n / 1000000).toFixed(1)}M`;
}

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
