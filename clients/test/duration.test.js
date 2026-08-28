// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The clients agree with the rest of the system about what a duration is.
 *
 * Track durations are **milliseconds** everywhere: `duration_ms` in the schema,
 * `* 1000` in every provider, and the engine adapter converts once at the CDEP
 * boundary because `cdep-1.schema.json` documents `load.duration` in seconds.
 *
 * The clients were the last place still reading seconds. Nothing threw — a
 * progress bar just moved a thousand times too slowly and every track showed as
 * "0:00", which is precisely the kind of failure that ships. The clients are
 * dependency-free inline HTML, so the functions are extracted and executed here
 * rather than reimplemented, which means this test fails if the real code drifts
 * instead of passing against a copy that agrees with it.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Pull one `function name(...) {...}` out of a client and make it callable. */
function extract(file, name) {
  const src = readFileSync(join(root, file), "utf8");
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start !== -1, `${file} no longer defines ${name}()`);

  let depth = 0;
  let end = -1;
  for (let i = src.indexOf("{", start); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) {
      end = i + 1;
      break;
    }
  }
  assert.ok(end !== -1, `could not find the end of ${name}() in ${file}`);
  return new Function(`${src.slice(start, end)}; return ${name};`)();
}

test("the patron app formats a four-minute track as four minutes", () => {
  const fmtDuration = extract("patron/index.html", "fmtDuration");
  assert.equal(fmtDuration(245_000), "4:05");
  assert.equal(fmtDuration(60_000), "1:00");
  assert.equal(fmtDuration(0), "");
  assert.equal(fmtDuration(null), "");
});

test("the DJ console formats the same way, and says so when it does not know", () => {
  const fmt = extract("dj/index.html", "fmt");
  assert.equal(fmt(245_000), "4:05");
  assert.equal(fmt(3_600_000), "60:00");
  assert.equal(fmt(null), "—");
});

test("no client still divides elapsed milliseconds by a thousand before a duration", () => {
  // The progress bars compute elapsed / duration. Both are milliseconds now, so a
  // stray `/ 1000` on either side is off by three orders of magnitude — a bar that
  // creeps across the screen over an hour instead of a song.
  for (const file of ["display/index.html", "dj/index.html"]) {
    const src = readFileSync(join(root, file), "utf8");
    assert.ok(
      !/Date\.now\(\)\s*-\s*startedAt\)\s*\/\s*1000/.test(src),
      `${file} still converts elapsed time to seconds before dividing by a duration`
    );
  }
});
