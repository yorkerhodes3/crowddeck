# CONCEPT-IDEA.md — CrowdDeck

**Status:** Phase 1 (Concept) — complete, awaiting review
**Date:** 2026-08-26
**Companion artefact:** [`docs/index.html`](docs/index.html) — interactive dashboard explainer
**Next gates:** `SPECIFICATION.md` → `BACKLOG.md` (both blocked pending review of this document)

---

## 0. What this document is

A research artefact supporting a build decision. Nothing has been built. Its job is to answer four
questions before a single line of product code is written:

1. What does the "DJ App Pro" tier actually do, feature by feature?
2. What does TouchTunes actually do, and what makes its model work?
3. What content sources and MIDI interconnection standards are available to us, under what terms?
4. **What already exists in open source that we can fork, so that we do not rebuild it?**

Question 4 was the explicit brief and it materially changed the shape of the proposal. Three existing
projects cover so much ground that building their functionality from scratch would be indefensible.

---

## 1. Executive summary

**The gap.** Every product surveyed is excellent at one half of the problem and structurally uninterested
in the other half. Across djay Pro AI, Serato DJ Pro, rekordbox 7, Traktor Pro 4 and Mixxx, the
crowd-participation capability is effectively **zero**. Across TouchTunes, AMI NEXTGEN, Rockbot and the
Festify/Jukestar class, the performance capability is effectively **zero**. The two columns of the
capability matrix are near-perfect complements.

**Why that matters.** Real venues are both, on a schedule. A bar is an unattended jukebox from 11:00 to
21:00 and a DJ room from 21:00 to close. Today that means two systems, two libraries and an awkward
physical handover. No product, open or closed, spans it.

**The proposal.** CrowdDeck: an open-source venue runtime running a professional multi-deck DJ engine and
a TouchTunes-style patron request jukebox on **one scheduler, one library and one clock**, with MIDI
treated as a first-class interconnection fabric rather than a settings page.

**The single design decision that makes it work.** Crowd requests never write directly to the audio
output. They land in a **staging lane**. When a DJ is present, they approve, reorder and beatmatch from it.
When no DJ is present, an autonomous mixer drains the same lane with beatmatched transitions. One queue,
two consumers. This is the part nobody has implemented.

**The build/fork position.** Fork three projects, adopt twenty as dependencies, study eleven more, and
explicitly refuse seven. Details in §5.

**The decision that must be made first.** The most valuable code to reuse carries the strongest copyleft.
The licence structure is an architecture decision and it must be settled in `SPECIFICATION.md` before any
engine work begins (§8).

---

## 2. Method

| Stage | Approach |
|---|---|
| Competitive & technical research | Tavily search API, 56 queries with advanced search depth across five domains: DJ software feature sets, jukebox platforms and their business model, content-source licensing, MIDI/interconnection standards, and the open-source landscape. |
| Open-source triage | 80 candidate repositories queried directly against the **GitHub REST API** for stars, language, licence, last-push date and archive status. |
| Licence verification | Where GitHub reported `NOASSERTION`, the repository's actual `LICENSE` file was fetched and read. |

That last step mattered. Automated licence detection was wrong or unhelpful for twelve projects, including
several load-bearing ones:

- **JUCE** reports `NOASSERTION`; the file shows JUCE 9 modules are **AGPLv3 or commercial**.
- **miniaudio** reports `NOASSERTION`; the file offers a **choice of public domain or MIT-0**.
- **Mixxx** reports `NOASSERTION`; the file confirms **GPL-2.0-or-later**.
- **Ableton Link** reports `NOASSERTION`; it is **GPL-2.0-or-later**, with a commercial option from Ableton.
- **OLA** reports `NOASSERTION`; it is **split** — LGPL-2.1 for `libola`, GPL-2.0 for the `olad` daemon.

Search-engine summarisation also produced several plausible-sounding projects that do not exist, and
described at least one proprietary product as open source. Every project named in §5 was confirmed to
exist via the API. Raw findings are preserved in [`research/`](research/).

> Caveat: capability scores in the matrix are analyst judgements of *published feature depth*, not audio
> quality benchmarks. Licensing content is research, not legal advice.

---

## 3. Competitive analysis — the DJ tier

### 3.1 What each product brings

