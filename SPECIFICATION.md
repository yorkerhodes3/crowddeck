# SPECIFICATION.md

## 🟡 Ready to draft — pending sign-off on `DECISIONS.md`

The five questions that blocked this document now have **recommendations** in
[`DECISIONS.md`](DECISIONS.md). They are proposed, not ratified. Once signed off (or amended), this
specification can be written against them.

**Pipeline:** [`CONCEPT-IDEA.md`](CONCEPT-IDEA.md) ✅ → [`DECISIONS.md`](DECISIONS.md) 🟡 → `SPECIFICATION.md` → [`BACKLOG.md`](BACKLOG.md)

---

## Recommendations awaiting sign-off

| ADR | Question | Recommendation | Confidence |
|---|---|---|---|
| [001](DECISIONS.md#adr-001--licence-structure) | Licence structure | **Split** — Apache-2.0 core + GPL-2.0-or-later engine across a hard IPC boundary | High |
| [002](DECISIONS.md#adr-002--engine-fork-mixxx-or-build-new) | Engine | **Fork Mixxx** headless via its existing Control bus — contract-first, stub second, fork third | High |
| [003](DECISIONS.md#adr-003--is-paid-priority-fast-pass-in-v1) | Paid priority | **Model yes, rails no** — ordering + ledger in v1, payment providers in v1.1 | High |
| [004](DECISIONS.md#adr-004--single-venue-appliance-or-multi-tenant-from-the-start) | Deployment | **Single-venue appliance**, `venue_id` everywhere, multi-venue as federation | High |
| [005](DECISIONS.md#adr-005--native-qt-shell-or-thin-native-engine-plus-web-consoles) | Client architecture | **Thin native engine + web consoles** | Medium-High |

**Decide ADR-001 first** — it is the keystone. Rejecting the split licence changes ADR-002 and reopens
ADR-005.

## What this document will contain

Structure below reflects the recommended decisions. If an ADR is amended, the affected sections change
accordingly.

### 1. Licence and boundary rules — *from ADR-001*
- Plane assignment: `engine/` GPL-2.0-or-later, everything else Apache-2.0
- SPDX header policy and the CI licence-lint gate that enforces it
- The hard requirements that keep the boundary defensible: standalone executable, documented
  general-purpose protocol, no GPL headers reachable from Apache-2.0 code, engine replaceable

### 2. The engine IPC contract — *from ADR-002, written first*
- Control vocabulary modelled on Mixxx's `(group, item, value)` addressing
- Runtime enumeration of the control set, so the protocol is self-describing
- Transport, framing, versioning, change notification and back-pressure
- Conformance suite that both the stub engine and the Mixxx-derived engine must pass

### 3. Unified Scheduler — *the novelty, Domain C*
- Staging lane semantics, and how DJ-attended and autonomous modes consume one queue
- The **priority ordering function**: votes and priority boosts as two inputs (ADR-003)
- Fair-queue rules: per-patron limits, artist/track cooldown, rate limiting
- Gapless mode handoff, and never-silent fallback

### 4. Data model — *shaped by ADR-003 and ADR-004*
- `venue_id` on every venue-scoped entity from day one
- Track, licence class, venue licensing profile, patron, request, queue entry with priority
- Append-only credit ledger (no paid top-up path in v1)
- Play log for PRO reporting export

### 5. Public API — *from ADR-005*
- HTTP + WebSocket surface, namespaced `/v1/venues/{id}/...` from the start
- OpenSubsonic compatibility subset
- The API is the *only* path for all three consoles — no privileged back door

### 6. Interconnect — *Domain D*
- MIDI 1.0 + 2.0/UMP capability model, stable port identity, hot-plug
- Controller mapping format, and MIDI-CI Property Exchange for self-describing controllers
- Leader-deck clock publishing to MIDI Clock and Ableton Link simultaneously

### 7. Acceptance criteria and non-functional requirements
- Testable criteria for each P0 in `docs/data/capabilities.json`
- Latency budget per plane: sub-10 ms deterministic engine, hundreds of ms for the crowd plane
- Offline-first behaviour (G1) and no-telemetry guarantees (G6)

## Inputs already prepared

The structured research data is ready to be converted into requirements without re-doing the analysis:

| File | Use in the specification |
|---|---|
| [`docs/data/capabilities.json`](docs/data/capabilities.json) | 62 capabilities across 8 domains, each with a proposed priority and its originating product — the raw material for requirements. |
| [`docs/data/oss-inventory.json`](docs/data/oss-inventory.json) | 41 projects with verdicts and verified licences — fork-vs-build is already settled per component. |
| [`docs/data/sources.json`](docs/data/sources.json) | Content sources with their public-performance status, and interconnect protocols with platform support. |
| [`docs/data/competitors.json`](docs/data/competitors.json) | Capability baselines to specify against. |

## Recommended before ratifying

A **~6-week headless-Mixxx spike** (see [ADR-002](DECISIONS.md#adr-002--engine-fork-mixxx-or-build-new)).
It tests the assumption the whole plan rests on — that the engine can be extracted behind a socket
protocol at acceptable cost — and its output *is* the engine IPC contract in §2 above. Everything else
here can be committed to on paper; that one should be measured.
