# CrowdDeck

**An open-source venue runtime that runs a professional DJ deck engine and a TouchTunes-style crowd request
jukebox on one scheduler, one library and one clock — wired together by MIDI.**

> ## 📊 [**View the project dashboard →**](https://yorkerhodes3.github.io/crowddeck/)
>
> The dashboard is the recommended way to read this project: an interactive capability matrix, a filterable
> open-source triage table, the proposed architecture, and browsable views of all 123 requirements and 70
> backlog stories.

---

## Status

| Phase | Artefact | State |
|---|---|---|
| **1 — Concept** | [`CONCEPT-IDEA.md`](CONCEPT-IDEA.md) | ✅ Complete |
| **1.5 — Decisions** | [`DECISIONS.md`](DECISIONS.md) | ✅ Ratified 2026-08-27 |
| **2 — Specification** | [`SPECIFICATION.md`](SPECIFICATION.md) | ✅ Complete — 123 requirements, 18 acceptance criteria |
| **3 — Backlog** | [`BACKLOG.md`](BACKLOG.md) | ✅ Complete — 12 epics, 74 stories, 123/123 traced |
| **4 — Build** | `protocol/` `core/` `data/` `api/` `interconnect/` `clients/` | 🚧 **In progress — M1–M3 + MIDI + persistence + content, 59/74 stories** |

### Try it

```bash
npm start
```

Open the **patron** page on a phone, the **DJ console** in the booth, and the **display** on a screen.
Search a licence-tagged demo catalogue, queue a song, watch your position in line update live, vote tracks
up — and in attended mode watch requests sit in the staging lane until the DJ cues them.

> **Audio works — in the browser.** Open [`/deck/index.html`](clients/deck) for two real decks with
> waveforms, hot cues, beat loops, three-band EQ, crossfader, pitch and sync. The
> [`engine-web/`](engine-web) Web Audio engine speaks the same CDEP contract as the stub, so nothing above
> the engine adapter changes between them — that is the point of having written the contract first, and it
> is now demonstrated rather than claimed.
>
> The **venue** clients (patron / DJ console / display) still run on the stub engine, so deck state there is
> real but no sound is produced. Wiring them to a real engine is `DJX-2`.

### What is built

| Module | Licence | What it is |
|---|---|---|
| [`protocol/`](protocol) | Apache-2.0 | **CDEP** — the engine contract: NDJSON over a local socket, self-describing controls, published [JSON Schema](protocol/cdep-1.schema.json) |
| [`core/`](core) | Apache-2.0 | **The Unified Scheduler** — staging lane, priority ordering, fairness with **patron rotation**, policy, autonomous drain, gapless handoff, never-silent fallback. *This is the novelty.* |
| [`interconnect/`](interconnect) | Apache-2.0 | **MIDI** — identity-stable ports, soft-takeover, mappings targeting CDEP, 24 PPQN clock, **MIDI-CI auto-mapping** so a device can describe itself, and **live instruments as queueable sources** |
| [`providers/`](providers) | Apache-2.0 | Where music comes from — one interface, a router that **isolates a dead source**, an **OpenSubsonic client** where the operator declares the licence, a **Creative Commons classifier** that refuses to guess, and a CI guard that no consumer-streaming or downloader adapter can enter |
| [`data/`](data) | Apache-2.0 | **Persistence** — venue-scoped schema, append-only credit ledger, licence-class store, play log with CSV export, durable queue |
| [`api/`](api) | Apache-2.0 | The venue API — patron and staff surfaces over HTTP, live push over a hand-written WebSocket, and an **OpenSubsonic surface** so existing clients drive the jukebox |
| [`clients/`](clients) | Apache-2.0 | Patron PWA, DJ console and venue display — including a from-scratch **QR encoder** verified against a real decoder |
| [`engine-web/`](engine-web) | Apache-2.0 | **The browser audio engine** — two decks, EQ, crossfader, waveform and BPM. Real sound, no native toolchain, and no GPL anywhere near it |
| [`engine-stub/`](engine-stub) | Apache-2.0 | A **conformant engine with no audio**. Unblocks everything above, and permanently proves the engine is replaceable (REQ-LIC-5) |
| [`conformance/`](conformance) | Apache-2.0 | The suite **any** engine must pass — 20 checks |
| [`tools/licence-lint.mjs`](tools/licence-lint.mjs) | Apache-2.0 | Enforces the ADR-001 licence boundary mechanically |
| [`engine/`](engine) | GPL-2.0-or-later | Deliberately **empty** until `SPIKE-1` — see [why](engine/README.md) |

**724 tests · 20 conformance checks · zero runtime dependencies.**

> **One dependency footnote, stated rather than buried.** [`data/`](data) uses Node's built-in
> `node:sqlite`, so there is still nothing to install — but that module is marked **experimental** by Node
> and needs **Node 22.5+** (declared in `engines`, and checked by a test so it cannot drift). It prints an
> `ExperimentalWarning` on first use, which is left visible on purpose. If the API moves, the blast radius is
> [`data/src/db.js`](data/src/db.js); everything else talks to `VenueDatabase`, not to SQLite.

### The definition of done, as an executable test

[`SPECIFICATION.md`](SPECIFICATION.md) §0.4 states in prose what "v1 works" means. That paragraph now runs
as a test — [`core/test/day-in-the-life.test.js`](core/test/day-in-the-life.test.js):

