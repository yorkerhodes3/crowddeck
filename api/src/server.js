// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The venue API — SPECIFICATION §5.
 *
 * The **only** way anything talks to the system (REQ-API-1). The patron PWA, the
 * DJ console, the venue display and any third-party client all use this same
 * surface; there is no privileged back door. That is what makes third-party
 * clients viable, which is how an open project out-features a closed one (G3).
 *
 * Everything is namespaced `/v1/venues/:venueId/...` from day one (REQ-API-2),
 * so client URLs survive the move to a federation of appliances (ADR-004).
 */

import http from "node:http";
import { HttpError, Router, readJson, sendJson } from "./router.js";
import { Role, SessionStore, tokenFrom } from "./sessions.js";
import { isWebSocketUpgrade, upgrade } from "./ws.js";
import { filterSearch } from "../../core/src/policy.js";
import { Mode } from "../../core/src/scheduler.js";

export class VenueApi {
  /**
   * @param {object} opts
   * @param {import("../../core/src/scheduler.js").Scheduler} opts.scheduler
   * @param {{search: (q: string) => object[]}} opts.catalog
   * @param {string} [opts.venueId]
   * @param {string} [opts.venueName]
   * @param {string} [opts.staffKey] shared secret for staff endpoints (REQ-NFR-8)
   * @param {import("../../core/src/engine-adapter.js").EngineAdapter} [opts.adapter]
   * @param {(pathname: string) => {body: string, contentType: string}|null} [opts.staticHandler]
   */
  constructor(opts) {
    this.scheduler = opts.scheduler;
    this.catalog = opts.catalog;
    this.venueId = opts.venueId ?? "default";
    this.venueName = opts.venueName ?? "CrowdDeck Venue";
    this.staffKey = opts.staffKey ?? null;
    this.adapter = opts.adapter ?? null;
    this.staticHandler = opts.staticHandler ?? null;

    // CON-1. When present, search fans out across providers instead of using the
    // single catalogue. Optional so the stub catalogue keeps working.
    //
    // Named `providers`, not `router`: `this.router` is already the HTTP route
    // table, and assigning a provider router to it silently replaced the routing
    // and broke every request. Two different things called "router" in one class
    // is a collision waiting to happen.
    this.providers = opts.providers ?? null;

    // VEN-3 / REQ-DAT-9. Anything with an `assess(track, nowMs)` method — in
    // practice a VenueLicenceProfile from data/. Structural typing keeps api/
    // from having to depend on the persistence layer.
    this.licenceProfile = opts.licenceProfile ?? null;
    // Only consulted when no profile exists. Defaults to false, because a venue
    // that has not told us what it holds has not told us it holds anything.
    this.assumeProLicence = opts.assumeProLicence ?? false;

    this.sessions = new SessionStore();
    /** @type {Set<{ws: import("./ws.js").WebSocketConnection, session: object}>} */
    this.subscribers = new Set();

    this.router = this.#buildRoutes();
    this.server = http.createServer((req, res) => this.#onRequest(req, res));
    this.server.on("upgrade", (req, socket) => this.#onUpgrade(req, socket));

    this.#wireScheduler();
  }

  async listen(port = 0, host = "127.0.0.1") {
    await new Promise((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(port, host, () => {
        this.server.off("error", reject);
        resolve();
      });
    });
    return this.server.address();
  }

  get url() {
    const a = this.server.address();
    return a ? `http://${a.address === "::" ? "127.0.0.1" : a.address}:${a.port}` : null;
  }

  async close() {
    for (const sub of this.subscribers) sub.ws.close(1001, "server shutting down");
    this.subscribers.clear();
    await new Promise((resolve) => this.server.close(resolve));
  }

  /* --------------------------------------------------------- live events */

  #wireScheduler() {
    // Position changes must reach patrons in real time — REQ-SCH-12, AC-4.
    this.scheduler.on("queueChanged", (queue) => {
      this.#broadcast({ type: "queue", queue });
    });
    this.scheduler.on("nowPlaying", (entry) => {
      this.#broadcast({ type: "nowPlaying", entry: entry.toPublic() });
    });
    this.scheduler.on("played", () => {
      this.#broadcast({ type: "nowPlaying", entry: null });
    });
    this.scheduler.on("mode", (m) => {
      this.#broadcast({ type: "mode", mode: m.to });
    });
    this.scheduler.on("silent", (s) => {
      this.#broadcast({ type: "silent", reason: s.reason });
    });
  }

  #broadcast(message) {
    const payload = JSON.stringify(message);
    for (const sub of [...this.subscribers]) {
      if (!sub.ws.send(payload)) this.subscribers.delete(sub);
    }
  }

