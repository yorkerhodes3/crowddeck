# SPECIFICATION.md — CrowdDeck v1

**Status:** ✅ Phase 2 complete — ready for backlog derivation
**Version:** 1.0 · **Date:** 2026-08-27
**Upstream:** [`CONCEPT-IDEA.md`](CONCEPT-IDEA.md) (research) → [`DECISIONS.md`](DECISIONS.md) (ratified ADRs) → **this document** → [`BACKLOG.md`](BACKLOG.md)

Written against the five decisions ratified in [`DECISIONS.md`](DECISIONS.md) on 2026-08-27. Where a
requirement exists because of a decision, the ADR is cited inline. Requirement IDs (`REQ-*`) are stable and
are what [`BACKLOG.md`](BACKLOG.md) and `docs/data/requirements.json` reference.

**Conventions.** **MUST** / **MUST NOT** / **SHOULD** / **MAY** carry their RFC 2119 meanings. Capability
IDs in parentheses (e.g. *C1*, *B6*) trace back to `docs/data/capabilities.json`.

---

## 0. Scope of v1

### 0.1 What v1 is

A **single-venue appliance** (ADR-004) that runs unattended as a policy-governed request jukebox, and
attended as a DJ performance system, **draining one shared queue** (*C1*, *C2*). It works with no internet
(*G1*), keeps all data in the venue (*G6*), and exposes everything it can do over one documented API (*G3*).

### 0.2 In scope

| Area | v1 content |
|---|---|
| Engine | 4 decks, beatgrid, key detection + key-lock, sync lock with leader deck, hot cues, loops, per-deck EQ/filter/gain, crossfader |
| Fusion | Staging lane, autonomous auto-mix drain, gapless mode handoff, never-silent fallback |
| Crowd | QR join, live queue with position in line, voting, fair-queue rules, staff override console |
| Policy | Explicit filter, allow/block lists, dayparting, licence-class gating |
| Content | Local library ingest, OpenSubsonic consume **and** expose, Creative Commons providers |
| Interconnect | MIDI 1.0 + 2.0/UMP I/O, MIDI learn with soft-takeover, mapping format, MIDI Clock out, Ableton Link |
| Priority | Ordering model + append-only credit ledger, **no payment rails** (ADR-003) |

### 0.3 Explicitly out of scope for v1

Payment provider integration (v1.1, ADR-003) · operator console and multi-venue federation (ADR-004) ·
licensed-streaming adapters, interface only · DVS timecode · stems · effects beyond EQ/filter · video ·
karaoke · DMX lighting · Mackie/HUI · multi-zone audio · polished mouse-only scratching (ADR-005).

Everything deferred is recorded in [`BACKLOG.md`](BACKLOG.md) so it is not silently lost.

### 0.4 Definition of done for v1

> A venue runs CrowdDeck for a full trading day. It opens unattended, patrons scan a QR code and queue
> music that respects venue policy and fair-queue rules, the room never goes silent, a DJ takes over at
> 21:00 with no gap in audio, mixes patron requests from the staging lane using a MIDI controller with an
> external instrument locked to the deck tempo, releases control at close, and the venue can export
> exactly what was performed. The venue's internet was down the whole time.

---

## 1. Licence and boundary rules — *ADR-001*

### 1.1 Plane assignment

| Path | Licence | May link |
|---|---|---|
| `engine/` | **GPL-2.0-or-later** | Mixxx-derived code, Qt, Ableton Link, Rubber Band, aubio, libKeyFinder |
| everything else | **Apache-2.0** | Permissive only — Apache/MIT/BSD/ISC/public-domain, plus LGPL via dynamic linking |

- **REQ-LIC-1** Every source file **MUST** carry an `SPDX-License-Identifier` header matching its plane.
- **REQ-LIC-2** Apache-2.0 code **MUST NOT** include, vendor, statically link, or `#include` any header
  from a GPL-licensed work. Not once, not "temporarily".
- **REQ-LIC-3** CI **MUST** run a licence-lint job that fails the build on any violation of REQ-LIC-1 or
  REQ-LIC-2, including transitive dependencies. Contributor confusion is the main practical risk of a split
  licence, so the mitigation is mechanical rather than documentary.
- **REQ-LIC-4** The engine **MUST** ship as a standalone executable that is independently useful and
  independently runnable.
- **REQ-LIC-5** A conforming alternative engine **MUST** remain possible. The stub engine (§2.9) exists
  permanently to prove this and **MUST** stay green in CI.
- **REQ-LIC-6** FFmpeg **MUST** be built LGPL-only, with enabled components audited in CI. A
  GPL-configured build silently relicenses the product.
- **REQ-LIC-7** Third-party dependency licences **MUST** be inventoried in a generated `NOTICE` file per
  release artifact.
- **REQ-LIC-8** The Apache-2.0 venue layer and the GPL engine **MUST** be released as **separate
  artifacts**. They **MUST NOT** be distributed together in a single installer, archive, container image or
  package (*ADR-006*).
- **REQ-LIC-9** Contributions **MUST** be accepted under a DCO with inbound=outbound licensing, so the
  single-GPL fallback in ADR-006 remains exercisable without tracing every contributor (*ADR-006*).

> **REQ-LIC-8 is the load-bearing one.** ADR-006 chose two separate downloads, which means the project never
> distributes a combined work at all — whatever combining happens, happens on the operator's machine. The
> realistic way that protection gets lost is not a court: it is someone shipping a convenience installer
> because it is obviously nicer for users. Writing it down as a requirement is the cheapest available
> guard, and `REPO-4` makes it a release-time check rather than a hope.

