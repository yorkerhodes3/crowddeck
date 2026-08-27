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
import { readFileSync } from "node:fs";
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
  assert.ok(/npm run lint:artifacts/.test(ci), "CI must run the REQ-LIC-8 artifact check");
});

test("every test directory in the repository is covered by npm test", () => {
  // A new package with tests that npm test does not glob is invisible, which is
  // exactly how the previous gap happened.
  const testScript = pkg.scripts.test;
  const dirsWithTests = [
    "protocol", "engine-stub", "core", "data", "api", "interconnect", "clients", "tools"
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