**djay Pro AI (Algoriddim)** — subscription, ~$19/mo. Neural Mix real-time separation into four stems
(vocals, harmonics, drums, bass) controllable on any deck. Automix AI detects intros, outros and rhythmic
patterns to build production-style transitions automatically. Fluid Beatgrid, four decks, crossfader
fusion across isolated stems, DVS, sampler, slicer, XY pad, up to three chainable FX per deck, video
mixing. Over 100 class-compliant controllers plus MIDI-Learn. Streams from TIDAL, SoundCloud Go+ and
Beatport with a 50–100 track offline locker.

**Serato DJ Pro** — ~$179 perpetual. The DVS and scratch-response benchmark. Stems with dedicated Stems
Pad FX, Practice Mode (mix with no hardware attached), four decks, ~50 FX, Sampler, Beat Jump, Slicer,
Quantize, Smart Sync, Key Analysis. Video, Play and DVS are separately-sold expansion packs.

**rekordbox 7 (AlphaTheta/Pioneer DJ)** — ~$129 perpetual, cloud plans from $14.99/mo. Tightest CDJ/XDJ
integration and the deepest preparation workflow. **CloudDirectPlay** lets a DJ log into their account on
a CDJ-3000 and stream their entire cloud library with Hot Cues and Memory Cues preserved and edits synced
back — no USB stick. **Lighting mode** generates lighting cues from track phrase analysis and drives
DMX-512 through the RB-DMX1 interface.

**Traktor Pro 4 (Native Instruments)** — ~$119 perpetual. The most modular controller mapping in the
category. Remix Decks for triggering samples/loops/stems, a **Pattern Player** with four independent drum
units, 17 kits and step sequencing, iZotope RX stem separation with per-stem volume/filter/FX, 43 FX
across nine slots, Auto-Master, DVS, and native Ableton Link.

**VirtualDJ 2026 (Atomix)** — free Lite tier, ~$299 Pro. The most feature-dense product surveyed.
Real-time **five-way** stem separation including hi-hats. **Sandbox Mode** lets the DJ jump ahead and build
the next transition without interrupting what the audience hears, restoring state on exit. StemSwap
sampler records stem samples live for on-the-fly mash-ups. AI/text-prompted beat-synced video loops and
shaders, VST hosting, karaoke, one-click mapping for thousands of controllers.

**Mixxx 2.5 / 2.6** — free, GPL-2.0-or-later, ~7,100 stars, actively developed. Four decks, BPM and key
detection, sync lock with leader-deck selection, hot cues, loops, beat-roll, quantize, Auto DJ crossfade
automation, DVS timecode, sampler, mic/aux inputs, ReplayGain, recording, and live Icecast/Shoutcast
broadcasting. Imports iTunes, Traktor, Rekordbox, Serato and Rhythmbox libraries. **2.6 adds STEM
mixing** built on Native Instruments' open stem specification, extended to accept any codec Mixxx already
supports. Its notable weaknesses are exactly our opportunities: no native streaming sources, no crowd
layer, no show control.

### 3.2 What this tier establishes as table stakes

Four decks. Accurate beatgrids with manual editing. Key detection and key-lock. Sync with an explicit
leader deck. Hot cues, loops, beat jump, slicer, quantize, slip. Chainable per-deck FX. And, as of this
generation, **stems are no longer a differentiator — they are expected**.

### 3.3 What this tier universally lacks

Any concept of an audience. Not one of these products has a patron-facing surface, a request queue, a
payment path, a content-policy engine, or multi-tenancy. The assumption is a skilled operator standing at
the machine, and everything follows from it.

---

## 4. Competitive analysis — the jukebox tier

### 4.1 TouchTunes decoded

TouchTunes is not interesting because of its catalog. It is interesting because of a small number of
mechanics that no open-source project has replicated:

**Position in line.** The single most-cited feature in the research. Showing a patron exactly where their
song sits converts an unbounded, frustrating wait into a bounded, tolerable one.

**Paid priority.** Fast Pass / Song Upgrade lets a patron spend extra credits to jump the queue. This is
the core monetisation primitive of the entire industry — and it works precisely *because* position in line
is visible. One feature manufactures the demand the other one sells. That coupling is the design insight.

**The credit wallet.** Credits never expire, sit in a wallet and can auto-refill. This converts a
transaction into a balance, which is a retention mechanic. Layered on top: TouchTunes Rewards loyalty
points, emoji reactions, personal playlists, and a visible feed of who played what.