### 1.2 Repository layout

```
engine/          GPL-2.0-or-later   Mixxx-derived headless engine + CDEP server
engine-stub/     Apache-2.0         Reference engine, proves REQ-LIC-5 and CDEP conformance
core/            Apache-2.0         Fusion core: scheduler, policy, mode/handoff
crowd/           Apache-2.0         Jukebox plane, Karaoke-Eternal-derived
providers/       Apache-2.0         Content sources, Mopidy-derived abstraction
api/             Apache-2.0         HTTP + WebSocket + OpenSubsonic surface
clients/         Apache-2.0         patron / dj / operator / display web consoles
interconnect/    Apache-2.0         MIDI, mapping, clock (Link adapter is a thin GPL shim in engine/)
```

> **Note on Ableton Link.** Link is GPL-2.0-or-later, so its integration **MUST** live in `engine/`.
> `interconnect/` addresses it through CDEP like any other engine capability.

---

## 2. CDEP — the CrowdDeck Engine Protocol — *ADR-002*

Written first, because everything else is built against it and because the contract must be defined by its
consumer rather than dictated by the fork.

### 2.1 Design basis

Mixxx's `src/control` already exposes an enumerable, named, change-notifying parameter bus
(`ControlObject`, `ControlProxy`, `ControlObjectScript`, and `ControlDoublePrivate::getAllInstances()` for
enumeration) that its JavaScript controller layer drives the entire engine through. CDEP **adopts that
vocabulary** and adds a transport. This is why extraction is tractable — we are wrapping a proven
abstraction, not inventing one. SPIKE-1 verified this claim against real source rather than inference.

### 2.2 Transport

- **REQ-CDEP-1** Transport **MUST** be a local stream socket: Unix domain socket on POSIX, named pipe on
  Windows. TCP on loopback **MAY** be offered for development, **MUST** be off by default.
- **REQ-CDEP-2** Framing **MUST** be newline-delimited JSON (one object per line, UTF-8).
- **REQ-CDEP-3** The protocol **MUST NOT** use shared memory or pass structures whose layout is defined by
  GPL headers. Arms-length generality is a licence requirement (ADR-001), not a style preference.
- **REQ-CDEP-4** The engine **MUST** accept multiple concurrent clients and **MUST** apply per-client
  subscription state independently.

### 2.3 Control addressing

Controls are addressed by `(group, item)`, mirroring Mixxx: group `"[Channel1]"`, item `"play"`. Values are
JSON numbers unless the descriptor declares otherwise.

- **REQ-CDEP-5** Group names **MUST** be stable across engine restarts.
- **REQ-CDEP-6** Deck groups **MUST** be `[Channel1]`…`[ChannelN]`; the master bus **MUST** be `[Master]`.

### 2.4 Message envelope

Every message is a JSON object with a `t` (type) field. Requests carry an `id`; the matching reply echoes it.

```jsonc
// request
{ "t": "set", "id": 42, "group": "[Channel1]", "item": "rate", "value": 0.031 }
// reply
{ "t": "ok", "id": 42 }
// error reply
{ "t": "error", "id": 42, "code": "unknown_control", "message": "[Channel9]/rate" }
```

- **REQ-CDEP-7** Receivers **MUST** ignore unknown object fields, so the protocol can extend without a
  version bump.
- **REQ-CDEP-8** Every error **MUST** carry a machine-readable `code` from a documented enumeration.

### 2.5 Message types

| Type | Direction | Purpose |
|---|---|---|
| `hello` / `welcome` | C→E / E→C | Version negotiation and capability advertisement |
| `describe` / `description` | C→E / E→C | Enumerate the full control set with descriptors |
| `get` / `value` | C→E / E→C | Read a control |
| `set` | C→E | Write a control |
| `subscribe` / `unsubscribe` | C→E | Manage change notification, with a rate cap |
| `changed` | E→C | Control value changed |
| `load` | C→E | Load a track into a deck |
| `event` | E→C | `track_loaded`, `track_ended`, `deck_empty`, `beat`, `phase`, `xrun`, `device_error` |
| `ping` / `pong` | both | Liveness |

### 2.6 Handshake and versioning

```jsonc
{ "t": "hello", "protocol": "cdep/1", "client": "crowddeck-core/0.1.0",
  "accept": ["cdep/1"] }
{ "t": "welcome", "protocol": "cdep/1", "engine": "crowddeck-engine-mixxx/0.1.0",
  "decks": 4, "sample_rate": 48000, "latency_ms": 5.3,
  "capabilities": ["stems", "keylock", "link", "midi_clock"] }
```

- **REQ-CDEP-9** The protocol **MUST** be versioned `cdep/<major>`. Breaking changes bump the major.
- **REQ-CDEP-10** The engine **MUST** reject an unsupported protocol version with `unsupported_protocol`
  and close the connection.
- **REQ-CDEP-11** `welcome` **MUST** advertise optional features in `capabilities`. Clients **MUST**
  degrade gracefully when a capability is absent — this is what allows the stub engine to be conformant
  while implementing far less than the Mixxx engine.

### 2.7 Self-description

- **REQ-CDEP-12** `describe` **MUST** return every control with a descriptor carrying `group`, `item`,
  `default`, `readonly`, and a human `label`. `type` (`bool` | `int` | `float` | `enum`), `min` and `max`
  are **SHOULD** — an engine supplies them where it knows them and omits them where it does not.
