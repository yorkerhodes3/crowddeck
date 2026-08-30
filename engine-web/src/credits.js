// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Credits — DJX-26.
 *
 * CC BY and CC BY-SA do not merely *suggest* attribution; they require it as a
 * condition of the licence. `cc-licence.js` has always built the credit string,
 * and its own comment says where it belongs — *"in a venue that means on the
 * screen while the track plays"* — but nothing ever displayed it.
 *
 * That is a compliance gap in the one area this project exists to get right. A
 * deck that plays CC BY music without crediting it is in breach of the licence
 * it depends on, and the fact that the string was computed and discarded makes
 * it worse rather than better: the information was there and thrown away.
 *
 * So credits are shown live for whatever is loaded, and accumulated for the
 * session so they can be pasted into a stream description or a mix write-up —
 * which is the form the obligation actually takes once a set leaves the room.
 *
 * ## Public domain is not credited, and that is correct
 *
 * CC0 and the Public Domain Mark impose no attribution obligation, so
 * `ccAttribution` returns null for them and this keeps that distinction rather
 * than inventing a credit. Naming a source is still polite, and the *provider*
 * is credited separately; but presenting a legal requirement where none exists
 * would misrepresent the licence just as much as omitting a real one.
 */

/**
 * A session's worth of credits, in play order, without duplicates.
 *
 * Order matters: a set list reads chronologically, and re-ordering it to group
 * by artist would make it useless for the thing it is for.
 */
export class CreditLog {
  constructor() {
    /** @type {Map<string, object>} keyed by track id, insertion-ordered. */
    this.entries = new Map();
  }

  /**
   * Record a track that was played.
   *
   * @param {object} track
   * @returns {boolean} true when it was newly added
   */
  add(track) {
    if (!track || !track.id || this.entries.has(track.id)) return false;
    this.entries.set(track.id, {
      id: track.id,
      title: track.title ?? "Untitled",
      artist: track.artist ?? "Unknown artist",
      attribution: track.attribution ?? null,
      licenceClass: track.licenceClass ?? "unknown",
      provider: track.provider ?? null,
      landingUrl: track.landingUrl ?? null
    });
    return true;
  }

  get size() {
    return this.entries.size;
  }

  clear() {
    this.entries.clear();
  }

  /** Everything played, in order. */
  list() {
    return [...this.entries.values()];
  }

  /** Only those carrying a genuine attribution obligation. */
  required() {
    return this.list().filter((e) => Boolean(e.attribution));
  }

  /**
   * The credits as text, ready to paste under a mix.
   *
   * Plain text rather than HTML or Markdown because the destinations — a stream
   * description, a forum post, a caption — mangle formatting inconsistently, and
   * a credit that arrives as literal asterisks is worse than a plain one.
   *
   * @param {{includePublicDomain?: boolean}} [opts]
   */
  toText(opts = {}) {
    const rows = opts.includePublicDomain ? this.list() : this.required();
    if (!rows.length) return "";

    const lines = rows.map((e) => {
      const base = e.attribution ?? `"${e.title}" by ${e.artist} — public domain`;
      return e.landingUrl ? `${base} — ${e.landingUrl}` : base;
    });

    const sources = [...new Set(rows.map((e) => e.provider).filter(Boolean))];
    const via = sources.length ? `\n\nvia ${sources.join(", ")}` : "";
    return `Music credits\n\n${lines.join("\n")}${via}`;
  }
}

/**
 * A short credit for the screen, while a track is playing.
 *
 * Deliberately different from the pasteable form: on screen there is one line of
 * room, and the licence is the part a venue needs to be able to point at.
 *
 * @param {object|null} track
 * @returns {string}
 */
export function nowPlayingCredit(track) {
  if (!track) return "";
  if (track.attribution) return track.attribution;
  // Public domain carries no obligation, so it is labelled rather than credited.
  if (track.licenceClass === "owned_local") {
    return `"${track.title ?? "Untitled"}" — public domain`;
  }
  return `"${track.title ?? "Untitled"}" by ${track.artist ?? "Unknown artist"}`;
}
