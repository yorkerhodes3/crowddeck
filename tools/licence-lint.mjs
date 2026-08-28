// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Licence lint — REQ-LIC-1, REQ-LIC-2, REQ-LIC-3, AC-16.
 *
 * ADR-001 splits the product across a licence boundary: `engine/` is
 * GPL-2.0-or-later (Mixxx-derived) and everything else is Apache-2.0, separated
 * by the CDEP socket. That split is only real if it is mechanically enforced —
 * contributor confusion is the main practical risk of a two-licence repository,
 * and the mitigation is automation rather than documentation.
 *
 * This check fails the build when:
 *   1. a source file has no SPDX-License-Identifier            (REQ-LIC-1)
 *   2. a file declares a licence that does not match its plane (REQ-LIC-1)
 *   3. Apache-2.0 code imports from the GPL plane              (REQ-LIC-2)
 *
 *   node tools/licence-lint.mjs [--json]
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Plane assignment — SPECIFICATION §1.2.
 * Longest prefix wins, so a nested exception could be added later.
 */
const PLANES = [
  { prefix: "engine", licence: "GPL-2.0-or-later", copyleft: true },
  { prefix: "engine-stub", licence: "Apache-2.0", copyleft: false },
  { prefix: "protocol", licence: "Apache-2.0", copyleft: false },
  { prefix: "conformance", licence: "Apache-2.0", copyleft: false },
  { prefix: "core", licence: "Apache-2.0", copyleft: false },
  { prefix: "data", licence: "Apache-2.0", copyleft: false },
  { prefix: "crowd", licence: "Apache-2.0", copyleft: false },
  { prefix: "providers", licence: "Apache-2.0", copyleft: false },
  { prefix: "api", licence: "Apache-2.0", copyleft: false },
  { prefix: "clients", licence: "Apache-2.0", copyleft: false },
  { prefix: "interconnect", licence: "Apache-2.0", copyleft: false },
  { prefix: "tools", licence: "Apache-2.0", copyleft: false },
  { prefix: "docs", licence: "Apache-2.0", copyleft: false },
  // Unmodified upstream Mixxx source, kept only as evidence for SPIKE-1's citations.
  // `thirdParty` means: do not demand our SPDX header (we must not edit upstream files),
  // but DO treat it as copyleft, so importing from it is a REQ-LIC-2 violation exactly
  // as importing from engine/ is. See spike/mixxx-src/PROVENANCE.md.
  { prefix: "spike/mixxx-src", licence: "GPL-2.0-or-later", copyleft: true, thirdParty: true },
  // Our own spike code. Longest-prefix matching keeps this distinct from the GPL
  // vendored source sitting beside it under the same spike/ parent.
  { prefix: "spike/spike-2", licence: "Apache-2.0", copyleft: false }
];

/** Source extensions that must carry an SPDX header. */
const SOURCE_EXT = new Set([".js", ".mjs", ".cjs", ".ts", ".mts", ".cpp", ".cc", ".h", ".hpp"]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "research", "build", "dist", "vendor", "third_party"
]);

/** Generated artefacts are exempt: their generator carries the header. */
const EXEMPT_FILES = new Set(["docs/data/bundle.js"]);

const SPDX_RE = /SPDX-License-Identifier:\s*([^\s*]+)/;

/** @returns {{prefix: string, licence: string, copyleft: boolean}|null} */
function planeFor(relPath) {
  const parts = relPath.split(/[\\/]/);
  let best = null;
  for (const p of PLANES) {
    const pp = p.prefix.split("/");
    if (pp.every((seg, i) => parts[i] === seg)) {
      if (!best || pp.length > best.prefix.split("/").length) best = p;
    }
  }
  return best;
}

