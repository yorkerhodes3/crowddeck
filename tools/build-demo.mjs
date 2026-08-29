// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Assemble the playable deck demo into `docs/`, so GitHub Pages serves it.
 *
 * The deck is entirely client-side: Web Audio decodes locally, the library
 * fetches the Internet Archive directly, and nothing needs a server. So the same
 * files that run under `npm start` can be published as a static page, and the
 * demo becomes a link rather than an instruction to clone and run something.
 *
 * ## Copied, not duplicated
 *
 * These files have exactly one source of truth — `clients/` and `engine-web/` —
 * and this script mirrors them at build time. Hand-copying would guarantee drift:
 * the published demo would slowly stop matching the tested code, and the first
 * anyone would know is a bug report against a version that no longer exists.
 *
 * ## Why the directory shape is preserved
 *
 * The deck imports `../engine-web/src/...` and that module imports
 * `../../providers/src/cc-licence.js`. Those relative paths resolve correctly
 * both from `/deck/index.html` on the local server and from `/demo/index.html`
 * under `docs/`, *provided the layout is the same on both sides*. That is the
 * whole reason the imports are relative rather than absolute: an absolute
 * `/engine-web/...` works at a domain root and breaks under the `/crowddeck/`
 * path prefix that Project Pages serves from.
 */

import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docs = join(root, "docs");

/** Each entry is mirrored from the repo into `docs/`, preserving its shape. */
const COPY = [
  { from: "clients/deck/index.html", to: "demo/index.html" },
  { from: "engine-web/src", to: "engine-web/src" },
  // Only the one module the browser actually imports. Copying all of
  // `providers/` would publish server-side adapters that cannot run in a page
  // and would imply they are part of the demo.
  { from: "providers/src/cc-licence.js", to: "providers/src/cc-licence.js" }
];

function copyDir(from, to) {
  mkdirSync(to, { recursive: true });
  let n = 0;
  for (const entry of readdirSync(from)) {
    const src = join(from, entry);
    const dst = join(to, entry);
    if (statSync(src).isDirectory()) n += copyDir(src, dst);
    else {
      copyFileSync(src, dst);
      n++;
    }
  }
  return n;
}

// Cleared first, so a file deleted from source does not linger in the published
// demo. A stale module that no longer exists upstream is the hardest kind of
// difference to notice.
for (const dir of ["demo", "engine-web", "providers"]) {
  rmSync(join(docs, dir), { recursive: true, force: true });
}

let copied = 0;
for (const { from, to } of COPY) {
  const src = join(root, from);
  const dst = join(docs, to);
  if (statSync(src).isDirectory()) {
    copied += copyDir(src, dst);
  } else {
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    copied++;
  }
}

/*
 * Fail loudly if the demo could not possibly work.
 *
 * A silently broken demo is worse than none: the link still resolves, the page
 * still renders, and the first symptom is a blank deck for whoever opened it. So
 * every module the page imports is checked to exist on disk, here, at build time.
 */
const html = readFileSync(join(docs, "demo/index.html"), "utf8");
const imports = [...html.matchAll(/from\s+"([^"]+\.js)"/g)].map((m) => m[1]);
const missing = [];
for (const spec of imports) {
  if (!spec.startsWith(".")) continue;
  const target = resolve(join(docs, "demo"), spec);
  try {
    statSync(target);
  } catch {
    missing.push(spec);
  }
}
if (missing.length) {
  console.error(
    "build-demo: the published demo would be broken — these imports have no file:\n" +
      missing.map((m) => "  " + m).join("\n")
  );
  process.exit(1);
}

console.log(
  `build-demo: ${copied} files into docs/, ${imports.length} imports resolved.\n` +
    "  Playable demo will be served at <pages-url>/demo/"
);
