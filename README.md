# CrowdDeck

**An open-source venue runtime that runs a professional DJ deck engine and a TouchTunes-style crowd request
jukebox on one scheduler, one library and one clock — wired together by MIDI.**

> ## 📊 [**View the concept dashboard →**](https://yorkerhodes3.github.io/crowddeck/)
>
> The dashboard is the recommended way to read this research: an interactive capability matrix, a filterable
> open-source triage table, and the proposed architecture.

---

## Status

| Phase | Artefact | State |
|---|---|---|
| **1 — Concept** | [`CONCEPT-IDEA.md`](CONCEPT-IDEA.md) | ✅ **Complete** |
| **1.5 — Decisions** | [`DECISIONS.md`](DECISIONS.md) | 🟡 **Recommendations proposed — awaiting sign-off** |
| 2 — Specification | [`SPECIFICATION.md`](SPECIFICATION.md) | ⏳ Ready to draft once decisions are ratified |
| 3 — Backlog | [`BACKLOG.md`](BACKLOG.md) | 🔒 Blocked on Phase 2 |

**Nothing is built yet.** This repository is a research artefact supporting a build decision, plus the
dashboard that explains it.

### The five decisions on the table

| ADR | Question | Recommendation |
|---|---|---|
| [001](DECISIONS.md#adr-001--licence-structure) | Licence structure | **Split** — Apache-2.0 core + GPL-2.0-or-later engine across a hard IPC boundary |
| [002](DECISIONS.md#adr-002--engine-fork-mixxx-or-build-new) | Engine | **Fork Mixxx** headless — but contract-first, stub second, fork third |
| [003](DECISIONS.md#adr-003--is-paid-priority-fast-pass-in-v1) | Paid priority | **Model yes, rails no** — ordering + ledger in v1, payments in v1.1 |
| [004](DECISIONS.md#adr-004--single-venue-appliance-or-multi-tenant-from-the-start) | Deployment | **Single-venue appliance**; multi-venue later as federation, not multi-tenancy |
| [005](DECISIONS.md#adr-005--native-qt-shell-or-thin-native-engine-plus-web-consoles) | Client architecture | **Thin native engine + web consoles** |

Rationale, confidence levels and what would change each recommendation: [`DECISIONS.md`](DECISIONS.md).

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
DECISIONS.md             Five ADRs unblocking Phase 2 — proposed, awaiting sign-off
SPECIFICATION.md         Phase 2 — ready to draft once decisions are ratified
BACKLOG.md               Phase 3 — gated stub
docs/
  index.html             Interactive dashboard explainer (GitHub Pages root)
  assets/                styles.css, app.js — no external dependencies
  data/                  Structured research data, reusable by later phases
    competitors.json       11 products x 7 capability axes
    capabilities.json      8 domains, 62 capabilities, each traced to its source
    oss-inventory.json     41 projects triaged FORK / ADOPT / REFERENCE / AVOID
    sources.json           Content sources + interconnect protocols
    bundle.js              Generated — lets the dashboard work over file:// too
tools/
  build-data.mjs         Regenerates docs/data/bundle.js from the JSON
research/                Raw Tavily findings and GitHub API output
```

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

After editing anything in `docs/data/*.json`, regenerate the bundle:

```bash
node tools/build-data.mjs
```

The script validates every JSON file and fails loudly on a syntax error, so it doubles as a data linter.

---

## Licence

[Apache-2.0](LICENSE), covering the research, dashboard and scaffolding in this repository.

The licence structure for the *product* is addressed in [`DECISIONS.md`](DECISIONS.md) ADR-001 — the
recommendation is a split model where a Mixxx-derived performance plane is GPL-2.0-or-later and everything
else stays Apache-2.0 across a hard IPC boundary. It is proposed, not ratified.

---

*Product names and trademarks belong to their respective owners. Capability scores are analyst judgements of
published feature depth. Licensing summaries are research notes, not legal advice.*
