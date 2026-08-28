// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The CI workflow must not duplicate commands that live in package.json.
 *
 * ## Why this test exists
 *
 * `.github/workflows/ci.yml` inlined the test globs instead of calling `npm test`.
 * Three test directories were added to `package.json` over time and the workflow
 * never caught up, so **76 tests ran locally and never ran in CI** — every
 * persistence test, every QR test, and every licence-lint test. CI stayed green the
 * whole time, which is the worst version of this failure: the signal was not just
 * absent, it was actively misleading.
 *
 * A duplicated command list is a second source of truth that nothing reconciles.
 * These tests make the workflow call npm scripts and fail if the duplication returns.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
const ci = readFileSync(join(root, ".github", "workflows", "ci.yml"), "utf8");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

/** The `run:` command bodies in the workflow. */
const runSteps = [...ci.matchAll(/run:\s*(\|[\s\S]*?(?=\n\s{6}-|\n\s{4}\w|$)|.+)/g)].map((m) =>
  m[1].trim()
);

test("CI does not inline the test globs", () => {
  for (const step of runSteps) {
    assert.ok(
      !/node\s+--test/.test(step),
      `CI runs "node --test" directly:\n\n${step}\n\n` +
        `That is a second copy of the glob list in package.json, and it has already ` +
        `drifted once — 76 tests silently stopped running in CI. Call "npm test" instead.`
    );
  }
});

test("CI invokes the same entry points a developer does", () => {
  assert.ok(/npm run check/.test(ci), "CI must run `npm run check`");
  assert.ok(/npm run build:data/.test(ci), "CI must run `npm run build:data`");
});

test("npm run check covers every gate, so CI cannot drift from a local run", () => {
  // CI calls `npm run check` and nothing else. That is only safe if `check` really
  // does cover everything — otherwise a gate can be added to the repo and silently
  // never run, which is precisely what happened when CI kept its own copy of the
  // test-glob list.
  const check = pkg.scripts.check;
  for (const [gate, why] of [
    ["lint:licence", "the ADR-001 licence boundary"],
    ["lint:artifacts", "REQ-LIC-8 release artifact separation"],
    ["lint:sources", "REQ-CON-7 no consumer-streaming or downloader adapters"],
    ["test", "the test suite"],
    ["conformance", "CDEP conformance"]
  ]) {
    assert.ok(check.includes(gate), `npm run check must run ${gate} — ${why}`);
  }
});

test("every declared lint script exists as a file", () => {
  for (const [name, cmd] of Object.entries(pkg.scripts)) {
    if (!name.startsWith("lint:")) continue;
    const m = /node\s+(\S+)/.exec(cmd);
    assert.ok(m, `${name} does not invoke a script`);
    assert.ok(existsSync(join(root, m[1])), `${name} points at missing ${m[1]}`);
  }
});

test("every test directory in the repository is covered by npm test", () => {
  // A new package with tests that npm test does not glob is invisible, which is
  // exactly how the previous gap happened.
  const testScript = pkg.scripts.test;
  const dirsWithTests = [
    "protocol", "engine-stub", "core", "data", "providers", "api", "interconnect", "clients", "tools"
  ];
  for (const dir of dirsWithTests) {
    assert.ok(
      testScript.includes(`${dir}/test/`),
      `"${dir}/test/" has tests but npm test does not include it`
    );
  }
});

test("npm run check covers lint, tests and conformance", () => {
  const check = pkg.scripts.check;
  assert.ok(check.includes("lint:licence"), "check must run the licence boundary lint");
  assert.ok(check.includes("test"), "check must run the tests");
  assert.ok(check.includes("conformance"), "check must run CDEP conformance");
});

test("the artifact check is wired into npm scripts", () => {
  assert.ok(pkg.scripts["lint:artifacts"], "lint:artifacts script must exist");
  assert.match(pkg.scripts["lint:artifacts"], /check-artifacts/);
});

test("CI installs dependencies whenever any are declared", () => {
  // The project has zero *runtime* dependencies, so CI historically needed no
  // install step at all. Adding a single dev-only dependency (jsQR, the oracle
  // that proves the QR encoder actually produces scannable codes) silently broke
  // that assumption: the import failed and the whole clients/ test file errored.
  const declared =
    Object.keys(pkg.dependencies ?? {}).length + Object.keys(pkg.devDependencies ?? {}).length;

  if (declared > 0) {
    assert.match(
      ci,
      /npm ci/,
      `package.json declares ${declared} dependency/dependencies but CI never installs them, ` +
        `so any test importing one will fail with ERR_MODULE_NOT_FOUND`
    );
  }
});

test("a lockfile exists so npm ci is reproducible", () => {
  assert.ok(
    existsSync(join(root, "package-lock.json")),
    "npm ci requires package-lock.json"
  );
});

test("runtime dependencies stay at zero", () => {
  // The dev-only oracle is a deliberate exception. A *runtime* dependency would
  // break the appliance promise: a venue box that needs a package registry to
  // boot is one more thing to fail on a Friday night.
  assert.deepEqual(
    Object.keys(pkg.dependencies ?? {}),
    [],
    "runtime dependencies must stay empty — dev-only tooling is fine"
  );
});
