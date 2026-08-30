// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Every module the deck imports must be reachable from the dev server.
 *
 * Found by driving the local deck in a real browser: the page rendered
 * perfectly, and every control did nothing. `npm start` served
 * `clients/deck/index.html`, which imports `engine-web/`, which imports
 * `providers/src/provider.js`, which imports `core/src/policy.js` — and `core/`
 * was not mounted. The 404 aborted the module, so the listeners at the bottom of
 * the file were never attached.
 *
 * That is the worst shape a bug can take here. There is no error on the page, no
 * failed control, nothing an HTTP check would catch — fetching the deck returned
 * 200, and so did every module it *names*. Only the browser console showed it,
 * and only because the missing file is imported transitively by a package the
 * deck never mentions.
 *
 * So the graph is walked rather than listed. A hand-written list of modules
 * would need updating by exactly the person who just forgot to update the mount
 * list, which is no guard at all.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const deckPage = path.join(repoRoot, "clients", "deck", "index.html");

/**
 * Mirrors SERVED_ROOTS in api/bin/crowddeck-server.js, read from the source so
 * the two cannot drift.
 */
function servedRoots() {
  const src = readFileSync(path.join(repoRoot, "api", "bin", "crowddeck-server.js"), "utf8");
  const block = /const SERVED_ROOTS = \[([\s\S]*?)\];/.exec(src);
  assert.ok(block, "SERVED_ROOTS should still be a literal array this test can read");
  const roots = [...block[1].matchAll(/prefix:\s*"(\/[^"]+)",\s*dir:\s*(\w+)/g)].map((m) => ({
    prefix: m[1],
    // `xxxDir` is built as path.join(repoRoot, "xxx") — the name carries the folder.
    dir: m[2].replace(/Dir$/, "").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
  }));
  assert.ok(roots.length > 0, "expected at least one served root");
  return roots;
}

/**
 * Resolve a browser URL to a file on disk using the server's own mount rules.
 *
 * This is the crux: the page lives at the URL `/deck/index.html` but on disk at
 * `clients/deck/index.html`, so `../engine-web/x.js` is `/engine-web/x.js` to the
 * browser and `repoRoot/engine-web/x.js` after mounting — NOT `clients/engine-web`.
 * Walking the disk layout instead of the URL space finds files that are never
 * requested and misses the ones that 404.
 */
function urlToFile(url, roots) {
  const mount = roots.find((r) => url.startsWith(r.prefix));
  if (mount) return path.join(repoRoot, mount.dir, url.slice(mount.prefix.length));
  return path.join(repoRoot, "clients", url.replace(/^\//, ""));
}

/** Relative import specifiers in a file. */
function importsIn(text) {
  return [...text.matchAll(/(?:^|\s)(?:import|export)[^;]*?from\s*["'](\.[^"']+)["']/g)].map((m) => m[1]);
}

/** Walk the import graph in URL space, the way the browser does. */
function walk(entryUrl, entryText, roots) {
  const seen = new Set();
  const out = [];
  const queue = importsIn(entryText).map((s) => new URL(s, "http://x" + entryUrl).pathname);

  while (queue.length) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);

    const file = urlToFile(url, roots);
    out.push({ url, file });
    if (!existsSync(file)) continue;
    for (const spec of importsIn(readFileSync(file, "utf8"))) {
      queue.push(new URL(spec, "http://x" + url).pathname);
    }
  }
  return out;
}

test("every module the deck imports, transitively, is served by the dev server", () => {
  const roots = servedRoots();
  const modules = walk("/deck/index.html", readFileSync(deckPage, "utf8"), roots);
  assert.ok(modules.length > 10, `expected a real import graph, found ${modules.length}`);

  const missing = modules.filter((m) => !existsSync(m.file)).map((m) => m.url);

  assert.deepEqual(
    missing,
    [],
    "these modules 404 on `npm start`, which aborts the deck silently — the page " +
      "renders and every control does nothing. Add their top-level directory to " +
      "SERVED_ROOTS in api/bin/crowddeck-server.js: " + missing.join(", ")
  );
});

test("the walk really does follow imports through more than one hop", () => {
  // Without this, the test above passes trivially if importsIn() ever stops
  // matching — an empty graph has nothing missing. The deck reaches core/ only
  // via providers/, so seeing core/ proves three levels were followed:
  // deck -> engine-web -> providers -> core.
  const roots = servedRoots();
  const urls = walk("/deck/index.html", readFileSync(deckPage, "utf8"), roots).map((m) => m.url);
  assert.ok(
    urls.some((u) => u.startsWith("/core/")),
    "expected the graph to reach /core/ transitively; it found: " + urls.join(", ")
  );
});
