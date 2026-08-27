// Regenerates docs/data/bundle.js from the JSON files in docs/data/.
//
// The dashboard reads its data from JSON so the same files can be reused by
// SPECIFICATION.md and BACKLOG.md tooling later. Browsers block fetch() over
// file://, so this bundles the JSON into a plain script that also works when
// index.html is opened directly from disk.
//
//   node tools/build-data.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "docs", "data");

const files = {
  competitors: "competitors.json",
  oss: "oss-inventory.json",
  capabilities: "capabilities.json",
  sources: "sources.json"
};

const bundle = {};
for (const [key, file] of Object.entries(files)) {
  const raw = readFileSync(join(dataDir, file), "utf8");
  try {
    bundle[key] = JSON.parse(raw);
  } catch (err) {
    console.error(`Invalid JSON in ${file}: ${err.message}`);
    process.exit(1);
  }
  console.log(`  ok  ${file}`);
}

const out =
  "/* GENERATED FILE - do not edit.\n" +
  "   Run `node tools/build-data.mjs` after changing anything in docs/data/*.json. */\n" +
  "window.__CROWDDECK_DATA__ = " +
  JSON.stringify(bundle, null, 2) +
  ";\n";

writeFileSync(join(dataDir, "bundle.js"), out, "utf8");
console.log(`\nWrote docs/data/bundle.js (${(out.length / 1024).toFixed(1)} KB)`);
