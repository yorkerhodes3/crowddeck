// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The OpenSubsonic-compatible surface — API-2, REQ-API-10 … REQ-API-12.
 *
 * Speaking Subsonic buys an existing client ecosystem on day one. Every Subsonic
 * client already knows how to browse, search and — crucially — drive
 * `jukeboxControl`, which means "playback on the server's own audio hardware".
 * That is precisely what this product is, so the mapping is unusually natural.
 *
 * ## Why this is a separate module and not a few more routes
 *
 * Subsonic has a completely different error model from the venue API: it answers
 * **HTTP 200 with the failure inside the envelope**, authenticates by query string,
 * and answers to both `/rest/ping` and `/rest/ping.view`. Interleaving that with a
 * REST API that uses status codes properly would corrupt both. So the surface is
 * self-contained, mounted ahead of the main router, and the venue API is unaware
 * of it beyond handing over requests under `/rest/`.
 *
 * ## Subsonic clients are staff — REQ-API-12
 *
 * The Subsonic auth model has no patron concept. A Subsonic client authenticates
 * as a user with library access and assumes it may play anything immediately;
 * there is no "request a song and wait your turn". Mapping such a client to a
 * patron would let it walk around credit limits and fairness rules, so it is staff.
 *
 * That has a consequence worth being explicit about: a Subsonic credential can
 * skip, stop and clear the queue. It crosses the wire as `md5(password + salt)`,
 * which is offline-crackable. Defaulting it to the venue's staff key would put the
 * main staff credential behind a weak hash, so **this surface is disabled unless an
 * operator gives it a password of its own**, and refuses to start if that password
 * is the staff key.
 *
 * ## The honest part of jukeboxControl
 *
 * A Subsonic client calling `add` expects its track appended and played in turn.
 * Ours goes through the same Unified Scheduler as every patron request, which may
 * order it differently — that is the entire point of the product. So `get` returns
 * the scheduler's **real** order rather than the order things were added. The
 * client is told the truth even when it is not the answer it expected; a jukebox
 * that lies about its queue is worse than one that surprises you.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { Actor } from "../../core/src/queue.js";

/** The last Subsonic version, and the floor OpenSubsonic servers implement. */
export const API_VERSION = "1.16.1";
export const SERVER_TYPE = "crowddeck";

/**
 * Our own extension, deliberately namespaced.
 *
 * REQ-API-11 originally named a `jukeboxMediaTypes` extension. **There is no such
 * extension.** The registry defines exactly ten, and that is not among them — the
 * name came from unverified concept-phase research. The requirement's *intent* was
 * right, so rather than quietly drop it or invent a private field and imply it is a
 * standard, the capability ships under a name nobody can mistake for one.
 */
export const MEDIA_TYPES_EXTENSION = "crowddeck.mediaTypes";

/** Error codes, from the Subsonic specification. */
export const SubsonicError = Object.freeze({
  GENERIC: 0,
  MISSING_PARAMETER: 10,
  CLIENT_TOO_OLD: 20,
  SERVER_TOO_OLD: 30,
  WRONG_CREDENTIALS: 40,
  TOKEN_AUTH_UNSUPPORTED: 41,
  AUTH_MECHANISM_UNSUPPORTED: 42,
  CONFLICTING_AUTH: 43,
  INVALID_API_KEY: 44,
  NOT_AUTHORIZED: 50,
  NOT_FOUND: 70
});

const JUKEBOX_ACTIONS = new Set([
  "get", "status", "set", "start", "stop", "skip", "add", "clear", "remove", "shuffle", "setGain"
]);

/** Thrown by a handler to produce a Subsonic error envelope. */
class SubsonicFault extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/** Constant-time string comparison, so a credential cannot be found a byte at a time. */
function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? ""), "utf8");
  const y = Buffer.from(String(b ?? ""), "utf8");
  // Lengths must match for timingSafeEqual, and comparing hashes of equal length
  // keeps the length itself from leaking.
  const hx = createHash("sha256").update(x).digest();
  const hy = createHash("sha256").update(y).digest();
  return timingSafeEqual(hx, hy);
}