- **REQ-CDEP-12a** Every control **MUST** additionally be readable and writable in **parameter space**: a
  normalised `0.0..1.0` where 0 is the control's minimum useful position and 1 its maximum. `get` **MUST**
  return `parameter` alongside `value`; `set` **MUST** accept either.
- **REQ-CDEP-13** The description **MUST** be sufficient to build a complete control UI and a complete
  MIDI-mapping target list with no hard-coded knowledge of the engine. A client that uses only parameter
  space **MUST** be able to do this using solely **MUST**-level descriptor fields.

> **Amended by SPIKE-1.** `min`/`max`/`type` were originally **MUST**. Reading the Mixxx source showed that
> would have made CDEP unimplementable by its own reference engine: ranges live in protected members of a
> privately-held `ControlPotmeterBehavior` (`controlbehavior.h:54-55`, `control.h:189`) with no getter, some
> behaviors are unbounded by design, and every control is a `double` so `type` is not modelled at all.
>
> Parameter space is not a workaround, it is the better primitive. Mixxx already exposes
> `getParameter`/`setParameter` universally (`control.h:113-116`) and each control carries its own curve —
> logarithmic for gain, audio-taper for volume, linear for the crossfader. A client scaling linearly between
> `min` and `max` would get every one of those wrong even if it *could* read them. Sending a normalised
> parameter and letting the engine apply its own curve is both simpler and more correct.
> See [`spike/SPIKE-1-REPORT.md`](spike/SPIKE-1-REPORT.md) §4.

> Self-description is deliberately symmetric with the MIDI-CI Property Exchange model in §6.3 — the same
> "the device describes itself" principle applied on both sides of the system.

### 2.8 Subscriptions and back-pressure

- **REQ-CDEP-14** `subscribe` **MUST** accept `max_hz` and the engine **MUST** coalesce updates to that
  rate, emitting only the latest value per control per interval.
- **REQ-CDEP-15** High-rate controls (`playposition`, VU meters) **MUST NOT** be delivered unsubscribed.
- **REQ-CDEP-16** If a client's send queue exceeds a bounded depth, the engine **MUST** drop coalesced
  updates rather than block. **The audio thread MUST NEVER block on IPC** — this is the hard rule the whole
  two-plane split exists to guarantee.

### 2.9 Conformance and the stub engine

- **REQ-CDEP-17** A published conformance suite **MUST** exist, and **both** `engine/` and `engine-stub/`
  **MUST** pass it in CI.
- **REQ-CDEP-18** `engine-stub/` **MUST** implement: handshake, describe, get/set, subscribe/changed,
  load, transport, and gapless sequential playback — enough for the fusion core to be developed and tested
  against it with no Mixxx dependency.

### 2.10 Minimum control set for v1

| Group | Items |
|---|---|
| `[ChannelN]` | `play`, `cue_gotoandplay`, `rate`, `rate_dir`, `bpm`, `key`, `keylock`, `volume`, `pregain`, `filter`, `loop_in`, `loop_out`, `loop_enabled`, `hotcue_N_activate`, `playposition`, `track_loaded`, `duration`, `sync_enabled`, `sync_leader` |
| `[Master]` | `crossfader`, `gain`, `headMix`, `headGain`, `bpm`, `mode`, `num_decks` |
| `[EqualizerRack1_[ChannelN]_Effect1]` | `parameter1` (low), `parameter2` (mid), `parameter3` (high) |

**Ranges.** `[Master]`/`gain` and `[Master]`/`headGain` are **-14..14 dB** (`enginemixer.cpp:67,71`), not a
linear multiplier. `crossfader` is -1..1. Clients **SHOULD NOT** hard-code these: use parameter space
(REQ-CDEP-12a) and the ranges become the engine's problem, which is where they belong.

> **Amended by SPIKE-1.** Two errors were found by checking this table against real Mixxx source.
>
> First, `gain`/`headGain` were specified as 0..4 linear. They are decibels. A MIDI fader at half travel
> would have meant "double gain" to a client and "unity" to the engine.
>
> Second — and with scope consequences — **per-deck EQ is not a deck control.** Mixxx routes it through the
> effects subsystem as `[EqualizerRack1_[ChannelN]_Effect1]`/`parameter1..3`
> (`common-controller-scripts.js:590`). `[ChannelN]`/`eq_low|mid|high` does not exist. The headless extraction
> in §0.2 therefore **must retain the effects rack**, not just the mixer and decks. This is a real increase in
> the surface area of the fork and is tracked as such in the backlog.
>
> 12 of the 14 remaining names in this table were verified directly against Mixxx source; the other two
> (`crossfader`, `headMix`) are present but were not returned by code search. See
> [`spike/SPIKE-1-REPORT.md`](spike/SPIKE-1-REPORT.md) §5.

---

## 3. Unified Scheduler — *Domain C, the novelty*

One queue, two consumers (*C1*, *C2*). No existing product does this, so it is specified in the most detail.

### 3.1 Queue entry lifecycle

```
                    ┌──────────► rejected  (policy denied, staff vetoed)
                    │
requested ──► screened ──► staged ──► cued ──► playing ──► played
                    │          │        │
                    │          │        └────► skipped   (staff skip)
                    │          └─────────────► expired   (aged out unplayed)
                    └────────────────────────► expired   (venue closed)
```

