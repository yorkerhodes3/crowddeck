# CrowdDeck

**An open-source venue runtime that runs a professional DJ deck engine and a TouchTunes-style crowd request
jukebox on one scheduler, one library and one clock — wired together by MIDI.**

> ## 📊 [**View the project dashboard →**](https://yorkerhodes3.github.io/crowddeck/)
>
> The dashboard is the recommended way to read this project: an interactive capability matrix, a filterable
> open-source triage table, the proposed architecture, and browsable views of all 117 requirements and 59
> backlog stories.

---

## Status

| Phase | Artefact | State |
|---|---|---|
| **1 — Concept** | [`CONCEPT-IDEA.md`](CONCEPT-IDEA.md) | ✅ Complete |
| **1.5 — Decisions** | [`DECISIONS.md`](DECISIONS.md) | ✅ Ratified 2026-08-27 |
| **2 — Specification** | [`SPECIFICATION.md`](SPECIFICATION.md) | ✅ Complete — 117 requirements, 18 acceptance criteria |
| **3 — Backlog** | [`BACKLOG.md`](BACKLOG.md) | ✅ Complete — 11 epics, 59 stories, 117/117 traced |
| **4 — Build** | `protocol/` `core/` `api/` `interconnect/` `clients/` | 🚧 **In progress — M1–M3 + MIDI, 29/60 stories** |

### Try it

```bash
npm start
```

Open the **patron** page on a phone, the **DJ console** in the booth, and the **display** on a screen.
Search a licence-tagged demo catalogue, queue a song, watch your position in line update live, vote tracks
up — and in attended mode watch requests sit in the staging lane until the DJ cues them.

> **Nothing is audible yet.** The engine is the stub, so deck state is real but no sound is produced.
> Audio arrives with the Mixxx-derived engine (epic E7), and nothing above the engine adapter changes when
> it does — that is the point of having written the contract first.

### What is built

| Module | Licence | What it is |
|---|---|---|
| [`protocol/`](protocol) | Apache-2.0 | **CDEP** — the engine contract: NDJSON over a local socket, self-describing controls, published [JSON Schema](protocol/cdep-1.schema.json) |
| [`core/`](core) | Apache-2.0 | **The Unified Scheduler** — staging lane, priority ordering, fairness, policy, autonomous drain, gapless handoff, never-silent fallback. *This is the novelty.* |
| [`interconnect/`](interconnect) | Apache-2.0 | **MIDI** — identity-stable ports, soft-takeover, mappings targeting CDEP, 24 PPQN clock, and **live instruments as queueable sources** |
| [`api/`](api) | Apache-2.0 | The venue API — patron and staff surfaces over HTTP, live push over a hand-written WebSocket |
| [`clients/`](clients) | Apache-2.0 | Patron PWA, DJ console and venue display |
| [`engine-stub/`](engine-stub) | Apache-2.0 | A **conformant engine with no audio**. Unblocks everything above, and permanently proves the engine is replaceable (REQ-LIC-5) |
| [`conformance/`](conformance) | Apache-2.0 | The suite **any** engine must pass — 19 checks |
| [`tools/licence-lint.mjs`](tools/licence-lint.mjs) | Apache-2.0 | Enforces the ADR-001 licence boundary mechanically |
| [`engine/`](engine) | GPL-2.0-or-later | Deliberately **empty** until `SPIKE-1` — see [why](engine/README.md) |

**211 tests · 19 conformance checks · zero runtime dependencies.**

```bash
npm run check      # licence lint + tests + conformance
```

### The five ratified decisions

