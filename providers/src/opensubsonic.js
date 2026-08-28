// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * OpenSubsonic consumer provider — CON-4, REQ-CON-5, REQ-CON-6.
 *
 * > v1 MUST ship `local`, `opensubsonic` and at least one CC provider.
 *
 * Most venues that would run this already have a music library, and increasingly
 * it is behind Navidrome, Gonic, Astiga or Airsonic. Speaking their protocol means
 * the appliance inherits an existing, curated, already-paid-for catalogue instead
 * of demanding the operator import everything again.
 *
 * ## Why this is a network client and not a library
 *
 * Navidrome is GPL-3.0. We talk to it over HTTP as a separate process, which is
 * the arrangement ADR-006 and REQ-LIC-8 assume: no linking, no combined work, no
 * relicensing question. That is a deliberate architectural choice, not an
 * accident of convenience — the moment this became an in-process dependency the
 * licence analysis would change.
 *
 * ## The hard part: whose licence is it?
 *
 * A Subsonic server is *somebody else's library*. Nothing in the protocol says
 * where the files came from or what rights the operator holds in them. Three
 * options, and only one is defensible:
 *
 * 1. **Infer from tags.** Guessing. Forbidden by the same rule that makes
 *    `licenceClass` mandatory in the provider contract.
 * 2. **Always `unknown`.** Honest, and useless: policy blocks `unknown` in a
 *    commercial venue, so the provider would ship dead.
 * 3. **The operator declares it.** They ripped the CDs, or bought the downloads,
 *    or pay the record pool. They know, we cannot, and they are the party who
 *    carries the liability.
 *
 * So `licenceClass` is a **required constructor argument with no default**, and
 * the declaration is recorded on every track as an attestation — who declared it,
 * when, and for which server (REQ-DAT-8). If a PRO ever asks why the venue
 * believed it could perform a track, the answer is a named human on a date, which
 * is a real answer. "The software assumed so" is not.
 *
 * ## Credentials leak through stream URLs
 *
 * Subsonic authenticates every request by query string, including `stream`. That
 * URL is handed to the audio engine and is exactly the kind of string that ends up
 * in a log line, a crash report or a play-history row. So:
 *
 * - errors never quote the URL — `#describe()` reports method and host only;
 * - stream URLs are minted fresh per call with a new salt and never cached;
 * - sending a plaintext password to a non-TLS, non-loopback host throws, because
 *   on a venue's shared Wi-Fi that is a credential handed to the room.
 */

import { createHash, randomBytes } from "node:crypto";
import { Provider, ProviderError, LICENCE_CLASSES } from "./provider.js";

/**
 * 1.16.1 is the last Subsonic version and the floor OpenSubsonic servers
 * implement. Asking for less would forgo `search3`; asking for more would be
 * rejected by servers with error 30.
 */
export const API_VERSION = "1.16.1";

/** Identifies us in server logs, which is how an operator debugs a bad client. */
export const CLIENT_NAME = "CrowdDeck";

/** The spec's floor is six characters; more costs nothing. */
const SALT_BYTES = 12;

/**
 * Error codes worth distinguishing. A wrong password and an unreachable server
 * both look like "no music" to a patron, but they need completely different
 * things from an operator.
 */
const AUTH_ERRORS = new Set([40, 41, 42, 43, 44, 50]);
const NOT_FOUND = 70;