- **REQ-SCH-1** Every queue entry **MUST** occupy exactly one state, and transitions **MUST** be recorded
  with a timestamp and actor.
- **REQ-SCH-2** `requested → screened` **MUST** be performed by the policy engine (§3.5). An entry failing
  policy **MUST** go to `rejected` with a machine-readable reason.
- **REQ-SCH-3** In **attended** mode, `staged → cued` **MUST** require an explicit DJ action (*C1*).
- **REQ-SCH-4** In **autonomous** mode, `screened → staged → cued` **MUST** proceed automatically (*C2*).
- **REQ-SCH-5** Patrons **MUST NOT** be able to cause a `cued` or `playing` entry to change state. Only
  staff and the engine may.

> **REQ-SCH-3 and REQ-SCH-5 together are the core design decision.** Crowd requests never reach the audio
> output without passing through either a DJ or the autonomous mixer. This is what lets a jukebox and a DJ
> rig share one set of speakers.

### 3.2 Priority ordering

Ordering within `screened`/`staged` is by descending `priority_score`, then FIFO by `enqueued_at`.

```
priority_score = (votes        × VOTE_WEIGHT)
               + (boost_units  × BOOST_WEIGHT)
               + age_bonus

age_bonus = floor(minutes_waiting / AGING_INTERVAL) × AGING_WEIGHT
```

- **REQ-SCH-6** Staff-pinned entries **MUST** sort above all others regardless of score.
- **REQ-SCH-7** The ordering function **MUST** treat votes and boost units as two inputs to one score, so
  that enabling payments in v1.1 requires **no scheduler change** (ADR-003).
- **REQ-SCH-8** `age_bonus` **MUST** be non-zero and monotonically increasing. Without an aging term an
  unpopular request never plays; anti-starvation is a correctness property, not a nicety.
- **REQ-SCH-9** All weights and intervals **MUST** be venue-configurable, with documented defaults
  (`VOTE_WEIGHT=10`, `BOOST_WEIGHT=25`, `AGING_INTERVAL=5min`, `AGING_WEIGHT=3`).
- **REQ-SCH-10** `priority_score` **MUST** be recomputed deterministically; identical inputs give identical
  ordering. It **MUST NOT** depend on wall-clock time except through `age_bonus`.

### 3.3 Position in line

- **REQ-SCH-11** Every patron **MUST** see their entry's **1-based position** in the effective play order
  (*B2*). This is TouchTunes' single most-cited feature and is what makes waiting tolerable.
- **REQ-SCH-12** Position **MUST** update in real time over WebSocket when the ordering changes.
- **REQ-SCH-13** An estimated time-until-play **SHOULD** be derived from queued track durations.

### 3.4 Fair-queue rules (*B6*)

- **REQ-SCH-14** `max_pending_per_patron` (default 2) **MUST** be enforced at request time.
- **REQ-SCH-15** `track_cooldown` (default 60 min) and `artist_cooldown` (default 30 min) **MUST** block
  re-requests venue-wide, counting from last play.
- **REQ-SCH-16** A per-patron request rate limit (default 5 per 15 min) **MUST** apply.
- **REQ-SCH-17** A patron **MUST NOT** vote twice for the same entry, enforced by a uniqueness constraint
  rather than UI logic.
- **REQ-SCH-18** Every rejection **MUST** return a specific reason so the client can explain it.
- **REQ-SCH-19** The effective play order **MUST** rotate between patrons: where several patrons have
  pending entries, a patron **MUST NOT** occupy consecutive positions while another patron with a pending
  entry has not yet had a turn. Rotation orders *turns*, not outcomes — the highest-scoring entry still
  plays first, and staff-pinned entries (REQ-SCH-6) are unaffected. It **MUST** be venue-configurable
  (`ROTATE_PATRONS=true`) under REQ-SCH-9.

> Without §3.4 one patron plays the same song six times and the venue switches the system off. These are
> P0 for adoption, not polish.

> **REQ-SCH-19 added by CRW-1.** A pure score sort satisfies every other rule in §3.2 and still produces
> the outcome §3.4 exists to prevent: two entries from one patron outscore the room and play back to back
> while someone who queued once waits behind both. No rule is violated — the queue does exactly what it was
> told — and the patron who waited concludes it is rigged, which is the perception REQ-SCH-8 already
> identifies as a correctness problem rather than a cosmetic one.
>
> The mechanism is generalised from **Karaoke Eternal** (MIT, `docs/data/oss.json`), whose singer rotation
> is the best prior art: a singer with three songs queued does not get three turns in a row. "Singers"
> becomes "patrons with priority", which is the whole of the `FORK` verdict recorded for this story.

### 3.5 Venue policy engine (*B7*)

- **REQ-POL-1** Requests **MUST** be screened against: explicit-content flag, artist/genre block lists,
  allow-list mode, per-daypart rules, and **licence class** (§4.4).
- **REQ-POL-2** Patron **search MUST be scoped by the same policy**, so an unrequestable track is never
  offered (*C6*). Filtering only at request time is a defect.
- **REQ-POL-3** Policy **MUST** be evaluated at request time **and** re-evaluated at `cued`, since
  dayparting may have changed in between.
- **REQ-POL-4** Staff **MUST** be able to override any policy decision, and the override **MUST** be logged.

### 3.6 Mode and handoff (*C2*, *C3*)

