# BACKLOG.md

## 🔒 Blocked — awaiting `SPECIFICATION.md`

This document is intentionally empty. The backlog is derived from the specification, which is itself
gated on sign-off of the recommendations in [`DECISIONS.md`](DECISIONS.md).

**Pipeline:** [`CONCEPT-IDEA.md`](CONCEPT-IDEA.md) ✅ → [`DECISIONS.md`](DECISIONS.md) 🟡 → [`SPECIFICATION.md`](SPECIFICATION.md) → `BACKLOG.md` 🔒

---

## What this document will contain once unblocked

Sequenced, estimated work items derived from the specification, with fork-vs-build already settled per item
from [`docs/data/oss-inventory.json`](docs/data/oss-inventory.json).

Each item is expected to carry:

- The capability ID it satisfies (e.g. `C1`, `B6`, `D5`) from `docs/data/capabilities.json`
- Its verdict source — fork, adopt, reference or build-new — and the upstream project if any
- Acceptance criteria traced back to the specification
- Licence plane: which side of the IPC boundary it lands on

## Likely shape of the first epics

Sequencing reflects [ADR-002](DECISIONS.md#adr-002--engine-fork-mixxx-or-build-new) — **contract-first,
stub second, fork third** — so the highest-risk, zero-prior-art work is proven before the expensive fork
begins.

| # | Epic | Rationale from the research and decisions |
|---|---|---|
| 1 | **Engine IPC contract** | Written before any engine exists, modelled on Mixxx's `(group, item, value)` Control vocabulary. The contract must be designed by its consumer, not dictated by the fork. |
| 2 | **Stub engine** | A trivial gapless player implementing the contract. Proves the engine is genuinely replaceable — the property [ADR-001](DECISIONS.md#adr-001--licence-structure) depends on — and stays permanently as a CI fixture. |
| 3 | **Fusion core walking skeleton** | Domain C is the only part with no prior art. Prove the staging lane (C1) and autonomous drain (C2) against the stub, before committing to fork surgery. |
| 4 | **Fork and thin down Mixxx** | Extract the headless engine behind the now-proven contract. Delete `skin`, `widget`, `qml`, `dialog`, `preferences`, `rendergraph`, `shaders` aggressively. |
| 5 | **Fork Karaoke Eternal into the crowd plane** | ISC-licensed; already covers QR join, rooms and a fair queue — generalise from singers to patrons with priority. |
| 6 | **Content provider abstraction from Mopidy** | Apache-2.0 backend API, plus licence-class tagging so the policy engine can gate requests. |
| 7 | **Interconnect bus** | libremidi with UMP; leader-deck clock publishing to MIDI Clock and Ableton Link simultaneously. |
| 8 | **Venue policy + never-silent fallback** | The two P0s that determine whether a venue keeps the system switched on. |

Epic 0, if the spike in `SPECIFICATION.md` has not already run: the **~6-week headless-Mixxx spike**,
whose output is epic 1.

## Deliberately deferred

Recorded here so they are not silently forgotten, and not re-litigated during planning:

- Licensed-streaming adapters (Beatport, TIDAL, SoundCloud) — interface only; each needs a commercial agreement
- **Payment provider integration** — v1.1, behind an adapter. The priority *model* and credit ledger ship in v1 ([ADR-003](DECISIONS.md#adr-003--is-paid-priority-fast-pass-in-v1))
- **Operator console / multi-venue** — later, and as *federation over appliances*, not shared-database multi-tenancy ([ADR-004](DECISIONS.md#adr-004--single-venue-appliance-or-multi-tenant-from-the-start))
- DVS timecode — P2, and inherited free from the Mixxx fork
- Mackie Control / HUI emulation — P2
- Video mixing and digital signage — P2
- Polished mouse-only scratching — accepted as mediocre in v1 ([ADR-005](DECISIONS.md#adr-005--native-qt-shell-or-thin-native-engine-plus-web-consoles)); the target user has hardware