/**
 * Walk the tree, tolerating a file that disappears mid-walk.
 *
 * `readdirSync` gives a snapshot; by the time we `stat` an entry it may be gone —
 * an editor saving, a build cleaning up, a git checkout, or another test removing
 * its fixture. Crashing on that is wrong twice over: the lint result is unrelated
 * to the vanished file, and in CI it surfaces as a licence failure, which is
 * alarming for no reason. A file that no longer exists cannot violate anything.
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

const violations = [];
let checked = 0;

for (const file of walk(root)) {
  const rel = relative(root, file).split(sep).join("/");
  const ext = rel.slice(rel.lastIndexOf("."));
  if (!SOURCE_EXT.has(ext)) continue;
  if (EXEMPT_FILES.has(rel)) continue;

  const plane = planeFor(rel);
  if (!plane) {
    // Fail closed. A gate that silently ignores whatever it does not recognise
    // gives false confidence: source could be added in a new top-level directory
    // and this tool would still report "no violations". If you add a directory,
    // declare its plane above.
    violations.push({
      rule: "REQ-LIC-1",
      file: rel,
      message: "sits outside every declared plane — add it to PLANES in tools/licence-lint.mjs"
    });
    continue;
  }

  checked++;
  const text = readFileSync(file, "utf8");

  // 1 + 2. SPDX header present and matching the plane. Skipped for unmodified
  // third-party source, which we deliberately do not touch.
  if (!plane.thirdParty) {
    const m = SPDX_RE.exec(text.slice(0, 2000));
    if (!m) {
      violations.push({
        rule: "REQ-LIC-1",
        file: rel,
        message: `missing SPDX-License-Identifier (plane requires ${plane.licence})`
      });
    } else if (m[1] !== plane.licence) {
      violations.push({
        rule: "REQ-LIC-1",
        file: rel,
        message: `declares ${m[1]} but sits in the ${plane.prefix}/ plane, which is ${plane.licence}`
      });
    }
  }

  // 3. Permissive code must not reach into the copyleft plane.
  if (!plane.copyleft) {
    const gplPlanes = PLANES.filter((p) => p.copyleft).map((p) => p.prefix);
    // Every form that can pull in a module. The `from` clause is NOT sufficient:
    // a bare side-effect import (`import "x";`) has no `from` and would otherwise
    // walk straight through this check — which is exactly how a negative test
    // caught this rule failing to fire.
    const importRe = new RegExp(
      [
        /(?:^|[\s;])(?:import|export)[\s\S]{0,200}?\sfrom\s*["']([^"']+)["']/.source,
        /(?:^|[\s;])import\s*["']([^"']+)["']/.source,
        /\bimport\s*\(\s*["']([^"']+)["']\s*\)/.source,
        /\brequire\s*\(\s*["']([^"']+)["']\s*\)/.source,
        /#include\s+["<]([^">]+)[">]/.source
      ].join("|"),
      "g"
    );
    let im;
    while ((im = importRe.exec(text)) !== null) {
      const spec = im[1] ?? im[2] ?? im[3] ?? im[4] ?? im[5];
      if (!spec) continue;
      const resolved = spec.startsWith(".")
        ? relative(root, resolve(dirname(file), spec)).split(sep).join("/")
        : spec;
      for (const gpl of gplPlanes) {
        if (resolved === gpl || resolved.startsWith(`${gpl}/`)) {
          violations.push({
            rule: "REQ-LIC-2",
            file: rel,
            message:
              `imports "${spec}" from the ${gpl}/ (GPL) plane. ` +
              `Apache-2.0 code must reach the engine only over CDEP.`
          });
        }
      }
    }
  }
}

const json = process.argv.includes("--json");

/**
 * A walk that finds almost nothing means the tool is broken, not that the tree is
 * clean. Now that the walker tolerates a vanishing file, a wrong root or an
 * unreadable tree could otherwise report "0 files checked, no violations" and pass
 * — the exact fail-open this tool exists to prevent.
 */
const MIN_EXPECTED_FILES = 50;
if (checked < MIN_EXPECTED_FILES) {
  violations.push({
    rule: "REQ-LIC-1",
    file: "(the tree itself)",
    message:
      `only ${checked} source files were found, expected at least ${MIN_EXPECTED_FILES}. ` +
      `The scan is broken; "no violations" here would mean nothing.`
  });
}

if (json) {
  console.log(JSON.stringify({ checked, violations }, null, 2));
} else if (violations.length === 0) {
  console.log(`licence-lint: ${checked} files checked, no violations.`);
  console.log("  Apache-2.0 core and GPL engine plane are cleanly separated (ADR-001).");
} else {
  console.error(`licence-lint: ${violations.length} violation(s) in ${checked} files\n`);
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}`);
    console.error(`      ${v.message}`);
  }
  console.error(
    "\nThe licence boundary is an architectural invariant (ADR-001), not a style rule.\n"
  );
}

process.exitCode = violations.length === 0 ? 0 : 1;
