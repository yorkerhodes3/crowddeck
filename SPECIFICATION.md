# SPECIFICATION.md

## 🔒 Blocked — awaiting review of `CONCEPT-IDEA.md`

This document is intentionally empty. Per the project workflow, the specification is written **after**
the concept research has been reviewed and its open questions answered.

👉 Review [`CONCEPT-IDEA.md`](CONCEPT-IDEA.md) first, or read the
[dashboard](https://yorkerhodes3.github.io/crowddeck/).

---

## Blocking decisions

`CONCEPT-IDEA.md` §11 raises five questions that must be answered before this document can be written.
Each one changes the shape of the specification materially:

| # | Decision | Why it blocks the spec |
|---|---|---|
| 1 | **Licence structure** — split Apache-2.0 / GPL-2.0-or-later, or single GPL? | Determines every process and module boundary in the system. Nearly impossible to unwind later. |
| 2 | **Engine** — fork Mixxx, or build against permissive libraries only? | Decides whether the performance plane is inherited or written, which changes the schedule by years. |
| 3 | **Monetisation** — is paid priority (Fast Pass) in v1, or is v1 vote-only? | Adds a payment provider, a wallet ledger and a refund path to the data model. |
| 4 | **Deployment shape** — single-venue appliance, or multi-tenant from the start? | Multi-tenancy is not retrofittable into an auth and data model cheaply. |
| 5 | **Client architecture** — native desktop shell (Qt), or thin native engine + web consoles? | Determines the IPC contract and how much of the UI is shared. |

## What this document will contain once unblocked

- Locked licence structure and the plane/process boundary it implies
- The IPC contract between the performance plane and the fusion core
- The Unified Scheduler model: staging lane, fair-queue rules, and how paid priority and votes blend into
  one ordering
- Data model: track, licence class, venue, venue licensing profile, patron, request, credit ledger, play log
- The public HTTP + WebSocket API surface, and the OpenSubsonic compatibility subset
- The controller mapping format, and the MIDI 2.0 / UMP capability model
- Testable acceptance criteria for each P0 capability in `docs/data/capabilities.json`
- Non-functional requirements, especially the latency budget per plane

## Inputs already prepared

The structured research data is ready to be converted into requirements without re-doing the analysis:

| File | Use in the specification |
|---|---|
| [`docs/data/capabilities.json`](docs/data/capabilities.json) | 62 capabilities across 8 domains, each with a proposed priority and its originating product — the raw material for requirements. |
| [`docs/data/oss-inventory.json`](docs/data/oss-inventory.json) | 41 projects with verdicts and verified licences — fork-vs-build is already settled per component. |
| [`docs/data/sources.json`](docs/data/sources.json) | Content sources with their public-performance status, and interconnect protocols with platform support. |
| [`docs/data/competitors.json`](docs/data/competitors.json) | Capability baselines to specify against. |