  /* --------------------------------------------------------------- routes */

  #buildRoutes() {
    const r = new Router();
    const V = "/v1/venues/:venueId";

    /* ---- discovery ---- */
    r.get("/v1/health", () => ({ ok: true, venue: this.venueId }));
    r.get(`${V}`, (ctx) => {
      this.#requireVenue(ctx);
      return {
        id: this.venueId,
        name: this.venueName,
        mode: this.scheduler.mode,
        nowPlaying: this.scheduler.nowPlaying?.toPublic() ?? null
      };
    });

    /* ---- patron ---- */
    r.post(`${V}/join`, (ctx) => {
      this.#requireVenue(ctx);
      const session = this.sessions.create({
        venueId: this.venueId,
        displayName: typeof ctx.body.displayName === "string" ? ctx.body.displayName : null
      });
      return {
        token: session.token,
        patronId: session.patronId,
        venue: { id: this.venueId, name: this.venueName }
      };
    });

    r.get(`${V}/search`, async (ctx) => {
      this.#requireVenue(ctx);
      const q = ctx.url.searchParams.get("q") ?? "";

      // The provider router fans out and may come back degraded; the older
      // single-catalogue path is kept so existing deployments and tests keep
      // working (CON-1 adds providers, it does not force them).
      let raw;
      let degraded = false;
      let sources;

      if (this.providers) {
        const res = await this.providers.search(q, { limit: 50 });
        raw = res.tracks;
        degraded = res.degraded;
        // Surfaced so a venue console can say *which* source is down. A catalogue
        // that silently shrinks makes staff think the jukebox is broken.
        sources = {
          queried: res.providersQueried,
          answered: res.providersAnswered,
          unavailable: res.errors.map((e) => ({ provider: e.provider, name: e.name }))
        };
      } else {
        raw = this.catalog.search(q);
      }

      // Scoped by the same policy used at request time — REQ-POL-2, AC-7.
      // An unrequestable track is never offered.
      const results = filterSearch(raw, this.scheduler.policy, this.#policyContext());
      return degraded ? { results, degraded, sources } : { results };
    });

    r.get(`${V}/queue`, (ctx) => {
      this.#requireVenue(ctx);
      return {
        mode: this.scheduler.mode,
        nowPlaying: this.scheduler.nowPlaying?.toPublic() ?? null,
        queue: this.scheduler.publicQueue()
      };
    });

    r.post(`${V}/queue`, (ctx) => {
      const session = this.#requireSession(ctx);
      const trackId = ctx.body.trackId;
      if (typeof trackId !== "string" || !trackId) {
        throw new HttpError(400, "invalid_request", `"trackId" is required`);
      }
      const track = this.catalog.get(trackId);
      if (!track) throw new HttpError(404, "unknown_track", "No such track.");

      const result = this.scheduler.request({
        track,
        patronId: session.patronId,
        context: this.#policyContext()
      });
      if (!result.ok) {
        // 409: understood, well-formed, but refused by policy or fairness.
        throw new HttpError(409, result.reason, result.detail);
      }
      return {
        entry: result.entry.toPublic(result.position),
        position: result.position
      };
    });

    r.post(`${V}/queue/:entryId/votes`, (ctx) => {
      const session = this.#requireSession(ctx);
      const result = this.scheduler.vote(ctx.params.entryId, session.patronId);
      if (!result.ok) throw new HttpError(409, result.reason, result.detail);
      return result;
    });

    r.post(`${V}/queue/:entryId/boost`, (ctx) => {
      const session = this.#requireSession(ctx);
      const units = Number.isInteger(ctx.body.units) ? ctx.body.units : 1;
      const result = this.scheduler.boost(ctx.params.entryId, units);
      if (!result.ok) throw new HttpError(409, result.reason, result.detail);
      // v1 has no payment rails (ADR-003): credits come from staff grants and
      // promotions only. The scheduler is indifferent to their origin.
      return { ...result, note: "v1 has no paid top-up path" };
    });

    r.get(`${V}/me`, (ctx) => {
      const session = this.#requireSession(ctx);
      const mine = this.scheduler
        .publicQueue()
        .filter((e) => this.scheduler.entries.get(e.id)?.patronId === session.patronId);
      return { patronId: session.patronId, requests: mine };
    });

    /* ---- staff (REQ-API-5, REQ-NFR-8) ---- */
    r.post(`${V}/staging/:entryId/promote`, (ctx) => {
      this.#requireStaff(ctx);
      const result = this.scheduler.promote(ctx.params.entryId, {
        actor: "dj",
        context: this.#policyContext()
      });
      if (!result.ok) throw new HttpError(409, result.reason, result.detail);
      return { entry: result.entry.toPublic() };
    });

    r.post(`${V}/staging/:entryId/reject`, (ctx) => {
      this.#requireStaff(ctx);
      const entry = this.scheduler.reject(ctx.params.entryId, ctx.body.reason ?? "staff");
      return { entry: entry.toPublic() };
    });

    r.post(`${V}/queue/:entryId/pin`, (ctx) => {
      this.#requireStaff(ctx);
      const entry = this.scheduler.pin(ctx.params.entryId, ctx.body.pinned !== false);
      return { entry: entry.toPublic() };
    });

    r.post(`${V}/queue/:entryId/skip`, (ctx) => {
      this.#requireStaff(ctx);
      const entry = this.scheduler.skip(ctx.params.entryId, "staff");
      return { entry: entry.toPublic() };
    });

    r.post(`${V}/mode`, (ctx) => {
      this.#requireStaff(ctx);
      const mode = ctx.body.mode;
      if (![Mode.AUTONOMOUS, Mode.ATTENDED].includes(mode)) {
        throw new HttpError(400, "invalid_mode", `mode must be autonomous or attended`);
      }
      this.scheduler.setMode(mode);
      return { mode: this.scheduler.mode };
    });

    r.get(`${V}/staging`, (ctx) => {
      this.#requireStaff(ctx);
      return { staging: this.scheduler.stagingLane() };
    });

    /** Immediate stop — REQ-API-6 requires this inside 500ms. */
    r.post(`${V}/panic`, async (ctx) => {
      this.#requireStaff(ctx);
      const playing = this.scheduler.nowPlaying;
      if (this.adapter) {
        await this.adapter.client.set(this.adapter.deck, "play", 0).catch(() => {});
      }
      if (playing) this.scheduler.skip(playing.id, "staff");
      this.#broadcast({ type: "panic" });
      return { stopped: true };
    });

    r.get(`${V}/play-log.csv`, (ctx) => {
      this.#requireStaff(ctx);
      // Local-only evidence trail for PRO reporting — REQ-DAT-13, never transmitted.
      const rows = [["track_id", "artist", "ended_at"].join(",")];
      for (const p of this.scheduler.recentPlays) {
        rows.push([p.trackId, JSON.stringify(p.artist ?? ""), new Date(p.endedAt).toISOString()].join(","));
      }
      return { csv: rows.join("\n") };
    });

    return r;
  }

