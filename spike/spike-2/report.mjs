// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * SPIKE-2 report — turns probe CSV files into a backend recommendation.
 *
 * Usage:
 *   node spike/spike-2/report.mjs run1.csv run2.csv ...
 *   node spike/spike-2/report.mjs --json runs/*.csv
 */

import { readFileSync } from "node:fs";
import { parseProbeOutput, analyse, compare, formatResult } from "./analyse.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const files = args.filter((a) => !a.startsWith("--"));

if (files.length === 0) {
  console.error(
    "usage: node spike/spike-2/report.mjs [--json] <probe-output.csv> ...\n" +
      "\n" +
      "Produce probe output first:\n" +
      "  probe_miniaudio --api wasapi --frames 128 --seconds 60 --out wasapi-128.csv"
  );
  process.exit(2);
}

const results = files.map((f) => {
  const parsed = parseProbeOutput(readFileSync(f, "utf8"));
  return { file: f, ...analyse(parsed) };
});

const { ranked, recommendation } = compare(results);

if (json) {
  console.log(JSON.stringify({ results, recommendation }, null, 2));
  process.exit(0);
}

console.log("SPIKE-2 — audio backend measurement (REQ-NFR-1, REQ-NFR-2, §8.1)\n");
for (const r of results) {
  console.log(formatResult(r));
  console.log("");
}

console.log("Ranking (by xruns first, then jitter p99):");
ranked.forEach((s, i) => {
  console.log(
    `  ${i + 1}. ${s.result.backend}/${s.result.api} @ ${s.result.bufferFrames} — ` +
      `p99 jitter ${s.result.jitter.p99.toFixed(3)} ms, ${s.result.xruns} xrun(s) — ` +
      `${s.verdict.pass ? "PASS" : "FAIL"}`
  );
});

console.log(`\nRecommendation: ${recommendation}`);

// Only offer the "check the machine" hint when there were judgeable runs that all
// failed. If nothing was measurable, the machine is not the explanation.
if (ranked.length > 0 && !ranked.some((s) => s.verdict.pass)) {
  console.log(
    "\nNothing passed. Before concluding the backends are at fault, check that the\n" +
      "machine was otherwise idle and not on battery — power management alone can\n" +
      "produce this result on an otherwise capable laptop."
  );
}
