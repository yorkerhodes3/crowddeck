# DECISIONS.md — Phase 2 unblocking decisions

**Status:** ✅ **Accepted — ratified 2026-08-27.** All five recommendations approved as written.
**Date proposed:** 2026-08-27 · **Date ratified:** 2026-08-27
**Context:** [`CONCEPT-IDEA.md`](CONCEPT-IDEA.md) §11 raised five questions blocking `SPECIFICATION.md`.
**Consequence:** [`SPECIFICATION.md`](SPECIFICATION.md) is written against this ratified set.

Each decision below states the ratified position, a confidence level, the reasoning, **what would change
it**, and the consequences that flow into the specification. Superseding any of these requires a new ADR
rather than an edit in place.

> ⚠️ **Not legal advice, and no legal review has been obtained.** ADR-001 describes a widely-practised
> interpretation of the GPL that is not universally settled.
>
> **[ADR-006](#adr-006--distribution-shape-and-the-licence-risk-position) records the project owner's
> decision to proceed without counsel**, on two separate downloads, in the US and EU, with single-GPL
> accepted as the fallback. That is a knowing acceptance of risk with a cheap remedy — it is *not* the same
> as the risk having been cleared, and nothing here should be read as saying the boundary has been blessed.
> [`legal/REVIEW-PACK.md`](legal/REVIEW-PACK.md) stays ready with seven precise questions should counsel
> ever be engaged.

---

## Decision map — these interlock

The five questions are not independent. Two of them cascade:

```
ADR-001 (licence split)  ──requires──▶  a real IPC boundary
                          │
                          └──enables──▶  ADR-002 (fork Mixxx safely)
                                          │
ADR-005 (web consoles)  ◀──reinforces────┘   keeps Qt out of the permissive core

ADR-003 (priority model, no payment rails) ──┐
                                              ├──▶ both are "build the model, defer the mechanism"
ADR-004 (venue_id now, federation later)   ──┘
```

**ADR-001 is the keystone.** If the split licence is rejected in favour of a single GPL product, then
ADR-002 gets easier (fork the whole app), ADR-005 becomes an open question again (Qt is fine in a GPL
product), and the venue layer stops being reusable — which removes most of the project's strategic value.
Decide 001 first.

ADR-003 and ADR-004 share one principle worth naming: **commit to the data model, defer the machinery.**
Both put the expensive-to-retrofit structure in v1 while leaving the expensive-to-operate parts out.

---

## ADR-001 — Licence structure

### ✅ Ratified: **Split.** Apache-2.0 core, GPL-2.0-or-later engine plane, separated by IPC.

**Confidence: High.**

A new fact found while checking this changes the picture. Both load-bearing copyleft dependencies are
**"or later"**, not v2-only:

> *"either version 2 of the License, or (at your option) any later version"*
> — verified in the LICENSE files of both **Mixxx** and **Ableton Link**

That matters because Apache-2.0 is incompatible with GPL-**2.0-only** (the patent-termination and
indemnification clauses) but *is* compatible with GPL-3.0. Since both projects are "or later", anyone
distributing a combined work can elect v3 for that combination. The incompatibility that would have made
the split model fragile does not apply.

**So keep our engine fork at GPL-2.0-or-later — identical to upstream Mixxx.** Do not narrow it to
GPL-3.0-only. Matching upstream preserves two-way patch flow: we can contribute fixes back and pull their
improvements. The "or later" clause remains available as a compatibility escape hatch if a combined
distribution ever needs it.

### Why split rather than single-GPL

1. **The venue layer is the reusable asset.** The crowd/queue/policy plane is the genuinely novel part
   (Domain C has no prior art anywhere). Under Apache-2.0 a hotel group, a cruise line, a POS vendor or a
   fitness chain can embed it. Under GPL, almost none of them will. Adoption of that layer is the
   project's strategic value.
2. **The IPC boundary is good architecture regardless.** The two planes have latency budgets three orders
   of magnitude apart, want different languages, and benefit from crash isolation — a stuck web request
   must never glitch the audio thread. We want the boundary anyway; the licence separation rides along
   for free.
3. **It preserves optionality.** A permissive engine, a commercially-licensed Ableton Link, or an
   embedded deployment all remain possible later. Single-GPL forecloses them permanently.
4. **Apache-2.0 carries a patent grant.** Meaningful for a product touching audio codecs and, later,
   payments.

### Making the boundary defensible

The "separate processes are separate works" position is widely practised but the FSF reads it narrowly.
Treat these as **hard requirements in the specification**, not stylistic preferences:

- The engine is a **standalone executable**, independently useful, and shippable as its own artifact.
- The protocol is **documented, general-purpose, and versioned** — text/JSON over a local socket. No
  shared memory carrying GPL-defined structs.
- **No GPL headers are included by Apache-2.0 code**, ever. Not once.
- The engine is **replaceable**: a conforming alternative implementation must be possible, and a stub
  engine (see ADR-002) proves it from day one.
- **Enforced mechanically**: SPDX headers on every file plus a CI licence-lint job that fails the build if
  a GPL header is reachable from the Apache-2.0 tree. Contributor confusion is the main practical risk of
  a split licence, and the mitigation is automation, not documentation.

### Repository shape this implies

```
engine/          SPDX: GPL-2.0-or-later   ← Mixxx-derived, Qt allowed, Link/Rubber Band/aubio fine
  (everything else)  SPDX: Apache-2.0     ← fusion core, jukebox plane, API, clients, providers
```

Physical directory separation so the boundary is visible in every diff and every PR.

### What would reverse this

- If legal review finds the IPC boundary insufficiently defensible in target jurisdictions → fall back to
  single GPL and accept the loss of venue-layer reuse.
- If the project's goal is explicitly a **community DJ application** rather than a reusable venue platform
  → single GPL is simpler and the reuse argument evaporates.

---

## ADR-002 — Engine: fork Mixxx or build new?

### ✅ Ratified: **Fork Mixxx and extract a headless engine — but build it second, not first.**

**Confidence: High on forking. High on the sequencing, which matters just as much.**

### Why forking wins

Rebuilding `EngineMixer`, `SoundManager`, the analysers, beatgrid handling, key detection, DVS timecode
decoding, ReplayGain and the format-decoding matrix is multiple years of specialist work. Mixxx has been
hardened against real hardware for two decades and ships 2.5.6 with 2.6 in progress.

Two findings from inspecting the source tree make the extraction **much cheaper than it first appears**:

**1. The source tree already splits cleanly along our plane boundary.**

| Keep (headless engine) | Discard (UI) |
|---|---|
| `engine`, `audio`, `soundio`, `mixer` | `skin`, `widget`, `qml`, `dialog` |
| `analyzer`, `effects`, `vinylcontrol` | `preferences`, `rendergraph`, `shaders` |
| `control`, `controllers`, `sources`, `track` | `waveform` (rendering only) |

**2. Mixxx already has an enumerable, named parameter bus — which is an IPC surface in all but transport.**

`src/control` contains `ControlObject`, `ControlProxy`, **`ControlObjectScript`** and `ControlModel`.
`ControlObjectScript` is the bridge that lets the JavaScript controller-mapping layer drive the *entire*
engine through string-addressed controls (`[Channel1]`, `play`). Enumeration comes from
**`ControlDoublePrivate::getAllInstances()`** (`control.h:63`, *"Returns a list of all existing instances"*),
which — combined with per-control `name()`, `description()` and `defaultValue()` — makes the full control set
**enumerable at runtime** with the metadata a UI needs.

> **Corrected by SPIKE-1.** This ADR originally credited `ControlModel` with runtime enumeration. It does not
> do that: it is a `QAbstractTableModel` backing Mixxx's Developer→Controls window, populated by manual
> `addControl()` calls. The decision is unaffected — enumeration *is* available, and `getAllInstances()` is
> arguably a better mechanism than the one I claimed — but the ADR was resting on a misidentified citation
> and that is worth recording rather than quietly editing.

The hard part of headless extraction — designing a uniform, introspectable, change-notifying parameter
surface — **is already done and already proven** by every controller mapping Mixxx ships. Our work is
largely to add a socket transport speaking the same `(group, item, value)` vocabulary. Because the control
set is enumerable, the protocol can be **self-describing**, which pairs naturally with the MIDI 2.0
Property Exchange ambition in Domain D.

*(`src/network` is only an HTTP **client** for metadata lookups — there is no existing server surface, so
we add one.)*

### The sequencing recommendation — contract-first, engine-last

**Do not start with the fork.** Build in this order:

1. **Define the engine IPC contract** in `SPECIFICATION.md`, modelled on Mixxx's control vocabulary.
2. **Build a stub engine** — a trivial gapless player implementing that contract. Few hundred lines.
3. **Build the fusion core against the stub** and prove C1 (staging lane) and C2 (autonomous drain).
4. **Then** extract the Mixxx engine behind the same contract.

Three reasons this ordering is right:

- **The novel part carries the risk.** Domain C has no prior art. If the staging-lane/autonomous-drain
  model doesn't work, we want to know that in week 6 against a stub, not after months of fork surgery.
- **The contract should be designed by its consumer.** Extract first and the IPC surface will ossify
  around Mixxx's internals rather than the fusion core's needs.
- **The stub *is* the licence-boundary proof.** A working second implementation demonstrates the engine is
  genuinely replaceable — exactly the property ADR-001 depends on. It stays in the repo permanently as a
  CI test fixture and integration target.

### Scope discipline

Fork **thin**. Delete the UI aggressively rather than carrying it. Contribute fixes upstream where they
are general, so divergence stays manageable — which is also why ADR-001 keeps our fork at
GPL-2.0-or-later rather than narrowing it.

### What would reverse this

- If extracting headless Mixxx proves harder than a **~6-week spike** suggests, reconsider: build a
  permissive engine on miniaudio/PortAudio + SoundTouch + librosa-derived analysis, accepting no DVS and
  weaker analysis in v1. **Run that spike before committing.**
- If ADR-001 is rejected for single-Apache-2.0, forking Mixxx becomes impossible and this decision is moot.

---

## ADR-003 — Is paid priority (Fast Pass) in v1?

### ✅ Ratified: **Build the priority *model* in v1. Ship no payment rails in v1.**

**Confidence: High.**

This is a false binary. "Fast Pass" is two separable things:

| Concern | v1? | Why |
|---|---|---|
| **Priority ordering model** — queue entries carry a priority score; votes and paid boosts are two inputs to one ordering function | ✅ **Yes** | Retrofitting priority into a queue model means rewriting the scheduler, the fair-queue rules and every client that renders position-in-line. Expensive to add later, nearly free to add now. |
| **Credit ledger** — append-only, balance per patron, non-expiring | ✅ **Yes** | Ledgers are painful to retrofit correctly. Staff-granted and promotional credits make it useful in v1 on its own. |
| **Payment provider integration** — card processing, top-up, auto-refill | ❌ **No** | PCI scope, chargebacks, fraud, refunds, tax and per-market compliance. Enormous surface, none of it differentiating. |

So **v1 is vote-driven, with a credit ledger that exists but has no paid top-up path.** Credits enter only
by staff grant or promotion. Payment providers arrive in v1.1 behind an adapter interface — and the
scheduler needs no change when they do, because the ordering function already blends a priority input.

### Why not defer priority entirely

The research finding worth respecting: **visible position in line and paid priority are coupled.** Fast
Pass works *because* position is visible — one feature manufactures the demand the other sells. Since
visible position (B2) is already P0, the ordering model that makes priority meaningful should land with it.

Building the model without the rails also **keeps the door open for non-monetary priority**, which many
deployments will prefer: staff boosts, birthday/regular perks, loyalty redemption, happy-hour multipliers.
Those need the same ordering machinery and carry none of the payment risk.

### What would reverse this

- If a launch venue partner needs revenue on day one, promote a **single** payment provider into v1 — but
  only behind the adapter interface, never inlined into the scheduler.

---

## ADR-004 — Single-venue appliance or multi-tenant from the start?

### ✅ Ratified: **Single-venue appliance. `venue_id` in the schema from day one. Multi-venue later as *federation*, not multi-tenancy.**

**Confidence: High**, and the third clause is the part that matters most.

### The offline-first requirement already decided this

G1 (offline-first — full function with no internet) is a **P0** and is one of the few genuine advantages
over TouchTunes, whose cloud dependency means the music stops when the venue's connection drops. An
appliance that must keep working without internet **cannot be a multi-tenant cloud service**. The runtime
shape is therefore an appliance per venue, and that is not really negotiable without abandoning G1.

### So multi-venue is federation, not tenancy

This is the substantive recommendation. The operator console — AMI's Co-Pilot equivalent, and a real
requirement since the operator route model *is* the industry's business model — should be an
**aggregation layer over many independent appliances**, not a multi-tenant database with `WHERE tenant_id`
on every query.

That is a different and better architecture for this domain:

- Each venue survives a network partition, which is the whole point of G1.
- No cross-tenant data-isolation risk, because there is no shared datastore.
- Venue data stays in the venue, satisfying G6 (no telemetry by default).
- The operator console becomes a **client of the same open API** (G3) that everything else uses, rather
  than a privileged path into a shared database.

### Carry `venue_id` anyway

Cost now: near zero. Cost later: a schema migration across every table plus every query. Put it on every
row that could ever be venue-scoped and have the v1 runtime bind to exactly one venue. Also namespace the
API (`/v1/venues/{id}/...`) from day one so client URLs never have to change.

**Explicitly out of v1:** cross-venue queries, tenant isolation testing, per-tenant billing, the operator
console itself.

### What would reverse this

- If the first real customer is a **multi-site operator** rather than a single venue, build the federation
  aggregator earlier — but still as an aggregator over appliances, not as shared-database multi-tenancy.

---

## ADR-005 — Native Qt shell or thin native engine plus web consoles?

### ✅ Ratified: **Thin native engine + web consoles.** The engine owns every real-time path; all three consoles are web.

**Confidence: Medium-High.** The lowest-confidence of the five, and the one most worth revisiting after a
DJ console prototype.

### The question is narrower than it looks

Two parts were never in question: the **performance engine must be native** (sub-10 ms determinism, per
CONCEPT-IDEA §7.3), and the **patron surface must be web** (B1 requires no app install). Only the **DJ
console** is genuinely open.

### The argument that decides it: controller input does not pass through the UI

A controller talks to the **engine** directly over native MIDI/HID. When a DJ moves a physical fader, the
path is controller → engine → audio. The console only *reflects* that state.

This means web-UI latency is **cosmetic, not functional**, for any DJ using hardware — which is our target
user, a venue with a booth. That single fact removes the main objection to a web DJ console.

Supporting reasons:

- **One UI stack instead of two.** Patron, operator and DJ consoles share components, build tooling and
  the same open API (G3). Roughly a third of total UI effort saved, on a project whose main risk is scope.
- **It keeps Qt out of the permissive plane.** Qt is LGPL-3.0-or-commercial. Fine inside the GPL engine
  plane, an unwanted complication in the Apache-2.0 core. This synergises with ADR-001.
- **We wouldn't inherit Mixxx's UI anyway.** ADR-002 discards `skin`, `widget` and `qml` — so Mixxx's QML
  migration is not a reason to adopt Qt for our console.
- **Remote consoles come free.** A tablet at the booth, a phone for a walk-around, a second screen for a
  VJ — all just clients. Genuinely useful in a venue and awkward with a native shell.
- **Waveforms are a solved web problem.** wavesurfer.js (BSD-3-Clause) plus canvas/WebGL is adequate for
  display, and the engine remains authoritative for the actual timeline.

### The cost, stated honestly

**Mouse-only scratching in a browser will feel mediocre**, and we should accept that in v1 rather than
pretend otherwise. Our target user is a venue with hardware. A bedroom scratch DJ on a trackpad is not who
this is for, and trying to serve them would compromise the architecture for everyone else.

Mitigations: serve the console **locally from the engine process** so it works with no network and no
external browser dependency; render waveforms from engine-pushed state over WebSocket; and keep every
latency-sensitive control path in the engine where it belongs.

### What would reverse this

- If a DJ console prototype shows **visual** feedback lag bad enough to disrupt beatmatching even with
  hardware attached, reconsider a native console for the DJ surface only — keeping patron and operator on
  web regardless.
- If DVS/scratch fidelity becomes a v1 headline feature rather than a P2, the calculus shifts toward native.

---

## ADR-006 — Distribution shape and the licence risk position

**Status:** Ratified by the project owner, 2026-08-27. Supersedes the open question in ADR-001.
**Confidence:** High on the mechanics, *explicitly none* on the legal conclusion — see the caveat.

### The four inputs

ADR-001 left five business questions that materially change the licence analysis and that no lawyer can
answer for us. Four are now answered:

| Question | Decision |
|---|---|
| Distribution shape | **Two separate downloads.** No combined installer, ever. |
| Jurisdictions | **US and EU.** |
| Fallback appetite | **Single-GPL is acceptable** if the split is ever judged unsound. |
| Counsel | **None will be engaged.** |

The fifth — CLA or DCO — is unanswered and is dealt with below, because the fallback depends on it.

### What follows: keep the split

Two separate downloads is the strongest shape the split could have had, and it is not a small detail.
**It means we never distribute a combined work at all.** We publish an Apache-2.0 venue layer, which is
100% our own original code and contains no Mixxx code of any kind, and separately a GPL engine, which we
ship in full compliance with the GPL. Whatever combining happens, happens on the operator's machine when
they choose to run both. Aggregation by an end user is not us distributing a derivative work.

Given that, and given that the fallback is acceptable, **the split costs nothing to keep**:

- We hold the copyright on every line of the Apache-2.0 layer. We can relicense it to GPL at any moment.
- Apache-2.0 is one-way compatible with GPL-3.0, so the fallback stays available even with outside
  contributions under inbound=outbound.
- If the position were ever judged wrong, the remedy *is* the fallback — relicense to GPL. That is exactly
  where we would have landed by choosing single-GPL today.

So the worst case of keeping the split equals the certain case of abandoning it. Meanwhile abandoning it is
a **one-way door**: once the venue layer is GPL and outside contributors have committed to it, going back to
Apache-2.0 needs every one of their permissions. Keeping the option costs nothing and closing it costs the
strategic asset ADR-001 was built around.

### Consequences that are now requirements, not preferences

The single largest risk to this position is that someone later adds a convenience installer bundling both
binaries, because it is obviously nicer for users, and silently destroys the only thing holding the boundary
up. Two new requirements exist so that cannot happen quietly:

- **REQ-LIC-8** — release artifacts **MUST** be separate: the Apache-2.0 venue layer and the GPL engine
  **MUST NOT** be distributed in a single installer, archive, container image or package.
- **REQ-LIC-9** — contributions **MUST** be accepted under a DCO with inbound=outbound licensing, so the
  single-GPL fallback in this ADR remains exercisable without tracing every contributor.

### The caveat, stated plainly

**No legal review has been obtained, and none is planned.** This ADR is a business decision to proceed on an
unreviewed interpretation, with a documented and cheap fallback. That is a legitimate way to accept a risk;
it is not the same thing as the risk being absent, and this document must not be read as saying the boundary
has been blessed. [`legal/REVIEW-PACK.md`](legal/REVIEW-PACK.md) remains ready if counsel is ever engaged,
and lists the seven questions to ask.

### What would reverse this

- A credible challenge, or counsel later advising the boundary does not hold in the US or EU → execute the
  fallback: relicense everything GPL-2.0-or-later. No architectural change is required, because every
  property the split relies on — separate processes, a versioned protocol, a replaceable engine, crash
  isolation — is architecture we want regardless.
- Evidence that third parties are being materially misled about their obligations → revisit immediately.

---

## Summary

| # | Decision | Ratified position | Confidence |
|---|---|---|---|
| 001 | Licence structure | **Split** — Apache-2.0 core + GPL-2.0-or-later engine across a hard IPC boundary, enforced by CI licence-lint | High |
| 002 | Engine | **Fork Mixxx**, extract headless via its existing Control bus — but **contract-first, stub second, fork third** | High |
| 003 | Paid priority | **Model yes, rails no.** Priority ordering + credit ledger in v1; payment providers in v1.1 behind an adapter | High |
| 004 | Deployment | **Single-venue appliance**, `venue_id` everywhere, multi-venue later as **federation of appliances** | High |
| 005 | Client architecture | **Thin native engine + web consoles**; controller input bypasses the UI, so web latency is cosmetic | Medium-High |
| 006 | Distribution & licence risk | **Two separate downloads**, US/EU, single-GPL fallback accepted, **no counsel engaged** — risk accepted knowingly | Mechanics high, legal conclusion unreviewed |

### Highest-value next action

One **~6-week headless-Mixxx spike** (ADR-002) is the highest-value de-risking action available. It tests
the assumption the whole plan rests on — that the engine can be extracted behind a socket protocol at
acceptable cost — and its output is exactly the IPC contract `SPECIFICATION.md` needs. Everything else
here can be committed to on paper; that one should be measured.