export class OpenSubsonicProvider extends Provider {
  /**
   * @param {object} args
   * @param {string} args.url Base URL of the server, with or without `/rest`.
   * @param {string} args.licenceClass What the operator declares this library to be.
   * @param {string} [args.declaredBy] Who made that declaration — recorded, not decorative.
   * @param {string} [args.username]
   * @param {string} [args.password] Used to derive a per-request token; never sent as-is.
   * @param {string} [args.apiKey] OpenSubsonic API key. Mutually exclusive with username/password.
   * @param {string} [args.id] Override, so two servers can coexist.
   * @param {string} [args.name]
   * @param {boolean} [args.allowInsecureAuth] Permit plaintext password over plain HTTP.
   * @param {boolean} [args.useAlbumGain] Prefer album ReplayGain over track gain.
   * @param {typeof globalThis.fetch} [args.fetch]
   * @param {() => string} [args.salt] Injected for testing.
   * @param {() => string} [args.now] Injected for testing.
   */
  constructor({
    url,
    licenceClass,
    declaredBy,
    username,
    password,
    apiKey,
    id = "opensubsonic",
    name,
    allowInsecureAuth = false,
    useAlbumGain = false,
    fetch: fetchImpl,
    salt,
    now
  } = {}) {
    super({ id, name: name ?? "OpenSubsonic library", remote: true });

    if (!url || typeof url !== "string") {
      throw new TypeError("OpenSubsonicProvider requires a server url");
    }
    let base;
    try {
      base = new URL(url);
    } catch (cause) {
      throw new TypeError(`OpenSubsonicProvider url "${url}" is not a valid URL`, { cause });
    }
    if (base.protocol !== "http:" && base.protocol !== "https:") {
      throw new TypeError(`OpenSubsonicProvider url must be http or https, got ${base.protocol}`);
    }

    // The operator's declaration. No default, and no inference — see the module
    // note. This is the one thing about a remote library only a human can know.
    if (!LICENCE_CLASSES.includes(licenceClass)) {
      throw new TypeError(
        `OpenSubsonicProvider requires an explicit licenceClass — one of: ` +
          `${LICENCE_CLASSES.join(", ")}. A Subsonic server does not say what rights ` +
          `the operator holds in its files, and this provider will not guess. ` +
          `Declare "unknown" if the library genuinely has not been reviewed; that is a ` +
          `claim about the state of your knowledge, and policy will block it in a ` +
          `commercial venue, which is the correct outcome.`
      );
    }

    this.#assertOneAuthMechanism({ username, password, apiKey });

    // Plaintext credentials on an untrusted network. Loopback is exempt: there is
    // no wire to sniff, and it is the common case for an all-in-one appliance.
    if (password && base.protocol === "http:" && !isLoopback(base.hostname) && !allowInsecureAuth) {
      throw new TypeError(
        `refusing to send a password to ${base.host} over plain HTTP. Subsonic ` +
          `authenticates in the query string, so on a venue's shared network this hands ` +
          `the credential to anyone listening. Use https, an apiKey, or set ` +
          `allowInsecureAuth if you are certain the link is private.`
      );
    }

    // Trailing `/rest` is what people copy out of a client, so accept both.
    this.root = base.href.replace(/\/+$/, "").replace(/\/rest$/, "");
    this.host = base.host;
    this.licenceClassDeclared = licenceClass;
    this.declaredBy = declaredBy ?? null;
    this.username = username ?? null;
    this.password = password ?? null;
    this.apiKey = apiKey ?? null;
    this.useAlbumGain = useAlbumGain;
    this.fetch = fetchImpl ?? globalThis.fetch;
    this.salt = salt ?? (() => randomBytes(SALT_BYTES).toString("hex"));
    this.now = now ?? (() => new Date().toISOString());

    /** Populated by the first successful call; shown in the venue console. */
    this.serverType = null;
    this.serverVersion = null;
    this.openSubsonic = false;

    this.cache = new Map();
  }

