// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Patron and staff sessions — REQ-API-3, REQ-NFR-7, REQ-NFR-8.
 *
 * Three properties matter more than sophistication here:
 *
 * **No personal data.** A patron joins by scanning a QR code and gets an opaque
 * token. No email, no phone, no account. There is nothing to leak, which is the
 * cheapest possible way to honour "all data stays in the venue" (G6).
 *
 * **Venue-scoped.** A token is valid for exactly one venue. When multi-venue
 * arrives as a federation of appliances (ADR-004) rather than shared-database
 * multi-tenancy, this stays correct without change.
 *
 * **Expiring.** Sessions die a few hours after last use, so a token found on a
 * phone months later is worthless.
 */

import crypto from "node:crypto";

export const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // a long shift

export const Role = Object.freeze({
  PATRON: "patron",
  STAFF: "staff"
});

export class SessionStore {
  /**
   * @param {{ttlMs?: number, now?: () => number}} [opts]
   */
  constructor(opts = {}) {
    this.ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
    this.now = opts.now ?? (() => Date.now());
    /** @type {Map<string, {token: string, venueId: string, role: string, displayName: string|null, createdAt: number, lastSeenAt: number}>} */
    this.sessions = new Map();
  }

  /**
   * @param {{venueId: string, role?: string, displayName?: string}} args
   */
  create({ venueId, role = Role.PATRON, displayName = null }) {
    const now = this.now();
    const token = crypto.randomBytes(24).toString("base64url");
    const session = {
      token,
      // The patron id is derived, not the token itself, so the id can appear in
      // logs and vote records without exposing a credential.
      patronId: `p_${crypto.createHash("sha256").update(token).digest("hex").slice(0, 16)}`,
      venueId,
      role,
      displayName,
      createdAt: now,
      lastSeenAt: now
    };
    this.sessions.set(token, session);
    return session;
  }

  /**
   * Resolve a token, refreshing its last-seen time.
   * @param {string|undefined} token
   * @param {string} venueId
   */
  resolve(token, venueId) {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    const now = this.now();
    if (now - session.lastSeenAt > this.ttlMs) {
      this.sessions.delete(token);
      return null;
    }
    // A token issued for one venue must not work at another.
    if (session.venueId !== venueId) return null;

    session.lastSeenAt = now;
    return session;
  }

  /** Drop expired sessions. Safe to call on a timer. */
  sweep() {
    const now = this.now();
    let removed = 0;
    for (const [token, s] of this.sessions) {
      if (now - s.lastSeenAt > this.ttlMs) {
        this.sessions.delete(token);
        removed++;
      }
    }
    return removed;
  }

  get size() {
    return this.sessions.size;
  }
}

/**
 * Extract a bearer token from a request.
 * Accepts a query parameter too, because a WebSocket handshake from a browser
 * cannot set headers.
 */
export function tokenFrom(req, url) {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return url?.searchParams.get("token") ?? undefined;
}
