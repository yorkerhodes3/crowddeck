// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Release artifact separation — REQ-LIC-8, ADR-006.
 *
 * ## What this defends
 *
 * ADR-006 chose to distribute the Apache-2.0 venue layer and the GPL engine as
 * **two separate downloads**. That choice is what lets the project say it never
 * distributes a combined work at all: whatever combining happens, happens on the
 * operator's machine when they choose to run both.
 *
 * The realistic way that protection is lost is not a courtroom. It is a maintainer
 * shipping a convenience installer eighteen months from now, because bundling both
 * binaries is obviously nicer for users and nobody remembers why it was forbidden.
 * By the time anyone notices, it has shipped.
 *
 * So this is a check, not a note in a README.
 *
 * ## What it actually verifies
 *
 * Given one or more artifact manifests — a directory, or a list of file paths — it
 * asserts that no single artifact contains files from **both** planes. Plane
 * membership reuses the same prefix table as `licence-lint.mjs`, so the two cannot
 * disagree about where the boundary is.
 *
 * Run with no arguments it checks the repository's declared release layout in
 * `release.json`; with arguments it checks the paths given, which is how a packaging
 * step would call it.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Plane prefixes, mirroring tools/licence-lint.mjs. */
export const APACHE_PREFIXES = [
  "protocol", "core", "data", "api", "clients", "interconnect",
  "conformance", "engine-stub", "tools", "docs"
];
export const GPL_PREFIXES = ["engine", "spike/mixxx-src"];

/** @returns {"apache"|"gpl"|null} */
export function planeOf(relPath) {
  const p = relPath.split(/[\\/]/).join("/");
  const startsWith = (prefix) => p === prefix || p.startsWith(`${prefix}/`);
  // Longest prefix wins so `spike/mixxx-src` beats a hypothetical `spike`.
  if (GPL_PREFIXES.some(startsWith)) return "gpl";
  if (APACHE_PREFIXES.some(startsWith)) return "apache";
  return null;
}

/**
 * @param {{name: string, files: string[]}} artifact
 * @returns {{name: string, apache: string[], gpl: string[], mixed: boolean}}
 */
export function inspectArtifact(artifact) {
  const apache = [];
  const gpl = [];
  for (const f of artifact.files) {
    const plane = planeOf(f);
    if (plane === "apache") apache.push(f);
    else if (plane === "gpl") gpl.push(f);
  }
  return { name: artifact.name, apache, gpl, mixed: apache.length > 0 && gpl.length > 0 };
}

/** @param {Array<{name: string, files: string[]}>} artifacts */
export function checkArtifacts(artifacts) {
  const violations = [];
  for (const a of artifacts) {
    const r = inspectArtifact(a);
    if (r.mixed) {
      violations.push({
        rule: "REQ-LIC-8",
        artifact: r.name,
        message:
          `contains both planes — ${r.apache.length} Apache-2.0 file(s) and ${r.gpl.length} GPL file(s). ` +
          `ADR-006 requires them to ship as separate downloads, because that is what keeps the project ` +
          `from ever distributing a combined work.`,
        apacheSample: r.apache.slice(0, 3),
        gplSample: r.gpl.slice(0, 3)
      });
    }
  }
  return violations;
}

/**
 * Walk the tree, tolerating a file that disappears mid-walk.
 *
 * `readdirSync` returns a snapshot, so an entry can be gone by the time we stat
 * it — an editor saving, another test cleaning up a fixture, or `build-demo.mjs`
 * clearing and rewriting the very `docs/` subtrees this walks. Crashing then
 * reports an artifact-layout failure that has nothing to do with the artifact
 * layout, and a file that no longer exists cannot violate ADR-006.
 *
 * The other two tree walkers in `tools/` already handle this and say so. This
 * one did not, which made it the only place where a routine file-system race
 * could take the build down. Kept deliberately narrow: only ENOENT is
 * swallowed, so a permissions problem or a corrupt directory still fails loudly.
 */
export function walk(dir, base = dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (err) {
    if (err.code === "ENOENT") return out;
    throw err;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".git") continue;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch (err) {
      if (err.code === "ENOENT") continue;
      throw err;
    }
    if (st.isDirectory()) out.push(...walk(full, base));
    else out.push(relative(base, full).split(sep).join("/"));
  }
  return out;
}

/** Reads the declared release layout, or falls back to the repository's own shape. */
export function declaredArtifacts() {
  const manifestPath = join(root, "release.json");
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    return manifest.artifacts.map((a) => ({
      name: a.name,
      // Expand each declared prefix to the files it would contain.
      files: a.include.flatMap((prefix) => {
        const dir = join(root, prefix);
        if (!existsSync(dir)) return [];
        return statSync(dir).isDirectory()
          ? walk(dir).map((f) => `${prefix}/${f}`)
          : [prefix];
      })
    }));
  }
  return null;
}

/* --------------------------------------------------------------------- CLI */

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("check-artifacts.mjs")) {
  const args = process.argv.slice(2);
  let artifacts;

  if (args.length > 0) {
    // Each argument is a directory that will become one artifact.
    artifacts = args.map((a) => ({ name: a, files: walk(resolve(a)) }));
  } else {
    artifacts = declaredArtifacts();
    if (!artifacts) {
      console.error(
        "check-artifacts: no release.json and no directories given.\n" +
          "  Declare the release layout in release.json, or pass artifact directories."
      );
      process.exit(2);
    }
  }

  const violations = checkArtifacts(artifacts);

  if (violations.length === 0) {
    const summary = artifacts
      .map((a) => {
        const r = inspectArtifact(a);
        const plane = r.gpl.length ? "GPL-2.0-or-later" : "Apache-2.0";
        return `  ${a.name} — ${a.files.length} file(s), ${plane}`;
      })
      .join("\n");
    console.log(`check-artifacts: ${artifacts.length} artifact(s), no mixing.\n${summary}`);
    console.log("  Apache-2.0 and GPL planes ship separately (REQ-LIC-8, ADR-006).");
    process.exit(0);
  }

  console.error(`check-artifacts: ${violations.length} violation(s)\n`);
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.artifact}`);
    console.error(`      ${v.message}`);
    console.error(`      Apache-2.0: ${v.apacheSample.join(", ")}`);
    console.error(`      GPL:        ${v.gplSample.join(", ")}`);
  }
  console.error(
    "\nSeparate artifacts are what let the project say it never distributes a combined\n" +
      "work. Bundling them is the one change that quietly undoes ADR-006."
  );
  process.exit(1);
}
