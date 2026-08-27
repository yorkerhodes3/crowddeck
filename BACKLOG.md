# BACKLOG.md

## 🔒 Blocked — awaiting `SPECIFICATION.md`

This document is intentionally empty. The backlog is derived from the specification, which is itself
gated on review of the concept research.

**Pipeline:** [`CONCEPT-IDEA.md`](CONCEPT-IDEA.md) ✅ → [`SPECIFICATION.md`](SPECIFICATION.md) 🔒 → `BACKLOG.md` 🔒

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

Based on the concept analysis, and subject to the specification:

| Epic | Rationale from the research |
|---|---|
| **Fusion core walking skeleton** | Domain C is the only part with no prior art. Prove the staging lane and the autonomous drain first — it is the highest-risk, highest-novelty piece, and everything else is integration. |
| **Fork and thin down Mixxx** | Establish the performance plane and, critically, the IPC boundary that the licence strategy depends on. |
| **Fork Karaoke Eternal into the crowd plane** | ISC-licensed, and already covers QR join, rooms and a fair queue — generalise it from singers to patrons. |
| **Content provider abstraction from Mopidy** | Apache-2.0 backend API, plus licence-class tagging so the policy engine can gate requests. |
| **Interconnect bus** | libremidi with UMP, leader-deck clock publishing to MIDI Clock and Ableton Link simultaneously. |
| **Venue policy + never-silent fallback** | The two P0s that determine whether a venue keeps the system switched on. |

## Deliberately deferred

Recorded here so they are not silently forgotten, and not re-litigated during planning:

- Licensed-streaming adapters (Beatport, TIDAL, SoundCloud) — interface only; each needs a commercial agreement
- DVS timecode — P2, and inherited free if Mixxx is forked
- Mackie Control / HUI emulation — P2
- Multi-tenant operator console — depends on blocking decision 4
- Video mixing and digital signage — P2
