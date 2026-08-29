// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Content-source guard — REQ-CON-7, CON-7.
 *
 * > The system MUST NOT include any adapter sourcing venue playback from a
 * > consumer streaming account or a media downloader.
 *
 * ## Why this is a build check and not a paragraph in a README
 *
 * This is the single flaw that makes the existing open-source jukeboxes unusable
 * in a real venue. They are technically impressive and legally unshippable: they
 * play a member of staff's personal Spotify account through a PA system, which
 * every consumer streaming licence forbids in plain terms, and which no amount of
 * PRO licensing fixes — the venue can hold every ASCAP, BMI, SESAC and GMR licence
 * going and still be in breach of the *service's* terms.
 *
 * Designing that out is a feature of this product. But "we decided not to do that"
 * is exactly the kind of decision that erodes: a contributor wires up `ytdl-core`
 * one evening because it makes the demo better, it is genuinely useful, nobody
 * remembers the reasoning, and the property quietly stops being true. By the time
 * anyone notices it is a dependency other things rely on.
 *
 * So it is enforced. The same argument as `REQ-LIC-8` and the licence boundary:
 * an architectural guarantee nothing checks is a guarantee with a half-life.
 *
 * ## What is banned, and what is emphatically not
 *
 * The rule is **not** "no streaming". It is **no consumer accounts and no
 * downloaders**. Licensed business services are exactly what a venue *should* use
 * and are welcome here — Soundtrack Your Brand, Cloud Cover, SiriusXM Business and
 * their peers all sell public-performance rights with the subscription. So do
 * record pools. So does the venue's own library, a self-hosted OpenSubsonic server,
 * and Creative Commons repertoire.
 *
 * The line is whether the source grants the venue the right to perform the music in
 * public. Consumer tiers explicitly do not. Downloaders do not grant anything at
 * all — they route around the question.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, dirname, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Package names that indicate a consumer-account or downloader integration.
 * Matched against import specifiers and declared dependencies.
 */
export const BANNED_PACKAGES = Object.freeze([
  // Consumer streaming clients and account-credential libraries.
  { name: "spotify-web-api-node", why: "Spotify consumer account" },
  { name: "spotify-web-api-js", why: "Spotify consumer account" },
  { name: "librespot", why: "reimplements the Spotify consumer client" },
  { name: "spotifyd", why: "reimplements the Spotify consumer client" },
  { name: "node-spotify-api", why: "Spotify consumer account" },
  { name: "apple-music-api", why: "Apple Music consumer account" },
  { name: "deezer-api", why: "Deezer consumer account" },
  { name: "tidalapi", why: "Tidal consumer account" },

  // Downloaders and rippers. These route around the licensing question entirely.
  { name: "ytdl-core", why: "YouTube downloader" },
  { name: "@distube/ytdl-core", why: "YouTube downloader" },
  { name: "youtube-dl", why: "media downloader" },
  { name: "youtube-dl-exec", why: "media downloader" },
  { name: "yt-dlp", why: "media downloader" },
  { name: "yt-dlp-wrap", why: "media downloader" },
  { name: "play-dl", why: "YouTube/SoundCloud downloader" },
  { name: "ytdl", why: "YouTube downloader" },
  { name: "spotdl", why: "Spotify ripper" },
  { name: "streamrip", why: "streaming ripper" },
  { name: "scdl", why: "SoundCloud downloader" }
]);

/**
 * Hostnames that only appear in code if something is talking to a consumer
 * service. Documentation may discuss them freely; source may not call them.
 */
export const BANNED_HOSTS = Object.freeze([
  { host: "api.spotify.com", why: "Spotify Web API" },
  { host: "accounts.spotify.com", why: "Spotify account authorisation" },
  { host: "api.music.apple.com", why: "Apple Music API" },
  { host: "api.deezer.com", why: "Deezer API" },
  { host: "api.tidal.com", why: "Tidal API" },
  { host: "youtube.com/watch", why: "YouTube media fetch" },
  { host: "youtubei.googleapis.com", why: "YouTube internal API" },
  { host: "api-v2.soundcloud.com", why: "SoundCloud consumer API" }
]);

/** Sources whose licensing model makes them legitimate. Documented, not enforced. */
export const PERMITTED_MODELS = Object.freeze([
  "the venue's own local library, with a PRO licence on file",
  "a self-hosted OpenSubsonic server (Navidrome and friends)",
  "Creative Commons repertoire with machine-readable licence metadata",
  "record pools that grant public-performance rights",
  "licensed background-music services that sell public-performance rights " +
    "(Soundtrack Your Brand, Cloud Cover, SiriusXM Business and peers)",
  "live instruments and hardware sources over MIDI"
]);

const SOURCE_EXT = new Set([".js", ".mjs", ".cjs", ".ts", ".mts", ".c", ".h", ".cpp", ".hpp"]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "research", "build", "dist", "vendor", "third_party",
  // Unmodified upstream source: not ours to police, and not shipped.
  "mixxx-src"
]);

