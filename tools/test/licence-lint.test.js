// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Tests for the licence boundary gate itself.
 *
 * The gate enforces ADR-001, which the whole licence structure depends on. A gate
 * that cannot fail is not a gate, so each rule here is proven by constructing a
 * violation and checking it is caught.
 *
 * This file exists because a manual negative test found the boundary rule silently
 * missing bare side-effect imports (`import "x";` has no `from` clause). Everything
 * else would have passed while the rule was broken, which is exactly the kind of
 * false confidence a safety gate must not give.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
const lint = join(root, "tools", "licence-lint.mjs");

// Specifiers are assembled from segments rather than written literally. If the
// literal text "../../engine/foo.js" appeared in this file, licence-lint would scan
// this file and flag it — the fixtures would trip the very rule they test. Building
// them at runtime keeps the gate fully armed on this file too.
const GPL_ENGINE = ["..", "..", "engine", "foo.js"].join("/");
const GPL_VENDORED = ["..", "..", "spike", "mixxx-src", "control.h"].join("/");
const SPDX = ["SPDX", "License", "Identifier"].join("-");
const APACHE_HEADER = `// ${SPDX}: Apache-2.0\n`;

/** @returns {{code: number, out: string}} */
function runLint() {
  try {
    return { code: 0, out: execFileSync(process.execPath, [lint], { encoding: "utf8" }) };
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout ?? "") + (e.stderr ?? "") };
  }
}

/**
 * Remove probe artefacts from a previous run.
 *
 * These tests deliberately write files that make licence-lint fail. If a run is
 * interrupted between writing one and its cleanup hook, the next run starts with a
 * repository that fails lint for a reason that has nothing to do with the change
 * being tested — a confusing false alarm. Cleaning up on the way in as well as on
 * the way out makes that self-healing.
 */
function clearProbes() {
  rmSync(join(root, "core", "src", "_lint_probe.js"), { force: true });
  rmSync(join(root, "engine", "_lint_probe.cpp"), { force: true });
  rmSync(join(root, "_lint_sandbox"), { recursive: true, force: true });
}

clearProbes();

test("the repository is currently clean", () => {
  const { code, out } = runLint();
  assert.equal(code, 0, out);
  assert.match(out, /no violations/);
});

test("every module-loading form is checked for the GPL boundary — REQ-LIC-2", (t) => {
  const probe = join(root, "core", "src", "_lint_probe.js");
  t.after(() => rmSync(probe, { force: true }));

  // Each of these pulls GPL-plane code into an Apache-2.0 file. All must be caught.
  const forms = {
    "import ... from": `import x from "${GPL_ENGINE}";`,
    "export ... from": `export { z } from "${GPL_ENGINE}";`,
    "bare side-effect import": `import "${GPL_ENGINE}";`,
    "dynamic import()": `const m = await import("${GPL_ENGINE}");`,
    "require()": `const y = require("${GPL_ENGINE}");`
  };

  for (const [name, stmt] of Object.entries(forms)) {
    writeFileSync(probe, APACHE_HEADER + stmt + "\n");
    const { code, out } = runLint();
    assert.equal(code, 1, `${name}: expected a non-zero exit\n${out}`);
    assert.match(out, /REQ-LIC-2/, `${name}: was NOT caught by the boundary rule\n${out}`);
  }
});

test("vendored upstream GPL source is inside the boundary, not beside it — REQ-LIC-2", (t) => {
  const probe = join(root, "core", "src", "_lint_probe.js");
  t.after(() => rmSync(probe, { force: true }));

  // spike/mixxx-src holds unmodified Mixxx source kept as evidence for SPIKE-1's
  // citations. It is GPL, so Apache-2.0 code must not reach into it any more than
  // it may reach into engine/. See spike/mixxx-src/PROVENANCE.md.
  writeFileSync(probe, APACHE_HEADER + `import "${GPL_VENDORED}";\n`);
  const { code, out } = runLint();
  assert.equal(code, 1, out);
  assert.match(out, /REQ-LIC-2/);
  assert.match(out, /mixxx-src/);
});

test("unmodified upstream files are not required to carry our SPDX header", () => {
  // We must not edit third-party source to satisfy our own lint. The `thirdParty`
  // flag exempts them from the header rule while keeping them copyleft.
  const { code, out } = runLint();
  assert.equal(code, 0);
  assert.doesNotMatch(out, /mixxx-src/);
});

test("source outside every declared plane fails the build — REQ-LIC-1", (t) => {
  const dir = join(root, "_lint_sandbox");
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "rogue.js"), "export const x = 1;\n");

  const { code, out } = runLint();
  assert.equal(code, 1, "an unassigned directory must not be silently ignored");
  assert.match(out, /outside every declared plane/);
});

test("a file in the GPL plane must declare GPL, not Apache — REQ-LIC-1", (t) => {
  const dir = join(root, "engine");
  const probe = join(dir, "_lint_probe.cpp");
  t.after(() => rmSync(probe, { force: true }));

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(probe, APACHE_HEADER + "int main() { return 0; }\n");

  const { code, out } = runLint();
  assert.equal(code, 1, out);
  assert.match(out, /declares Apache-2\.0 but sits in the engine\/ plane/);
});