  /* -------------------------------------------------------------- plumbing */

  #policyContext() {
    const d = new Date();
    const ctx = { venueMinuteOfDay: d.getHours() * 60 + d.getMinutes(), nowMs: d.getTime() };

    // VEN-3: use the venue's real PRO licence profile when one is configured.
    // `holdsPro: true` used to be hard-coded here, which meant the API asserted
    // every track was cleared for public performance regardless of what the venue
    // actually held — a confident answer with nothing behind it.
    if (this.licenceProfile) {
      ctx.licenceProfile = this.licenceProfile;
    } else {
      // No profile configured. Fall back to the coarse check rather than none, and
      // stay conservative: an unconfigured venue has not told us it holds anything.
      ctx.holdsPro = this.assumeProLicence === true;
    }
    return ctx;
  }

  #requireVenue(ctx) {
    if (ctx.params.venueId !== this.venueId) {
      // ADR-004: this runtime binds to exactly one venue.
      throw new HttpError(404, "unknown_venue", "This appliance serves a different venue.");
    }
  }

  #requireSession(ctx) {
    this.#requireVenue(ctx);
    const session = this.sessions.resolve(tokenFrom(ctx.req, ctx.url), this.venueId);
    if (!session) throw new HttpError(401, "no_session", "Scan the venue QR code to join.");
    return session;
  }

  #requireStaff(ctx) {
    this.#requireVenue(ctx);
    // Staff credentials are separate from patron sessions — REQ-NFR-8.
    if (!this.staffKey) throw new HttpError(403, "staff_disabled", "No staff key configured.");
    const provided = ctx.req.headers["x-staff-key"] ?? ctx.url.searchParams.get("staffKey");
    if (provided !== this.staffKey) {
      throw new HttpError(401, "not_staff", "Staff credentials required.");
    }
  }

  async #onRequest(req, res) {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type,authorization,x-staff-key"
      });
      res.end();
      return;
    }

    const route = this.router.match(req.method, url.pathname);
    if (!route) {
      if (this.staticHandler) {
        const asset = this.staticHandler(url.pathname);
        if (asset) {
          res.writeHead(200, { "content-type": asset.contentType, "cache-control": "no-store" });
          res.end(asset.body);
          return;
        }
      }
      sendJson(res, 404, { error: "not_found", message: `No route for ${req.method} ${url.pathname}` });
      return;
    }

    try {
      const body = req.method === "POST" ? await readJson(req) : {};
      const result = await route.handler({ req, res, url, params: route.params, body });
      sendJson(res, 200, result ?? { ok: true });
    } catch (err) {
      const status = err.statusCode ?? 500;
      sendJson(res, status, {
        error: err.code ?? "internal_error",
        message: err.message ?? "Unexpected error"
      });
    }
  }

  #onUpgrade(req, socket) {
    const url = new URL(req.url, "http://localhost");
    const expected = `/v1/venues/${this.venueId}/events`;

    if (!isWebSocketUpgrade(req) || url.pathname !== expected) {
      socket.end("HTTP/1.1 404 Not Found\r\n\r\n");
      return;
    }

    const ws = upgrade(req, socket);
    if (!ws) return;

    // The queue is public, so a session is optional for read-only observers
    // such as the venue display screen.
    const session = this.sessions.resolve(tokenFrom(req, url), this.venueId);
    const sub = { ws, session };
    this.subscribers.add(sub);

    ws.on("close", () => this.subscribers.delete(sub));
    ws.on("error", () => this.subscribers.delete(sub));

    // Send current state immediately so a client never renders empty.
    ws.sendJson({
      type: "hello",
      venue: { id: this.venueId, name: this.venueName },
      mode: this.scheduler.mode,
      nowPlaying: this.scheduler.nowPlaying?.toPublic() ?? null,
      queue: this.scheduler.publicQueue(),
      patronId: session?.patronId ?? null
    });
  }
}

export { Role };
