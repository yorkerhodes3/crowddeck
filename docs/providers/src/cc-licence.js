// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Creative Commons licence identification — REQ-DAT-8, CON-5.
 *
 * ## Why this is its own module
 *
 * Deciding what a Creative Commons URL permits is the single most legally
 * consequential piece of parsing in the product. Get it wrong in the permissive
 * direction and a venue publicly performs a non-commercial track, which is the
 * exact liability this system exists to prevent. So it lives apart from any one
 * provider, is exhaustively tested, and is deliberately conservative: **anything
 * not positively recognised is `unknown`**, which policy blocks in a commercial
 * venue.
 *
 * ## The rule, in one line
 *
 * If the licence contains `nc`, a commercial venue may not perform it. That is the
 * whole of the commercial question — `nd` (no derivatives) and `sa` (share-alike)
 * constrain *derivative works*, not performance, so a venue playing a track
 * unmodified is unaffected by either.
 *
 * That distinction matters practically. Treating `by-nd` as unsafe would discard a
 * large slice of legitimately playable catalogue for no legal reason; treating
 * `by-nc` as safe would be a licence breach. The two errors are not symmetric, and
 * neither is "just be cautious about everything".
 *
 * ## Mapping onto our seven classes
 *
 * `REQ-DAT-8` gives seven licence classes, and Creative Commons has more variants
 * than that. The mapping is therefore lossy *by design*, and lossy in a specific
 * direction: it preserves exactly the distinctions that change what a venue may do.
 *
 * - anything with `nc` → `cc_noncommercial` (blocked in a commercial venue)
 * - `by-sa`, `by-nc-sa` → `cc_sharealike` (attribution required on the display)
 * - `by`, `by-nd` → `cc_attribution` (attribution required on the display)
 * - CC0 / public domain → `owned_local` (no attribution obligation, no PRO licence)
 * - anything else → `unknown`
 *
 * The `nd` collapse into `cc_attribution` is worth stating plainly: for *playback*
 * they are identical, and CrowdDeck never modifies audio it did not create. If
 * remixing or stem separation is ever added, `nd` becomes a distinction that
 * matters and this mapping must be revisited — which is why `ccLicence()` returns
 * the full parse alongside the class rather than throwing the detail away.
 */

/** @typedef {{code: string, version: string|null, commercial: boolean, derivatives: boolean, shareAlike: boolean, attribution: boolean, url: string}} CcLicence */

/**
 * Parse a Creative Commons URL into what it actually permits.
 *
 * Accepts the forms that appear in real metadata: `creativecommons.org/licenses/…`,
 * `creativecommons.org/publicdomain/…`, with or without a scheme, `www.`, a
 * version, a locale suffix, or a trailing slash.
 *
 * @param {string} url
 * @returns {CcLicence|null} null when the URL is not recognisably Creative Commons
 */
export function parseCcUrl(url) {
  if (typeof url !== "string" || url.trim() === "") return null;
  const raw = url.trim();

  // Normalise: drop scheme, `www.`, query and fragment, then lowercase.
  const normalised = raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[?#]/)[0]
    .toLowerCase();

  // Anchored to the start of the normalised string, so a host that merely
  // *contains* the right name — `creativecommons.org.evil.example/...` — or one
  // that embeds it in a path — `evil.example/creativecommons.org/licenses/...` —
  // is rejected. Both the check below and the `^` anchors on the two patterns
  // enforce this; either alone would do, and having both is deliberate for
  // something with this much legal consequence.
  if (!normalised.startsWith("creativecommons.org/")) return null;

  // Public domain: CC0 and the Public Domain Mark.
  const pd = /^creativecommons\.org\/publicdomain\/(zero|mark)\/([\d.]+)/.exec(normalised);
  if (pd) {
    return {
      code: pd[1] === "zero" ? "cc0" : "pdm",
      version: pd[2] ?? null,
      commercial: true,
      derivatives: true,
      shareAlike: false,
      attribution: false,
      url: raw
    };
  }

  const lic = /^creativecommons\.org\/licenses\/([a-z-]+)(?:\/([\d.]+))?/.exec(normalised);
  if (!lic) return null;

  const code = lic[1];
  // Guard against a URL like `/licenses/something-invented/`: only accept codes
  // built from the four real clauses. Anything else falls through to `unknown`
  // rather than being interpreted generously.
  const parts = code.split("-");
  const VALID = new Set(["by", "nc", "nd", "sa"]);
  if (parts.length === 0 || !parts.every((p) => VALID.has(p))) return null;
  if (!parts.includes("by")) return null; // every modern CC licence requires attribution

  return {
    code,
    version: lic[2] ?? null,
    // The only clause that governs whether a commercial venue may perform it.
    commercial: !parts.includes("nc"),
    derivatives: !parts.includes("nd"),
    shareAlike: parts.includes("sa"),
    attribution: true,
    url: raw
  };
}

/**
 * Map a Creative Commons URL to one of the seven `REQ-DAT-8` classes.
 *
 * Conservative by construction: anything unparseable is `unknown`, which a
 * commercial venue blocks. Returning `cc_attribution` for an unrecognised URL
 * would be the failure mode that matters.
 *
 * @param {string} url
 * @returns {{licenceClass: string, licence: CcLicence|null, reason: string}}
 */
export function classifyCc(url) {
  const licence = parseCcUrl(url);

  if (!licence) {
    return {
      licenceClass: "unknown",
      licence: null,
      reason: `"${url}" is not a recognised Creative Commons licence URL, so it cannot be assumed playable`
    };
  }

  if (licence.code === "cc0" || licence.code === "pdm") {
    return {
      licenceClass: "owned_local",
      licence,
      reason: "public domain — no attribution obligation and no PRO licence needed"
    };
  }

  if (!licence.commercial) {
    return {
      licenceClass: "cc_noncommercial",
      licence,
      reason: `${licence.code.toUpperCase()} forbids commercial use, and a venue is a commercial setting`
    };
  }

  if (licence.shareAlike) {
    return {
      licenceClass: "cc_sharealike",
      licence,
      reason: `${licence.code.toUpperCase()} permits commercial performance with attribution`
    };
  }

  return {
    licenceClass: "cc_attribution",
    licence,
    reason: licence.derivatives
      ? `${licence.code.toUpperCase()} permits commercial performance with attribution`
      : // Stated explicitly so the collapse is visible in the data, not just in
        // this file's documentation.
        `${licence.code.toUpperCase()} permits commercial performance with attribution; ` +
        `the no-derivatives clause does not restrict unmodified playback`
  };
}

/**
 * Attribution string for the venue display — REQ-DAT-11.
 *
 * CC BY requires credit "in the manner specified"; in a venue that means on the
 * screen while the track plays. Built here so every CC provider produces the same
 * shape rather than each inventing one.
 *
 * @param {{artist?: string, title?: string}} track
 * @param {CcLicence|null} licence
 */
export function ccAttribution(track, licence) {
  if (!licence || licence.code === "cc0" || licence.code === "pdm") return null;
  const who = track.artist ?? "Unknown artist";
  const what = track.title ? `"${track.title}"` : "";
  const label = licence.code.toUpperCase().replace(/-/g, "-");
  const version = licence.version ? ` ${licence.version}` : "";
  return [what, `by ${who}`, `— CC ${label}${version}`].filter(Boolean).join(" ").trim();
}