/**
 * Files exempt from the scan because they legitimately name banned things.
 *
 * Kept deliberately short. Every entry is a place where the ban is *implemented or
 * tested*, never a place where an exception to it was granted.
 */
const EXEMPT = new Set([
  "tools/check-content-sources.mjs",
  "tools/test/check-content-sources.test.js",
  // Tests that a pasted consumer-service link is *refused* with an explanation
  // rather than silently returning nothing. It needs a realistic watch URL to
  // assert against, and the assertion is that the URL is turned away — the ban
  // being exercised, not excepted.
  "engine-web/test/openverse.test.js"
]);

/**
 * Walk the tree, tolerating a file that disappears mid-walk.
 *
 * `readdirSync` is a snapshot, so an entry can be gone by the time we stat it —
 * an editor saving, a build cleaning up, another test removing its fixture.
 * Crashing then reports a content-source failure that has nothing to do with
 * content sources, and a file that no longer exists cannot violate REQ-CON-7.
 */
function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch (err) {
      if (err.code === "ENOENT") continue;
      throw err;
    }
    if (st.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/**
 * Strip comments so that *discussing* the ban is not a violation of it — while
 * leaving string literals intact.
 *
 * The naive version of this (`text.replace(/\/\/.*$/gm, "")`) is worse than
 * useless here: every URL contains `//`, so `"https://api.spotify.com/..."` had
 * everything from the protocol separator onwards treated as a comment and thrown
 * away. The host check then matched nothing, and the guard silently passed code
 * that called the exact APIs it exists to forbid. A test caught it; reading the
 * regex would not have.
 *
 * So this tracks quote state properly. Not a full JavaScript tokeniser — it does
 * not need to be — but it does know that a `//` inside a string is data, not a
 * comment.
 */
export function stripComments(text) {
  let out = "";
  let i = 0;
  let quote = null; // the open quote character, or null

  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];

    if (quote) {
      if (c === "\\") {
        out += c + (next ?? "");
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      out += c;
      i++;
      continue;
    }

    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      out += c;
      i++;
      continue;
    }

    if (c === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue; // drop the comment, keep the newline
    }

    if (c === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    out += c;
    i++;
  }

  return out;
}

/** @returns {Array<{rule: string, file: string, message: string}>} */
export function scanSources() {
  const violations = [];

  for (const file of walk(root)) {
    const rel = relative(root, file).split(sep).join("/");
    if (!SOURCE_EXT.has(extname(rel))) continue;
    if (EXEMPT.has(rel)) continue;

    const code = stripComments(readFileSync(file, "utf8"));

    for (const { name, why } of BANNED_PACKAGES) {
      // Any of the module-loading forms, same coverage as the licence boundary.
      const spec = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(
        `(?:from\\s*['"]${spec}['"])|(?:import\\s*['"]${spec}['"])|` +
          `(?:require\\s*\\(\\s*['"]${spec}['"])|(?:import\\s*\\(\\s*['"]${spec}['"])`,
        "m"
      );
      if (re.test(code)) {
        violations.push({
          rule: "REQ-CON-7",
          file: rel,
          message: `imports "${name}" — ${why}. Venue playback must not be sourced from a consumer account or a downloader.`
        });
      }
    }

    for (const { host, why } of BANNED_HOSTS) {
      if (code.includes(host)) {
        violations.push({
          rule: "REQ-CON-7",
          file: rel,
          message: `references ${host} — ${why}. Documentation may discuss these services; source must not call them.`
        });
      }
    }
  }

  return violations;
}

/** @returns {Array<{rule: string, file: string, message: string}>} */
export function scanDependencies() {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const declared = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const violations = [];

  for (const { name, why } of BANNED_PACKAGES) {
    if (name in declared) {
      violations.push({
        rule: "REQ-CON-7",
        file: "package.json",
        message: `declares "${name}" as a dependency — ${why}.`
      });
    }
  }
  return violations;
}

export function check() {
  return [...scanDependencies(), ...scanSources()];
}

/* --------------------------------------------------------------------- CLI */

if (process.argv[1] && process.argv[1].endsWith("check-content-sources.mjs")) {
  const violations = check();

  if (violations.length === 0) {
    console.log(
      `check-content-sources: no consumer-streaming or downloader adapters ` +
        `(${BANNED_PACKAGES.length} packages, ${BANNED_HOSTS.length} hosts checked).`
    );
    console.log("  Venue playback comes only from sources that grant performance rights (REQ-CON-7).");
    process.exit(0);
  }

  console.error(`check-content-sources: ${violations.length} violation(s)\n`);
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}`);
    console.error(`      ${v.message}`);
  }
  console.error(
    "\nA consumer streaming licence forbids public performance, and no amount of PRO\n" +
      "licensing fixes that — the venue can hold every ASCAP, BMI, SESAC and GMR\n" +
      "licence going and still breach the service's own terms. This is the flaw that\n" +
      "makes existing open-source jukeboxes unusable in venues.\n" +
      "\nLegitimate sources:\n" +
      PERMITTED_MODELS.map((m) => `  - ${m}`).join("\n")
  );
  process.exit(1);
}
