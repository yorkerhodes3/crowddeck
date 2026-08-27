// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

// Generates BACKLOG.md from docs/data/backlog.json and validates traceability:
// every REQ-* cited by a story must exist in docs/data/requirements.json, and
// every verdict must be a known verdict from docs/data/oss-inventory.json.
// Broken traceability fails the build.
//
//   node tools/build-backlog.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "docs", "data");

const backlog = JSON.parse(readFileSync(join(dataDir, "backlog.json"), "utf8"));
const reqData = JSON.parse(readFileSync(join(dataDir, "requirements.json"), "utf8"));
const ossData = JSON.parse(readFileSync(join(dataDir, "oss-inventory.json"), "utf8"));

const knownReqs = new Set(reqData.requirements.map((r) => r.id));
const knownVerdicts = new Set(Object.keys(ossData.verdicts));
const knownMilestones = new Set(backlog.milestones.map((m) => m.id));

const errors = [];
const seenStoryIds = new Set();
let storyCount = 0;
const citedReqs = new Set();

for (const epic of backlog.epics) {
  if (!knownMilestones.has(epic.milestone)) {
    errors.push(`${epic.id}: unknown milestone "${epic.milestone}"`);
  }
  for (const s of epic.stories) {
    storyCount++;
    if (seenStoryIds.has(s.id)) errors.push(`Duplicate story id "${s.id}"`);
    seenStoryIds.add(s.id);

    if (!backlog.sizes[s.size]) errors.push(`${s.id}: unknown size "${s.size}"`);
    if (s.status !== undefined && !["done", "partial", "todo"].includes(s.status)) {
      errors.push(`${s.id}: unknown status "${s.status}"`);
    }
    if (s.verdict !== null && !knownVerdicts.has(s.verdict)) {
      errors.push(`${s.id}: unknown OSS verdict "${s.verdict}"`);
    }
    for (const r of s.reqs) {
      citedReqs.add(r);
      if (!knownReqs.has(r)) {
        errors.push(`${s.id}: cites "${r}", which does not exist in SPECIFICATION.md`);
      }
    }
  }
}

if (errors.length) {
  console.error("Traceability check FAILED:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}

const uncited = [...knownReqs].filter((r) => !citedReqs.has(r));
const doneCount = backlog.epics.reduce(
  (a, e) => a + e.stories.filter((s) => s.status === "done").length,
  0
);
// Counted separately and never folded into `done`. A story that is half-finished
// is not finished, and reporting it as such is how plans start lying.
const partialCount = backlog.epics.reduce(
  (a, e) => a + e.stories.filter((s) => s.status === "partial").length,
  0
);

// ---------------------------------------------------------------- render
const L = [];
const p = (s = "") => L.push(s);

p("# BACKLOG.md — CrowdDeck v1");
p();
p("> **Generated file.** Edit `docs/data/backlog.json` and run `node tools/build-backlog.mjs`.");
p("> Traceability is validated at build time: every `REQ-*` cited below exists in");
p("> [`SPECIFICATION.md`](SPECIFICATION.md), and every fork/adopt verdict matches the OSS triage.");
p();
p("**Status:** 🚧 In progress — " + doneCount + " of " + storyCount + " stories complete" +
  (partialCount ? ` · ${partialCount} partial (◐)` : "") +
  " · **Date:** " + backlog.generated);
p("**Upstream:** [`CONCEPT-IDEA.md`](CONCEPT-IDEA.md) → [`DECISIONS.md`](DECISIONS.md) → [`SPECIFICATION.md`](SPECIFICATION.md) → **this document**");
p();
p(`**${backlog.epics.length} epics · ${storyCount} stories · ${citedReqs.size} of ${knownReqs.size} requirements covered**`);
p();
p("Sizes are t-shirt estimates for a small team, not commitments: " +
  Object.entries(backlog.sizes).map(([k, v]) => `**${k}** ${v}`).join(" · ") + ".");
p();
p("---");
p();

p("## Sequencing");
p();
p("Ordering follows [ADR-002](DECISIONS.md#adr-002--engine-fork-mixxx-or-build-new) — **contract-first,");
p("stub second, fork third** — so the zero-prior-art fusion layer is proven before the expensive fork");
p("begins, and the IPC contract is shaped by its consumer rather than dictated by the fork.");
p();
p("| Milestone | Goal |");
p("|---|---|");
for (const m of backlog.milestones) p(`| **${m.id} — ${m.name}** | ${m.goal} |`);
p();

for (const m of backlog.milestones) {
  const epics = backlog.epics.filter((e) => e.milestone === m.id);
  if (!epics.length) continue;
  p("---");
  p();
  p(`## ${m.id} — ${m.name}`);
  p();
  p(`*${m.goal}*`);
  p();
  for (const epic of epics) {
    p(`### ${epic.id} · ${epic.name}`);
    p();
    p(epic.why);
    p();
    p("| ID | Story | Size | Source | Requirements |");
    p("|---|---|---|---|---|");
    for (const s of epic.stories) {
      const verdict = s.verdict ? `\`${s.verdict}\`` : "build";
      const reqs = s.reqs.length ? s.reqs.map((r) => `\`${r}\``).join(" ") : "—";
      const mark = s.status === "done" ? "✅ " : s.status === "partial" ? "◐ " : "";
      p(`| ${mark}**${s.id}** | **${s.name}**<br>${s.detail} | ${s.size} | ${verdict} | ${reqs} |`);
    }
    p();
  }
}

p("---");
p();
p("## Deferred");
p();
p("Recorded so they are not silently forgotten, and not re-litigated during planning.");
p();
p("| Item | When | Why |");
p("|---|---|---|");
for (const d of backlog.deferred) p(`| ${d.item} | ${d.when} | ${d.why} |`);
p();

if (uncited.length) {
  p("---");
  p();
  p("## Requirements not yet covered by a story");
  p();
  p(`${uncited.length} of ${knownReqs.size} requirements are not directly cited by any story. These are`);
  p("generally satisfied implicitly by the stories that implement their section, but they are listed here");
  p("so the gap is visible rather than assumed.");
  p();
  p(uncited.map((r) => `\`${r}\``).join(" · "));
  p();
}

writeFileSync(join(root, "BACKLOG.md"), L.join("\n"), "utf8");

console.log(
  `Traceability OK — ${backlog.epics.length} epics, ${storyCount} stories, ` +
    `${citedReqs.size}/${knownReqs.size} requirements cited (${uncited.length} uncited).\n` +
    `Wrote BACKLOG.md`
);