**Zero-capex venue economics.** Hardware is installed at no upfront cost. Revenue comes from per-song fees
that **already include the negotiated PRO and label licensing**, then splits between the venue and the
local amusement operator — the venue commonly taking roughly a quarter to a half of net proceeds.
Licensing bundled into the play fee is the reason venues accept the deal at all.

**Operator route management.** TouchTunes' cloud platform and AMI's Co-Pilot app both let one operator
manage many venues remotely: volume, content scheduling, promotions, detailed route reporting.
Multi-tenancy is not an enterprise afterthought here; it *is* the business model.

**The cabinet as venue display.** Playdium, Virtuo/Virtuo II and Angelina are modular, cloud-connected
units — field-replaceable backplane, payment door and camera modules, snap-in parts, removable
motherboards, HD 24–27" touchscreens, adjustable LED lighting, integrated visualisers, and optional
photobooth or karaoke add-ons. The physical presence advertises the service to the whole room.

### 4.2 Adjacent players

**AMI NEXTGEN** (NGX-32, NGX Curve) differentiates on hardware: interchangeable "Smart Skins" that can
trigger custom graphics, 35,000+ music videos, free-to-play trivia, venue ad upload, and a swappable core
for easy servicing.

**Rockbot / Soundtrack Your Brand** are cloud background-music services with commercial licensing bundled,
curated and dayparted playlists, digital signage, and a thin guest-request layer. Optimised for brand
control, not participation.

**Festify / Jukestar / PartyPlay** are the open or indie tier: join by short URL or QR, add to a shared
queue, vote tracks up, host admin can skip/delete/pause. Simple and genuinely popular — and built on a
legal fault line (§4.4).

### 4.3 What TouchTunes got wrong — our opening

**It is cloud-dependent by design.** When the venue's connection drops, the music stops. A local-first
runtime that keeps working with no internet is a real, demonstrable advantage rather than an ideological
preference. Combined with an open API and no telemetry, the open-source product has three things the
incumbent structurally cannot offer.

### 4.4 The licensing reality

- **The Jukebox License Office closed in 2025.** The JLO was the ASCAP/BMI/SESAC joint-venture
  clearinghouse selling one economical annual licence covering all three repertories for qualifying
  coin-operated jukeboxes. With it gone, operators must obtain **separate annual licences from ASCAP, BMI
  and SESAC**.
- **Venue background-music licensing is separate and additive.** Bars and restaurants typically need
  ASCAP, BMI, SESAC *and* GMR. Combined annual cost commonly exceeds **$1,000 per location**, varying with
  capacity, square footage, number of zones, outdoor playback, and whether there is live music, a DJ or
  karaoke.
- **DJ record pools are a legitimate ingest path.** BPM Supreme and ZIPDJ (roughly $20–25/month) grant
  professional DJs the right to play downloaded music live, on radio and in streamed mixes.
- **Consumer streaming is not.** A personal Spotify or Apple Music subscription is licensed for personal,
  non-commercial use. It does not convey public-performance rights. **This is the fault line under
  Festify, Jukestar and the whole PartyPlay class.**

**Design consequence:** the system must be able to answer *"may this venue legally play this track right
now?"* That makes per-track licence class and a per-venue licensing profile **data model concerns from day
one**, not a compliance bolt-on. It also means the architecture should make the consumer-streaming path
impossible for venue mode, by design.

---

## 5. Open-source landscape — fork, adopt, reference, avoid

The core of the brief. 41 projects triaged; full interactive table in the dashboard, full data in
[`docs/data/oss-inventory.json`](docs/data/oss-inventory.json).

| Verdict | Meaning |
|---|---|
| **FORK** | Closest existing implementation of a capability we need; cheaper to adapt than to rewrite. |
| **ADOPT** | Consume as an upstream dependency or over its published API. Track upstream, do not fork. |
| **REFERENCE** | Do not take the code. Study the design, protocol or data model and reimplement. |
| **AVOID** | Do not depend on this. Licence incompatibility, terms-of-service risk, or abandonment. |

### 5.1 Fork these three