- **REQ-MODE-1** The venue **MUST** be in exactly one mode: `autonomous` or `attended`.
- **REQ-MODE-2** Mode transitions **MUST NOT** interrupt audio (*C3*). A track playing across a handoff
  continues.
- **REQ-MODE-3** Entering `attended` **MUST** stop automatic `staged → cued` promotion, leaving already
  cued entries intact.
- **REQ-MODE-4** Entering `autonomous` **MUST** resume automatic promotion from the current queue state.
- **REQ-MODE-5** In `autonomous`, the engine **MUST** beatmatch transitions using the analysed beatgrid,
  falling back to a timed crossfade when confidence is low.

### 3.7 Never-silent fallback (*B9*)

- **REQ-FALL-1** When the queue empties, the scheduler **MUST** promote from a configured fallback source
  (playlist, smart playlist, or CC catalog).
- **REQ-FALL-2** Fallback selections **MUST** pass the same policy screening.
- **REQ-FALL-3** Dead air **MUST NOT** exceed 2 seconds under any queue state, including at venue open,
  after a skip, and on engine reconnect.
- **REQ-FALL-4** If the engine connection drops, the fusion core **MUST** reconnect with backoff and
  resume from persisted queue state. **The queue is durable; the engine is replaceable.**

---

## 4. Data model — *ADR-003, ADR-004*

### 4.1 Multi-venue readiness

- **REQ-DAT-1** Every venue-scoped table **MUST** carry `venue_id` from the first migration, even though
  v1 binds to one venue (ADR-004). Near-zero cost now; a migration across every table and query later.
- **REQ-DAT-2** The runtime **MUST** bind to exactly one `venue_id`. Cross-venue queries are out of scope.

### 4.2 Core tables

| Table | Key columns |
|---|---|
| `venue` | `id`, `name`, `timezone`, `opened_at`, `settings_json` |
| `venue_policy` | `venue_id`, `explicit_allowed`, `allow_mode`, `blocked_artists`, `blocked_genres`, `daypart_rules_json` |
| `venue_licence_profile` | `venue_id`, `pro` (ASCAP/BMI/SESAC/GMR), `licence_ref`, `valid_from`, `valid_to` |
| `content_source` | `id`, `venue_id`, `kind`, `config_json`, `default_licence_class`, `enabled` |
| `track` | `id`, `venue_id`, `source_id`, `source_ref`, `title`, `artist`, `album`, `duration_ms`, `bpm`, `musical_key`, `explicit`, `licence_class`, `replaygain_db`, `acoustid`, `mbid`, `analysis_state` |
| `track_analysis` | `track_id`, `beatgrid_json`, `phrases_json`, `waveform_path`, `analysed_at`, `analyser_version` |
| `patron` | `id`, `venue_id`, `session_token`, `display_name`, `created_at`, `last_seen_at` |
| `queue_entry` | `id`, `venue_id`, `track_id`, `patron_id`, `state`, `enqueued_at`, `votes`, `boost_units`, `priority_score`, `staff_pinned`, `deck_id`, `reject_reason` |
| `queue_entry_event` | `id`, `queue_entry_id`, `from_state`, `to_state`, `actor`, `reason`, `at` |
| `vote` | `queue_entry_id`, `patron_id`, `created_at` — **UNIQUE(queue_entry_id, patron_id)** |
| `credit_ledger` | `id`, `venue_id`, `patron_id`, `delta`, `reason`, `ref`, `created_at` — **append-only** |
| `play_log` | `id`, `venue_id`, `track_id`, `queue_entry_id`, `started_at`, `ended_at`, `mode`, `licence_class` |
| `controller_mapping` | `id`, `venue_id`, `device_identity`, `mapping_json`, `updated_at` |

### 4.3 Credit ledger (ADR-003)

- **REQ-DAT-3** The ledger **MUST** be append-only. Corrections are compensating entries, never updates.
- **REQ-DAT-4** Balance **MUST** be derived as the sum of deltas, never stored as a mutable column.
- **REQ-DAT-5** v1 **MUST** accept `reason` values `staff_grant`, `promotion`, `spend`, `refund` only.
  **No paid top-up path exists in v1.**
- **REQ-DAT-6** Credits **MUST NOT** expire (matching the TouchTunes wallet mechanic).
- **REQ-DAT-7** Spending credits **MUST** be atomic with the boost it purchases; a failed boost **MUST NOT**
  consume credit.

### 4.4 Licence class (*H2*)

- **REQ-DAT-8** Every track **MUST** carry a `licence_class`: `owned_local`, `cc_attribution`,
  `cc_sharealike`, `cc_noncommercial`, `record_pool`, `licensed_stream`, `unknown`.
- **REQ-DAT-9** The system **MUST** be able to answer *"may this venue legally play this track now?"* from
  `licence_class` + `venue_licence_profile`.
- **REQ-DAT-10** `cc_noncommercial` and `unknown` **MUST** default to blocked in a commercial venue profile.
- **REQ-DAT-11** Attribution-required tracks **MUST** surface attribution on the venue display while playing.

### 4.5 Play log (*H3*)

- **REQ-DAT-12** Every performance **MUST** be logged with start, end, mode and licence class.
- **REQ-DAT-13** The log **MUST** be exportable as CSV for PRO reporting.
- **REQ-DAT-14** The log **MUST** be local-only and **MUST NOT** be transmitted anywhere (*G6*).

---

## 5. Public API — *ADR-005*

### 5.1 Principles

