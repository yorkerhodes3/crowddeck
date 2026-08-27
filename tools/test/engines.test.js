// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The declared Node requirement must match what the code actually needs.
 *
 * This exists because it was briefly wrong: `data/` started using `node:sqlite`,
 * which needs Node 22.5, while `package.json` still said `>=20`. CI happened to run
 * Node 24 so nothing failed, and the only person who would have discovered it is a
 * contributor on Node 20 getting `ERR_UNKNOWN_BUILTIN_MODULE` with no explanation.
 *
 * A version floor that nothing checks is a comment, not a contract.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

/** Lowest Node that ships `node:sqlite`. */
const SQLITE_MIN = [22, 5, 0];

function parseFloor(range) {
  const m = /^>=\s*(\d+)\.(\d+)(?:\.(\d+))?/.exec(range);
  assert.ok(m, `engines.node must be a ">=x.y.z" range, got ${JSON.stringify(range)}`);
  return [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
}

const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

test("engines.node is high enough for node:sqlite", () => {
  const floor = parseFloor(pkg.engines.node);
  assert.ok(
    cmp(floor, SQLITE_MIN) >= 0,
    `engines.node is ${pkg.engines.node} but data/ imports node:sqlite, which needs ` +
      `${SQLITE_MIN.join(".")}. Either raise the floor or stop using node:sqlite.`
  );
});

test("the runtime actually running the tests satisfies the declared floor", () => {
  const floor = parseFloor(pkg.engines.node);
  const current = process.versions.node.split(".").map(Number);
  assert.ok(
    cmp(current, floor) >= 0,
    `running Node ${process.versions.node}, below the declared floor ${pkg.engines.node}`
  );
});

test("CI runs a Node that satisfies the declared floor", () => {
  const floor = parseFloor(pkg.engines.node);
  for (const wf of ["ci.yml", "pages.yml"]) {
    const yml = readFileSync(join(root, ".github", "workflows", wf), "utf8");
    const versions = [...yml.matchAll(/node-version:\s*"?(\d+)(?:\.(\d+))?"?/g)];
    assert.ok(versions.length > 0, `${wf} pins no node-version`);
    for (const v of versions) {
      const pinned = [Number(v[1]), Number(v[2] ?? 0), 0];
      // A major-only pin like "24" means "latest 24.x", so compare on the major
      // unless it equals the floor's major.
      const ok = pinned[0] > floor[0] || (pinned[0] === floor[0] && cmp(pinned, floor) >= 0);
      assert.ok(ok, `${wf} pins Node ${v[1]}, below the declared floor ${pkg.engines.node}`);
    }
  }
});

test("still no runtime dependencies", () => {
  // The claim is made on the dashboard and in the README, so it should be checked.
  const deps = Object.keys(pkg.dependencies ?? {});
  assert.deepEqual(deps, [], `expected zero runtime dependencies, found: ${deps.join(", ")}`);
});