**Mixxx** — `mixxxdj/mixxx`, GPL-2.0-or-later, 7,084★, C++, active.
The only mature, complete open-source DJ application in existence. `EngineMixer` orchestrates mixing,
beatmatching and FX routing; `SoundManager` owns device selection, sample rate, latency and the circular
buffer. It already ships beatgrids, key detection, sync lock, hot cues, loops, quantize, Auto DJ, DVS,
sampler, ReplayGain, Icecast broadcasting and STEM support. Its controller-mapping system (XML plus
JavaScript with typed API declaration files and a mapping wizard) is the best open prior art in the
category. UI is migrating to Qt QML for 3.0.
*The catch:* GPL-2.0-or-later. Anything linked into the same binary becomes GPL. This is the single
biggest architectural constraint on the project.

**Karaoke Eternal** — `bhj/KaraokeEternal`, **ISC**, 893★, TypeScript, active.
The most valuable find of the research. It is the closest **permissively-licensed** implementation of the
TouchTunes interaction model that exists: QR-code join, multiple password-protected rooms, a dynamic fair
queue that interleaves participants, browser-based control, music-synced visualisations, no ads or
telemetry. ISC means we can relicense it freely into our stack.
*The catch:* built around CDG/MP4 karaoke media and a room-per-party model. The fair-queue algorithm needs
generalising from "singers" to "patrons + paid priority".

**Mopidy** — `mopidy/mopidy`, **Apache-2.0**, 8,563★, Python, active.
A permissively-licensed, extensible music server whose entire reason for existing is a pluggable backend
API normalising many content sources behind one library/playback interface. That is precisely the content
abstraction we need, with no copyleft consequences and a patent grant.
*The catch:* Python and GStreamer-based, so it belongs in the catalog/control plane, never the real-time
audio path.

### 5.2 Adopt as dependencies (selected)

| Project | Licence | Role |
|---|---|---|
| **libremidi** | Permissive (RtMidi/ModernMIDI derived) | MIDI 1.0 **and 2.0/UMP** I/O, hot-plug observers, stable handle-based port IDs, nanosecond timestamps, allocation-free messages for hard real-time. The right MIDI choice for a project starting in 2026. |
| RtMidi | MIT-style | Conservative fallback backend. MIDI 1.0 only; enumerates ports by unstable index. |
| **Navidrome** | GPL-3.0 | Library server, consumed **over the OpenSubsonic API** — separate process, so its GPL stays out of our binary. |
| OpenSubsonic spec | Community spec | The de-facto open standard for self-hosted music servers. Includes a `jukeboxMediaTypes` extension widening `jukeboxControl` beyond song IDs. We should both consume and expose it. |
| **miniaudio** | Public domain / MIT-0 | Single-file cross-platform audio I/O with zero licence friction. (No ASIO backend — plan a WASAPI-exclusive/ASIO path.) |
| PortAudio | MIT | Permissive real-time audio I/O with ASIO support; already underneath Mixxx's SoundManager. |
| **Ableton Link** | GPL-2.0-or-later **or commercial** | Peer-to-peer tempo/beat/phase sync. Licence caution — see §8. |
| beets | MIT | Library ingest with MusicBrainz autotagging wired to Chromaprint/AcoustID fingerprinting. |
| Chromaprint / AcoustID | MIT (own code) | Acoustic fingerprinting, so tracks are identified regardless of tag quality. |
| **librosa** | ISC | The **licence-safe** analysis path: onset envelopes, tempo, beat tracking, chroma for key estimation. Offline only. |
| Demucs | MIT | Quality benchmark for stem separation. ~5–10× real-time on GPU, slower than real-time on CPU — hence precompute on ingest. |
| python-audio-separator | MIT | Maintained wrapper over many separation models; avoids writing model plumbing. |
| OLA | LGPL-2.1 (lib) / GPL-2.0 (daemon) | DMX512 / Art-Net / sACN bridge with OSC input. |
| QLC+ | Apache-2.0 | Lighting desk with a very large fixture library; drive it over OSC. |
| liblo | LGPL-2.1 | OSC implementation. |
| Snapcast | GPL-3.0 | Synchronised multi-room audio; separate process at the edge. |
| FFmpeg | LGPL-2.1 / GPL builds | Decoding the format spread a real library contains. **Build LGPL-only and audit components.** |
| libsndfile / libsamplerate / Opus | LGPL-2.1 / BSD-2 / BSD-3 | File I/O, sample-rate conversion, low-latency preview streaming. |
| wavesurfer.js | BSD-3-Clause | Waveform rendering for venue display and patron preview. |
| WEBMIDI.js | Apache-2.0 | Browser MIDI for the mapping UI (see §7 for why this cannot be the only path). |