- **REQ-API-1** The API **MUST** be the only way clients interact with the system. No privileged back door
  for first-party consoles — this is what makes third-party clients viable (*G3*).
- **REQ-API-2** Paths **MUST** be namespaced `/v1/venues/{venue_id}/...` from the start (ADR-004), so
  client URLs survive the move to federation.
- **REQ-API-3** All mutations **MUST** be authenticated; patron auth is a venue-scoped session token bound
  to a QR join.
- **REQ-API-4** The API **MUST** be documented as OpenAPI 3.1, generated in CI.

### 5.2 Patron surface

| Method | Path | Notes |
|---|---|---|
| `POST` | `/v1/venues/{v}/join` | QR/short-code join, returns session token (*B1*) |
| `GET` | `/v1/venues/{v}/search?q=` | **Policy-scoped** (REQ-POL-2) |
| `GET` | `/v1/venues/{v}/queue` | Public queue with positions (*B2*) |
| `POST` | `/v1/venues/{v}/queue` | Request a track |
| `POST` | `/v1/venues/{v}/queue/{id}/votes` | Vote once (REQ-SCH-17) |
| `POST` | `/v1/venues/{v}/queue/{id}/boost` | Spend credits for priority |
| `GET` | `/v1/venues/{v}/me` | Session, balance, pending requests |
| `WS` | `/v1/venues/{v}/events` | Queue, position, now-playing changes |

### 5.3 Staff surface (*B8*)

`POST /staging/{id}/promote` · `/reject` · `/pin` · `POST /queue/{id}/skip` · `POST /mode` ·
`POST /policy` · `POST /credits` · `POST /panic` (immediate stop) · `GET /play-log.csv`

- **REQ-API-5** Staff actions **MUST** be logged to `queue_entry_event` with the actor.
- **REQ-API-6** `POST /panic` **MUST** stop output within 500 ms.

### 5.4 DJ surface

- **REQ-API-7** The DJ console **MUST** drive the engine through the core, not by connecting to CDEP
  directly — one authority over deck state.
- **REQ-API-8** Deck state **MUST** stream over WebSocket at a coalesced rate suitable for UI (≥20 Hz for
  playposition).
- **REQ-API-9** The DJ console **MUST** be served locally by the appliance and **MUST** function with no
  WAN connectivity (*G1*).

### 5.5 OpenSubsonic compatibility (*E2*)

- **REQ-API-10** The appliance **MUST** expose an OpenSubsonic-compatible subset at `/rest/`: `ping`,
  `getLicense`, `search3`, `getAlbumList2`, `getPlaylists`, `stream`, `getCoverArt`.
- **REQ-API-11** `jukeboxControl` **MUST** be implemented. Its playlist **MUST** be able to represent queue
  entries that are not Subsonic library songs — a Creative Commons provider track, or a live MIDI instrument
  (REQ-INST-1) — because a queue that can only express song IDs cannot describe this product's queue.
- **REQ-API-11a** That capability **MUST** be advertised through `getOpenSubsonicExtensions` under a
  **vendor-namespaced** name, and entries a stock client cannot understand **MUST** still be returned as
  valid `Child` objects, so an unmodified Subsonic client shows a coherent queue rather than failing.
- **REQ-API-12** Subsonic-authenticated clients **MUST** be treated as staff-level, since the Subsonic
  auth model has no patron concept. The Subsonic surface **MUST** be disabled unless explicitly configured
  with its own credential, and that credential **MUST NOT** default to the staff key.

