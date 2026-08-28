# BACKLOG.md — CrowdDeck v1

> **Generated file.** Edit `docs/data/backlog.json` and run `node tools/build-backlog.mjs`.
> Traceability is validated at build time: every `REQ-*` cited below exists in
> [`SPECIFICATION.md`](SPECIFICATION.md), and every fork/adopt verdict matches the OSS triage.

**Status:** 🚧 In progress — 42 of 61 stories complete · 2 partial (◐) · **Date:** 2026-08-27
**Upstream:** [`CONCEPT-IDEA.md`](CONCEPT-IDEA.md) → [`DECISIONS.md`](DECISIONS.md) → [`SPECIFICATION.md`](SPECIFICATION.md) → **this document**

**11 epics · 61 stories · 120 of 120 requirements covered**

Sizes are t-shirt estimates for a small team, not commitments: **S** ≤1 week · **M** 1-3 weeks · **L** 3-6 weeks · **XL** 6-12 weeks.

---

## Sequencing

Ordering follows [ADR-002](DECISIONS.md#adr-002--engine-fork-mixxx-or-build-new) — **contract-first,
stub second, fork third** — so the zero-prior-art fusion layer is proven before the expensive fork
begins, and the IPC contract is shaped by its consumer rather than dictated by the fork.

| Milestone | Goal |
|---|---|
| **M0 — De-risk** | Prove the two load-bearing assumptions before committing to the build. |
| **M1 — Walking skeleton** | One queue drains to audio through CDEP, with no Mixxx involved. |
| **M2 — The fusion layer** | The novelty: staging lane, autonomous drain, handoff, never-silent. |
| **M3 — Crowd plane** | Patrons can actually use it: QR join, position in line, votes, fairness. |
| **M4 — Real engine** | Swap the stub for the Mixxx-derived engine behind the same contract. |
| **M5 — Interconnect** | MIDI in, clock out, instruments in time. |
| **M6 — Venue-ready** | Policy, licensing, offline, deploy — the things that make a venue keep it switched on. |

---

## M0 — De-risk

*Prove the two load-bearing assumptions before committing to the build.*

### E0 · De-risking spikes

Two assumptions carry the plan. Both are cheap to test and expensive to get wrong.

| ID | Story | Size | Source | Requirements |
|---|---|---|---|---|
| ◐ **SPIKE-1** | **Headless Mixxx extraction spike**<br>Strip Mixxx to a headless binary, expose the Control bus over a socket, measure command→audio latency. Output is the validated CDEP control set (§2.10) and the §8.1 budgets. This is the single highest-value action in the whole plan. PARTIAL — the source-analysis half is done and reported in spike/SPIKE-1-REPORT.md: the enumerable-control-bus assumption ADR-002 rests on is verified, EngineMixer is confirmed GUI-free, §2.10 is validated and two errors fixed, and CDEP is amended to parameter space. The build-and-measure half is NOT done — it needs Qt6/CMake/MSVC and real audio+MIDI hardware, which this environment has none of. §8.1 latency budgets therefore remain unvalidated assumptions and are the largest residual risk in the plan. | L | `FORK` | `REQ-CDEP-17` `REQ-CDEP-18` |
| ✅ **LEGAL-1** | **Licence risk position for the ADR-001 boundary**<br>RESOLVED BY OWNER DECISION, NOT BY LEGAL REVIEW — ADR-006. The project owner chose two separate downloads (so no combined work is ever distributed), US and EU as target jurisdictions, single-GPL as an accepted fallback, and no counsel. Keeping the split therefore costs nothing: we own every line of the Apache-2.0 layer and can relicense it to GPL at any time, so the worst case equals the certain case of abandoning it now — while abandoning it is a one-way door once outside contributors arrive. Two new requirements make the position durable: REQ-LIC-8 (separate release artifacts, never one installer) and REQ-LIC-9 (DCO inbound=outbound, keeping the fallback exercisable). NOTE HONESTLY: no legal review was obtained and none is planned. This is knowing risk acceptance with a cheap remedy, not a clearance. legal/REVIEW-PACK.md stays ready with seven questions if counsel is ever engaged. | S | build | `REQ-LIC-2` `REQ-LIC-4` `REQ-LIC-5` `REQ-LIC-8` `REQ-LIC-9` |
| ◐ **SPIKE-2** | **Audio backend selection**<br>Measure miniaudio vs PortAudio for WASAPI-exclusive/ASIO/CoreAudio/ALSA at 64-128 sample buffers on the REQ-NFR-11 baseline. WASAPI MEASURED — spike/spike-2/FINDINGS.md. The §8.1 audio-callback budget is achievable: WASAPI shared at 128 frames gave a p99 callback interval of 3.667ms against a 10ms budget on commodity laptop hardware, with 0.14% late callbacks. Three findings: (1) exclusive mode was markedly WORSE than shared (17% late vs 0.14%), inverting the usual advice — share mode must be configurable and default to shared; (2) the first run measured the default device, a USB speakerphone, whose large hardware buffer would have been misread as 'no configuration met the budget'; (3) the xrun proxy was too strict and was recalibrated from measurement, judging a rate rather than any-at-all. Built with portable GCC (w64devkit) because MSVC needs admin rights; the compiler does not materially affect a 10ms budget dominated by the OS audio stack. CROSS-PLATFORM: CoreAudio and ALSA cannot be substituted — CoreAudio IS macOS audio and ALSA IS the Linux kernel API. But compile-and-run is separable from latency: a CI workflow now builds the probe on ubuntu-latest against real ALSA headers and macos-latest against real CoreAudio frameworks, and runs the callback loop on both, every push. It caught a real bug immediately — the POSIX branch used clock_gettime with no <time.h> include and had never been compiled anywhere. STILL OUTSTANDING (all need hardware): ASIO latency (needs an interface), CoreAudio latency (needs a Mac), ALSA latency (needs real Linux with a sound card), and the PortAudio comparison. | S | `ADOPT` | `REQ-NFR-1` |

---

## M1 — Walking skeleton

*One queue drains to audio through CDEP, with no Mixxx involved.*

### E1 · CDEP contract and stub engine

The contract is written before any engine exists so it is shaped by its consumer, not by the fork. The stub is also the permanent proof that the engine is replaceable (REQ-LIC-5).

| ID | Story | Size | Source | Requirements |
|---|---|---|---|---|
| ✅ **CDEP-1** | **Specify and publish the CDEP schema**<br>JSON Schema for every message type, versioned cdep/1, with the documented error-code enumeration. Transport is arms-length by design: no shared memory, no GPL-defined structures, because that generality is a licence requirement. | S | build | `REQ-CDEP-1` `REQ-CDEP-2` `REQ-CDEP-3` `REQ-CDEP-7` `REQ-CDEP-8` `REQ-CDEP-9` |
| ✅ **CDEP-2** | **Stub engine: handshake, describe, get/set**<br>Apache-2.0 reference engine with a self-describing control set, accepting multiple concurrent clients with independent subscription state. No Mixxx dependency. | M | build | `REQ-CDEP-4` `REQ-CDEP-11` `REQ-CDEP-12` `REQ-CDEP-13` `REQ-CDEP-18` |
| ✅ **CDEP-3** | **Stub engine: gapless sequential playback**<br>Load, transport, and gap-free track-to-track playback on the chosen audio backend. Enough to develop the entire fusion core against. | M | `ADOPT` | `REQ-CDEP-18` `REQ-FALL-3` |
| ✅ **CDEP-4** | **Subscriptions with coalescing and back-pressure**<br>max_hz coalescing and bounded send queues. Includes the AC-18 test that a stalled client cannot disturb audio. | M | build | `REQ-CDEP-14` `REQ-CDEP-15` `REQ-CDEP-16` |
| ✅ **CDEP-5** | **Conformance suite**<br>Executable suite both engines must pass, wired into CI. Gates every future engine change. | M | build | `REQ-CDEP-17` |

### E2 · Repository, licence enforcement and CI

The split licence is only real if it is mechanically enforced. Contributor confusion is the main practical risk, and the mitigation is automation rather than documentation.

| ID | Story | Size | Source | Requirements |
|---|---|---|---|---|
| ✅ **REPO-1** | **Plane layout and SPDX headers**<br>Directory structure per SPECIFICATION §1.2, SPDX header on every file. | S | build | `REQ-LIC-1` |
| ✅ **REPO-2** | **CI licence-lint gate**<br>Fail the build if any GPL header is reachable from Apache-2.0 code, including transitively. Satisfies AC-16. | M | build | `REQ-LIC-2` `REQ-LIC-3` |
| **REPO-3** | **LGPL-only FFmpeg build with component audit**<br>A GPL-configured FFmpeg silently relicenses the product. Pin the configuration and assert it in CI; generate NOTICE per artifact. | M | `ADOPT` | `REQ-LIC-6` `REQ-LIC-7` |
| ✅ **REPO-4** | **Assert release artifacts stay separate**<br>ADR-006 rests on never shipping a combined installer, and the realistic way that is lost is a well-meaning convenience build, not a court. DONE — release.json declares the two artifacts, tools/check-artifacts.mjs fails if any artifact contains both planes (reusing licence-lint prefixes so the two cannot disagree), and a DCO job checks Signed-off-by on every PR commit (REQ-LIC-9). While wiring this up, CI was found to be running a hardcoded test-glob list that had drifted behind package.json — 76 tests, every data/, clients/ and tools/ test, had never run in CI while it reported green. CI now calls npm scripts only, and tools/test/ci-workflow.test.js fails if the duplication returns. | S | build | `REQ-LIC-8` `REQ-LIC-9` |

---

## M2 — The fusion layer

*The novelty: staging lane, autonomous drain, handoff, never-silent.*

### E3 · Unified Scheduler — the novelty

Domain C has no prior art in any product, open or closed. Built against the stub engine so it is proven before fork surgery begins.

| ID | Story | Size | Source | Requirements |
|---|---|---|---|---|
| ✅ **SCH-1** | **Queue entry lifecycle state machine**<br>States, guarded transitions, and an append-only event log with actor and reason. | M | build | `REQ-SCH-1` `REQ-SCH-2` `REQ-SCH-5` |
| ✅ **SCH-2** | **Staging lane and DJ promotion**<br>The core design decision: requests never reach audio without a DJ or the autonomous mixer. Satisfies AC-1. | M | build | `REQ-SCH-3` `REQ-SCH-4` |
| ✅ **SCH-3** | **Priority ordering function**<br>Votes and boost units as two inputs to one score, plus the anti-starvation aging term. Reference Raveberry for vote decay. Payments in v1.1 need no change here. | M | `REFERENCE` | `REQ-SCH-6` `REQ-SCH-7` `REQ-SCH-8` `REQ-SCH-9` `REQ-SCH-10` |
| ✅ **SCH-4** | **Fair-queue anti-monopoly rules**<br>Per-patron limits, artist/track cooldown, rate limiting, one-vote-per-entry as a DB constraint. Reference Karaoke Eternal's fair queue and Mopidy-Party throttling. Satisfies AC-5, AC-6. | M | `REFERENCE` | `REQ-SCH-14` `REQ-SCH-15` `REQ-SCH-16` `REQ-SCH-17` `REQ-SCH-18` |
| ✅ **SCH-5** | **Autonomous drain with beatmatched transitions**<br>Auto-mix the queue when no DJ is present, using beatgrid confidence with a timed-crossfade fallback. Satisfies AC-2. | L | `REFERENCE` | `REQ-MODE-4` `REQ-MODE-5` |
| ✅ **SCH-6** | **Gapless mode handoff**<br>Attended ⇄ autonomous with no interruption to audio. Satisfies AC-3. | M | build | `REQ-MODE-1` `REQ-MODE-2` `REQ-MODE-3` |
| ✅ **SCH-7** | **Never-silent fallback engine**<br>Fallback rotation, policy-screened, ≤2s dead air in every state including engine reconnect. Reference Liquidsoap. Satisfies AC-8. | M | `REFERENCE` | `REQ-FALL-1` `REQ-FALL-2` `REQ-FALL-3` `REQ-FALL-4` |

### E4 · Data model and persistence

The two things that are expensive to retrofit — venue_id and the credit ledger — land now, per ADR-003 and ADR-004.

| ID | Story | Size | Source | Requirements |
|---|---|---|---|---|
| ✅ **DAT-1** | **Schema with venue_id from the first migration**<br>Near-zero cost now; a migration across every table and query later. Built in data/src/schema.js + db.js on Node's built-in node:sqlite, so zero runtime dependencies still holds. Two tests guard it: every table in VENUE_SCOPED_TABLES carries venue_id, and any NEW table not listed there fails the suite. The venue is bound when the database is opened rather than passed per call, so no call site can read another venue's data. | M | build | `REQ-DAT-1` `REQ-DAT-2` |
| ✅ **DAT-2** | **Append-only credit ledger**<br>Derived balances, compensating entries, non-expiring credits, atomic spend. No paid top-up path in v1. Append-only is enforced by SQL triggers that raise on UPDATE and DELETE, not by convention. Balance is SUM(delta) with no balance column to drift. spendFor({apply}) runs the debit and the effect in one transaction, so a failed boost cannot consume credit — verified by deliberately breaking the atomicity and confirming the suite went red. | M | build | `REQ-DAT-3` `REQ-DAT-4` `REQ-DAT-5` `REQ-DAT-6` `REQ-DAT-7` |
| ✅ **DAT-3** | **Licence-class model and gating**<br>Answer 'may this venue legally play this now?' from track class plus venue profile. Satisfies AC-14. Gating logic lives in core/src/policy.js; data/src/tracks.js stores the facts it reads and refuses a track with no declared licence class — there is deliberately no default, because defaulting to 'unknown' turns 'nobody checked' into a stored fact. Attribution-required classes cannot be stored without attribution text (REQ-DAT-11). | M | build | `REQ-DAT-8` `REQ-DAT-9` `REQ-DAT-10` `REQ-DAT-11` |
| ✅ **DAT-4** | **Play log and CSV export**<br>Local-only evidence trail for PRO reporting, never transmitted. RFC 4180 quoting is tested against a title containing both a comma and quotes, because one unescaped comma shifts every later column and quietly corrupts a royalty report. REQ-DAT-14 is tested by reading the module source and failing if any transport API appears in it. | S | build | `REQ-DAT-12` `REQ-DAT-13` `REQ-DAT-14` |
| ✅ **DAT-5** | **Durable queue across restart**<br>The queue is durable and the engine is replaceable; a core crash must not stop audio. REQ-NFR-4: data/src/queue-store.js round-trips the whole entry — state, votes, voter IDENTITIES so one-vote-per-patron still holds after a restart, and the transition log that is the audit trail for staff overrides. REQ-NFR-5: core/src/engine-link.js reconnects with jittered backoff and resyncs by reading the deck FIRST, adopting a playing track rather than re-issuing load — a naive reconnect would restart the track the room is dancing to. Tested against a real engine process over a real socket. | M | build | `REQ-NFR-4` `REQ-NFR-5` |

---

## M3 — Crowd plane

*Patrons can actually use it: QR join, position in line, votes, fairness.*

### E5 · Crowd plane

Fork Karaoke Eternal (ISC) — it already implements QR join, rooms and a dynamic fair queue, which is most of the TouchTunes interaction model under a licence we can freely relicense.

| ID | Story | Size | Source | Requirements |
|---|---|---|---|---|
| **CRW-1** | **Fork Karaoke Eternal and generalise the fair queue**<br>Generalise from 'singers' to 'patrons with priority'. Strip karaoke-specific media handling for v1. | L | `FORK` | `REQ-SCH-14` |
| ✅ **CRW-2** | **Venue-scoped patron sessions**<br>No app install, no personal data, expiring venue-scoped tokens. Join is by URL; QR generation is tracked separately as DISP-1 after a hand-rolled encoder failed decoder verification. | M | `FORK` | `REQ-API-3` `REQ-NFR-7` |
| ✅ **CRW-3** | **Live queue with position in line**<br>TouchTunes' single most-cited feature, and what makes paid priority meaningful later. Satisfies AC-4. | M | build | `REQ-SCH-11` `REQ-SCH-12` `REQ-SCH-13` |
| ✅ **CRW-4** | **Voting with one-vote-per-patron**<br>Enforced by a uniqueness constraint, not UI logic. | S | build | `REQ-SCH-17` |
| ✅ **CRW-5** | **Staff override console**<br>Skip, veto, pin, lock, mute, panic-stop within 500ms. Satisfies AC-9. | M | build | `REQ-API-5` `REQ-API-6` |
| ✅ **CRW-6** | **Venue display screen**<br>Now playing, up next, QR to join, attribution for CC tracks. wavesurfer.js for waveforms. | M | `ADOPT` | `REQ-DAT-11` |
| ✅ **DISP-1** | **QR code on the venue display**<br>Needs a vetted QR encoder. A hand-rolled one was written and removed after a real decoder proved it did not scan; a QR that fails in a venue is worse than none. DONE — clients/lib/qr.js implements ISO/IEC 18004 byte mode, versions 1-10, all four ECC levels, with zero runtime dependencies. The second attempt failed too at first: format information was transposed (rows and columns swapped) and the version-information generator polynomial was ten bits instead of thirteen. Both were found by diffing against an independent encoder and solving the bit mapping empirically rather than writing it from memory again. Verified end to end: 19 tests encode, rasterise and decode with jsQR (a dev-only oracle), and the QR as actually painted by the venue display decodes at 120-300px. | S | `ADOPT` | `REQ-DAT-11` |

### E6 · Public API and clients

The API is the only path in (REQ-API-1). Third-party clients are how an open project out-features a closed one.

| ID | Story | Size | Source | Requirements |
|---|---|---|---|---|
| ✅ **API-1** | **HTTP + WebSocket surface, venue-namespaced**<br>/v1/venues/{id}/... from the start so client URLs survive the move to federation. OpenAPI 3.1 generated in CI. | L | build | `REQ-API-1` `REQ-API-2` `REQ-API-4` |
| **API-2** | **OpenSubsonic-compatible endpoint**<br>Including jukeboxControl with the jukeboxMediaTypes extension. Buys an existing client ecosystem on day one. | L | `ADOPT` | `REQ-API-10` `REQ-API-11` `REQ-API-12` |
| ✅ **API-3** | **DJ console (web)**<br>Per ADR-005. Served locally, works with no WAN, streams deck state at ≥20Hz. Controller input bypasses the UI entirely. | L | `ADOPT` | `REQ-API-7` `REQ-API-8` `REQ-API-9` |

---

## M4 — Real engine

*Swap the stub for the Mixxx-derived engine behind the same contract.*

### E7 · Mixxx-derived engine

Fork now that the contract is proven. Its Control bus already drives the whole engine from a scripting layer, so this is largely adding a transport over a proven abstraction.

| ID | Story | Size | Source | Requirements |
|---|---|---|---|---|
| **ENG-1** | **Fork and strip to headless**<br>Keep engine, audio, soundio, mixer, analyzer, effects, control, controllers, sources, track. Delete skin, widget, qml, dialog, preferences, rendergraph, shaders. SPIKE-1: effects is NOT optional — per-deck EQ is routed through [EqualizerRack1_[ChannelN]_Effect1], so the rack must be retained. SPIKE-1 also found EngineMixer includes only QtCore, so the headless strip is less risky than assumed. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source. | XL | `FORK` | `REQ-LIC-4` |
| **ENG-2** | **CDEP server over the Control bus**<br>Bridge ControlObject / ControlDoublePrivate::getAllInstances() to CDEP describe/get/set/subscribe. Must pass the same conformance suite as the stub. Satisfies AC-17. SPIKE-1: describe() is built from getAllInstances() + name()/description()/defaultValue(); min/max are NOT reachable, so serve parameter space via ControlDoublePrivate::getParameter/setParameter (REQ-CDEP-12a). Coalescing for REQ-CDEP-14 is inheritable from ControlObjectScript's CompressingProxy rather than built from scratch. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source. | L | `FORK` | `REQ-CDEP-5` `REQ-CDEP-6` `REQ-CDEP-12` `REQ-CDEP-12a` |
| **ENG-3** | **Four decks with EQ, filter, crossfader**<br>Inherited from Mixxx; wire to the CDEP control set. SPIKE-1: EQ is an effects-rack unit, not a deck control — budget for wiring [EqualizerRack1_[ChannelN]_Effect1]/parameter1..3. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source. | M | `FORK` | `REQ-CDEP-10` |
| **ENG-4** | **Beatgrid, key detection and key-lock**<br>Inherited analysers. Key-lock via SoundTouch (LGPL) rather than Rubber Band, keeping the permissive option open. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source. | L | `FORK` | `REQ-CON-2` |
| **ENG-5** | **Sync lock with leader deck**<br>The leader deck becomes the single tempo source published to every transport. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source. | M | `FORK` | `REQ-CLK-1` |
| **ENG-6** | **Hot cues and loops**<br>Inherited from Mixxx. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source. | M | `FORK` | `REQ-CDEP-10` |
| **ENG-7** | **Real-time safety audit**<br>Assert no allocation, locks, logging or I/O in the audio callback. Count and surface xruns as CDEP events. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source. HARDWARE GAP: AC-12 (MIDI → audible, p99 < 15ms) needs a real USB-MIDI controller — none is attached to the dev machine. A virtual loopback such as loopMIDI exercises the software path but cannot measure true latency, because that number includes USB transfer and the driver stack. SPIKE-2: replace the probe's late-callback heuristic with real xruns from the engine — the proxy measures 'the callback was late', not 'the audio glitched'. | M | build | `REQ-NFR-1` `REQ-NFR-2` |

### E8 · Content sources and ingest

Fork Mopidy's backend abstraction (Apache-2.0) rather than inventing a provider interface. Ship legal music in the box.

| ID | Story | Size | Source | Requirements |
|---|---|---|---|---|
| ✅ **CON-1** | **Provider interface from Mopidy's backend API**<br>One interface: search, resolve, stream URL, licence class. Shaped after Mopidy's backend API. DONE — providers/src: Provider (the contract), ProviderRouter (fan-out) and LocalProvider (the venue's own library, no network at all). Two decisions carry the weight. licenceClass is part of the contract with no default: a provider that cannot establish one returns 'unknown', which policy blocks in a commercial venue — 'nobody checked' and 'checked and it's fine' must never be the same value. And a slow provider must not stall the venue: providers are searched concurrently under a per-provider timeout, and failures are reported as {tracks, errors, degraded} rather than swallowed, so the console can say which source is down instead of silently offering a smaller catalogue. That is what keeps REQ-NFR-3 real — an internet outage must not take the local library with it. Wiring it into the API exposed a name collision: the option was called 'router' and VenueApi already used this.router for its HTTP route table, so every endpoint returned 500. Renamed, and a test now pins both names apart and checks the endpoint end to end. | L | `FORK` | `REQ-CON-5` |
| **CON-2** | **Local ingest with fingerprint tagging**<br>beets + Chromaprint/AcoustID + MusicBrainz, de-duplicating by fingerprint. Satisfies AC-15. | L | `ADOPT` | `REQ-CON-1` |
| **CON-3** | **Out-of-process analysis pipeline**<br>One pass produces beatgrid, key, loudness, waveform, phrases. librosa (ISC) keeps the analysis path licence-safe. Never shares a process with the audio engine. | L | `ADOPT` | `REQ-CON-2` `REQ-CON-3` |
| **CON-4** | **OpenSubsonic consumer provider**<br>Consume Navidrome and friends over HTTP — separate process, so GPL-3.0 stays out of our binary. | M | `ADOPT` | `REQ-CON-6` |
| ✅ **CON-5** | **Creative Commons provider (Jamendo)**<br>So a fresh install has legally playable music on first run, with licence metadata from the API. DONE — providers/src/jamendo.js plus cc-licence.js, which is kept separate because deciding what a Creative Commons URL permits is the most legally consequential parsing in the product. The rule: any licence containing 'nc' is blocked in a commercial venue; 'nd' and 'sa' constrain derivative works, not performance, so an unmodified playback is unaffected by either — treating by-nd as unsafe would discard a large slice of legitimate catalogue for no legal reason, and treating by-nc as safe would be a breach. Anything not positively recognised is 'unknown', which policy blocks. Non-commercial tracks are filtered twice, server-side and client-side, because a silent API change would otherwise put unplayable music in front of patrons and the consequence lands on the venue. The API signals failure inside a 200 response, so checking res.ok alone would turn an invalid client ID into a silently empty catalogue; that is handled and tested. Probing the guards found the lookalike-host test was passing for an incidental reason and missing the path-embedded case, which is now covered. | M | `ADOPT` | `REQ-CON-6` |
| **CON-6** | **Loudness normalisation across sources**<br>ReplayGain / EBU R128. Non-negotiable when a CC track, a local file and a live instrument follow one another. | M | `ADOPT` | `REQ-CON-4` |
| ✅ **CON-7** | **Assert no consumer-streaming or downloader adapters**<br>A CI check plus an architectural note. This is the flaw that makes existing open jukeboxes unusable in venues, and designing it out is a feature. DONE — tools/check-content-sources.mjs fails the build on any import of a consumer-streaming client or a downloader, and on any source reference to their API hosts. Documentation may discuss them freely; source may not call them. The rule is NOT 'no streaming': licensed B2B services that sell public-performance rights (Soundtrack Your Brand and peers) are exactly what a venue should use and remain welcome — as do OpenSubsonic, Creative Commons repertoire and record pools. Writing the tests found a bug that had made the guard silently inert: the comment stripper treated the // in https:// as a line comment, so every banned host inside a URL was invisible. It now tracks quote state, and a test pins that. | S | `AVOID` | `REQ-CON-7` |

---

## M5 — Interconnect

*MIDI in, clock out, instruments in time.*

### E9 · Interconnect

MIDI as a first-class subsystem, not a settings page. A UMP-native start is a lead available only to a project beginning now.

| ID | Story | Size | Source | Requirements |
|---|---|---|---|---|
| ✅ **MID-1** | **libremidi backend with stable port identity**<br>MIDI 1.0 + 2.0/UMP, hot-plug, identity-bound mappings that survive reboot. RtMidi as fallback behind our own port interface. HID for high-resolution jog wheels is a SHOULD in v1 — 7-bit MIDI's 128 steps per rotation is not enough for credible feel. Satisfies AC-10. | L | `ADOPT` | `REQ-MIDI-1` `REQ-MIDI-2` `REQ-MIDI-3` `REQ-MIDI-7` |
| ✅ **MID-2** | **MIDI learn with soft-takeover**<br>No parameter jumps when a physical control is out of sync with software state. Satisfies AC-11. | M | build | `REQ-MIDI-4` |
| ✅ **MID-3** | **Declarative mapping format targeting CDEP controls**<br>Reference Mixxx's XML+JS model. Target list generated from CDEP describe, so mappings need no hard-coded engine knowledge. | L | `REFERENCE` | `REQ-MIDI-5` `REQ-MIDI-6` |
| ✅ **MID-4** | **MIDI Clock out at 24 PPQN from the leader deck**<br>≤1ms RMS jitter at the output. Short clock path, no Thru daisy-chains. MTC is explicitly excluded from musical sync — its ~0.6ms resolution and traffic sensitivity make it a positional reference only. | M | build | `REQ-CLK-1` `REQ-CLK-2` `REQ-CLK-5` `REQ-CLK-6` |
| **MID-5** | **Ableton Link integration**<br>GPL-2.0-or-later, so it lives in engine/. Quantum and start/stop sync; must survive a mode handoff. | M | `ADOPT` | `REQ-CLK-3` `REQ-CLK-4` |
| ✅ **MID-6** | **Live MIDI instrument as a queueable source**<br>The brief's distinguishing idea: a groovebox is scheduled in the queue like a track, in time with the decks. Satisfies AC-12. | L | build | `REQ-INST-1` `REQ-INST-2` |
| **MID-7** | **MIDI-CI Property Exchange auto-mapping**<br>Let capable controllers describe themselves. Every incumbent still hand-authors mapping files; this is the defensible lead. | L | build | `REQ-MIDI-8` `REQ-MIDI-9` |

---

## M6 — Venue-ready

*Policy, licensing, offline, deploy — the things that make a venue keep it switched on.*

### E10 · Venue readiness

The difference between a demo and something a venue keeps switched on.

| ID | Story | Size | Source | Requirements |
|---|---|---|---|---|
| ✅ **VEN-1** | **Venue policy engine**<br>Explicit filter, allow/block lists, dayparting, licence gating, logged staff overrides. | L | build | `REQ-POL-1` `REQ-POL-3` `REQ-POL-4` |
| ✅ **VEN-2** | **Policy-scoped search**<br>An unrequestable track is never offered. Filtering only at request time is a defect. Satisfies AC-7. | M | build | `REQ-POL-2` |
| ✅ **VEN-3** | **Venue licensing profile**<br>Which PRO licences the venue holds. Post-consent-decree, operators need separate ASCAP, BMI and SESAC licences — and since GMR began signing major writers away from the incumbents, a fourth — so the software tracks rather than assumes. DONE — data/src/licensing.js models each licence individually with validity dates, because a lapsed licence is not a licence. The decisive design choice is the middle outcome: when a track carries no PRO metadata (the normal case) and the venue holds some but not all licences, the answer is neither 'blocked' (which would block most of the catalogue and get switched off) nor a silent 'yes' (which manufactures false confidence) — it returns coverage:'gap' naming the missing PROs, so the venue can buy the licence or accept a known risk knowingly. Territories differ in what full coverage means (the UK splits PRS from PPL), and an unknown territory is reported as undeterminable rather than covered. | M | build | `REQ-DAT-9` |
| ✅ **VEN-4** | **Offline-first verification**<br>Run the full day-in-the-life scenario with WAN disconnected in CI. Satisfies AC-13. | M | build | `REQ-NFR-3` `REQ-NFR-9` |
| ✅ **VEN-5** | **No-telemetry guarantee**<br>Assert no outbound traffic beyond enabled providers; separate staff credentials. | S | build | `REQ-NFR-6` `REQ-NFR-8` |
| **VEN-6** | **Single-command container deploy**<br>Compose file, sane defaults, CC catalog seeded, on 4-core/8GB with no GPU. | M | `ADOPT` | `REQ-NFR-10` `REQ-NFR-11` |

---

## Deferred

Recorded so they are not silently forgotten, and not re-litigated during planning.

| Item | When | Why |
|---|---|---|
| Payment provider integration | v1.1 | ADR-003 — the ordering model and ledger ship in v1 so the scheduler needs no change. PCI scope, chargebacks and fraud are deliberately not v1 problems. |
| Operator console and multi-venue | v2 | ADR-004 — and as federation over appliances, not shared-database multi-tenancy. Offline-first rules out multi-tenant SaaS. |
| Stem separation and per-stem deck control | v1.1 | Precompute with Demucs on ingest; needs a GPU story that v1 deliberately avoids (REQ-NFR-11). |
| DVS timecode vinyl | v1.1 | P2, and largely inherited free from the Mixxx fork once the engine lands. |
| Licensed-streaming adapters | when agreements exist | Beatport/TIDAL/SoundCloud each require a commercial agreement. Ship the interface, not unauthorised implementations. |
| DMX lighting and show control | v2 | OLA + QLC+ integration. rekordbox's phrase-aware auto-lighting is the benchmark to match. |
| Karaoke media and singer rotation | v2 | Comes partly free from the Karaoke Eternal fork; deliberately out of v1 scope. |
| Multi-zone synchronised audio | v2 | Snapcast as a separate process at the edge. |
| Mackie Control / HUI emulation | v2 | P2. Unlocks motorised-fader surfaces no DJ app addresses. |
| Polished mouse-only scratching | not planned | ADR-005 accepts this as mediocre. The target user is a venue with hardware. |
