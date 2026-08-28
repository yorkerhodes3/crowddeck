// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * A tiny HTTP router over `node:http`.
 *
 * Supports the one pattern feature the venue API needs: `:param` segments, so
 * every route can be namespaced `/v1/venues/:venueId/...` from day one
 * (REQ-API-2). Client URLs therefore survive the eventual move to a federation
 * of appliances (ADR-004) without a breaking change.
 */

export class Router {
  constructor() {
    /** @type {Array<{method: string, segments: string[], handler: Function}>} */
    this.routes = [];
  }

  /**
   * @param {string} method
   * @param {string} pattern e.g. "/v1/venues/:venueId/queue"
   * @param {(ctx: object) => Promise<any>|any} handler
   */
  add(method, pattern, handler) {
    this.routes.push({
      method: method.toUpperCase(),
      segments: pattern.split("/").filter(Boolean),
      handler
    });
    return this;
  }

  get(p, h) { return this.add("GET", p, h); }
  post(p, h) { return this.add("POST", p, h); }
  del(p, h) { return this.add("DELETE", p, h); }

  /**
   * @param {string} method
   * @param {string} pathname
   * @returns {{handler: Function, params: Record<string,string>}|null}
   */
  match(method, pathname) {
    const parts = pathname.split("/").filter(Boolean);
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue;
      if (route.segments.length !== parts.length) continue;

      const params = {};
      let ok = true;
      for (let i = 0; i < parts.length; i++) {
        const seg = route.segments[i];
        if (seg.startsWith(":")) params[seg.slice(1)] = decodeURIComponent(parts[i]);
        else if (seg !== parts[i]) { ok = false; break; }
      }
      if (ok) return { handler: route.handler, params };
    }
    return null;
  }
}

/** Read and parse a JSON body, with a size cap so a client cannot exhaust memory. */
export async function readJson(req, { maxBytes = 64 * 1024 } = {}) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const err = new Error("request body too large");
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  if (total === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const err = new Error("request body is not valid JSON");
    err.statusCode = 400;
    throw err;
  }
}

/** Read a body as text, with the same size cap. Used for form POSTs. */
export async function readText(req, { maxBytes = 64 * 1024 } = {}) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const err = new Error("request body too large");
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** An error carrying an HTTP status, so handlers can fail declaratively. */
export class HttpError extends Error {
  constructor(statusCode, code, message) {
    super(message ?? code);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    // The API is meant to be consumed by third-party clients (G3).
    "access-control-allow-origin": "*",
    "cache-control": "no-store"
  });
  res.end(payload);
}
