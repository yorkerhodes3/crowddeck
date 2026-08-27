<!-- SPDX-License-Identifier: Apache-2.0 -->

# Contributing to CrowdDeck

## The one thing that is different here

CrowdDeck is **two licences in one repository**, split across a hard boundary:

| Directory | Licence |
|---|---|
| `engine/`, `spike/mixxx-src/` | **GPL-2.0-or-later** |
| everything else | **Apache-2.0** |

This is [ADR-001](DECISIONS.md) and it is not decorative. The rules below are enforced by CI, so you will
find out quickly — but knowing why saves time.

**Apache-2.0 code must never import, include, vendor or link GPL code.** It reaches the engine only over
CDEP, a documented protocol on a local socket. `node tools/licence-lint.mjs` checks every module-loading
form: `import … from`, bare side-effect `import`, dynamic `import()`, `require()` and `#include`.

**Every source file needs an SPDX header** matching its directory's plane:

```js
// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors
```

**New top-level directories must declare a plane** in `tools/licence-lint.mjs`. The lint fails closed: a
directory it does not recognise is an error, not something it quietly skips.

## Sign your commits

```
git commit -s
```

This adds a `Signed-off-by` line, certifying the [Developer Certificate of Origin](https://developercertificate.org/):
you wrote the contribution or have the right to submit it under the project's licence.

**Why it is required** (`REQ-LIC-9`): [ADR-006](DECISIONS.md) accepts a documented fallback of relicensing
the whole project to GPL if the licence boundary is ever judged unsound. That fallback is only exercisable if
every contribution arrived under inbound=outbound terms. Without a sign-off record we would have to trace and
re-ask every past contributor — which in practice means the fallback silently stops existing. A DCO is the
lightest way to keep it real, with no CLA paperwork.

CI checks this on every pull request.

## Before you open a pull request

```bash
npm run check        # licence lint + artifact separation + tests + CDEP conformance
npm run build:data   # regenerate requirements, backlog and dashboard data
```

Commit any regenerated files. CI fails if they are stale.

## Testing expectations

Two norms this project holds to, both learned the hard way:

**A guard that cannot fail is not a guard.** If you add a check, prove it fires — delete the thing it
protects and confirm the suite goes red. This has already caught a back-pressure test that only tested
coalescing, and a venue-scoping test written against two in-memory databases that could never have seen each
other's data anyway.

**Do not test your code against a copy of your own logic.** A QR encoder here passed its own round-trip test
while producing symbols no decoder could read, because the test mirrored the encoder's bug. Where an external
oracle exists — a real decoder, a published table, an independent implementation — use it.

## Releases

The two planes ship as **separate downloads** and must never be bundled into one installer, archive or
container image (`REQ-LIC-8`). `release.json` declares the layout and `npm run lint:artifacts` enforces it.

This is the concrete thing that keeps the project from ever distributing a combined work, and the realistic
way it gets lost is a well-meaning convenience build. If you think you need a bundle, raise it as an ADR
rather than a pull request.

## Where to start

- [`README.md`](README.md) — what this is and how the pieces fit
- [`SPECIFICATION.md`](SPECIFICATION.md) — 120 requirements; the source of truth
- [`BACKLOG.md`](BACKLOG.md) — generated; edit `docs/data/backlog.json` instead
- [`DECISIONS.md`](DECISIONS.md) — six ADRs; superseding one needs a new ADR, not an edit