### 5.3 Reference, don't take

Raveberry (LGPL-3.0) for democratic queue ordering and vote decay. Mopidy-Party (Apache-2.0) for request
throttling. Music Assistant (Apache-2.0) for provider abstraction and multi-device queue design.
Liquidsoap (GPL-2.0) for "never let the room go silent" fallback rotation and smart crossfades. OpenKJ
(GPL-3.0) for karaoke host workflow. xwax (GPL-3.0) as the clearest readable DVS timecode implementation.
libKeyFinder (GPL-3.0) for key detection. aubio (GPL-3.0) for real-time analysis. Spleeter (MIT) as the
fast fallback when an unanalysed track is requested and stems are needed now. RPi-Jukebox-RFID (MIT) for
the physical-token kiosk pattern.

### 5.4 Refuse these

| Project | Why refused |
|---|---|
| **librespot / spotifyd** | Technically excellent, but consumer streaming accounts convey no public-performance rights. Building on these repeats the core legal flaw of the existing open jukeboxes. |
| **yt-dlp** | Sourcing a commercial venue's catalog by scraping is both a ToS violation and unlicensed public performance. Explicitly out of scope. |
| **JUCE** | JUCE 9 modules are **AGPLv3 or commercial**. An AGPL framework under a hosted venue service is a serious obligation. Use miniaudio/PortAudio + libremidi + Qt instead. |
| **Essentia** | Most capable analysis library available — and **AGPL-3.0**. The network clause is actively dangerous here. Only viable as a fully separate offline tool. |
| **Rubber Band** | Best-in-class time-stretch, but GPL-or-commercial. Prefer SoundTouch (LGPL-2.1 with static-link exception); treat Rubber Band as an optional GPL-plane quality upgrade. |
| **Festify** | Archived since 2019, zero current stars, host-Spotify-dependent. Prior art only. |
| **Airsonic-Advanced** | No pushes since April 2024. Navidrome and gonic are the maintained choices. |

### 5.5 The pattern worth naming

**Talk to copyleft components over a socket.** Navidrome (GPL-3.0), Snapcast (GPL-3.0) and OLA's daemon
(GPL-2.0) are all first-rate and all separate processes. Consuming them over HTTP or IPC gets their
capability without their licence. This recurs throughout the architecture and is the mechanism that makes
the licence strategy in §8 workable.

---

## 6. Merged capability set

Eight domains, 62 capabilities, each traced to the product that established the expectation. Full detail
in [`docs/data/capabilities.json`](docs/data/capabilities.json) and browsable with priority filters in the
dashboard. Priorities below are **proposals for `SPECIFICATION.md` review**, not commitments.

| # | Domain | Count | P0 | Character |
|---|---|---|---|---|
| A | Performance Engine | 11 | 5 | Hard real-time. Native. Table stakes from the DJ tier. |
| B | Venue & Crowd Plane | 12 | 6 | The TouchTunes half. Largely greenfield in open source. |
| C | **Fusion Layer** | 6 | 3 | **The actual novelty. No prior art anywhere.** |
| D | MIDI & Interconnection | 10 | 4 | First-class subsystem, not a settings page. |
| E | Content & Catalog | 8 | 3 | Pluggable, because licensing differs per deployment. |
| F | Show Control | 4 | 0 | Lighting, multi-zone, video. Mostly integration work. |
| G | Platform & Operations | 6 | 4 | What makes it deployable rather than a demo. |
| H | Licensing & Governance | 5 | 3 | The part hobby projects skip and venues get fined for. |

### Domain C in full — the part that does not exist yet

- **C1 — Crowd requests land in the DJ's staging lane, not on the output.** *(P0)* The DJ approves,
  reorders and beatmatches. This single decision is what lets a jukebox and a DJ rig coexist.
- **C2 — Autonomous mode.** *(P0)* The engine auto-mixes the crowd queue with beatmatched transitions when
  no DJ is present. A venue is unattended most of the day and staffed at night; one system, two modes.