export class SubsonicSurface {
  /**
   * @param {object} opts
   * @param {import("../../core/src/scheduler.js").Scheduler} opts.scheduler
   * @param {string} [opts.password] Enables the surface. Must not be the staff key.
   * @param {string} [opts.apiKey] Alternative credential, checked constant-time.
   * @param {string} [opts.staffKey] Only used to refuse a shared credential.
   * @param {string} [opts.venueName]
   * @param {string} [opts.serverVersion]
   * @param {{search: (q: string) => object[]}} [opts.catalog]
   * @param {(trackId: string) => Promise<{body: Buffer, contentType: string}|null>} [opts.streamResolver]
   * @param {(coverId: string) => Promise<{body: Buffer, contentType: string}|null>} [opts.coverArtResolver]
   * @param {import("../../core/src/engine-adapter.js").EngineAdapter} [opts.adapter]
   */
  constructor(opts = {}) {
    this.scheduler = opts.scheduler;
    this.password = opts.password ?? null;
    this.apiKey = opts.apiKey ?? null;
    this.venueName = opts.venueName ?? "CrowdDeck Venue";
    this.serverVersion = opts.serverVersion ?? "0.1.0";
    this.catalog = opts.catalog ?? null;
    this.streamResolver = opts.streamResolver ?? null;
    this.coverArtResolver = opts.coverArtResolver ?? null;
    this.adapter = opts.adapter ?? null;

    // Supplied by the venue API so both surfaces screen against the same venue
    // licence profile and daypart rules. Duplicating this was how the two would
    // have drifted, and a Subsonic client enqueueing a track the patron API would
    // have refused is a policy hole, not a convenience.
    this.policyContext =
      opts.policyContext ??
      (() => {
        const d = new Date();
        return {
          venueMinuteOfDay: d.getHours() * 60 + d.getMinutes(),
          nowMs: d.getTime(),
          holdsPro: false
        };
      });

    // REQ-API-12. A Subsonic credential is staff-level and travels as a weak hash;
    // sharing it with the staff key would drag the real credential down to that
    // level. Refused at construction rather than warned about at runtime.
    if (opts.staffKey && this.password && opts.staffKey === this.password) {
      throw new TypeError(
        "the Subsonic password must not be the staff key. Subsonic sends it as " +
          "md5(password + salt), which is offline-crackable, and a Subsonic client is " +
          "staff-level (REQ-API-12) — sharing the credential would put skip, mode and " +
          "panic behind that hash."
      );
    }
    if (opts.staffKey && this.apiKey && opts.staffKey === this.apiKey) {
      throw new TypeError("the Subsonic apiKey must not be the staff key.");
    }

    /** Last gain set through jukeboxControl, in Subsonic's 0..1 terms. */
    this.gain = 1;
  }

  /** Off unless an operator configured a credential for it. */
  get enabled() {
    return Boolean(this.password || this.apiKey);
  }

  /* ------------------------------------------------------------- envelopes */