> A venue opens unattended at 11:00 and the fallback rotation carries the room. Patrons join, search a
> policy-scoped catalogue, queue music and vote. The fair-queue rules refuse a patron's third request and
> explain why. The room never falls silent through the afternoon. At 21:00 a DJ takes over **with no
> interruption to what is playing**; requests now wait in the staging lane, and the scheduler itself is
> refused permission to promote. The DJ works a MIDI controller where **soft-takeover** stops the volume
> jumping, cues a patron request, and runs a MIDI clock so a live instrument locks to the deck — and that
> instrument hands the room back when the performer stops early. At close the venue exports exactly what
> was performed. **Nothing touched the internet all day.**

Every other test checks one component. That one checks they compose.

```bash
npm run check      # licence lint + artifact separation + content sources + tests + conformance
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

`SPIKE-1` is **partially complete**. Its source-analysis half is done and written up in
[`spike/SPIKE-1-REPORT.md`](spike/SPIKE-1-REPORT.md): the enumerable-control-bus assumption that
[ADR-002](DECISIONS.md#adr-002--engine-fork-mixxx-or-build-new) rests on is **verified against real Mixxx
source**, `EngineMixer` is confirmed to be GUI-free, and §2.10 was validated — which turned up two errors and
produced a real amendment to CDEP (parameter space, `REQ-CDEP-12a`).

Its **build-and-measure half is not done**, and cannot be done here: it needs Qt6, CMake, MSVC and real audio
and MIDI hardware. So the §8.1 latency budgets remain **unvalidated assumptions** and are now the single
largest technical risk in the plan.

### What is blocked, and on what exactly

Two items are blocked. Neither blocks the remaining stories, which are pure JavaScript.

| Item | Blocked on | Not blocked on |
|---|---|---|
| **`SPIKE-2`** | **Latency** on other platforms: an ASIO interface, a Mac, real Linux with a sound card. Hardware, unavoidably. | **WASAPI is measured** (p99 **3.667 ms** vs a 10 ms budget), and the probe is **verified to compile and run on Linux and macOS in CI** — so only the timing is outstanding, not correctness. See [`FINDINGS.md`](spike/spike-2/FINDINGS.md). |
| **`ENG-*`** | MSVC, CMake, Ninja, Qt6 and vcpkg for Mixxx's dependency tree — several GB, multi-hour first build. Plus a **USB-MIDI controller** for `AC-12`. | Design. `SPIKE-1` already resolved how `describe`, coalescing and parameter space will be implemented. |

`LEGAL-1` is **closed** — see [ADR-006](DECISIONS.md#adr-006--distribution-shape-and-the-licence-risk-position).
The owner chose two separate downloads, US/EU, single-GPL as an accepted fallback, and no counsel. Because
the project therefore never distributes a combined work, and because we hold copyright on the whole
Apache-2.0 layer and can relicense it at will, keeping the split costs nothing while abandoning it is a
one-way door. `REQ-LIC-8` and `REQ-LIC-9` make that durable. **No legal review was obtained and none is
planned** — this is knowing risk acceptance, not a clearance.

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
SPECIFICATION.md         123 requirements, 18 acceptance criteria (source of truth)
BACKLOG.md               Generated — 12 epics, 70 stories

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
  src/engine-link.js       reconnect + resync so a core crash cannot stop audio
  src/loudness.js          EBU R128 gain with a true-peak guard, so it cannot clip
data/                    Apache-2.0 — persistence (node:sqlite, still zero deps)
  src/schema.js            migrations; venue_id on every venue-scoped table
  src/db.js                connection, migration runner, single-venue binding
  src/ledger.js            append-only credits, derived balance, atomic spend
  src/tracks.js            licence class per track, mandatory and un-defaulted
  src/playlog.js           performance log + RFC 4180 CSV, no transport at all
  src/queue-store.js       durable queue: state, voter identities, audit trail
engine-stub/             Apache-2.0 — a conformant engine with no audio
  src/                     server, engine model, simulated sink
  bin/                     crowddeck-engine-stub
  test/                    integration, transport, back-pressure
conformance/             Apache-2.0 — the suite any engine must pass
api/                     Apache-2.0 — venue API + hand-written RFC 6455 WebSocket
clients/                 Apache-2.0 — patron PWA, venue display, DJ console
interconnect/            Apache-2.0 — MIDI ports, mappings, clock, live instruments
engine/                  GPL-2.0-or-later — empty until SPIKE-1
spike/                   SPIKE-1 findings + the Mixxx source extracts they cite
  SPIKE-1-REPORT.md        What was verified, what was corrected, what is still owed
  mixxx-src/               Unmodified upstream GPL source, kept as evidence — see PROVENANCE.md

docs/
  index.html             Interactive dashboard explainer (GitHub Pages root)
  assets/                styles.css, app.js — no external dependencies
  data/                  Structured data, reusable by later phases
tools/
  licence-lint.mjs          Enforces the ADR-001 plane boundary — fails closed
  extract-requirements.mjs  SPECIFICATION.md  → docs/data/requirements.json
  build-backlog.mjs         backlog.json      → BACKLOG.md, validates traceability
  build-data.mjs            docs/data/*.json  → docs/data/bundle.js
  test/                     Tests that each licence rule actually fires
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
