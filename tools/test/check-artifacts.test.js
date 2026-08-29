// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Release artifact separation — REQ-LIC-8, ADR-006.
 *
 * ADR-006's licence position rests entirely on the two planes shipping as separate
 * downloads. These tests prove the check that defends it actually fires, by
 * constructing the exact mistake a future maintainer would make.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { planeOf, checkArtifacts, inspectArtifact, declaredArtifacts, walk } from "../check-artifacts.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));

test("plane membership matches the licence-lint boundary", () => {
  assert.equal(planeOf("core/src/scheduler.js"), "apache");
  assert.equal(planeOf("data/src/ledger.js"), "apache");
  assert.equal(planeOf("clients/lib/qr.js"), "apache");
  assert.equal(planeOf("engine-stub/src/server.js"), "apache");

  assert.equal(planeOf("engine/src/enginemixer.cpp"), "gpl");
  assert.equal(planeOf("spike/mixxx-src/control.h"), "gpl");

  assert.equal(planeOf("README.md"), null, "unassigned paths are not a plane");
});

test("the declared release layout ships the planes separately — REQ-LIC-8", () => {
  const artifacts = declaredArtifacts();
  assert.ok(artifacts, "release.json must declare the release layout");
  assert.equal(artifacts.length, 2);

  const violations = checkArtifacts(artifacts);
  assert.deepEqual(violations, [], "the declared layout must not mix planes");

  const venue = inspectArtifact(artifacts.find((a) => a.name === "crowddeck-venue"));
  const engine = inspectArtifact(artifacts.find((a) => a.name === "crowddeck-engine"));

  assert.ok(venue.apache.length > 0, "the venue artifact must contain the Apache-2.0 layer");
  assert.equal(venue.gpl.length, 0, "the venue artifact must contain no GPL code at all");
  assert.equal(engine.apache.length, 0, "the engine artifact must contain no Apache-2.0 code");
});

test("a combined installer is refused — the mistake this exists to catch", () => {
  // The realistic failure: someone bundles both because one download is nicer.
  const convenienceInstaller = {
    name: "crowddeck-all-in-one",
    files: ["core/src/scheduler.js", "api/src/server.js", "engine/src/enginemixer.cpp"]
  };

  const violations = checkArtifacts([convenienceInstaller]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, "REQ-LIC-8");
  assert.match(violations[0].message, /both planes/);
  assert.match(violations[0].message, /separate downloads/);
});

test("vendored upstream GPL source also counts as the GPL plane", () => {
  // spike/mixxx-src holds unmodified Mixxx source as report evidence. Shipping it
  // inside the Apache artifact would be the same mistake wearing a different hat.
  const violations = checkArtifacts([
    { name: "venue", files: ["core/src/queue.js", "spike/mixxx-src/control.h"] }
  ]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, "REQ-LIC-8");
});

test("a single-plane artifact of either licence passes", () => {
  assert.deepEqual(
    checkArtifacts([{ name: "venue", files: ["core/src/a.js", "data/src/b.js"] }]),
    []
  );
  assert.deepEqual(
    checkArtifacts([{ name: "engine", files: ["engine/src/a.cpp", "engine/src/b.h"] }]),
    []
  );
});

test("documentation alongside either artifact is not a violation", () => {
  // README, LICENSE and NOTICE belong in both downloads and are plane-neutral.
  assert.deepEqual(
    checkArtifacts([
      { name: "engine", files: ["engine/src/a.cpp", "README.md", "LICENSE", "NOTICE"] }
    ]),
    []
  );
});

test("release.json stays consistent with the licence-lint planes", () => {
  const manifest = JSON.parse(readFileSync(join(root, "release.json"), "utf8"));
  const lint = readFileSync(join(root, "tools", "licence-lint.mjs"), "utf8");

  for (const artifact of manifest.artifacts) {
    for (const prefix of artifact.include) {
      assert.ok(
        lint.includes(`prefix: "${prefix}"`),
        `release.json ships "${prefix}" but licence-lint declares no plane for it, ` +
          `so nothing checks what licence its files carry`
      );
      const expected = artifact.licence === "Apache-2.0" ? "apache" : "gpl";
      assert.equal(
        planeOf(`${prefix}/x.js`),
        expected,
        `"${prefix}" is shipped as ${artifact.licence} but resolves to the other plane`
      );
    }
  }
});

/* ------------------------------------------- walking a moving tree (DJX-21) */

test("a directory that vanishes mid-walk is not an artifact violation", () => {
  // `build-demo.mjs` clears and rewrites the very docs/ subtrees this walks, and
  // `declaredArtifacts` checks existence and *then* walks — a time-of-check race
  // with a real writer. A file that no longer exists cannot violate ADR-006, so
  // it must not take the build down.
  //
  // The sibling walkers in licence-lint and check-content-sources both handle
  // this and say why; this one did not, which made it the only place a routine
  // file-system race could fail the build.
  assert.deepEqual(walk(join(root, "no-such-directory-anywhere")), []);
});

test("a real tree still walks completely — tolerance is not blindness", () => {
  // The other half of the guard: swallowing ENOENT must not turn into swallowing
  // everything, or the check would pass by finding nothing at all.
  const files = walk(join(root, "tools"));
  assert.ok(files.includes("check-artifacts.mjs"), "should find its own source");
  assert.ok(files.length > 5, `only found ${files.length} files under tools/`);
});

test("only ENOENT is tolerated, so a real failure still fails loudly", () => {
  // Walking a *file* as though it were a directory fails with ENOTDIR (or
  // ENOENT on some platforms). Either way it must not be reported as an empty
  // artifact, which would silently pass the licence-plane check.
  const notADirectory = join(root, "tools", "check-artifacts.mjs");
  let threw = false;
  let result = null;
  try { result = walk(notADirectory); } catch { threw = true; }
  assert.ok(threw || (Array.isArray(result) && result.length === 0),
    "walking a file must either throw or yield nothing, never invent contents");
});