- **C3 — Gapless handoff.** *(P1)* A DJ takes or releases control mid-set with no gap in audio.
- **C4 — Request-aware transition planning.** *(P1)* Uses intro/outro and phrase detection, as djay's
  Automix AI and rekordbox's phrase analysis do.
- **C5 — Crowd signal surfaced to the DJ.** *(P2)* Request heatmap, vote velocity, unfilled genre demand.
  Turning the request stream into live audience telemetry is genuinely new.
- **C6 — Patrons can only request what is playable and licensed here.** *(P0)* Search is scoped by the
  venue policy engine, so an unplayable request is never even offered.

### Selected P0s from the other domains

From **B**: live queue with visible position in line; fair-queue anti-monopoly rules (per-patron limits,
artist/track cooldown, rate limiting — without these one patron plays the same song six times and the
venue switches the system off); the venue policy engine; a staff override console; never-silent fallback
rotation.

From **D**: MIDI 1.0 + 2.0/UMP I/O with hot-plug and **stable port identity** (mappings must bind to
stable handles, not port indices, or they break on reboot); MIDI-learn with soft-takeover; a declarative,
shareable, forkable mapping format; MIDI clock out at 24 PPQN sourced from the leader deck.

From **G**: **offline-first venue runtime** — full function with no internet; headless server with separate
operator/DJ/patron clients; an open, documented HTTP + WebSocket API; **no telemetry by default**.

From **H**: catalog sources tagged with licence class and public-performance status; hard refusal of
consumer-account and downloader sourcing; **clean licence separation between the permissive core and any
GPL-derived planes** — decided before the first line of engine code, because it is nearly impossible to
unwind later.

---

## 7. MIDI & systems interconnection

The brief treats MIDI as an interface to musical instruments and other content sources, not merely a way
to read knobs. That reframing has real consequences: **a groovebox becomes a queueable source**, and the
**leader deck becomes a clock master the whole room follows**.

### 7.1 Protocol positions

| Protocol | Position |
|---|---|
| **MIDI 2.0 / UMP** | **Adopt now.** Windows 11 MIDI Services (2026), macOS CoreMIDI (since Oct 2021) and Linux ALSA (kernel 6.5+, 2023) all carry Universal MIDI Packets natively. |
| MIDI 1.0 | Required baseline. 7-bit resolution is insufficient for jog wheels on its own. |
| **HID** | Needed for credible scratch feel. 7-bit MIDI gives 128 steps per rotation; Serato mappings commonly use 1536 (128 × 12). Requires the unit's "Advanced" HID mode. |
| **MIDI Clock (24 PPQN)** | Primary outbound tempo path. Keep the clock path short; Thru daisy-chains add jitter and can form loops. |
| MTC | **Positional reference only.** ~0.6 ms resolution and susceptibility to traffic delay make it unfit for beat-accurate triggering. |
| **Ableton Link** | Adopt. Shares tempo, beat and phase peer-to-peer over LAN. The *quantum* gives phase alignment for free — an 8-beat loop and a 4-beat loop stay aligned at each 8-beat boundary — and `enableStartStopSync` quantises transport launches. Licence caution (§8). |
| OSC | Adopt via liblo. The bridge into lighting, visuals and tablet control. |
| DMX512 / Art-Net / sACN | Adopt through OLA. rekordbox's phrase-aware auto-lighting is the capability to match. |
| Mackie Control / HUI | Optional. 10-bit fader resolution; reverse-engineered spec with open implementations. Unlocks a large installed base of motorised-fader surfaces no DJ app addresses. |
| Web MIDI | **Convenience only** (§7.3). |

### 7.2 The MIDI 2.0 opportunity

MIDI-CI **Property Exchange** provides a JSON-based Resource/Property model for reading and writing device
properties — preset names, parameter mappings, state — and **Profiles** let devices auto-configure their
behaviour. Every incumbent still solves controller mapping with hand-authored files. A UMP-native project
starting now could make most controllers largely **self-describing**. This is a defensible technical lead
available specifically because we have no legacy mapping format to protect.

### 7.3 Why the browser cannot be the MIDI path

- **Web MIDI is absent from Safari on macOS and iOS**, with no announced roadmap — which excludes every
  iPhone browser, since all iOS browsers use WebKit.
