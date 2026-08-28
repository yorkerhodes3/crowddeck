// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Generated artefacts must be deterministic.
 *
 * ## Why this exists
 *
 * CI regenerates `docs/data/` and `BACKLOG.md` and fails if the result differs from
 * what was committed. That check is only meaningful if the generators are
 * deterministic — and one was not: `extract-requirements.mjs` stamped
 * `new Date()` into `requirements.json`.
 *
 * The consequence was not a one-off. The field changed at every UTC midnight, so
 * the build failed for anyone whose commit and CI run straddled 00:00, and would
 * have failed again the next day, and the next. It broke roughly seven hours after
 * being introduced. Nothing read the field.
 *
 * A staleness check that fires on the calendar rather than on the content trains
 * people to ignore it, which is worse than not having it.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));

/** Artefacts CI regenerates and compares. */
const GENERATED = [
  "docs/data/requirements.json",
  "docs/data/bundle.js",
  "BACKLOG.md"
];

const run = (script) =>
  execFileSync(process.execPath, [join(root, "tools", script)], {
    cwd: root,
    encoding: "utf8"
  });

test("regenerating produces byte-identical output — the check CI relies on", () => {
  const before = GENERATED.map((f) => readFileSync(join(root, f)));

  run("extract-requirements.mjs");
  run("build-backlog.mjs");
  run("build-data.mjs");

  GENERATED.forEach((f, i) => {
    const after = readFileSync(join(root, f));
    assert.ok(
      before[i].equals(after),
      `${f} changed when nothing in its source did. A generator that is not ` +
        `deterministic makes CI's "generated files are committed" check fail for ` +
        `reasons unrelated to the change being tested.`
    );
  });
});

test("no generator stamps the clock into its output", () => {
  // Targets the real failure precisely. Scanning the *output* for today's date was
  // the obvious approach and was wrong: `backlog.json` carries a legitimate, hand-
  // committed date that flows into the bundle, and flagging it would train people
  // to ignore this test.
  //
  // The property that actually matters is that a generator's result depends only on
  // committed source data, never on when it happened to run. So the check is on the
  // generators themselves: they must not read the clock at all. A generated artefact
  // that needs a date should take it from source data, as `backlog.generated` does.
  const generators = ["extract-requirements.mjs", "build-backlog.mjs", "build-data.mjs"];

  for (const g of generators) {
    const src = readFileSync(join(root, "tools", g), "utf8");
    // Strip comments so the explanation of this rule does not trip the rule.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

    for (const pattern of [/new Date\s*\(/, /Date\.now\s*\(/]) {
      assert.ok(
        !pattern.test(code),
        `tools/${g} reads the clock. Its output would then change on the calendar ` +
          `rather than on its input, breaking CI's "generated files are committed" ` +
          `check at every UTC midnight — which is exactly what happened. Take dates ` +
          `from committed source data instead.`
      );
    }
  }
});

test("the requirements extractor writes no timestamp field", () => {
  const reqs = JSON.parse(readFileSync(join(root, "docs/data/requirements.json"), "utf8"));
  assert.ok(
    !("generated" in reqs),
    'requirements.json must not carry a "generated" field — nothing read it, and ' +
      "it failed the build once a day"
  );
  // The useful provenance is which source it came from, which is stable.
  assert.equal(reqs.source, "SPECIFICATION.md");
});