  /**
   * The spec is explicit: an apiKey excludes `u`, `p`, `t` and `s`, and a server
   * must reject the combination with error 43. Better to fail here, where the
   * message can explain it, than to ship a request the server will refuse.
   */
  #assertOneAuthMechanism({ username, password, apiKey }) {
    if (apiKey && (username || password)) {
      throw new TypeError(
        "OpenSubsonicProvider takes either an apiKey or a username/password, not both — " +
          "the spec requires servers to reject conflicting authentication (error 43)."
      );
    }
    if (!apiKey && !(username && password)) {
      throw new TypeError(
        "OpenSubsonicProvider requires an apiKey, or both a username and a password."
      );
    }
  }

  /**
   * Authentication parameters for one request.
   *
   * Token auth (`t`/`s`) rather than `p`, because the password then never crosses
   * the wire. It is worth being clear about what that does and does not buy:
   * md5(password + salt) is weak, and the server must store the password
   * recoverably to check it, so this is not a substitute for TLS. It removes the
   * plaintext, nothing more. An apiKey is better where the server supports one.
   */
  #auth() {
    if (this.apiKey) return { apiKey: this.apiKey };
    const salt = this.salt();
    const token = createHash("md5")
      .update(`${this.password}${salt}`, "utf8")
      .digest("hex");
    return { u: this.username, t: token, s: salt };
  }

  /** @param {string} method @param {Record<string, unknown>} params */
  #url(method, params = {}) {
    const url = new URL(`${this.root}/rest/${method}`);
    for (const [k, v] of Object.entries({
      ...this.#auth(),
      v: API_VERSION,
      c: CLIENT_NAME,
      f: "json",
      ...params
    })) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    return url.toString();
  }

  /**
   * How a request is named in an error.
   *
   * Deliberately not the URL: it carries `t`, `s` and possibly `apiKey`, and error
   * strings are the least controlled data path in any system — they reach logs,
   * consoles, bug reports and screenshots.
   */
  #describe(method) {
    return `${method} on ${this.host}`;
  }

  async #get(method, params, signal) {
    let res;
    try {
      res = await this.fetch(this.#url(method, params), { signal });
    } catch (cause) {
      throw new ProviderError(this.id, `${this.#describe(method)} is unreachable`, {
        code: "network_error",
        retryable: true,
        cause
      });
    }

    if (!res.ok) {
      throw new ProviderError(this.id, `${this.#describe(method)} returned HTTP ${res.status}`, {
        code: "http_error",
        retryable: res.status >= 500 || res.status === 429
      });
    }

    let body;
    try {
      body = await res.json();
    } catch (cause) {
      // Almost always an HTML login page from a reverse proxy in front of the
      // server — a 200 that is not the API at all.
      throw new ProviderError(
        this.id,
        `${this.#describe(method)} returned a 200 that was not JSON — is something ` +
          `in front of the server intercepting the request?`,
        { code: "bad_response", cause }
      );
    }

    const envelope = body?.["subsonic-response"];
    if (!envelope) {
      throw new ProviderError(
        this.id,
        `${this.#describe(method)} returned JSON with no subsonic-response envelope`,
        { code: "bad_response" }
      );
    }

    this.serverType = envelope.type ?? this.serverType;
    this.serverVersion = envelope.serverVersion ?? this.serverVersion;
    this.openSubsonic = Boolean(envelope.openSubsonic) || this.openSubsonic;

    // Failure arrives inside a 200, exactly as it does with Jamendo. Checking the
    // HTTP status alone would read "wrong password" as "empty library".
    if (envelope.status !== "ok") {
      const { code, message } = envelope.error ?? {};
      throw new ProviderError(
        this.id,
        `${this.#describe(method)} failed: ${message || "unspecified error"} (code ${code ?? "?"})`,
        {
          code: AUTH_ERRORS.has(code) ? "auth_error" : code === NOT_FOUND ? "not_found" : "api_error",
          // Credentials will not fix themselves on a retry; a generic error might.
          retryable: code === 0
        }
      );
    }

    return envelope;
  }

  /** @param {string} query @param {{limit?: number, signal?: AbortSignal}} [opts] */
  async search(query, opts = {}) {
    const envelope = await this.#get(
      "search3",
      {
        // Always sent, including empty: Subsonic treats a missing `query` as a
        // missing required parameter (error 10), while an empty one means "all".
        query: query ?? "",
        songCount: Math.min(opts.limit ?? 50, 500),
        // We want tracks. Asking for artists and albums we would discard wastes
        // the server's time and the venue's bandwidth.
        artistCount: 0,
        albumCount: 0
      },
      opts.signal
    );

    const songs = envelope.searchResult3?.song ?? [];
    return songs.map((s) => this.#project(s)).filter((t) => t !== null);
  }

  /** @param {string} trackId */
  async resolve(trackId) {
    if (this.cache.has(trackId)) return this.cache.get(trackId);

    let envelope;
    try {
      envelope = await this.#get("getSong", { id: trackId });
    } catch (err) {
      // A missing track is an answer, not a fault: the operator deleted it, or a
      // queued id outlived a library rescan.
      if (err instanceof ProviderError && err.code === "not_found") return null;
      throw err;
    }

    const track = this.#project(envelope.song);
    if (track) this.cache.set(trackId, track);
    return track;
  }

  /**
   * A playable URL for the engine.
   *
   * Never cached and never stored. It embeds a credential, so its lifetime should
   * be the length of one playback and no longer.
   *
   * `format=raw` asks the server not to transcode. Transcoding to a lossy stream
   * would undo the ReplayGain figures we just read and put a re-encode between the
   * library and the PA for no benefit — the appliance is on the same network and
   * has the bandwidth.
   *
   * @param {string} trackId
   */
  async streamUrl(trackId) {
    const track = await this.resolve(trackId);
    if (!track) {
      throw new ProviderError(this.id, `no track "${trackId}" on ${this.host}`, {
        code: "not_found"
      });
    }
    return this.#url("stream", { id: trackId, format: "raw" });
  }

  /**
   * The operator's declaration, unchanged.
   *
   * It does not vary per track, and pretending otherwise would imply a per-track
   * review that never happened.
   *
   * @param {string} trackId
   */
  async licenceClass(trackId) {
    const track = await this.resolve(trackId);
    if (!track) {
      throw new ProviderError(this.id, `no track "${trackId}" on ${this.host}`, {
        code: "not_found"
      });
    }
    return this.licenceClassDeclared;
  }

  /** `ping` exists for precisely this. */
  async healthy() {
    try {
      await this.#get("ping", {});
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Turn a Subsonic Child into a CrowdDeck track.
   *
   * @param {object} row
   */
  #project(row) {
    if (!row?.id) return null;

    // Videos are filtered out rather than played blind. A venue jukebox pulling
    // the audio track off a music video is not what the operator asked for, and
    // `isDir` entries are folders that arrive here on file-structure servers.
    if (row.isVideo === true || row.isDir === true) return null;

    const gain = this.#replayGain(row);

    return {
      id: String(row.id),
      title: row.title,
      artist: row.displayArtist || row.artist || null,
      album: row.album ?? null,
      // Subsonic reports seconds; everything downstream is milliseconds.
      duration: Number.isFinite(row.duration) ? row.duration * 1000 : null,
      licenceClass: this.licenceClassDeclared,
      // The evidence behind the licence claim, carried with the track so it can be
      // written to the play log rather than reconstructed later — REQ-DAT-8.
      licenceAttestation: {
        server: this.host,
        declaredBy: this.declaredBy,
        declaredAt: this.now(),
        basis: "operator declaration for the whole library"
      },
      licenceReason: `declared by the venue operator for ${this.host}`,
      // OpenSubsonic's explicitStatus is "explicit", "clean" or absent. Absent is
      // left undefined, not false: a server that does not track it has not told us
      // the track is clean, and a false negative slips explicit material past a
      // daypart rule.
      explicit:
        row.explicitStatus === "explicit"
          ? true
          : row.explicitStatus === "clean"
            ? false
            : undefined,
      bpm: Number.isFinite(row.bpm) ? row.bpm : undefined,
      genre: row.genre ?? row.genres?.[0]?.name,
      year: row.year ?? undefined,
      musicBrainzId: row.musicBrainzId ?? undefined,
      contentType: row.contentType ?? undefined,
      suffix: row.suffix ?? undefined,
      ...gain,
      playable: true
    };
  }

  /**
   * Map the server's ReplayGain into the fields `core/src/loudness.js` reads.
   *
   * This is the reason the two stories fit together: a Navidrome library is
   * usually already analysed, so CON-6 normalisation works on it on first run
   * instead of waiting for our own analysis pass.
   *
   * Two details that are easy to get wrong:
   *
   * - `baseGain` is a header gain, such as Opus output gain, and the spec has
   *   clients add it to the track gain. Whether a given decoder has already
   *   applied it is not knowable from here, so it is added by default and can be
   *   switched off rather than silently assumed either way.
   * - `fallbackGain` is the server's estimate for tracks it could not measure. It
   *   is used only when there is no real figure, and never in preference to one.
   *
   * @param {object} row
   */
  #replayGain(row) {
    const rg = row.replayGain;
    if (!rg || typeof rg !== "object") return {};

    const measured = this.useAlbumGain ? rg.albumGain : rg.trackGain;
    const peak = this.useAlbumGain ? rg.albumPeak : rg.trackPeak;

    const gain = Number.isFinite(measured)
      ? measured
      : Number.isFinite(rg.fallbackGain)
        ? rg.fallbackGain
        : null;
    if (gain === null) return {};

    const base = Number.isFinite(rg.baseGain) ? rg.baseGain : 0;

    return {
      replayGainDb: gain + base,
      // Peaks are linear here and linear in loudness.js. A negative or zero peak
      // is not physical — the spec says "must be positive" — so a server sending
      // one is dropped rather than converted into a -Infinity dB peak that would
      // then clamp every gain to nothing.
      ...(Number.isFinite(peak) && peak > 0 ? { replayGainPeak: peak } : {})
    };
  }
}

/**
 * Loopback has no wire to intercept, which is the whole reason for the exemption.
 *
 * The naive check — does the hostname start with `127.` — is wrong in a way that
 * matters: an attacker who controls `evil.test` can publish `127.0.0.1.evil.test`,
 * which resolves to a host they own. Under a prefix check that name would be
 * treated as loopback and the venue's password would be sent to it in cleartext.
 * So the whole hostname must be a literal address in 127.0.0.0/8, every octet
 * validated. Anything not provably loopback is treated as remote, which is the
 * safe direction to be wrong in.
 */
export function isLoopback(hostname) {
  const h = String(hostname ?? "")
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    // A trailing dot is the DNS root, and "localhost." is still localhost.
    .replace(/\.$/, "");

  if (h === "localhost" || h === "::1" || h === "0:0:0:0:0:0:0:1") return true;

  // IPv4-mapped IPv6, as Node hands back for a dual-stack loopback socket.
  const mapped = /^::ffff:(.+)$/.exec(h);
  return isLoopbackV4(mapped ? mapped[1] : h);
}

function isLoopbackV4(h) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!m) return false;
  const octets = m.slice(1).map(Number);
  if (octets.some((o) => o > 255)) return false;
  return octets[0] === 127;
}