- **Chrome 124+ gates the entire API** behind a user-permission prompt and requires a secure context.
- **Web Audio latency** is 20–30 ms round-trip on desktop and 50–100 ms on mobile. AudioWorklet's fixed
  128-sample block (~3 ms at 44.1 kHz) is fine, but end-to-end latency is dominated by the OS pipeline and
  device buffer, **which a web page cannot configure**. Native APIs (ASIO, WASAPI-exclusive, CoreAudio)
  reach 32–64 sample buffers and sub-10 ms deterministic latency.

**Position:** the browser is an excellent surface for patrons, operators and mapping UI, and an
unacceptable one for the performance engine. The native MIDI and audio path stays authoritative.

### 7.4 Clock topology

The **leader deck** is the single tempo source, publishing to MIDI Clock and Ableton Link *simultaneously*,
so cabled hardware and wireless peers share one timeline — including during autonomous mode when no human
is driving.

---

## 8. Licence strategy — the decision to make first

This is the highest-consequence open question in the concept. The most valuable components to reuse carry
the strongest copyleft.

| Component | Licence | Consequence if linked into our binary |
|---|---|---|
| Mixxx engine | GPL-2.0-or-later | Entire binary becomes GPL-2.0-or-later |
| Ableton Link | GPL-2.0-or-later **or commercial** | GPL, unless licensed commercially from Ableton |
| Rubber Band | GPL-2.0-or-later **or commercial** | GPL. SoundTouch (LGPL-2.1 + static-link exception) is the permissive alternative |
| JUCE 9 | **AGPL-3.0** or commercial | AGPL — the network clause reaches a hosted venue service |
| Essentia | **AGPL-3.0** | AGPL. Only safe as a fully separate offline tool |
| aubio, libKeyFinder | GPL-3.0 | GPL-3.0, incompatible with GPL-2.0-**only** code |
| Navidrome, Snapcast, olad | GPL-2.0/3.0 | **No effect** — separate processes over HTTP/socket |
| Karaoke Eternal | ISC | None. Freely relicensable |
| Mopidy, QLC+, WEBMIDI.js | Apache-2.0 | None. Patent grant included |
| miniaudio | Public domain / MIT-0 | None whatsoever |
| librosa, beets, Demucs, Chromaprint | ISC / MIT | None |

### Recommendation

**Adopt a two-licence structure that matches the two-plane architecture.**

- The **Performance Plane** forks Mixxx and ships as **GPL-2.0-or-later**, inheriting its engine,
  analysers and DVS path. Ableton Link, Rubber Band, aubio and libKeyFinder are all comfortable here.
- **Everything else** — fusion core, jukebox plane, API, clients, content providers, controller mapping
  format — is **Apache-2.0**, and talks to the performance plane across a documented IPC boundary.

This keeps the valuable fork legal, keeps the crowd/venue layer reusable by anyone (including commercially),
and preserves the option of a non-GPL alternative engine later. The alternative — one GPL product — is
simpler to reason about but permanently forecloses embedding the venue layer in other systems.

> This repository's own `LICENSE` is Apache-2.0 and covers the research, dashboard and scaffolding only.

---

## 9. Proposed architecture

Full diagram in the dashboard. In summary, six layers with **a process boundary that is simultaneously a
licence boundary**:

1. **Clients** — Patron PWA (QR join, request, vote, pay), DJ Console, Operator Console, Venue Display, and
   any third-party OpenSubsonic client.
2. **Open API** — HTTP + WebSocket, plus an OpenSubsonic-compatible endpoint. Documented, versioned, no
   telemetry. Third-party clients are how an open project out-features a closed one.
3. **Fusion Core** — Unified Scheduler (one queue, two consumers; staging lane; fair queue; paid priority
   and vote blending), Venue Policy Engine, Mode & Handoff, Crowd Telemetry.
4. **Execution Planes** — Performance Plane (real-time, native, copyleft) and Jukebox Plane (soft real-time,
   permissive). Latency budgets three orders of magnitude apart, which is why they are separate.
5. **Interconnect Bus** — MIDI 1.0/2.0 UMP, HID, MIDI Clock, Ableton Link, OSC, DMX/Art-Net/sACN, MCU/HUI.
   One clock for the whole room.
6. **Content Source Providers** — pluggable and licence-tagged: local library, OpenSubsonic, Creative
   Commons, licensed-streaming adapters, and live MIDI instruments as a first-class queueable source.