  #base() {
    return {
      status: "ok",
      version: API_VERSION,
      type: SERVER_TYPE,
      serverVersion: this.serverVersion,
      openSubsonic: true
    };
  }

  #ok(body = {}) {
    return { "subsonic-response": { ...this.#base(), ...body } };
  }

  #fail(code, message) {
    return { "subsonic-response": { ...this.#base(), status: "failed", error: { code, message } } };
  }

  /* ------------------------------------------------------------------ auth */

  /**
   * Verify one request's credentials.
   *
   * Token auth is checked by recomputing md5(password + salt) here, which requires
   * holding the password. That is inherent to the Subsonic scheme, not a choice:
   * the server cannot verify the token without being able to recreate it, which is
   * exactly why the credential is kept separate from the staff key.
   */
  #authenticate(q) {
    const apiKey = q.get("apiKey");
    const user = q.get("u");
    const token = q.get("t");
    const salt = q.get("s");
    const plain = q.get("p");

    if (apiKey && (user || token || plain)) {
      throw new SubsonicFault(
        SubsonicError.CONFLICTING_AUTH,
        "Provide either an apiKey or a username with a password, not both."
      );
    }

    if (apiKey) {
      if (!this.apiKey || !safeEqual(apiKey, this.apiKey)) {
        throw new SubsonicFault(SubsonicError.INVALID_API_KEY, "Invalid API key");
      }
      return;
    }

    if (!this.password) {
      throw new SubsonicFault(
        SubsonicError.AUTH_MECHANISM_UNSUPPORTED,
        "This server accepts API key authentication only."
      );
    }

    if (token || salt) {
      if (!token || !salt) {
        throw new SubsonicFault(
          SubsonicError.MISSING_PARAMETER,
          "Token authentication needs both t and s."
        );
      }
      const expected = createHash("md5").update(`${this.password}${salt}`, "utf8").digest("hex");
      if (!safeEqual(token.toLowerCase(), expected)) {
        throw new SubsonicFault(SubsonicError.WRONG_CREDENTIALS, "Wrong username or password");
      }
      return;
    }

    if (plain) {
      // `enc:` is hex, and is obfuscation rather than encryption — it protects
      // against a shoulder, not a network. Accepted because clients still send it.
      const supplied = plain.startsWith("enc:")
        ? Buffer.from(plain.slice(4), "hex").toString("utf8")
        : plain;
      if (!safeEqual(supplied, this.password)) {
        throw new SubsonicFault(SubsonicError.WRONG_CREDENTIALS, "Wrong username or password");
      }
      return;
    }

    throw new SubsonicFault(SubsonicError.MISSING_PARAMETER, "No credentials supplied.");
  }

  /* --------------------------------------------------------------- routing */

  /**
   * Handle a `/rest/...` request, or return false so the venue API can route it.
   *
   * @param {import("node:http").IncomingMessage} req
   * @param {import("node:http").ServerResponse} res
   * @param {URL} url
   * @param {Record<string, string>} [formBody] parsed form POST, per the formPost extension
   */
  async handle(req, res, url, formBody = null) {
    if (!url.pathname.startsWith("/rest/")) return false;
    // Not enabled means not present. A 404 rather than a 403 avoids confirming to
    // a scanner that there is a Subsonic surface here at all.
    if (!this.enabled) return false;

    // `.view` is the historical suffix and every client still sends it.
    const method = url.pathname.slice("/rest/".length).replace(/\.view$/, "");

    // The formPost extension: parameters may arrive in the body instead of the
    // query string, which is how clients avoid URL length limits.
    const q = new URLSearchParams(url.searchParams);
    if (formBody) for (const [k, v] of Object.entries(formBody)) q.append(k, v);

    try {
      // Explicitly exempt from authentication by the specification: a client must
      // be able to discover extensions before it knows how to authenticate.
      if (method === "getOpenSubsonicExtensions") {
        return this.#send(res, q, this.#ok({ openSubsonicExtensions: this.#extensions() }));
      }

      this.#authenticate(q);
      const result = await this.#dispatch(method, q, res);
      // A binary handler writes the response itself.
      if (result === undefined) return true;
      return this.#send(res, q, this.#ok(result));
    } catch (err) {
      if (err instanceof SubsonicFault) {
        return this.#send(res, q, this.#fail(err.code, err.message));
      }
      return this.#send(
        res,
        q,
        this.#fail(SubsonicError.GENERIC, err?.message ?? "Unexpected error")
      );
    }
  }

  #extensions() {
    return [
      // Real, published extensions we actually implement.
      { name: "formPost", versions: [1] },
      ...(this.apiKey ? [{ name: "apiKeyAuthentication", versions: [1] }] : []),
      // Ours, and named so it cannot be mistaken for a standard one.
      { name: MEDIA_TYPES_EXTENSION, versions: [1] }
    ];
  }

  async #dispatch(method, q, res) {
    switch (method) {
      case "ping":
        return {};
      case "getLicense":
        // Subsonic's own licensing, not music licensing. Conflating the two would
        // be a genuinely dangerous piece of ambiguity, so: this is about whether
        // the *server software* is licensed, and ours always is.
        return { license: { valid: true, email: "", licenseExpires: null, trialExpires: null } };
      case "getOpenSubsonicExtensions":
        return { openSubsonicExtensions: this.#extensions() };
      case "search3":
        return this.#search3(q);
      case "getSong":
        return { song: this.#requireSong(q.get("id")) };
      case "getAlbumList2":
        // Honest emptiness. This appliance is a queue, not a library browser; a
        // fabricated album list would send clients looking for things that are not
        // there. `search3` and the jukebox playlist are where the content is.
        return { albumList2: { album: [] } };
      case "getPlaylists":
        return { playlists: { playlist: [] } };
      case "getMusicFolders":
        return { musicFolders: { musicFolder: [{ id: 0, name: this.venueName }] } };
      case "stream":
        return this.#stream(q, res);
      case "getCoverArt":
        return this.#coverArt(q, res);
      case "jukeboxControl":
        return this.#jukebox(q);
      default:
        throw new SubsonicFault(
          SubsonicError.NOT_FOUND,
          `${method} is not implemented by this server`
        );
    }
  }

  /* -------------------------------------------------------------- browsing */

  #search3(q) {
    const query = q.get("query");
    if (query === null) {
      throw new SubsonicFault(SubsonicError.MISSING_PARAMETER, "query is required");
    }
    const count = Number(q.get("songCount") ?? 20);
    const tracks = this.catalog ? this.catalog.search(query) : [];
    return {
      searchResult3: {
        artist: [],
        album: [],
        song: tracks.slice(0, Number.isFinite(count) ? count : 20).map((t) => toChild(t))
      }
    };
  }

  #requireSong(id) {
    if (!id) throw new SubsonicFault(SubsonicError.MISSING_PARAMETER, "id is required");
    const track = this.#findTrack(id);
    if (!track) throw new SubsonicFault(SubsonicError.NOT_FOUND, "Song not found");
    return toChild(track);
  }

  /**
   * Look in the queue first: a Subsonic client mostly asks about what it queued.
   *
   * Catalogues differ in shape — `DemoCatalog` exposes `get(id)` and a `byId` Map,
   * a provider router does not — so the lookup handles each explicitly rather than
   * assuming one. Assuming `byId` was a method is what broke every `add`.
   */
  #findTrack(id) {
    for (const entry of this.scheduler.entries.values()) {
      if (entry.track?.id === id) return entry.track;
    }
    if (!this.catalog) return null;

    if (typeof this.catalog.get === "function") return this.catalog.get(id) ?? null;
    if (this.catalog.byId instanceof Map) return this.catalog.byId.get(id) ?? null;
    if (typeof this.catalog.byId === "function") return this.catalog.byId(id) ?? null;

    if (typeof this.catalog.search === "function") {
      return this.catalog.search("").find((t) => t.id === id) ?? null;
    }
    return null;
  }

  /* ---------------------------------------------------------------- binary */

  async #stream(q, res) {
    const id = q.get("id");
    if (!id) throw new SubsonicFault(SubsonicError.MISSING_PARAMETER, "id is required");
    if (!this.streamResolver) {
      throw new SubsonicFault(
        SubsonicError.NOT_FOUND,
        "This appliance plays through its own hardware and does not serve audio to clients."
      );
    }
    const media = await this.streamResolver(id);
    if (!media) throw new SubsonicFault(SubsonicError.NOT_FOUND, "Song not found");

    res.writeHead(200, {
      "content-type": media.contentType ?? "application/octet-stream",
      "content-length": media.body.length,
      "access-control-allow-origin": "*"
    });
    res.end(media.body);
    return undefined;
  }

  async #coverArt(q, res) {
    const id = q.get("id");
    if (!id) throw new SubsonicFault(SubsonicError.MISSING_PARAMETER, "id is required");
    const art = this.coverArtResolver ? await this.coverArtResolver(id) : null;
    if (!art) throw new SubsonicFault(SubsonicError.NOT_FOUND, "Cover art not found");

    res.writeHead(200, {
      "content-type": art.contentType ?? "image/jpeg",
      "content-length": art.body.length,
      "access-control-allow-origin": "*"
    });
    res.end(art.body);
    return undefined;
  }

  /* --------------------------------------------------------- jukeboxControl */

  /**
   * The jukebox, driven by a Subsonic client — REQ-API-11.
   *
   * Everything here goes through the Unified Scheduler rather than round it. A
   * Subsonic client is staff, so its additions carry staff priority, but they are
   * still ordinary queue entries subject to the same policy and fairness code. The
   * alternative — a private path straight to the deck — would mean two queues
   * disagreeing about what plays next, which is the bug this product exists to not
   * have.
   */
  async #jukebox(q) {
    const action = q.get("action");
    if (!action) throw new SubsonicFault(SubsonicError.MISSING_PARAMETER, "action is required");
    if (!JUKEBOX_ACTIONS.has(action)) {
      throw new SubsonicFault(SubsonicError.GENERIC, `unknown jukebox action "${action}"`);
    }

    const ordered = () => this.scheduler.ordered().map((o) => this.scheduler.entries.get(o.id));

    switch (action) {
      case "get":
        return { jukeboxPlaylist: { ...this.#status(), entry: ordered().map((e) => this.#entry(e)) } };

      case "status":
        return { jukeboxStatus: this.#status() };

      case "start":
        this.scheduler.tick();
        if (this.adapter?.resume) await this.adapter.resume();
        return { jukeboxStatus: this.#status() };

      case "stop":
        if (this.adapter?.pause) await this.adapter.pause();
        return { jukeboxStatus: this.#status() };

      case "skip": {
        // Subsonic's index is into the playlist it last saw. We answer with the
        // scheduler's order, so the index means the same thing to both of us.
        const index = Number(q.get("index") ?? 0);
        const list = ordered();
        const target = list[index];
        if (!target) throw new SubsonicFault(SubsonicError.NOT_FOUND, `no entry at index ${index}`);
        // Everything up to and including the target is passed over: "skip to index
        // 3" means the first three are not going to play, not that they move down.
        for (const e of list.slice(0, index + 1)) this.#discard(e);
        return { jukeboxStatus: this.#status() };
      }

      case "add": {
        for (const id of q.getAll("id")) this.#enqueue(id);
        return { jukeboxStatus: this.#status() };
      }

      case "set": {
        // "similar to clear followed by add, but will not change the currently
        // playing track" — so the audible track is deliberately left alone.
        this.#clear();
        for (const id of q.getAll("id")) this.#enqueue(id);
        return { jukeboxStatus: this.#status() };
      }

      case "clear":
        this.#clear();
        return { jukeboxStatus: this.#status() };

      case "remove": {
        const index = Number(q.get("index"));
        if (!Number.isInteger(index)) {
          throw new SubsonicFault(SubsonicError.MISSING_PARAMETER, "index is required");
        }
        const target = ordered()[index];
        if (!target) throw new SubsonicFault(SubsonicError.NOT_FOUND, `no entry at index ${index}`);
        this.#discard(target);
        return { jukeboxStatus: this.#status() };
      }

      case "shuffle":
        // Deliberately not implemented as a shuffle. The queue order is produced
        // by the fairness and priority rules, and a client that could randomise it
        // would be able to undo a paid boost and every patron's place in line. It
        // reports success with the order unchanged rather than silently destroying
        // the property the whole scheduler exists to provide.
        return { jukeboxStatus: this.#status() };

      case "setGain": {
        const gain = Number(q.get("gain"));
        if (!Number.isFinite(gain) || gain < 0 || gain > 1) {
          throw new SubsonicFault(SubsonicError.GENERIC, "gain must be between 0.0 and 1.0");
        }
        this.gain = gain;
        // Subsonic's 0..1 gain *is* parameter space (REQ-CDEP-12a). Because of the
        // SPIKE-1 amendment we can set it without knowing the engine's dB range —
        // which for Mixxx is -14..14 dB, not the 0..4 linear the spec first said.
        if (this.adapter?.client?.setParameter) {
          await this.adapter.client.setParameter("[Master]", "gain", gain);
        }
        return { jukeboxStatus: this.#status() };
      }

      default:
        throw new SubsonicFault(SubsonicError.GENERIC, `unhandled action "${action}"`);
    }
  }

  #status() {
    const playing = this.scheduler.nowPlaying;
    return {
      currentIndex: playing ? 0 : -1,
      playing: Boolean(playing),
      gain: this.gain,
      position: 0
    };
  }

  #clear() {
    // The audible track is left alone: `clear` empties the queue, it does not
    // cut the room off mid-song.
    for (const o of this.scheduler.ordered()) {
      const entry = this.scheduler.entries.get(o.id);
      if (entry && entry !== this.scheduler.nowPlaying) this.#discard(entry);
    }
  }

  /**
   * Take one entry out of the queue.
   *
   * `reject` for anything not yet playing, `skip` only for what the room can
   * actually hear. Two reasons, and both were found the hard way:
   *
   * - `skipped` is only reachable from `cued` or `playing` in the state machine,
   *   so skipping a staged entry throws — every `clear` silently failed.
   * - `skip` records the track in `recentPlays`, because a skipped track was
   *   partly heard and should go into cooldown. A track removed from the queue was
   *   *never played*, so recording it would put that track and its artist into
   *   cooldown for something nobody in the room heard.
   *
   * @param {import("../../core/src/queue.js").QueueEntry} entry
   */
  #discard(entry) {
    if (this.scheduler.nowPlaying?.id === entry.id || entry.state === "cued") {
      this.scheduler.skip(entry.id, Actor.STAFF);
    } else {
      this.scheduler.reject(entry.id, "removed by a Subsonic client");
    }
  }

  #enqueue(id) {
    const track = this.#findTrack(id);
    if (!track) throw new SubsonicFault(SubsonicError.NOT_FOUND, `no track "${id}"`);

    const result = this.scheduler.request({
      track,
      // Attributed, not anonymous: the play log must be able to say a Subsonic
      // client put this in the queue, not blame a patron who was not involved.
      patronId: "subsonic",
      // Staff-level, per REQ-API-12 — exempt from the patron quota, but still
      // subject to every policy and licensing rule.
      actor: Actor.STAFF,
      context: this.policyContext()
    });

    // A refusal is reported, never swallowed. A jukebox that accepts a track and
    // then never plays it is indistinguishable from one that is broken, and the
    // reason — an explicit-content rule, an unlicensed track — is the one piece of
    // information that lets someone fix it.
    if (!result.ok) {
      throw new SubsonicFault(
        SubsonicError.NOT_AUTHORIZED,
        `"${track.title ?? id}" was refused: ${result.detail ?? result.reason}`
      );
    }

    // Staff-level, per REQ-API-12.
    this.scheduler.pin(result.entry.id, true);
    return result.entry;
  }

  /**
   * A queue entry as a Subsonic `Child`.
   *
   * REQ-API-11a: entries a stock client cannot understand must still be valid
   * `Child` objects. A live MIDI instrument is not a file — it has no suffix, no
   * bitrate and nothing to stream — but a client that receives a malformed entry
   * shows a broken queue or crashes. So it is described as fully as it honestly
   * can be, the extra media-type detail rides in our namespaced field, and a stock
   * client simply ignores what it does not recognise.
   */
  #entry(entry) {
    return toChild(entry.track, entry);
  }

  #send(res, q, body) {
    const format = q.get("f") ?? "json";
    // A client asking for XML gets told plainly, rather than being handed JSON
    // with an XML content type and left to fail at the parser.
    if (format !== "json") {
      const payload = JSON.stringify(
        this.#fail(
          SubsonicError.GENERIC,
          `this server speaks JSON only — send f=json (asked for "${format}")`
        )
      );
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(payload);
      return true;
    }
    const payload = JSON.stringify(body);
    res.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "content-length": Buffer.byteLength(payload),
      "access-control-allow-origin": "*",
      "cache-control": "no-store"
    });
    res.end(payload);
    return true;
  }
}

/**
 * A CrowdDeck track as a Subsonic `Child`.
 *
 * @param {object} track
 * @param {object} [entry] the queue entry, when this is a queued item
 */
export function toChild(track, entry = null) {
  const live = track.isLive === true;
  const child = {
    id: String(track.id),
    isDir: false,
    title: track.title ?? "Untitled",
    artist: track.artist ?? null,
    album: track.album ?? (live ? "Live" : null),
    // Subsonic durations are seconds; a track's is milliseconds everywhere in
    // this system (`duration_ms` in the schema). One conversion, one place.
    duration: Number.isFinite(track.duration) ? Math.round(track.duration / 1000) : null,
    genre: track.genre ?? undefined,
    isVideo: false,
    type: "music",
    // A live performance is not a file. Claiming a suffix and a content type would
    // invite a client to try to stream it, and it would be right to expect that to
    // work — so those fields are simply absent.
    ...(live ? {} : { suffix: track.suffix, contentType: track.contentType }),
    // Our extension, namespaced. Stock clients ignore unknown fields, so this is
    // additive: the entry above is still a valid Child on its own.
    [MEDIA_TYPES_EXTENSION]: {
      mediaType: live ? "live-instrument" : "recording",
      licenceClass: track.licenceClass ?? "unknown",
      provider: track.provider ?? (live ? "instrument" : "local"),
      streamable: !live,
      ...(entry
        ? {
            entryId: entry.id,
            state: entry.state,
            votes: entry.votes,
            boostUnits: entry.boostUnits,
            staffPinned: entry.staffPinned
          }
        : {})
    }
  };
  for (const k of Object.keys(child)) if (child[k] === undefined) delete child[k];
  return child;
}
