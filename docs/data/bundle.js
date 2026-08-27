/* GENERATED FILE - do not edit.
   Run `node tools/build-data.mjs` after changing anything in docs/data/*.json. */
window.__CROWDDECK_DATA__ = {
  "competitors": {
    "generated": "2026-08-26",
    "note": "Scores are 0-5 analyst ratings of capability depth, derived from vendor documentation and press gathered via Tavily. They rate breadth/depth of the published capability, not audio quality.",
    "axes": [
      {
        "id": "decks",
        "label": "Performance Decks",
        "desc": "Multi-deck mixing, beatgrid, sync, cues, loops, DVS"
      },
      {
        "id": "stems",
        "label": "Stems / AI",
        "desc": "Real-time source separation and per-stem control"
      },
      {
        "id": "midi",
        "label": "MIDI / Interconnect",
        "desc": "MIDI mapping, HID, clock, Ableton Link, OSC"
      },
      {
        "id": "crowd",
        "label": "Crowd / Jukebox",
        "desc": "Patron requests, queue visibility, voting, payments"
      },
      {
        "id": "catalog",
        "label": "Catalog Reach",
        "desc": "Streaming, local, and self-hosted content sources"
      },
      {
        "id": "show",
        "label": "Show Control",
        "desc": "Lighting/DMX, video, karaoke"
      },
      {
        "id": "openness",
        "label": "Openness",
        "desc": "Source availability, mapping formats, open APIs"
      }
    ],
    "products": [
      {
        "name": "djay Pro AI",
        "vendor": "Algoriddim",
        "tier": "dj",
        "model": "Subscription (~$19/mo)",
        "scores": {
          "decks": 5,
          "stems": 5,
          "midi": 4,
          "crowd": 0,
          "catalog": 5,
          "show": 3,
          "openness": 1
        },
        "signature": "Neural Mix 4-stem separation (vocals/harmonics/drums/bass), Automix AI transition detection, Fluid Beatgrid, 4 decks, DVS, video mixing, 100+ class-compliant controllers, MIDI-Learn.",
        "sources": "TIDAL, SoundCloud Go+, Beatport (50-100 track offline locker)"
      },
      {
        "name": "Serato DJ Pro",
        "vendor": "Serato",
        "tier": "dj",
        "model": "~$179 perpetual / $129 yr",
        "scores": {
          "decks": 5,
          "stems": 4,
          "midi": 5,
          "crowd": 0,
          "catalog": 4,
          "show": 2,
          "openness": 2
        },
        "signature": "Industry-standard DVS and scratch response, Stems + Stems Pad FX, Practice Mode, 4 decks, ~50 FX, Sampler, Beat Jump, Slicer, Smart Sync, Key Analysis. Video/Play/DVS sold as expansion packs.",
        "sources": "Beatport LINK, Beatsource, TIDAL, SoundCloud Go+"
      },
      {
        "name": "rekordbox 7",
        "vendor": "AlphaTheta / Pioneer DJ",
        "tier": "dj",
        "model": "~$129 perpetual; Cloud plans from $14.99/mo",
        "scores": {
          "decks": 5,
          "stems": 4,
          "midi": 4,
          "crowd": 0,
          "catalog": 4,
          "show": 5,
          "openness": 1
        },
        "signature": "Tightest CDJ/XDJ integration, deep prep workflow, built-in stems, Cloud Library Sync + CloudDirectPlay (stream your library straight from a CDJ-3000 with Hot Cues and Memory Cues preserved), Lighting mode with phrase-aware DMX-512 via RB-DMX1.",
        "sources": "Beatport, TIDAL, SoundCloud, Apple Music (prep)"
      },
      {
        "name": "Traktor Pro 4",
        "vendor": "Native Instruments",
        "tier": "dj",
        "model": "~$119 perpetual",
        "scores": {
          "decks": 5,
          "stems": 4,
          "midi": 5,
          "crowd": 0,
          "catalog": 3,
          "show": 1,
          "openness": 2
        },
        "signature": "Modular controller mapping, Remix Decks, Pattern Player (4 drum units / 17 kits / step sequencing), iZotope RX stem separation, 43 FX across 9 slots, Auto-Master, DVS, native Ableton Link.",
        "sources": "Beatport, Beatsource, TIDAL"
      },
      {
        "name": "VirtualDJ 2026",
        "vendor": "Atomix",
        "tier": "dj",
        "model": "Free Lite tier / ~$299 Pro",
        "scores": {
          "decks": 5,
          "stems": 5,
          "midi": 5,
          "crowd": 2,
          "catalog": 5,
          "show": 5,
          "openness": 2
        },
        "signature": "Real-time 5-way stem separation (incl. hi-hats), Sandbox Mode (audition ahead without interrupting output), StemSwap sampler, AI/text-prompted beat-synced video loops, VST hosting, karaoke, one-click mapping for thousands of controllers.",
        "sources": "Beatport, Beatsource, TIDAL, SoundCloud, Deezer, local"
      },
      {
        "name": "Mixxx 2.5 / 2.6",
        "vendor": "Mixxx Development Team",
        "tier": "oss",
        "model": "Free / GPL-2.0-or-later",
        "scores": {
          "decks": 5,
          "stems": 3,
          "midi": 5,
          "crowd": 1,
          "catalog": 2,
          "show": 1,
          "openness": 5
        },
        "signature": "4 decks, BPM + key detection, sync lock / leader deck, hot cues, loops, quantize, Auto DJ crossfade automation, DVS timecode, sampler, mic/aux, ReplayGain, Icecast/Shoutcast broadcasting, recording. 2.6 adds NI-spec STEM mixing extended to any codec Mixxx already supports.",
        "sources": "Local files; imports iTunes / Traktor / Rekordbox / Serato / Rhythmbox libraries. No native streaming."
      },
      {
        "name": "TouchTunes",
        "vendor": "TouchTunes",
        "tier": "jukebox",
        "model": "Pay-per-play credits; revenue split with venue + operator",
        "scores": {
          "decks": 0,
          "stems": 0,
          "midi": 0,
          "crowd": 5,
          "catalog": 5,
          "show": 3,
          "openness": 0
        },
        "signature": "Phone-controlled venue jukebox: map-based venue finder, live queue showing your exact position in line, Fast Pass / Song Upgrade to jump the queue, non-expiring credit wallet with auto-refill, TouchTunes Rewards loyalty, emoji reactions, personal playlists. Hardware line (Playdium, Virtuo/Virtuo II, Angelina) is modular and cloud-connected with karaoke and photobooth add-ons.",
        "sources": "Proprietary licensed catalog; PRO and label agreements bundled into the per-song fee"
      },
      {
        "name": "AMI NEXTGEN",
        "vendor": "AMI Entertainment",
        "tier": "jukebox",
        "model": "Pay-per-play; operator route model",
        "scores": {
          "decks": 0,
          "stems": 0,
          "midi": 0,
          "crowd": 4,
          "catalog": 5,
          "show": 3,
          "openness": 0
        },
        "signature": "NGX-32 / NGX Curve with interchangeable Smart Skins, 35,000+ music videos, free-to-play trivia, venue ad upload, swappable core, Co-Pilot app for remote route management (volume, scheduling, promotions, reporting).",
        "sources": "Proprietary licensed catalog"
      },
      {
        "name": "Rockbot / Soundtrack",
        "vendor": "Various",
        "tier": "jukebox",
        "model": "SaaS subscription per location",
        "scores": {
          "decks": 0,
          "stems": 0,
          "midi": 0,
          "crowd": 3,
          "catalog": 5,
          "show": 2,
          "openness": 1
        },
        "signature": "Cloud background-music with commercial licensing bundled in, curated and dayparted playlists, digital signage, a limited guest request/voting layer. Optimised for brand control, not performance.",
        "sources": "Licensed commercial catalog"
      },
      {
        "name": "Festify / Jukestar",
        "vendor": "Community / indie",
        "tier": "jukebox",
        "model": "Free / freemium, host supplies streaming account",
        "scores": {
          "decks": 0,
          "stems": 0,
          "midi": 0,
          "crowd": 4,
          "catalog": 3,
          "show": 0,
          "openness": 3
        },
        "signature": "Guests join by short URL or QR, add songs to a shared queue and vote tracks up; host admin can skip, delete, pause. Depends entirely on a host account with a consumer streaming subscription, which is a personal-use licence and not a venue licence.",
        "sources": "Spotify (consumer account)"
      },
      {
        "name": "Navidrome + OpenSubsonic",
        "vendor": "Community",
        "tier": "oss",
        "model": "Free / GPL-3.0",
        "scores": {
          "decks": 0,
          "stems": 0,
          "midi": 0,
          "crowd": 2,
          "catalog": 3,
          "show": 0,
          "openness": 5
        },
        "signature": "Self-hosted streaming server over your own collection, full Subsonic/OpenSubsonic API including server-side jukebox mode, smart playlists, transcoding, scrobbling, share links, and a very large third-party client ecosystem.",
        "sources": "Self-hosted local library"
      },
      {
        "name": "CrowdDeck (target)",
        "vendor": "This project",
        "tier": "target",
        "model": "Open source, self-hostable",
        "scores": {
          "decks": 5,
          "stems": 4,
          "midi": 5,
          "crowd": 5,
          "catalog": 4,
          "show": 4,
          "openness": 5
        },
        "signature": "One venue runtime where a live DJ deck plane and a patron-request jukebox plane share a single scheduler, a single library, and a single MIDI/Link clock - so the crowd's queue feeds the DJ's decks instead of competing with them.",
        "sources": "Self-hosted library, Subsonic/OpenSubsonic, CC catalogs (Jamendo / Free Music Archive / ccMixter), pluggable licensed-streaming adapters"
      }
    ]
  },
  "oss": {
    "generated": "2026-08-26",
    "method": "Stars, language, license and last-push date were read directly from the GitHub REST API on 2026-08-26. Where GitHub reported NOASSERTION, the repository's LICENSE file was fetched and read to determine the real terms.",
    "verdicts": {
      "FORK": "Fork or vendor the source. Closest existing implementation of a capability we need; cheaper to adapt than to rewrite.",
      "ADOPT": "Consume as an upstream dependency or over its published API. Do not fork - track upstream.",
      "REFERENCE": "Do not take the code. Study the design, protocol or data model and reimplement to fit our architecture/licence.",
      "AVOID": "Do not depend on this for the venue product. Licence incompatibility, terms-of-service risk, or abandonment."
    },
    "items": [
      {
        "name": "Mixxx",
        "repo": "mixxxdj/mixxx",
        "license": "GPL-2.0-or-later",
        "stars": 7084,
        "lang": "C++",
        "updated": "2026-08",
        "layer": "DJ engine",
        "verdict": "FORK",
        "why": "The only mature, complete open-source DJ application. EngineMixer drives mixing/beatmatching/FX routing, SoundManager owns device selection, sample rate, latency and the circular buffer. It already ships beatgrids, key detection, sync lock, hot cues, loops, quantize, Auto DJ, DVS timecode, sampler, ReplayGain, Icecast broadcasting, and 2.6 adds NI-spec STEM mixing. Rebuilding this is years of work.",
        "catch": "GPL-2.0-or-later. Anything we link into the same binary becomes GPL. This is the single biggest architectural constraint on the project - see the licence strategy section."
      },
      {
        "name": "Karaoke Eternal",
        "repo": "bhj/KaraokeEternal",
        "license": "ISC",
        "stars": 893,
        "lang": "TypeScript",
        "updated": "2026-08",
        "layer": "Crowd queue + karaoke",
        "verdict": "FORK",
        "why": "The closest permissively-licensed implementation of the TouchTunes interaction model that exists in open source: QR-code join, multiple password-protected rooms, a dynamic fair queue that interleaves singers, browser-based control, music-synced visualisations, no ads or telemetry. ISC means we can relicense freely into our stack.",
        "catch": "Built around CDG/MP4 karaoke media and a room-per-party model; the fair-queue algorithm needs generalising from 'singers' to 'patrons + paid priority'."
      },
      {
        "name": "Mopidy",
        "repo": "mopidy/mopidy",
        "license": "Apache-2.0",
        "stars": 8563,
        "lang": "Python",
        "updated": "2026-08",
        "layer": "Content source abstraction",
        "verdict": "FORK",
        "why": "A permissively-licensed, extensible music server whose entire reason for existing is a pluggable backend API that normalises many content sources behind one library/playback interface. That is exactly the 'content sources' abstraction this project needs, and Apache-2.0 lets us take it without copyleft consequences.",
        "catch": "Python and GStreamer-based, so it belongs in the catalog/control plane, not in the real-time audio path."
      },
      {
        "name": "Mopidy-Party",
        "repo": "Lesterpig/mopidy-party",
        "license": "Apache-2.0",
        "stars": 114,
        "lang": "JavaScript",
        "updated": "2025-10",
        "layer": "Crowd queue",
        "verdict": "REFERENCE",
        "why": "A small, readable 'party mode' web client for Mopidy: guests queue tracks, with per-guest limits. Good minimal reference for request throttling.",
        "catch": "Very small project; the UX is far below the TouchTunes bar."
      },
      {
        "name": "Raveberry",
        "repo": "raveberry/raveberry",
        "license": "LGPL-3.0",
        "stars": 750,
        "lang": "Python",
        "updated": "2025-09",
        "layer": "Crowd queue",
        "verdict": "REFERENCE",
        "why": "Multi-user participation server with request + vote mechanics over several backends. Best open-source reference for democratic queue ordering and vote decay.",
        "catch": "LGPL-3.0 and Django-bound. Take the queue-ordering ideas, not the code."
      },
      {
        "name": "Navidrome",
        "repo": "navidrome/navidrome",
        "license": "GPL-3.0",
        "stars": 23137,
        "lang": "Go",
        "updated": "2026-08",
        "layer": "Library server",
        "verdict": "ADOPT",
        "why": "Integrate over the network, do not fork. It already implements the full Subsonic/OpenSubsonic API including server-side jukebox mode, smart playlists, transcoding, scrobbling and share links, and it has the largest client ecosystem. Speaking OpenSubsonic makes CrowdDeck instantly compatible with dozens of existing apps.",
        "catch": "GPL-3.0, so consume it as a separate process over HTTP - which keeps our licence options open."
      },
      {
        "name": "OpenSubsonic spec",
        "repo": "opensubsonic/open-subsonic",
        "license": "Community spec",
        "stars": 0,
        "lang": "Spec",
        "updated": "2026",
        "layer": "Library API",
        "verdict": "ADOPT",
        "why": "The de-facto open standard for self-hosted music servers, and it explicitly extends jukeboxControl via the jukeboxMediaTypes extension so podcast episodes and radio stations can be enqueued alongside songs. Implementing this API on our server gets us a free client ecosystem.",
        "catch": "Jukebox mode in the base Subsonic spec only accepts song IDs; plan for the extension from day one."
      },
      {
        "name": "Music Assistant",
        "repo": "music-assistant/server",
        "license": "Apache-2.0",
        "stars": 2984,
        "lang": "Python",
        "updated": "2026-08",
        "layer": "Content source abstraction",
        "verdict": "REFERENCE",
        "why": "A permissive, actively developed provider-abstraction model that unifies streaming services and local libraries, plus a well-thought-out player/queue abstraction across heterogeneous output devices. Strong prior art for our multi-zone output design.",
        "catch": "Home-automation oriented; assumes a Home Assistant-style deployment."
      },
      {
        "name": "libremidi",
        "repo": "celtera/libremidi",
        "license": "Permissive (RtMidi MIT + ModernMIDI derived)",
        "stars": 700,
        "lang": "C++",
        "updated": "2026-08",
        "layer": "MIDI I/O",
        "verdict": "ADOPT",
        "why": "The right MIDI choice for a project starting in 2026. Modern C++20 rewrite of RtMidi with real MIDI 2.0 / UMP support on macOS 11+, Linux kernel 6.5+ and Windows 11 MIDI Services, plus hot-plug-aware observers, stable handle-based port IDs, nanosecond timestamps, optional allocation-free message storage for hard real-time, and WebMIDI support.",
        "catch": "Smaller community than RtMidi. Keep RtMidi as the fallback backend behind our own MIDI port interface."
      },
      {
        "name": "RtMidi",
        "repo": "thestk/rtmidi",
        "license": "MIT-style",
        "stars": 1202,
        "lang": "C++",
        "updated": "2025-11",
        "layer": "MIDI I/O",
        "verdict": "ADOPT",
        "why": "The conservative fallback: minimal dependencies, permissive licence, and the widest platform reach (ALSA, JACK, CoreMIDI, Windows MM/UWP, iOS, Android, WebMIDI).",
        "catch": "MIDI 1.0 only, and enumerates ports by unstable numeric index - a real problem for saved controller mappings across reboots."
      },
      {
        "name": "Ableton Link",
        "repo": "Ableton/link",
        "license": "GPL-2.0-or-later OR commercial",
        "stars": 1337,
        "lang": "C++",
        "updated": "2026-05",
        "layer": "Tempo sync",
        "verdict": "ADOPT",
        "why": "The industry-standard way to share tempo, beat and phase peer-to-peer across apps and devices on a LAN. The quantum model means an 8-beat loop and a 4-beat loop stay phase-aligned, and enableStartStopSync quantises transport launches so everything starts together. Traktor, djay and hundreds of iOS apps already speak it.",
        "catch": "GPL-2.0-or-later unless you buy Ableton's commercial licence. If our core is permissive, Link must live in a separate GPL process or optional module."
      },
      {
        "name": "miniaudio",
        "repo": "mackron/miniaudio",
        "license": "Public domain OR MIT-0 (your choice)",
        "stars": 7185,
        "lang": "C",
        "updated": "2026-08",
        "layer": "Audio I/O",
        "verdict": "ADOPT",
        "why": "Single-file C audio playback/capture across WASAPI, CoreAudio, ALSA, PulseAudio and more, with the most permissive licence available. Zero licence friction anywhere in the stack.",
        "catch": "No ASIO backend out of the box, which serious Windows DJ rigs will want; plan an ASIO or WASAPI-exclusive path."
      },
      {
        "name": "PortAudio",
        "repo": "PortAudio/portaudio",
        "license": "MIT",
        "stars": 2136,
        "lang": "C",
        "updated": "2026-08",
        "layer": "Audio I/O",
        "verdict": "ADOPT",
        "why": "The long-established permissive cross-platform real-time audio I/O library, with ASIO and WASAPI-exclusive support. This is what Mixxx's SoundManager sits on top of, so a Mixxx-derived engine inherits it anyway.",
        "catch": "Older C API; ASIO builds require Steinberg's SDK, which has its own redistribution terms."
      },
      {
        "name": "Rubber Band",
        "repo": "breakfastquay/rubberband",
        "license": "GPL-2.0-or-later OR commercial",
        "stars": 773,
        "lang": "C++",
        "updated": "2025-03",
        "layer": "Time-stretch / key-lock",
        "verdict": "AVOID",
        "why": "Best-in-class open time-stretch and pitch-shift quality, and it is what gives key-lock its transparency.",
        "catch": "GPL or a paid commercial licence. If we want a permissive core, prefer SoundTouch (LGPL-2.1 with a static-link exception) and treat Rubber Band as an optional GPL-plane quality upgrade."
      },
      {
        "name": "Demucs",
        "repo": "adefossez/demucs",
        "license": "MIT",
        "stars": 3097,
        "lang": "Python",
        "updated": "2026-07",
        "layer": "Stem separation",
        "verdict": "ADOPT",
        "why": "The quality benchmark for open stem separation and MIT-licensed, so it is safe to ship. Correct for our offline prep pipeline: separate on ingest, cache the stems, then play them back like Mixxx 2.6's STEM format.",
        "catch": "Roughly 5-10x real-time on a modern GPU and slower than real-time on CPU, needing 4-8 GB VRAM. Not viable for live on-the-fly separation - which is precisely why we precompute."
      },
      {
        "name": "Spleeter",
        "repo": "deezer/spleeter",
        "license": "MIT",
        "stars": 28403,
        "lang": "Python",
        "updated": "2026-06",
        "layer": "Stem separation",
        "verdict": "REFERENCE",
        "why": "Dramatically faster than Demucs (around 100x real-time on GPU), so it is the fallback when a track is requested that has not been pre-analysed and the queue needs stems now.",
        "catch": "Noticeably lower separation quality; ageing TensorFlow dependency."
      },
      {
        "name": "python-audio-separator",
        "repo": "nomadkaraoke/python-audio-separator",
        "license": "MIT",
        "stars": 1327,
        "lang": "Python",
        "updated": "2026-08",
        "layer": "Stem separation",
        "verdict": "ADOPT",
        "why": "A maintained, MIT-licensed CLI/library wrapper over many pretrained separation models. Saves us from writing model-loading plumbing and lets us swap models without touching our pipeline.",
        "catch": "Still a Python/GPU workload - keep it out-of-process behind a job queue."
      },
      {
        "name": "aubio",
        "repo": "aubio/aubio",
        "license": "GPL-3.0",
        "stars": 3754,
        "lang": "C",
        "updated": "2026-04",
        "layer": "Audio analysis",
        "verdict": "REFERENCE",
        "why": "Lightweight, real-time-capable onset detection, beat tracking, BPM and pitch tracking in C.",
        "catch": "GPL-3.0. Fine inside a GPL plane, fatal to a permissive core."
      },
      {
        "name": "Essentia",
        "repo": "MTG/essentia",
        "license": "AGPL-3.0",
        "stars": 3705,
        "lang": "C++",
        "updated": "2026-07",
        "layer": "Audio analysis",
        "verdict": "AVOID",
        "why": "250+ algorithms including strong beat tracking, tempo extraction, chroma and a dedicated key extractor - the most capable option technically.",
        "catch": "AGPL-3.0. The network clause is actively dangerous for a hosted venue service. Only usable as a fully separate offline analysis tool, or under a commercial licence."
      },
      {
        "name": "libKeyFinder",
        "repo": "mixxxdj/libkeyfinder",
        "license": "GPL-3.0",
        "stars": 181,
        "lang": "C++",
        "updated": "2024-11",
        "layer": "Key detection",
        "verdict": "REFERENCE",
        "why": "The focused key-detection algorithm Mixxx itself uses - long-term chroma histogram matched against key profiles. If we fork Mixxx we inherit it for free.",
        "catch": "GPL-3.0 and comparatively quiet upstream."
      },
      {
        "name": "librosa",
        "repo": "librosa/librosa",
        "license": "ISC",
        "stars": 8576,
        "lang": "Python",
        "updated": "2026-08",
        "layer": "Audio analysis",
        "verdict": "ADOPT",
        "why": "Permissively licensed (ISC) and ideal for the offline ingest pipeline: onset envelopes, tempo estimation, beat tracking, and chroma features for key estimation. The licence-safe way to get analysis without GPL contamination.",
        "catch": "Python and not real-time. Ingest pipeline only."
      },
      {
        "name": "Chromaprint / AcoustID",
        "repo": "acoustid/chromaprint",
        "license": "MIT (own code)",
        "stars": 1354,
        "lang": "C++",
        "updated": "2026-07",
        "layer": "Identification",
        "verdict": "ADOPT",
        "why": "Acoustic fingerprinting so we can identify a track regardless of how bad its tags are, then resolve it to a MusicBrainz recording. Essential for reliable de-duplication and for matching patron requests to what is actually in the library.",
        "catch": "Bundles some LGPL-2.1 FFmpeg parts; link accordingly."
      },
      {
        "name": "beets",
        "repo": "beetbox/beets",
        "license": "MIT",
        "stars": 15591,
        "lang": "Python",
        "updated": "2026-08",
        "layer": "Library management",
        "verdict": "ADOPT",
        "why": "MIT-licensed library manager that already wires MusicBrainz autotagging to Chromaprint/AcoustID fingerprinting (the chroma plugin), stores acoustid_id fields, and can find duplicates by fingerprint. This is our ingest front door.",
        "catch": "CLI-first and opinionated about on-disk layout."
      },
      {
        "name": "Open Lighting Architecture",
        "repo": "OpenLightingProject/ola",
        "license": "LGPL-2.1 (libola) / GPL-2.0 (olad)",
        "stars": 748,
        "lang": "C++",
        "updated": "2026-06",
        "layer": "Show control",
        "verdict": "ADOPT",
        "why": "The standard open bridge from software to DMX512 / Art-Net / sACN, with an OSC input plugin. This is how we match rekordbox's Lighting mode without building a DMX stack.",
        "catch": "Split licence - libola is LGPL-2.1 (linkable), the olad daemon is GPL-2.0 (run it as a separate process)."
      },
      {
        "name": "QLC+",
        "repo": "mcallegari/qlcplus",
        "license": "Apache-2.0",
        "stars": 1510,
        "lang": "C++",
        "updated": "2026-08",
        "layer": "Show control",
        "verdict": "ADOPT",
        "why": "A full Apache-2.0 lighting desk with an enormous fixture library and OSC/Art-Net input. Permissive licence plus fixture definitions we would otherwise spend months curating.",
        "catch": "It is an application, not a library - drive it over OSC rather than embedding it."
      },
      {
        "name": "liblo",
        "repo": "radarsat1/liblo",
        "license": "LGPL-2.1",
        "stars": 218,
        "lang": "C",
        "updated": "2026-06",
        "layer": "Show control",
        "verdict": "ADOPT",
        "why": "Small, stable OSC implementation for talking to lighting desks, VJ software and tablet controllers.",
        "catch": "LGPL-2.1 - dynamic-link it."
      },
      {
        "name": "Snapcast",
        "repo": "snapcast/snapcast",
        "license": "GPL-3.0",
        "stars": 7842,
        "lang": "C++",
        "updated": "2026-06",
        "layer": "Multi-zone audio",
        "verdict": "ADOPT",
        "why": "Solves synchronised multi-room playback properly - the venue case of patio, main room and bathroom staying time-aligned. Feed it PCM via a FIFO and it distributes a clock-aligned stream to every client.",
        "catch": "GPL-3.0, so it stays a separate process at the edge of our system."
      },
      {
        "name": "Liquidsoap",
        "repo": "savonet/liquidsoap",
        "license": "GPL-2.0",
        "stars": 1720,
        "lang": "OCaml",
        "updated": "2026-08",
        "layer": "Automation / fallback",
        "verdict": "REFERENCE",
        "why": "Battle-tested radio automation: crossfades, smart transitions, fallback rotation when the request queue runs dry, and Icecast output. Excellent design reference for our 'never let the room go silent' fallback engine.",
        "catch": "GPL-2.0 and OCaml. Reimplement the ideas."
      },
      {
        "name": "wavesurfer.js",
        "repo": "katspaugh/wavesurfer.js",
        "license": "BSD-3-Clause",
        "stars": 10384,
        "lang": "TypeScript",
        "updated": "2026-08",
        "layer": "Web UI",
        "verdict": "ADOPT",
        "why": "Mature, permissive waveform rendering with regions and zoom. Gets the venue-display and patron-preview waveforms done without custom canvas work.",
        "catch": "A display component, not a transport - the real timeline must stay authoritative in the engine."
      },
      {
        "name": "WEBMIDI.js",
        "repo": "djipco/webmidi",
        "license": "Apache-2.0",
        "stars": 1711,
        "lang": "JavaScript",
        "updated": "2026-08",
        "layer": "Web MIDI",
        "verdict": "ADOPT",
        "why": "Makes the raw Web MIDI API usable for the browser-based controller and mapping UI, with note/CC helpers and clean device enumeration.",
        "catch": "Web MIDI is unsupported in Safari on macOS and iOS with no announced roadmap, and Chrome 124+ gates the whole API behind a permission prompt over HTTPS. The browser cannot be the only MIDI path."
      },
      {
        "name": "Tone.js",
        "repo": "Tonejs/Tone.js",
        "license": "MIT",
        "stars": 14711,
        "lang": "TypeScript",
        "updated": "2026-08",
        "layer": "Web audio",
        "verdict": "REFERENCE",
        "why": "Excellent transport/scheduling abstractions over Web Audio, useful for prototypes and the browser preview deck.",
        "catch": "Browser round-trip latency is realistically 20-30 ms on desktop and 50-100 ms on mobile because the OS pipeline and device buffer are not configurable from a web page. Never the production performance path."
      },
      {
        "name": "xwax",
        "repo": "xwax/xwax",
        "license": "GPL-3.0",
        "stars": 159,
        "lang": "C",
        "updated": "2026-05",
        "layer": "DVS",
        "verdict": "REFERENCE",
        "why": "A minimal, very low-latency timecode-vinyl implementation - the clearest readable reference for how DVS decoding actually works.",
        "catch": "GPL-3.0, Linux-centric, and development happens on a mailing list rather than GitHub."
      },
      {
        "name": "OpenKJ",
        "repo": "OpenKJ/OpenKJ",
        "license": "GPL-3.0",
        "stars": 194,
        "lang": "C++",
        "updated": "2025-12",
        "layer": "Karaoke",
        "verdict": "REFERENCE",
        "why": "Real karaoke-host workflow: rotating singer list, key change, tempo control, end-of-track silence detection, remote song requests, automatic performance recording.",
        "catch": "GPL-3.0 and Qt/GStreamer-bound. Karaoke Eternal (ISC) is the better fork base."
      },
      {
        "name": "RPi-Jukebox-RFID",
        "repo": "MiczFlor/RPi-Jukebox-RFID",
        "license": "MIT",
        "stars": 1779,
        "lang": "PHP",
        "updated": "2026-08",
        "layer": "Kiosk",
        "verdict": "REFERENCE",
        "why": "MIT-licensed and proves out the physical-token kiosk pattern (RFID card triggers playback) on cheap hardware - a credible low-cost analogue to a TouchTunes cabinet.",
        "catch": "Aimed at home/children's use; not multi-tenant or payment-aware."
      },
      {
        "name": "JUCE",
        "repo": "juce-framework/JUCE",
        "license": "AGPL-3.0 OR commercial (JUCE 9)",
        "stars": 8822,
        "lang": "C++",
        "updated": "2026-08",
        "layer": "App framework",
        "verdict": "AVOID",
        "why": "The richest cross-platform C++ audio framework, with strong MIDI, device and plugin-hosting abstractions.",
        "catch": "As of JUCE 9 the modules are dual-licensed AGPLv3 or a paid commercial licence. AGPL on a framework used by a hosted venue service is a serious obligation. Prefer miniaudio/PortAudio + libremidi + Qt."
      },
      {
        "name": "librespot / spotifyd",
        "repo": "librespot-org/librespot",
        "license": "MIT / GPL-3.0",
        "stars": 6973,
        "lang": "Rust",
        "updated": "2026-08",
        "layer": "Streaming source",
        "verdict": "AVOID",
        "why": "Technically excellent open Spotify client libraries.",
        "catch": "Consumer streaming accounts are licensed for personal use, not public performance in a venue. Building the venue product on these repeats the core legal flaw of the Festify/Jukestar class of apps."
      },
      {
        "name": "yt-dlp",
        "repo": "yt-dlp/yt-dlp",
        "license": "Unlicense",
        "stars": 187193,
        "lang": "Python",
        "updated": "2026-08",
        "layer": "Content acquisition",
        "verdict": "AVOID",
        "why": "Ubiquitous media downloader.",
        "catch": "Sourcing a commercial venue's playback catalog this way is both a terms-of-service violation and unlicensed public performance. Explicitly out of scope."
      },
      {
        "name": "Festify",
        "repo": "Festify/Festify",
        "license": "MIT",
        "stars": 0,
        "lang": "TypeScript",
        "updated": "2019-11",
        "layer": "Crowd queue",
        "verdict": "AVOID",
        "why": "Frequently cited as the reference open-source party jukebox.",
        "catch": "Archived since 2019 and depends on a host's consumer Spotify Premium account. Dead upstream and legally unsuitable for venues. Cite it as prior art only."
      },
      {
        "name": "Airsonic-Advanced",
        "repo": "airsonic-advanced/airsonic-advanced",
        "license": "GPL-3.0",
        "stars": 1405,
        "lang": "Java",
        "updated": "2024-04",
        "layer": "Library server",
        "verdict": "AVOID",
        "why": "A Subsonic-API server with transcoding and DLNA.",
        "catch": "No pushes since April 2024. Navidrome and gonic are the maintained choices."
      },
      {
        "name": "FFmpeg",
        "repo": "FFmpeg/FFmpeg",
        "license": "LGPL-2.1 / GPL-2.0 builds",
        "stars": 63672,
        "lang": "C",
        "updated": "2026-08",
        "layer": "Codecs",
        "verdict": "ADOPT",
        "why": "Unavoidable for decoding the format spread a real venue library contains, plus transcoding for patron preview streams.",
        "catch": "Build LGPL-only and audit enabled components - a GPL-configured build silently drags the whole product to GPL."
      },
      {
        "name": "libsndfile / libsamplerate / Opus",
        "repo": "libsndfile/libsndfile",
        "license": "LGPL-2.1 / BSD-2 / BSD-3",
        "stars": 1711,
        "lang": "C",
        "updated": "2026-08",
        "layer": "Codecs / DSP",
        "verdict": "ADOPT",
        "why": "The permissive workhorses: lossless file I/O, high-quality sample-rate conversion, and a modern low-latency codec for streaming previews to patron phones.",
        "catch": "libsndfile is LGPL-2.1 - dynamic-link it; the other two are effectively unrestricted."
      }
    ]
  },
  "capabilities": {
    "generated": "2026-08-26",
    "note": "The merged capability set for CrowdDeck, assembled from the researched feature sets. 'from' records which analysed product established the expectation. Priorities are proposals for SPECIFICATION.md review, not commitments.",
    "domains": [
      {
        "id": "engine",
        "name": "A. Performance Engine",
        "summary": "The real-time audio core. Everything here has a hard latency budget and must run out of the browser.",
        "capabilities": [
          {
            "id": "A1",
            "name": "4 independent decks with per-deck EQ, filter, gain and crossfader assignment",
            "from": [
              "djay Pro AI",
              "Serato DJ Pro",
              "Traktor Pro 4",
              "Mixxx"
            ],
            "priority": "P0",
            "note": "Four decks is the table stakes established by every analysed product."
          },
          {
            "id": "A2",
            "name": "Beatgrid detection and manual grid editing",
            "from": [
              "djay Pro AI (Fluid Beatgrid)",
              "Traktor Pro 4",
              "Mixxx"
            ],
            "priority": "P0",
            "note": "Everything downstream - sync, loops, quantize, auto-transitions, lighting cues - depends on grid accuracy."
          },
          {
            "id": "A3",
            "name": "Musical key detection and key-lock / pitch-independent tempo",
            "from": [
              "Serato DJ Pro",
              "rekordbox",
              "Mixxx"
            ],
            "priority": "P0",
            "note": "Key-lock quality is a licence decision: SoundTouch (LGPL) vs Rubber Band (GPL/commercial)."
          },
          {
            "id": "A4",
            "name": "Sync lock with explicit leader deck, plus manual tempo",
            "from": [
              "Traktor Pro 4 (Auto-Master)",
              "Mixxx (sync lock)"
            ],
            "priority": "P0",
            "note": "The leader deck also becomes the master tempo source published to MIDI clock and Ableton Link."
          },
          {
            "id": "A5",
            "name": "Hot cues, memory cues, loops, beat jump, slicer, quantize, slip mode",
            "from": [
              "Serato DJ Pro",
              "rekordbox",
              "Mixxx"
            ],
            "priority": "P0",
            "note": ""
          },
          {
            "id": "A6",
            "name": "Per-stem control on every deck (vocals / harmonics / drums / bass)",
            "from": [
              "djay Pro AI (Neural Mix)",
              "VirtualDJ 2026",
              "Traktor Pro 4",
              "Mixxx 2.6 STEM"
            ],
            "priority": "P1",
            "note": "Precompute stems on ingest and cache them. Live separation is not achievable at Demucs quality."
          },
          {
            "id": "A7",
            "name": "Chainable per-deck FX with an XY performance pad",
            "from": [
              "djay Pro AI",
              "Traktor Pro 4 (43 FX)",
              "Serato DJ Pro"
            ],
            "priority": "P1",
            "note": ""
          },
          {
            "id": "A8",
            "name": "Sampler and step-sequencing pattern player",
            "from": [
              "Traktor Pro 4 (Pattern Player)",
              "VirtualDJ (StemSwap)",
              "Mixxx"
            ],
            "priority": "P2",
            "note": "The natural bridge to the MIDI instrument domain - the pattern player is what an external drum machine syncs against."
          },
          {
            "id": "A9",
            "name": "DVS timecode vinyl / CD control",
            "from": [
              "Serato DJ Pro",
              "Traktor Pro 4",
              "Mixxx",
              "xwax"
            ],
            "priority": "P2",
            "note": ""
          },
          {
            "id": "A10",
            "name": "Sandbox / practice mode - audition and build the next transition without touching the room output",
            "from": [
              "VirtualDJ 2026 (Sandbox)",
              "Serato DJ Pro (Practice Mode)"
            ],
            "priority": "P1",
            "note": "Unusually important here: the DJ needs to pre-fly patron requests before they hit the room."
          },
          {
            "id": "A11",
            "name": "Microphone and aux inputs with ducking, plus recording and Icecast broadcast",
            "from": [
              "Mixxx"
            ],
            "priority": "P2",
            "note": ""
          }
        ]
      },
      {
        "id": "crowd",
        "name": "B. Venue & Crowd Plane",
        "summary": "The TouchTunes half. This is where the differentiation lives - no open-source project covers this properly today.",
        "capabilities": [
          {
            "id": "B1",
            "name": "Patron joins a venue by QR code or short URL, no app install required",
            "from": [
              "TouchTunes (map finder)",
              "Karaoke Eternal",
              "Festify"
            ],
            "priority": "P0",
            "note": "QR beats a map-based venue finder for a self-hosted product - the patron is already in the room."
          },
          {
            "id": "B2",
            "name": "Live queue with each patron's exact position in line",
            "from": [
              "TouchTunes"
            ],
            "priority": "P0",
            "note": "TouchTunes' single most-cited feature. Visible position is what makes waiting tolerable."
          },
          {
            "id": "B3",
            "name": "Paid priority - jump the queue (Fast Pass / Song Upgrade equivalent)",
            "from": [
              "TouchTunes"
            ],
            "priority": "P1",
            "note": "The core monetisation primitive. Must be pluggable, and disable-able for free/private events."
          },
          {
            "id": "B4",
            "name": "Credit wallet with non-expiring balance and auto-refill",
            "from": [
              "TouchTunes"
            ],
            "priority": "P2",
            "note": "Payment provider must be an adapter; many self-hosted deployments will run creditless."
          },
          {
            "id": "B5",
            "name": "Democratic voting to reorder the queue, with vote decay and cooldown",
            "from": [
              "Raveberry",
              "Festify / Jukestar"
            ],
            "priority": "P1",
            "note": "Voting and paid priority are two orderings of the same queue - the scheduler must support blending them."
          },
          {
            "id": "B6",
            "name": "Fair-queue anti-monopoly rules: per-patron limits, artist/track cooldown, rate limiting",
            "from": [
              "Karaoke Eternal (dynamic fair queue)",
              "Mopidy-Party",
              "TouchTunes"
            ],
            "priority": "P0",
            "note": "Without this one patron plays the same song six times and the venue turns the system off."
          },
          {
            "id": "B7",
            "name": "Venue policy engine: explicit-content filter, genre/artist allow and block lists, dayparting, volume schedule",
            "from": [
              "Rockbot / Soundtrack",
              "AMI Co-Pilot",
              "TouchTunes"
            ],
            "priority": "P0",
            "note": "The venue owner must always be able to override the crowd."
          },
          {
            "id": "B8",
            "name": "Staff override console - skip, veto, refund, mute, lock the queue, panic-stop",
            "from": [
              "TouchTunes",
              "Festify admin",
              "AMI Co-Pilot"
            ],
            "priority": "P0",
            "note": ""
          },
          {
            "id": "B9",
            "name": "Never-silent fallback rotation when the request queue empties",
            "from": [
              "Liquidsoap",
              "Rockbot",
              "Mixxx Auto DJ"
            ],
            "priority": "P0",
            "note": "The system must degrade into a well-behaved background-music player, automatically."
          },
          {
            "id": "B10",
            "name": "Loyalty points, emoji reactions and now-playing social feed",
            "from": [
              "TouchTunes Rewards"
            ],
            "priority": "P2",
            "note": ""
          },
          {
            "id": "B11",
            "name": "Multi-venue / multi-tenant operator console with remote scheduling and reporting",
            "from": [
              "AMI Co-Pilot",
              "TouchTunes cloud platform"
            ],
            "priority": "P2",
            "note": "The operator route model is how this class of product actually makes money."
          },
          {
            "id": "B12",
            "name": "Venue display screen - now playing, up next, QR to join, visualiser",
            "from": [
              "TouchTunes cabinet",
              "AMI NEXTGEN",
              "Karaoke Eternal"
            ],
            "priority": "P1",
            "note": ""
          }
        ]
      },
      {
        "id": "fusion",
        "name": "C. Fusion Layer (the actual novelty)",
        "summary": "Where the DJ plane and the crowd plane meet. No analysed product, open or closed, does this.",
        "capabilities": [
          {
            "id": "C1",
            "name": "Crowd requests land in the DJ's staging lane, not directly on the output",
            "from": [
              "Novel"
            ],
            "priority": "P0",
            "note": "The DJ approves, reorders and beatmatches requests. This is the single design decision that makes a jukebox and a DJ rig coexist."
          },
          {
            "id": "C2",
            "name": "Autonomous mode - engine auto-mixes the crowd queue with beatmatched transitions when no DJ is present",
            "from": [
              "djay Pro AI (Automix AI)",
              "Mixxx Auto DJ",
              "Liquidsoap"
            ],
            "priority": "P0",
            "note": "A venue runs unattended most of the day and staffed at night. One system, two modes."
          },
          {
            "id": "C3",
            "name": "Handoff: DJ takes or releases control mid-set without a gap in audio",
            "from": [
              "Novel"
            ],
            "priority": "P1",
            "note": ""
          },
          {
            "id": "C4",
            "name": "Request-aware transition planning using intro/outro and phrase detection",
            "from": [
              "djay Pro AI (Automix AI)",
              "rekordbox (phrase analysis)"
            ],
            "priority": "P1",
            "note": ""
          },
          {
            "id": "C5",
            "name": "Crowd signal surfaced to the DJ: request heatmap, vote velocity, unfilled genre demand",
            "from": [
              "Novel"
            ],
            "priority": "P2",
            "note": "Turning the request stream into live audience telemetry is a genuinely new capability."
          },
          {
            "id": "C6",
            "name": "Patrons can only request what is playable and licensed in that venue's catalog",
            "from": [
              "Novel"
            ],
            "priority": "P0",
            "note": "Search is scoped by the venue policy engine, so an unplayable request is never offered."
          }
        ]
      },
      {
        "id": "midi",
        "name": "D. MIDI & Systems Interconnection",
        "summary": "The interconnect fabric. Explicitly a first-class subsystem, not a settings page.",
        "capabilities": [
          {
            "id": "D1",
            "name": "MIDI 1.0 and MIDI 2.0 / UMP I/O with hot-plug and stable port identity",
            "from": [
              "libremidi",
              "MIDI 2.0 spec"
            ],
            "priority": "P0",
            "note": "Windows 11 MIDI Services, macOS CoreMIDI (since 2021) and ALSA (kernel 6.5+) all now carry UMP natively. Mappings must bind to stable handles, not port indices."
          },
          {
            "id": "D2",
            "name": "MIDI learn with soft-takeover / pickup, plus visual mapped-state indication",
            "from": [
              "djay Pro AI (MIDI-Learn)",
              "Traktor Pro 4",
              "Mixxx"
            ],
            "priority": "P0",
            "note": "Soft-takeover prevents parameter jumps when a physical knob is out of sync with software state."
          },
          {
            "id": "D3",
            "name": "Declarative, shareable, forkable controller mapping format",
            "from": [
              "Mixxx (XML + JS)",
              "Traktor (.tsi)",
              "Serato (XML)"
            ],
            "priority": "P0",
            "note": "Mixxx's XML-plus-JavaScript model with typed API declarations is the best open prior art. Ship a controller wizard."
          },
          {
            "id": "D4",
            "name": "HID controller support for high-resolution jog wheels",
            "from": [
              "Serato DJ Pro",
              "rekordbox",
              "Mixxx"
            ],
            "priority": "P1",
            "note": "7-bit MIDI gives only 128 steps per rotation; HID is required for credible scratch feel."
          },
          {
            "id": "D5",
            "name": "MIDI clock out/in at 24 PPQN, with the leader deck as tempo source",
            "from": [
              "Traktor Pro 4",
              "DJM mixers"
            ],
            "priority": "P0",
            "note": "Clock is the tempo-accurate sync path; MTC is positional reference only and too coarse for beat-accurate triggering."
          },
          {
            "id": "D6",
            "name": "Ableton Link peer sync for tempo, beat, phase and start/stop",
            "from": [
              "Traktor Pro 4",
              "djay Pro",
              "Ableton Link SDK"
            ],
            "priority": "P1",
            "note": "How phones, laptops and hardware in the room join the same timeline with no cables. Watch the GPL/commercial licence split."
          },
          {
            "id": "D7",
            "name": "External MIDI instrument integration - keyboards, drum machines, grooveboxes play in time with the deck",
            "from": [
              "Traktor Pro 4",
              "Ableton Link",
              "user intent"
            ],
            "priority": "P1",
            "note": "The explicit brief: MIDI as an instrument interface, not only a control surface. Instruments become an additional content source, alongside files."
          },
          {
            "id": "D8",
            "name": "OSC in/out for tablets, VJ software and show-control systems",
            "from": [
              "OLA",
              "QLC+",
              "liblo"
            ],
            "priority": "P2",
            "note": ""
          },
          {
            "id": "D9",
            "name": "Mackie Control / HUI emulation so studio control surfaces work as mixers",
            "from": [
              "MCU / HUI protocol"
            ],
            "priority": "P2",
            "note": "Opens up a large installed base of motorised-fader surfaces beyond DJ-specific hardware."
          },
          {
            "id": "D10",
            "name": "Web MIDI path for browser-based mapping and lightweight control",
            "from": [
              "WEBMIDI.js",
              "Web MIDI API"
            ],
            "priority": "P2",
            "note": "Convenience only. Safari has no Web MIDI support on macOS or iOS, and Chrome 124+ requires a permission prompt over HTTPS - so the native path stays authoritative."
          }
        ]
      },
      {
        "id": "content",
        "name": "E. Content & Catalog",
        "summary": "Where the music comes from. Deliberately pluggable, because licensing differs per deployment.",
        "capabilities": [
          {
            "id": "E1",
            "name": "Local library ingest with fingerprint-backed tagging and de-duplication",
            "from": [
              "beets",
              "Chromaprint / AcoustID",
              "MusicBrainz"
            ],
            "priority": "P0",
            "note": ""
          },
          {
            "id": "E2",
            "name": "Self-hosted server sources over the OpenSubsonic API",
            "from": [
              "Navidrome",
              "gonic",
              "OpenSubsonic spec"
            ],
            "priority": "P0",
            "note": "Also expose our own OpenSubsonic endpoint so existing clients work against CrowdDeck immediately."
          },
          {
            "id": "E3",
            "name": "Creative Commons catalog providers",
            "from": [
              "Jamendo",
              "Free Music Archive",
              "ccMixter"
            ],
            "priority": "P1",
            "note": "The licence-clean default catalog, so a fresh install has legal music in it on first run."
          },
          {
            "id": "E4",
            "name": "Pluggable licensed-streaming adapters behind a provider interface",
            "from": [
              "Beatport",
              "TIDAL",
              "SoundCloud Go+",
              "Mopidy backends"
            ],
            "priority": "P2",
            "note": "Every one of these needs a commercial agreement; ship the interface, not unauthorised implementations."
          },
          {
            "id": "E5",
            "name": "Live MIDI instruments and external inputs registered as first-class queueable sources",
            "from": [
              "Novel",
              "user intent"
            ],
            "priority": "P1",
            "note": "A keyboard or drum machine appears in the queue like a track does - the interconnection idea taken to its conclusion."
          },
          {
            "id": "E6",
            "name": "Precomputed analysis cache: beatgrid, key, loudness, phrases, stems, waveform",
            "from": [
              "rekordbox prep",
              "Mixxx analyser",
              "Demucs"
            ],
            "priority": "P0",
            "note": "One ingest pass feeds decks, auto-mix, lighting and patron preview alike."
          },
          {
            "id": "E7",
            "name": "ReplayGain / EBU R128 loudness normalisation across mixed sources",
            "from": [
              "Mixxx",
              "Navidrome"
            ],
            "priority": "P1",
            "note": "Non-negotiable when a CC track, a local file and a live instrument follow one another."
          },
          {
            "id": "E8",
            "name": "Karaoke media support (CDG / MP4+lyrics) with singer rotation",
            "from": [
              "Karaoke Eternal",
              "OpenKJ",
              "TouchTunes karaoke add-on"
            ],
            "priority": "P2",
            "note": ""
          }
        ]
      },
      {
        "id": "show",
        "name": "F. Show Control",
        "summary": "Making the room respond to the music.",
        "capabilities": [
          {
            "id": "F1",
            "name": "Beat- and phrase-synced DMX512 / Art-Net / sACN lighting",
            "from": [
              "rekordbox Lighting mode",
              "OLA",
              "QLC+"
            ],
            "priority": "P2",
            "note": "rekordbox's phrase-aware auto-lighting is the benchmark; OLA plus the QLC+ fixture library gets us most of the way."
          },
          {
            "id": "F2",
            "name": "Synchronised multi-zone audio across rooms",
            "from": [
              "Snapcast",
              "Music Assistant"
            ],
            "priority": "P1",
            "note": "Patio, main room and restrooms are different zones with different policies and volumes."
          },
          {
            "id": "F3",
            "name": "Video / visualiser output on the venue screen",
            "from": [
              "VirtualDJ 2026",
              "AMI NEXTGEN",
              "Karaoke Eternal"
            ],
            "priority": "P2",
            "note": ""
          },
          {
            "id": "F4",
            "name": "Digital signage and venue promo slots between tracks",
            "from": [
              "AMI NEXTGEN ad upload",
              "Rockbot"
            ],
            "priority": "P2",
            "note": "A real revenue lever for operators."
          }
        ]
      },
      {
        "id": "platform",
        "name": "G. Platform & Operations",
        "summary": "What makes it deployable in a real venue rather than a demo.",
        "capabilities": [
          {
            "id": "G1",
            "name": "Offline-first venue runtime - full function with no internet",
            "from": [
              "Novel",
              "TouchTunes cloud dependency is a weakness"
            ],
            "priority": "P0",
            "note": "A cloud-dependent jukebox goes silent when the venue's DSL drops. Local-first is a genuine advantage over TouchTunes."
          },
          {
            "id": "G2",
            "name": "Headless server plus separate operator, DJ and patron clients",
            "from": [
              "Mopidy",
              "Navidrome",
              "Music Assistant"
            ],
            "priority": "P0",
            "note": ""
          },
          {
            "id": "G3",
            "name": "Open, documented HTTP + WebSocket API for the whole system",
            "from": [
              "OpenSubsonic",
              "Mopidy"
            ],
            "priority": "P0",
            "note": "Third-party clients are how an open project out-features a closed one."
          },
          {
            "id": "G4",
            "name": "Single-command deploy (container / compose) with a sane default catalog",
            "from": [
              "Navidrome",
              "Karaoke Eternal"
            ],
            "priority": "P1",
            "note": ""
          },
          {
            "id": "G5",
            "name": "Venue analytics: plays, requests, revenue, peak hours, unfilled demand",
            "from": [
              "AMI Co-Pilot",
              "TouchTunes operator reporting"
            ],
            "priority": "P2",
            "note": ""
          },
          {
            "id": "G6",
            "name": "No telemetry by default; all data stays in the venue",
            "from": [
              "Karaoke Eternal",
              "project principle"
            ],
            "priority": "P0",
            "note": ""
          }
        ]
      },
      {
        "id": "legal",
        "name": "H. Licensing, Compliance & Governance",
        "summary": "The part hobby projects skip and venues get fined for.",
        "capabilities": [
          {
            "id": "H1",
            "name": "Per-venue licensing profile recording which PRO licences are held",
            "from": [
              "ASCAP / BMI / SESAC / GMR",
              "JLO closure"
            ],
            "priority": "P1",
            "note": "The Jukebox License Office shut down in 2025, so operators now need separate ASCAP, BMI and SESAC licences. Software should track this, not assume it."
          },
          {
            "id": "H2",
            "name": "Catalog sources tagged with their licence class and public-performance status",
            "from": [
              "Jamendo",
              "FMA",
              "ccMixter",
              "record pools"
            ],
            "priority": "P0",
            "note": "The system must be able to answer 'may this venue legally play this track right now'."
          },
          {
            "id": "H3",
            "name": "Reporting export of what was actually performed",
            "from": [
              "PRO reporting practice"
            ],
            "priority": "P2",
            "note": "Play logs are the evidence trail for PRO reporting and label statements."
          },
          {
            "id": "H4",
            "name": "Hard refusal to source venue catalog from consumer accounts or downloaders",
            "from": [
              "Festify's flaw",
              "librespot",
              "yt-dlp"
            ],
            "priority": "P0",
            "note": "Consumer streaming subscriptions do not grant public-performance rights. Designing this out is a feature."
          },
          {
            "id": "H5",
            "name": "Clean licence separation between the permissive core and any GPL-derived planes",
            "from": [
              "Mixxx GPL-2.0+",
              "JUCE AGPL",
              "Rubber Band GPL"
            ],
            "priority": "P0",
            "note": "Decided before the first line of engine code, because it is nearly impossible to unwind later."
          }
        ]
      }
    ]
  },
  "sources": {
    "generated": "2026-08-26",
    "contentSources": [
      {
        "name": "Local filesystem library",
        "class": "Owned media",
        "access": "Direct file I/O",
        "performanceRights": "Venue must hold PRO licences (ASCAP / BMI / SESAC / GMR) for public performance; owning the file is not a performance right.",
        "fit": "P0 - the baseline source",
        "notes": "Ingest via beets + Chromaprint/AcoustID + MusicBrainz for reliable tags and de-duplication. Widest format spread, so FFmpeg/libsndfile decoding is unavoidable."
      },
      {
        "name": "OpenSubsonic / Subsonic servers",
        "class": "Self-hosted",
        "access": "Open HTTP API",
        "performanceRights": "Same as local media - the server is transport, not a licence.",
        "fit": "P0 - primary integration",
        "notes": "Navidrome (GPL-3.0, 23k stars), gonic (GPL-3.0) and others already implement it, including server-side jukebox mode. The jukeboxMediaTypes extension widens jukeboxControl beyond song IDs to podcast episodes and radio stations. We should both consume and expose this API."
      },
      {
        "name": "Jamendo",
        "class": "Creative Commons",
        "access": "Public REST API, free client ID",
        "performanceRights": "CC terms per track; commercial/venue use may require Jamendo's licensing product. Attribution and share-alike obligations vary by track.",
        "fit": "P1 - default legal catalog",
        "notes": "500,000+ CC tracks with streaming-ready URLs. The best candidate for shipping a demo install that is legal out of the box."
      },
      {
        "name": "Free Music Archive",
        "class": "Creative Commons",
        "access": "JSON API",
        "performanceRights": "Per-track CC licence, exposed in the API response.",
        "fit": "P1",
        "notes": "Metadata includes licence type, which maps directly onto our per-track licence-class tagging requirement (H2)."
      },
      {
        "name": "ccMixter",
        "class": "Creative Commons",
        "access": "ccHost Query API",
        "performanceRights": "Per-track CC licence.",
        "fit": "P2",
        "notes": "Remix- and stem-friendly catalog, which pairs unusually well with a stem-capable engine."
      },
      {
        "name": "Beatport / Beatsource",
        "class": "Licensed streaming (DJ)",
        "access": "Partner integration only",
        "performanceRights": "Subscription grants DJ performance use within approved applications. Beatsource is being folded into Beatport.",
        "fit": "P2 - adapter interface only",
        "notes": "Integrated into Serato, rekordbox, Traktor, VirtualDJ, djay, Engine OS and CDJ-3000 class hardware. Requires a commercial agreement; we ship the provider interface, not an implementation."
      },
      {
        "name": "TIDAL",
        "class": "Licensed streaming",
        "access": "Partner integration only",
        "performanceRights": "Per partner agreement.",
        "fit": "P2 - adapter interface only",
        "notes": "The most widely integrated hi-fi option across DJ software."
      },
      {
        "name": "SoundCloud Go+",
        "class": "Licensed streaming",
        "access": "API with registered client ID",
        "performanceRights": "Go+ content requires a separate written agreement with SoundCloud; the API terms mandate attribution and permalink backlinks and forbid circumventing quotas.",
        "fit": "P2 - adapter interface only",
        "notes": "Explicitly documented as needing a written agreement - a good example of why streaming adapters must be optional plugins."
      },
      {
        "name": "DJ record pools (BPM Supreme, ZIPDJ)",
        "class": "Licensed download",
        "access": "Subscription download",
        "performanceRights": "Subscription grants professional DJs the right to play downloaded music live, on radio and in streamed mixes.",
        "fit": "P2 - ingest path",
        "notes": "Roughly $20-25/month. Downloads land in the local library, so no special runtime integration is needed - only licence-class tagging."
      },
      {
        "name": "Consumer streaming (Spotify, Apple Music personal accounts)",
        "class": "Consumer subscription",
        "access": "librespot / spotifyd / official SDKs",
        "performanceRights": "NONE for public performance. Personal, non-commercial use only.",
        "fit": "EXCLUDED",
        "notes": "This is the fatal flaw in the Festify / Jukestar / PartyPlay class of open-source jukeboxes. CrowdDeck must refuse this path for venue mode by design."
      },
      {
        "name": "Media downloaders (yt-dlp and similar)",
        "class": "Unlicensed",
        "access": "Scraping",
        "performanceRights": "None. Terms-of-service violation plus unlicensed public performance.",
        "fit": "EXCLUDED",
        "notes": "Explicitly out of scope for the venue product."
      },
      {
        "name": "Live MIDI instruments",
        "class": "Performed in-room",
        "access": "MIDI 1.0 / 2.0 UMP, Ableton Link",
        "performanceRights": "Live-performance licensing is separate from jukebox licensing; original material needs none.",
        "fit": "P1 - novel source class",
        "notes": "The brief's distinguishing idea: a keyboard, groovebox or drum machine is registered as a queueable source that plays in time with the decks, not merely as a controller."
      }
    ],
    "interconnect": [
      {
        "name": "MIDI 1.0",
        "role": "Control surfaces, legacy gear",
        "resolution": "7-bit (0-127); 14-bit exists but is rarely implemented",
        "support": "Universal",
        "verdict": "Required baseline. Insufficient alone for high-resolution jog wheels."
      },
      {
        "name": "MIDI 2.0 / UMP",
        "role": "High-resolution, bidirectional, self-describing control",
        "resolution": "Up to 32-bit values; 16 groups x 16 channels",
        "support": "Windows 11 MIDI Services (2026), macOS CoreMIDI (since Oct 2021), Linux ALSA (kernel 6.5+, 2023)",
        "verdict": "Adopt now. MIDI-CI Property Exchange (JSON-based) and Profiles allow controllers to describe themselves, which could largely automate mapping - a real leap past every current DJ app."
      },
      {
        "name": "HID",
        "role": "High-resolution jog wheels and platters",
        "resolution": "Far beyond 128 steps/rotation; Serato mappings commonly use 1536 (128 x 12)",
        "support": "Pioneer CDJs and most Serato/Traktor-certified hardware, via an 'Advanced' HID mode",
        "verdict": "Needed for credible scratch feel. Mixxx already implements HID mapping with a packet-parser helper."
      },
      {
        "name": "MIDI Clock (24 PPQN)",
        "role": "Tempo sync to external instruments",
        "resolution": "24 pulses per quarter note",
        "support": "Universal on hardware",
        "verdict": "Primary outbound tempo path. Keep the clock path short and avoid Thru daisy-chains, which introduce jitter."
      },
      {
        "name": "MIDI Time Code (MTC)",
        "role": "Positional / SMPTE alignment",
        "resolution": "~0.6 ms, 8 quarter-frame messages per frame",
        "support": "Common in AV",
        "verdict": "Positional reference only. Too coarse and too jitter-prone for beat-accurate musical triggering."
      },
      {
        "name": "Ableton Link",
        "role": "Peer-to-peer tempo, beat, phase and start/stop sync over LAN",
        "resolution": "Shared continuous timeline with a phase 'quantum'",
        "support": "Traktor, djay, hundreds of iOS apps and hardware",
        "verdict": "Adopt - the cable-free way for phones, laptops and hardware in the room to share our timeline. Licence caution: GPL-2.0-or-later unless commercially licensed from Ableton."
      },
      {
        "name": "OSC (Open Sound Control)",
        "role": "Tablets, VJ software, show control",
        "resolution": "Arbitrary typed messages over UDP/TCP",
        "support": "OLA, QLC+, Lemur, TouchOSC",
        "verdict": "Adopt via liblo (LGPL-2.1) for the bridge into lighting and visuals."
      },
      {
        "name": "DMX512 / Art-Net / sACN",
        "role": "Lighting fixtures",
        "resolution": "512 channels per universe",
        "support": "OLA, QLC+; rekordbox drives DMX via the RB-DMX1 interface",
        "verdict": "Adopt through OLA. Phrase-aware auto-lighting, as in rekordbox Lighting mode, is the capability to match."
      },
      {
        "name": "Mackie Control / HUI",
        "role": "Studio control surfaces as mixers",
        "resolution": "10-bit (0-1023) fader resolution via LSB trick",
        "support": "Reverse-engineered spec; open implementations exist (TouchMCU, MusE)",
        "verdict": "Optional. Unlocks a large installed base of motorised-fader surfaces that no DJ app currently addresses."
      },
      {
        "name": "Web MIDI API",
        "role": "Browser-based mapping and light control",
        "resolution": "MIDI 1.0 byte stream",
        "support": "Chrome 43+, Edge 79+, Firefox 108+, Opera, Samsung Internet. NOT Safari on macOS/iOS, with no announced roadmap. Chrome 124+ gates the entire API behind a permission prompt and requires HTTPS.",
        "verdict": "Convenience path only. Because Safari and therefore every iPhone browser is excluded, the native MIDI path must remain authoritative."
      }
    ]
  }
};
