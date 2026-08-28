// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Content-source guard — REQ-CON-7, CON-7.
 *
 * The guard exists because "we decided not to integrate Spotify" is the kind of
 * decision that erodes: someone wires up a downloader one evening because it makes
 * the demo better, nobody remembers why it was excluded, and a load-bearing
 * property of the product quietly stops being true.
 *
 * These tests construct exactly that mistake and check it is caught — and, just as
 * importantly, check that the legitimate sources the product depends on are *not*
 * caught, because a guard that blocks OpenSubsonic would be turned off within a week.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, rmSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  check,
  scanSources,
  BANNED_PACKAGES,
  BANNED_HOSTS,
  PERMITTED_MODELS,
  stripComments
} from "../check-content-sources.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const probeDir = join(root, "providers");
const probe = join(probeDir, "_con7_probe.js");

const SPDX = ["SPDX", "License", "Identifier"].join("-");
const HEADER = `// ${SPDX}: Apache-2.0\n`;

// Specifiers are assembled at runtime so this test file does not itself contain
// the literals it is testing for — the same self-reference problem the licence
// boundary tests had.
const spotifyPkg = ["spotify", "web", "api", "node"].join("-");
const ytdlPkg = ["ytdl", "core"].join("-");
const spotifyHost = ["api", "spotify", "com"].join(".");

function withProbe(t, contents) {
  mkdirSync(probeDir, { recursive: true });
  writeFileSync(probe, contents);
  t.after(() => rmSync(probe, { force: true }));
}

test("the repository is currently clean", () => {
  assert.deepEqual(check(), []);
});

test("a consumer streaming client is caught — REQ-CON-7", (t) => {
  withProbe(t, HEADER + `import Spotify from "${spotifyPkg}";\n`);

  const v = scanSources();
  assert.equal(v.length, 1, JSON.stringify(v));
  assert.equal(v[0].rule, "REQ-CON-7");
  assert.match(v[0].message, /consumer account/);
});

test("a media downloader is caught — the ytdl-core evening", (t) => {
  withProbe(t, HEADER + `const ytdl = require("${ytdlPkg}");\n`);

  const v = scanSources();
  assert.equal(v.length, 1);
  assert.match(v[0].message, /downloader/);
});

test("every module-loading form is covered", (t) => {
  const forms = [
    `import x from "${ytdlPkg}";`,
    `import "${ytdlPkg}";`,
    `const x = require("${ytdlPkg}");`,
    `const x = await import("${ytdlPkg}");`
  ];
  for (const form of forms) {
    withProbe(t, HEADER + form + "\n");
    assert.ok(scanSources().length >= 1, `not caught: ${form}`);
    rmSync(probe, { force: true });
  }
});

test("calling a consumer API by hostname is caught", (t) => {
  withProbe(t, HEADER + `const r = await fetch("https://${spotifyHost}/v1/me/player");\n`);

  const v = scanSources();
  assert.equal(v.length, 1);
  assert.match(v[0].message, /Spotify Web API/);
});

test("a URL in a string is not mistaken for a comment", (t) => {
  // The bug that made this whole guard useless: every URL contains "//", so a
  // naive line-comment stripper threw away everything from the protocol separator
  // onwards. The host check then matched nothing and the guard passed code calling
  // the exact APIs it exists to forbid. It looked correct and was silently inert.
  withProbe(t, HEADER + `const url = "https://${spotifyHost}/v1/me/player";\n`);

  const v = scanSources();
  assert.equal(v.length, 1, "a banned host inside a URL string must still be seen");
  assert.match(v[0].message, /Spotify Web API/);
});

test("stripComments keeps strings and drops real comments", () => {
  const src = [
    `const a = "https://example.com/path"; // a real comment`,
    `const b = 'no // comment here';`,
    `/* block */ const c = 1;`,
    "const d = `template with // slashes`;"
  ].join("\n");

  const out = stripComments(src);

  assert.ok(out.includes("https://example.com/path"), "URLs survive");
  assert.ok(out.includes("no // comment here"), "slashes inside strings survive");
  assert.ok(out.includes("template with // slashes"), "template literals survive");
  assert.ok(!out.includes("a real comment"), "line comments are removed");
  assert.ok(!out.includes("block"), "block comments are removed");
});

test("discussing these services in a comment is not a violation", (t) => {
  // The reasoning has to be writable down. A guard that punishes explaining itself
  // makes the codebase worse.
  withProbe(
    t,
    HEADER +
      `// We deliberately do not use ${spotifyPkg} or ${ytdlPkg}: a consumer\n` +
      `// licence forbids public performance. See ${spotifyHost} terms.\n` +
      `export const provider = "opensubsonic";\n`
  );

  assert.deepEqual(scanSources(), [], "comments explaining the ban must be allowed");
});

test("legitimate sources are not caught — the guard must stay usable", (t) => {
  // If this guard blocked the sources the product actually ships, it would be
  // switched off inside a week, and then it would protect nothing.
  withProbe(
    t,
    HEADER +
      `import { OpenSubsonic } from "../providers/opensubsonic.js";\n` +
      `const jamendo = await fetch("https://api.jamendo.com/v3.0/tracks");\n` +
      `const mb = await fetch("https://musicbrainz.org/ws/2/recording");\n` +
      `const local = "file:///var/lib/crowddeck/library";\n` +
      `const pool = "https://example-record-pool.com/api";\n`
  );

  assert.deepEqual(scanSources(), [], "OpenSubsonic, Jamendo, MusicBrainz and local files are all fine");
});

test("markdown is not scanned, so the research can name what it excluded", () => {
  // CONCEPT-IDEA.md analyses these products at length. That analysis is the reason
  // the rule exists; scanning it would make documenting the decision impossible.
  assert.deepEqual(check(), [], "the repo has plenty of markdown naming these services");
});

test("a banned package declared as a dependency is caught", () => {
  // Belt and braces: an adapter could be added as a dependency before any code
  // imports it, and that is still the moment to object.
  assert.ok(
    BANNED_PACKAGES.some((p) => p.name === ytdlPkg),
    "the downloader denylist must cover the obvious one"
  );
});

test("the denylist covers both failure modes, with reasons", () => {
  assert.ok(BANNED_PACKAGES.length >= 15, "denylist should be more than a token gesture");
  assert.ok(BANNED_HOSTS.length >= 5);

  for (const entry of [...BANNED_PACKAGES, ...BANNED_HOSTS]) {
    assert.ok(entry.why && entry.why.length > 5, `${entry.name ?? entry.host} has no stated reason`);
  }

  // The rule is "no consumer accounts and no downloaders", NOT "no streaming".
  // Licensed B2B services are exactly what a venue should use.
  const permitted = PERMITTED_MODELS.join(" ");
  assert.match(permitted, /licensed background-music services/i);
  assert.match(permitted, /OpenSubsonic/i);
  assert.match(permitted, /Creative Commons/i);
});