> **Amended by API-2.** REQ-API-11 originally required "the `jukeboxMediaTypes` extension". **No such
> extension exists.** The OpenSubsonic extension registry
> ([`open-subsonic-api`](https://github.com/opensubsonic/open-subsonic-api), `content/en/docs/Extensions/`)
> defines exactly ten: `transcodeOffset`, `apiKeyAuthentication`, `formPost`, `getPodcastEpisode`,
> `indexBasedQueue`, `playbackReport`, `songLyrics`, `sonicSimilarity`, `topSongsByArtistId` and
> `transcoding`. The name came from the concept-phase research and was never verified — the same failure mode
> that put non-existent projects in the first Tavily pass, which is why every repository in that pass was
> re-checked against the GitHub API.
>
> The *intent* was sound and is kept: a stock `jukeboxControl` playlist is a list of library song IDs, and
> this product's queue contains things that are not library songs. Inventing a private field and calling it a
> published standard would have been worse than the original error, so the extension is namespaced
> `crowddeck.mediaTypes` — unmistakably ours — and declared through the real extension mechanism.
>
> REQ-API-12 also gained a constraint. Making Subsonic clients staff-level is correct, but it means an
> `md5(password + salt)` credential grants skip, mode and panic. Defaulting that to the staff key would put
> the main staff credential behind an offline-crackable hash, so the surface is off until an operator gives
> it a separate password of its own.

---

## 6. Interconnect — *Domain D*

### 6.1 MIDI I/O

- **REQ-MIDI-1** The engine **MUST** support MIDI 1.0 and MIDI 2.0/UMP via libremidi, with RtMidi as a
  fallback backend behind our own port interface.
- **REQ-MIDI-2** Ports **MUST** be identified by a **stable identity** (manufacturer, product, serial where
  available) and **MUST NOT** be bound by numeric index. Index-bound mappings break on reboot — this is a
  known defect class in existing tools and we design it out.
- **REQ-MIDI-3** Hot-plug attach/detach **MUST** be handled without restart, and mappings **MUST**
  re-bind automatically on reattach.

### 6.2 Mapping and MIDI learn

- **REQ-MIDI-4** MIDI learn **MUST** support **soft-takeover**: a physical control **MUST NOT** apply its
  value until it crosses the current software value, preventing parameter jumps.
- **REQ-MIDI-5** The mapping format **MUST** be declarative, human-readable, diffable and shareable, and
  **MUST** target controls by CDEP `(group, item)` — so the mapping target list is generated from
  `describe` (REQ-CDEP-13) with no hard-coded engine knowledge.
- **REQ-MIDI-6** A mapping **MUST** be exportable and importable as a single file.
- **REQ-MIDI-7** HID **SHOULD** be supported for high-resolution jog wheels; 7-bit MIDI's 128 steps per
  rotation is insufficient for credible feel.

### 6.3 MIDI 2.0 self-description

- **REQ-MIDI-8** Where a device supports MIDI-CI, the system **SHOULD** use Property Exchange to
  auto-populate a mapping, reducing hand-authoring.
- **REQ-MIDI-9** Auto-generated mappings **MUST** be editable and **MUST** be overridable by a user mapping.

### 6.4 Clock and sync

- **REQ-CLK-1** The **leader deck MUST be the single tempo source**, publishing to MIDI Clock and Ableton
  Link **simultaneously** (*D5*, *D6*).
- **REQ-CLK-2** MIDI Clock **MUST** be emitted at 24 PPQN.
- **REQ-CLK-3** Ableton Link **MUST** support a configurable quantum and `enableStartStopSync`.
- **REQ-CLK-4** Clock **MUST** continue across a mode handoff (§3.6) — external instruments **MUST NOT**
  lose sync when a DJ takes over or steps away.
- **REQ-CLK-5** MTC **MUST NOT** be used for musical sync; positional reference only.
- **REQ-CLK-6** Clock jitter **MUST** be ≤1 ms RMS measured at the MIDI output.

### 6.5 Instruments as sources (*E5*)

- **REQ-INST-1** A live MIDI instrument input **MUST** be registrable as a queueable source, so it can be
  scheduled in the queue like a track. This is the brief's distinguishing idea taken to its conclusion.
- **REQ-INST-2** An instrument entry **MUST** have a staff-set duration or an explicit end action, and
  **MUST** obey never-silent fallback (REQ-FALL-3) if it ends early.

---

## 7. Content and ingest — *Domain E*

- **REQ-CON-1** Local ingest **MUST** tag via MusicBrainz with Chromaprint/AcoustID fingerprinting, and
  **MUST** de-duplicate by fingerprint.
- **REQ-CON-2** Ingest **MUST** produce the analysis cache (*E6*) in one pass: beatgrid, key, loudness,
  waveform, phrases.
- **REQ-CON-3** Analysis **MUST** run out-of-process; it **MUST NOT** share a process with the audio engine.
- **REQ-CON-4** Loudness **MUST** be normalised (ReplayGain / EBU R128) across all sources (*E7*). Mixing a
  CC track, a local file and a live instrument without this is unacceptable in a venue.
- **REQ-CON-5** Provider adapters **MUST** implement one interface: search, resolve, stream URL, licence
  class.
- **REQ-CON-6** v1 **MUST** ship `local`, `opensubsonic` and at least one CC provider (Jamendo), so a fresh
  install has legally playable music on first run.
- **REQ-CON-7** The system **MUST NOT** include any adapter sourcing venue playback from a consumer
  streaming account or a media downloader (*H4*, ADR-003 rationale). This is the flaw that makes the
  existing open-source jukeboxes unusable in venues, and it is designed out rather than documented around.

---

## 8. Non-functional requirements

### 8.1 Latency and real-time

| Path | Budget |
|---|---|
| Engine audio callback | **< 10 ms** deterministic, no allocation, no locks in the audio thread |
| CDEP command → control applied | p99 **< 20 ms** |
| MIDI input → audible effect | p99 **< 15 ms** |
| API request | p95 **< 150 ms** |
| WebSocket event fanout | p95 **< 250 ms** |
| Panic stop | **< 500 ms** |

> **Partially validated by SPIKE-2.** The audio-callback budget is no longer an
> assumption on Windows: miniaudio over **WASAPI shared at 128 frames** measured a
> **p99 callback interval of 3.667 ms** on the `REQ-NFR-11` baseline — comfortably
> inside 10 ms. See [`spike/spike-2/FINDINGS.md`](spike/spike-2/FINDINGS.md).
>
> Two findings change implementation guidance. **WASAPI exclusive was markedly worse
> than shared** on that hardware (17% late callbacks against 0.14%), inverting the
> usual advice — so share mode **MUST** be configurable and **SHOULD** default to
> shared until a deployment is measured. And the default output device is often not
> the one to measure: the first run characterised a USB speakerphone rather than the
> audio backend.
>
> Still unvalidated: ASIO, CoreAudio and ALSA (each needs hardware or a platform not
> available), and every non-audio row in this table.

- **REQ-NFR-1** The audio thread **MUST NOT** allocate, lock, log, or perform I/O.
- **REQ-NFR-2** Audio buffer xruns **MUST** be counted and surfaced as a CDEP `event`.

### 8.2 Availability

- **REQ-NFR-3** The appliance **MUST** be fully functional with no WAN connectivity (*G1*) — the single
  clearest advantage over cloud jukeboxes, whose music stops when the venue's connection drops.
- **REQ-NFR-4** Queue state **MUST** survive process restart.
- **REQ-NFR-5** A fusion-core crash **MUST NOT** stop audio; the engine continues its cued track and the
  core resumes on reconnect.

### 8.3 Privacy and security

- **REQ-NFR-6** No telemetry. The system **MUST NOT** transmit usage data anywhere by default (*G6*).
- **REQ-NFR-7** Patron sessions **MUST** be venue-scoped, expiring, and **MUST NOT** require personal data.
- **REQ-NFR-8** Staff endpoints **MUST** require a separate credential from patron sessions.
- **REQ-NFR-9** Outbound network access **MUST** be limited to enabled providers and **MUST** be
  disable-able entirely.

### 8.4 Deployment

- **REQ-NFR-10** A single-command container deploy **MUST** bring up a working appliance (*G4*).
- **REQ-NFR-11** Target baseline hardware: 4-core x86-64 or ARM64, 8 GB RAM, no GPU. Stem separation is
  explicitly not required for v1, so no GPU dependency exists.

---

## 9. Acceptance criteria — P0 capabilities

Testable criteria for the v1 P0 set. Each maps to capability IDs in `docs/data/capabilities.json`.

| ID | Given / When / Then |
|---|---|
| **AC-1** (*C1*) | **Given** attended mode and a screened request, **when** it reaches the staging lane, **then** it **MUST NOT** become audible until a DJ promotes it. |
| **AC-2** (*C2*) | **Given** autonomous mode and ≥2 queued tracks with confident beatgrids, **when** one ends, **then** the next is beatmatched in with no gap. |
| **AC-3** (*C3*) | **Given** a track playing in autonomous mode, **when** a DJ switches to attended, **then** audio continues uninterrupted and auto-promotion stops. |
| **AC-4** (*B2*) | **Given** a patron with a queued request, **when** the ordering changes, **then** their displayed position updates within 250 ms without a page reload. |
| **AC-5** (*B6*) | **Given** `max_pending_per_patron=2`, **when** a patron submits a third request, **then** it is rejected with reason `patron_limit`. |
| **AC-6** (*B6*) | **Given** a track played 10 minutes ago and a 60-minute cooldown, **when** any patron requests it, **then** it is rejected with reason `track_cooldown`. |
| **AC-7** (*B7*, *C6*) | **Given** explicit content is disallowed, **when** a patron searches, **then** explicit tracks appear in **neither** results nor request attempts. |
| **AC-8** (*B9*) | **Given** an empty queue, **when** the current track ends, **then** a fallback track begins within 2 seconds. |
| **AC-9** (*B8*) | **Given** any playback state, **when** staff trigger panic, **then** output stops within 500 ms and the event is logged. |
| **AC-10** (*D1*, *D2*) | **Given** a mapped controller, **when** it is unplugged and replugged, **then** the mapping re-binds automatically with no restart. |
| **AC-11** (*D2*) | **Given** a physical fader at 0.0 and software at 0.8, **when** the fader is moved, **then** the value does not jump — it engages only on crossing 0.8. |
| **AC-12** (*D5*, *D7*) | **Given** an external instrument slaved to MIDI Clock, **when** leader-deck tempo changes, **then** the instrument follows within one beat and ≤1 ms RMS jitter. |
| **AC-13** (*G1*) | **Given** WAN is disconnected, **when** the full day-in-the-life scenario (§0.4) runs, **then** every step succeeds. |
| **AC-14** (*H2*, *H4*) | **Given** a `cc_noncommercial` track and a commercial venue profile, **when** it is requested, **then** it is rejected with reason `licence_class`. |
| **AC-15** (*E1*, *E6*) | **Given** a folder of untagged audio, **when** ingest runs, **then** every file is fingerprint-identified, de-duplicated, and has a complete analysis cache. |
| **AC-16** (ADR-001) | **Given** the repository, **when** CI licence-lint runs, **then** it fails if any GPL header is reachable from Apache-2.0 code. |
| **AC-17** (ADR-002) | **Given** the CDEP conformance suite, **when** it runs against **both** engines, **then** both pass. |
| **AC-18** (REQ-CDEP-16) | **Given** a client that stops reading its socket, **when** high-rate updates are produced, **then** updates are dropped and **audio is unaffected**. |

---

## 10. Traceability

| Artefact | Role |
|---|---|
| `docs/data/capabilities.json` | 62 capabilities — the source of *what* |
| `docs/data/requirements.json` | This document's `REQ-*` set, machine-readable, traced to capabilities |
| `docs/data/oss-inventory.json` | Fork/adopt/reference/avoid verdicts per component |
| [`BACKLOG.md`](BACKLOG.md) | Work items, each citing a `REQ-*` |
| [`DECISIONS.md`](DECISIONS.md) | The five ratified ADRs this specification implements |

---

## 11. Open items carried into the backlog

1. **`LEGAL-1`** — competent legal review of the ADR-001 IPC boundary before first public distribution.
   Tracked, not resolved.
2. **`SPIKE-1`** — the ~6-week headless-Mixxx extraction spike. Its measured output may amend §2.10 and
   the §8.1 budgets.
3. **Beatgrid confidence threshold** for REQ-MODE-5 fallback — to be set empirically during SPIKE-1.
4. **Default fair-queue weights** (§3.2) — defaults specified, but they need tuning against a real venue.