| ADR | Question | Decision |
|---|---|---|
| [001](DECISIONS.md#adr-001--licence-structure) | Licence structure | **Split** — Apache-2.0 core + GPL-2.0-or-later engine across a hard IPC boundary |
| [002](DECISIONS.md#adr-002--engine-fork-mixxx-or-build-new) | Engine | **Fork Mixxx** headless — but contract-first, stub second, fork third |
| [003](DECISIONS.md#adr-003--is-paid-priority-fast-pass-in-v1) | Paid priority | **Model yes, rails no** — ordering + ledger in v1, payments in v1.1 |
| [004](DECISIONS.md#adr-004--single-venue-appliance-or-multi-tenant-from-the-start) | Deployment | **Single-venue appliance**; multi-venue later as federation, not multi-tenancy |
| [005](DECISIONS.md#adr-005--native-qt-shell-or-thin-native-engine-plus-web-consoles) | Client architecture | **Thin native engine + web consoles** |

Two verified findings shaped these. Mixxx and Ableton Link are both GPL-2.0-**or-later**, which removes the
Apache/GPL-2.0 incompatibility that would have made the split licence fragile. And Mixxx's
`ControlObjectScript` bus already drives the whole engine from a scripting layer, so headless extraction is
largely adding a transport over a proven abstraction.

### What happens next

`SPIKE-1` — a ~6-week headless-Mixxx extraction spike, now with a **concrete contract and a passing
conformance suite to extract against**. `LEGAL-1`, review of the licence boundary, runs alongside it.

---

## The idea in one paragraph

Every DJ application surveyed — djay Pro AI, Serato DJ Pro, rekordbox 7, Traktor Pro 4, Mixxx — scores
effectively **zero** on crowd participation. Every jukebox platform — TouchTunes, AMI NEXTGEN, Rockbot,
Festify — scores effectively **zero** on performance capability. The two halves are near-perfect
complements, and no product spans them. Real venues are both on a schedule: an unattended jukebox by day, a
DJ room by night. CrowdDeck proposes one runtime for both, where **crowd requests land in the DJ's staging
lane rather than on the output** — so a human can approve and beatmatch them, or an autonomous mixer can
drain the same queue when nobody is in the booth.

## What the research found

- **Three projects are worth forking**, not rebuilding: **Mixxx** (GPL-2.0-or-later) for the performance
  engine, **Karaoke Eternal** (ISC) for the crowd/queue plane, and **Mopidy** (Apache-2.0) for content-source
  abstraction.
- **The existing open-source jukeboxes sit on a legal fault line** — Festify, Jukestar and the PartyPlay
  class all depend on a host's consumer Spotify account, which conveys no public-performance rights.
- **Licence choice is an architecture decision made once.** Mixxx is GPL-2.0-or-later, Ableton Link is
  GPL-or-commercial, JUCE 9 is AGPLv3-or-commercial, Essentia is AGPL-3.0. Get the process boundaries wrong
  at the start and the product is copyleft by accident.
- **MIDI 2.0 landed everywhere.** Windows 11 MIDI Services, macOS CoreMIDI and Linux ALSA all carry UMP
  natively, and MIDI-CI Property Exchange could make controllers largely self-describing — a lead available
  only to a project starting now.

Full analysis: [`CONCEPT-IDEA.md`](CONCEPT-IDEA.md).

## How this was researched

- **56 Tavily search-API queries** at advanced depth across DJ software, jukebox platforms and their business
  model, content-source licensing, MIDI/interconnection standards, and the open-source landscape.
- **80 repositories queried against the GitHub REST API** for stars, language, licence, last-push date and
  archive status.
- **Licence files read directly** wherever GitHub reported `NOASSERTION` — which is how JUCE 9 turned out to
  be AGPLv3-or-commercial and miniaudio turned out to be public-domain-or-MIT-0. Automated licence detection
  was wrong or unhelpful for twelve projects.

Raw findings are preserved in [`research/`](research/).

---

## Repository layout

```
CONCEPT-IDEA.md          Phase 1 research and analysis  ← start here
DECISIONS.md             Five ratified ADRs
SPECIFICATION.md         117 requirements, 18 acceptance criteria (source of truth)
BACKLOG.md               Generated — 11 epics, 59 stories

protocol/                Apache-2.0 — CDEP: the engine contract
  cdep-1.schema.json       Published wire-format schema
  src/                     messages, controls, framing, errors, client
  test/                    node --test
core/                    Apache-2.0 — the fusion core (the novelty)
  src/priority.js          ordering: votes + boosts + anti-starvation aging
  src/fairness.js          per-patron limits, cooldowns, rate limiting
  src/policy.js            explicit filter, allow/block, dayparting, licensing
  src/queue.js             lifecycle state machine with audit log
  src/scheduler.js         staging lane, modes, fallback
  src/engine-adapter.js    scheduler intents ⇄ CDEP
engine-stub/             Apache-2.0 — a conformant engine with no audio
  src/                     server, engine model, simulated sink
  bin/                     crowddeck-engine-stub
  test/                    integration, transport, back-pressure
conformance/             Apache-2.0 — the suite any engine must pass
engine/                  GPL-2.0-or-later — empty until SPIKE-1

docs/
  index.html             Interactive dashboard explainer (GitHub Pages root)
  assets/                styles.css, app.js — no external dependencies
  data/                  Structured data, reusable by later phases
tools/
  licence-lint.mjs          Enforces the ADR-001 plane boundary
  extract-requirements.mjs  SPECIFICATION.md  → docs/data/requirements.json
  build-backlog.mjs         backlog.json      → BACKLOG.md, validates traceability
  build-data.mjs            docs/data/*.json  → docs/data/bundle.js
research/                Raw Tavily findings and GitHub API output
```

### Generated files and the direction of truth

Two flows, deliberately in opposite directions:

- **`SPECIFICATION.md` → `requirements.json`.** The prose document is authoritative; the JSON is extracted
  from it, so the dashboard can never disagree with the spec.
- **`backlog.json` → `BACKLOG.md`.** The structured data is authoritative because the backlog is tabular;
  the markdown is rendered from it.

`build-backlog.mjs` **validates traceability** and exits non-zero if a story cites a requirement that does
not exist in the specification, or an unknown fork/adopt verdict. All three scripts run in CI, so a broken
reference fails the build rather than rotting quietly.

The dashboard is deliberately **dependency-free** — no CDN, no build step, no framework. It renders from the
JSON in `docs/data/`, so the same data can drive `SPECIFICATION.md` and `BACKLOG.md` tooling later.

## Running the dashboard locally

```bash
# any static server works
npx serve docs
# or
python -m http.server -d docs 8080
```

Then open <http://localhost:8080>. Opening `docs/index.html` directly from disk also works, because
`docs/data/bundle.js` carries the data past the browser's `file://` fetch restriction.

After editing `docs/data/*.json` or `SPECIFICATION.md`, regenerate:

```bash
node tools/extract-requirements.mjs   # SPECIFICATION.md -> requirements.json
node tools/build-backlog.mjs          # backlog.json -> BACKLOG.md (+ traceability check)
node tools/build-data.mjs             # *.json -> bundle.js
```

Each script validates its inputs and fails loudly, so together they act as a data linter.

---

## Licence

[Apache-2.0](LICENSE), covering the research, dashboard and scaffolding in this repository.

The *product* licence is settled in [`DECISIONS.md`](DECISIONS.md) ADR-001: a split model where the
Mixxx-derived performance plane is GPL-2.0-or-later and everything else stays Apache-2.0 across a hard IPC
boundary, mechanically enforced by a CI licence-lint gate. `LEGAL-1` in the backlog tracks the outstanding
legal review before any public distribution.

---

*Product names and trademarks belong to their respective owners. Capability scores are analyst judgements of
published feature depth. Licensing summaries are research notes, not legal advice.*