**Why two planes:** the deck engine needs sub-10 ms determinism and must be native; the crowd queue is
happy at hundreds of milliseconds and should be web. Forcing them into one runtime compromises both.

**Why one scheduler:** two queues means two sources of truth about what plays next, and the failure mode is
the jukebox and the DJ talking over each other.

**Why one clock:** if the leader deck publishes to MIDI Clock and Ableton Link at once, instruments,
lighting, visuals and other apps in the room are all on the same timeline for free.

---

## 10. Differentiation and risks

### What CrowdDeck would have that nothing else does

1. **The fusion layer** (Domain C) — a shared queue with a DJ staging lane and an autonomous drain mode.
2. **Local-first operation** — works with no internet, unlike every cloud jukebox surveyed.
3. **Open API and no telemetry** — third-party clients and venue-owned data.
4. **UMP-native MIDI with self-describing controllers** — a lead available only to a project starting now.
5. **Licence-aware content model** — the system can answer whether a track is legal to play here, and the
   consumer-streaming path is architecturally impossible.
6. **MIDI instruments as content sources** — not just control surfaces.

### Principal risks

| Risk | Assessment |
|---|---|
| **Scope.** The capability set spans two mature product categories. | Real. Mitigated by the fork strategy and by treating Domain C plus a thin slice of A/B as the actual v1. |
| **Licence contamination.** One careless link makes everything GPL. | High consequence, low probability *if* §8 is settled first. This is why it is a gate. |
| **Fork maintenance.** Three forks means three upstream divergence costs. | Mitigate by contributing upstream where possible and keeping forks thin. |
| **Legal exposure for deployers.** PRO licensing is complex and post-JLO it got worse. | Mitigate with an explicit licensing profile, licence-class tagging, play-log export, and clear documentation that the operator holds the licences. |
| **Real-time audio is unforgiving.** Sub-10 ms deterministic scheduling is hard. | Mitigate by forking Mixxx rather than writing an engine, and never putting the audio path in a browser. |
| **Stem separation cost.** Demucs is slower than real-time on CPU. | Mitigate by precomputing on ingest and caching, with Spleeter as the fast fallback. |

---

## 11. Open questions for review

These five blocked `SPECIFICATION.md`. **Recommendations for all five are now in
[`DECISIONS.md`](DECISIONS.md)**, proposed and awaiting sign-off:

1. **Licence structure** — split Apache-2.0 / GPL-2.0-or-later as recommended in §8, or a single GPL product?
   → *ADR-001: split. Both Mixxx and Ableton Link are GPL-2.0-**or-later**, which removes the Apache/GPL-2.0
   incompatibility that would have made this fragile.*
2. **Engine** — fork Mixxx, or build a new engine against permissive libraries only (slower, more freedom)?
   → *ADR-002: fork, but contract-first, stub second, fork third. Mixxx's `ControlObjectScript` bus is
   already an IPC surface in all but transport.*
3. **Monetisation** — is paid priority (Fast Pass) in scope for v1, or is v1 vote-only with payments deferred?
   → *ADR-003: build the ordering model and credit ledger; ship no payment rails until v1.1.*
4. **Deployment shape** — single-venue appliance first, or multi-tenant operator console from the start?
   → *ADR-004: single-venue appliance; multi-venue later as federation over appliances, since offline-first
   (G1) rules out multi-tenant SaaS.*
5. **Client architecture** — native desktop shell (Qt) for the DJ console, or a thin native engine with web
   consoles for everything?
   → *ADR-005: thin engine + web consoles. Controller input reaches the engine directly, so web latency is
   cosmetic.*

---

## 12. Evidence

| Location | Contents |
|---|---|
| [`research/ANSWERS.md`](research/ANSWERS.md) | Synthesised findings for all 46 primary Tavily queries |
| [`research/ANSWERS2.md`](research/ANSWERS2.md) | Synthesised findings for the 10 verification queries |
| [`research/repos.tsv`](research/repos.tsv) | Raw GitHub API output for all 80 repositories queried |
| [`research/queries.txt`](research/queries.txt) | The primary query set |
| [`docs/data/*.json`](docs/data/) | Structured data behind the dashboard, reusable by later phases |

---

*Product names and trademarks belong to their respective owners. Capability scores are analyst judgements
of published feature depth, not audio quality benchmarks. Licensing summaries are research notes, not
legal advice.*
