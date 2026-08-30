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
  },
  "requirements": {
    "source": "SPECIFICATION.md",
    "note": "Generated by tools/extract-requirements.mjs. Do not edit by hand — edit SPECIFICATION.md and re-run.",
    "counts": {
      "total": 123,
      "must": 119,
      "should": 3,
      "acceptance": 18,
      "byGroup": {
        "LIC": 9,
        "CDEP": 19,
        "SCH": 19,
        "POL": 4,
        "MODE": 5,
        "FALL": 4,
        "DAT": 14,
        "API": 13,
        "MIDI": 9,
        "CLK": 7,
        "INST": 2,
        "CON": 7,
        "NFR": 11
      }
    },
    "groups": [
      {
        "id": "LIC",
        "name": "Licence & boundary",
        "adr": "ADR-001",
        "count": 9
      },
      {
        "id": "CDEP",
        "name": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "count": 19
      },
      {
        "id": "SCH",
        "name": "Unified Scheduler",
        "adr": null,
        "count": 19
      },
      {
        "id": "POL",
        "name": "Venue policy",
        "adr": null,
        "count": 4
      },
      {
        "id": "MODE",
        "name": "Mode & handoff",
        "adr": null,
        "count": 5
      },
      {
        "id": "FALL",
        "name": "Never-silent fallback",
        "adr": null,
        "count": 4
      },
      {
        "id": "DAT",
        "name": "Data model",
        "adr": "ADR-003 / ADR-004",
        "count": 14
      },
      {
        "id": "API",
        "name": "Public API",
        "adr": "ADR-005",
        "count": 13
      },
      {
        "id": "MIDI",
        "name": "MIDI & mapping",
        "adr": null,
        "count": 9
      },
      {
        "id": "CLK",
        "name": "Clock & sync",
        "adr": null,
        "count": 7
      },
      {
        "id": "INST",
        "name": "Instruments as sources",
        "adr": null,
        "count": 2
      },
      {
        "id": "CON",
        "name": "Content & ingest",
        "adr": null,
        "count": 7
      },
      {
        "id": "NFR",
        "name": "Non-functional",
        "adr": null,
        "count": 11
      }
    ],
    "requirements": [
      {
        "id": "REQ-LIC-1",
        "group": "LIC",
        "groupName": "Licence & boundary",
        "adr": "ADR-001",
        "num": 1,
        "section": "1.1 Plane assignment",
        "level": "MUST",
        "capabilities": [],
        "text": "Every source file MUST carry an SPDX-License-Identifier header matching its plane."
      },
      {
        "id": "REQ-LIC-2",
        "group": "LIC",
        "groupName": "Licence & boundary",
        "adr": "ADR-001",
        "num": 2,
        "section": "1.1 Plane assignment",
        "level": "MUST",
        "capabilities": [],
        "text": "Apache-2.0 code MUST NOT include, vendor, statically link, or #include any header from a GPL-licensed work. Not once, not \"temporarily\"."
      },
      {
        "id": "REQ-LIC-3",
        "group": "LIC",
        "groupName": "Licence & boundary",
        "adr": "ADR-001",
        "num": 3,
        "section": "1.1 Plane assignment",
        "level": "MUST",
        "capabilities": [],
        "text": "CI MUST run a licence-lint job that fails the build on any violation of REQ-LIC-1 or REQ-LIC-2, including transitive dependencies. Contributor confusion is the main practical risk of a split licence, so the mitigation is mechanical rather than documentary."
      },
      {
        "id": "REQ-LIC-4",
        "group": "LIC",
        "groupName": "Licence & boundary",
        "adr": "ADR-001",
        "num": 4,
        "section": "1.1 Plane assignment",
        "level": "MUST",
        "capabilities": [],
        "text": "The engine MUST ship as a standalone executable that is independently useful and independently runnable."
      },
      {
        "id": "REQ-LIC-5",
        "group": "LIC",
        "groupName": "Licence & boundary",
        "adr": "ADR-001",
        "num": 5,
        "section": "1.1 Plane assignment",
        "level": "MUST",
        "capabilities": [],
        "text": "A conforming alternative engine MUST remain possible. The stub engine (§2.9) exists permanently to prove this and MUST stay green in CI."
      },
      {
        "id": "REQ-LIC-6",
        "group": "LIC",
        "groupName": "Licence & boundary",
        "adr": "ADR-001",
        "num": 6,
        "section": "1.1 Plane assignment",
        "level": "MUST",
        "capabilities": [],
        "text": "FFmpeg MUST be built LGPL-only, with enabled components audited in CI. A GPL-configured build silently relicenses the product."
      },
      {
        "id": "REQ-LIC-7",
        "group": "LIC",
        "groupName": "Licence & boundary",
        "adr": "ADR-001",
        "num": 7,
        "section": "1.1 Plane assignment",
        "level": "MUST",
        "capabilities": [],
        "text": "Third-party dependency licences MUST be inventoried in a generated NOTICE file per release artifact."
      },
      {
        "id": "REQ-LIC-8",
        "group": "LIC",
        "groupName": "Licence & boundary",
        "adr": "ADR-001",
        "num": 8,
        "section": "1.1 Plane assignment",
        "level": "MUST",
        "capabilities": [],
        "text": "The Apache-2.0 venue layer and the GPL engine MUST be released as separate artifacts. They MUST NOT be distributed together in a single installer, archive, container image or package (ADR-006)."
      },
      {
        "id": "REQ-LIC-9",
        "group": "LIC",
        "groupName": "Licence & boundary",
        "adr": "ADR-001",
        "num": 9,
        "section": "1.1 Plane assignment",
        "level": "MUST",
        "capabilities": [],
        "text": "Contributions MUST be accepted under a DCO with inbound=outbound licensing, so the single-GPL fallback in ADR-006 remains exercisable without tracing every contributor (ADR-006)."
      },
      {
        "id": "REQ-CDEP-1",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 1,
        "section": "2.2 Transport",
        "level": "MUST",
        "capabilities": [],
        "text": "Transport MUST be a local stream socket: Unix domain socket on POSIX, named pipe on Windows. TCP on loopback MAY be offered for development, MUST be off by default."
      },
      {
        "id": "REQ-CDEP-2",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 2,
        "section": "2.2 Transport",
        "level": "MUST",
        "capabilities": [],
        "text": "Framing MUST be newline-delimited JSON (one object per line, UTF-8)."
      },
      {
        "id": "REQ-CDEP-3",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 3,
        "section": "2.2 Transport",
        "level": "MUST",
        "capabilities": [],
        "text": "The protocol MUST NOT use shared memory or pass structures whose layout is defined by GPL headers. Arms-length generality is a licence requirement (ADR-001), not a style preference."
      },
      {
        "id": "REQ-CDEP-4",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 4,
        "section": "2.2 Transport",
        "level": "MUST",
        "capabilities": [],
        "text": "The engine MUST accept multiple concurrent clients and MUST apply per-client subscription state independently."
      },
      {
        "id": "REQ-CDEP-5",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 5,
        "section": "2.3 Control addressing",
        "level": "MUST",
        "capabilities": [],
        "text": "Group names MUST be stable across engine restarts."
      },
      {
        "id": "REQ-CDEP-6",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 6,
        "section": "2.3 Control addressing",
        "level": "MUST",
        "capabilities": [],
        "text": "Deck groups MUST be [Channel1]…[ChannelN]; the master bus MUST be [Master]."
      },
      {
        "id": "REQ-CDEP-7",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 7,
        "section": "2.4 Message envelope",
        "level": "MUST",
        "capabilities": [],
        "text": "Receivers MUST ignore unknown object fields, so the protocol can extend without a version bump."
      },
      {
        "id": "REQ-CDEP-8",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 8,
        "section": "2.4 Message envelope",
        "level": "MUST",
        "capabilities": [],
        "text": "Every error MUST carry a machine-readable code from a documented enumeration."
      },
      {
        "id": "REQ-CDEP-9",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 9,
        "section": "2.6 Handshake and versioning",
        "level": "MUST",
        "capabilities": [],
        "text": "The protocol MUST be versioned cdep/<major>. Breaking changes bump the major."
      },
      {
        "id": "REQ-CDEP-10",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 10,
        "section": "2.6 Handshake and versioning",
        "level": "MUST",
        "capabilities": [],
        "text": "The engine MUST reject an unsupported protocol version with unsupported_protocol and close the connection."
      },
      {
        "id": "REQ-CDEP-11",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 11,
        "section": "2.6 Handshake and versioning",
        "level": "MUST",
        "capabilities": [],
        "text": "welcome MUST advertise optional features in capabilities. Clients MUST degrade gracefully when a capability is absent — this is what allows the stub engine to be conformant while implementing far less than the Mixxx engine."
      },
      {
        "id": "REQ-CDEP-12",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 12,
        "section": "2.7 Self-description",
        "level": "MUST",
        "capabilities": [],
        "text": "describe MUST return every control with a descriptor carrying group, item, default, readonly, and a human label. type (bool | int | float | enum), min and max are SHOULD — an engine supplies them where it knows them and omits them where it does not."
      },
      {
        "id": "REQ-CDEP-12a",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": null,
        "section": "2.7 Self-description",
        "level": "MUST",
        "capabilities": [],
        "text": "Every control MUST additionally be readable and writable in parameter space: a normalised 0.0..1.0 where 0 is the control's minimum useful position and 1 its maximum. get MUST return parameter alongside value; set MUST accept either."
      },
      {
        "id": "REQ-CDEP-13",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 13,
        "section": "2.7 Self-description",
        "level": "MUST",
        "capabilities": [],
        "text": "The description MUST be sufficient to build a complete control UI and a complete MIDI-mapping target list with no hard-coded knowledge of the engine. A client that uses only parameter space MUST be able to do this using solely MUST-level descriptor fields."
      },
      {
        "id": "REQ-CDEP-14",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 14,
        "section": "2.8 Subscriptions and back-pressure",
        "level": "MUST",
        "capabilities": [],
        "text": "subscribe MUST accept max_hz and the engine MUST coalesce updates to that rate, emitting only the latest value per control per interval."
      },
      {
        "id": "REQ-CDEP-15",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 15,
        "section": "2.8 Subscriptions and back-pressure",
        "level": "MUST",
        "capabilities": [],
        "text": "High-rate controls (playposition, VU meters) MUST NOT be delivered unsubscribed."
      },
      {
        "id": "REQ-CDEP-16",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 16,
        "section": "2.8 Subscriptions and back-pressure",
        "level": "MUST",
        "capabilities": [],
        "text": "If a client's send queue exceeds a bounded depth, the engine MUST drop coalesced updates rather than block. The audio thread MUST NEVER block on IPC — this is the hard rule the whole two-plane split exists to guarantee."
      },
      {
        "id": "REQ-CDEP-17",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 17,
        "section": "2.9 Conformance and the stub engine",
        "level": "MUST",
        "capabilities": [],
        "text": "A published conformance suite MUST exist, and both engine/ and engine-stub/ MUST pass it in CI."
      },
      {
        "id": "REQ-CDEP-18",
        "group": "CDEP",
        "groupName": "Engine IPC (CDEP)",
        "adr": "ADR-002",
        "num": 18,
        "section": "2.9 Conformance and the stub engine",
        "level": "MUST",
        "capabilities": [],
        "text": "engine-stub/ MUST implement: handshake, describe, get/set, subscribe/changed, load, transport, and gapless sequential playback — enough for the fusion core to be developed and tested against it with no Mixxx dependency."
      },
      {
        "id": "REQ-SCH-1",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 1,
        "section": "3.1 Queue entry lifecycle",
        "level": "MUST",
        "capabilities": [],
        "text": "Every queue entry MUST occupy exactly one state, and transitions MUST be recorded with a timestamp and actor."
      },
      {
        "id": "REQ-SCH-2",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 2,
        "section": "3.1 Queue entry lifecycle",
        "level": "MUST",
        "capabilities": [],
        "text": "requested → screened MUST be performed by the policy engine (§3.5). An entry failing policy MUST go to rejected with a machine-readable reason."
      },
      {
        "id": "REQ-SCH-3",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 3,
        "section": "3.1 Queue entry lifecycle",
        "level": "MUST",
        "capabilities": [
          "C1"
        ],
        "text": "In attended mode, staged → cued MUST require an explicit DJ action."
      },
      {
        "id": "REQ-SCH-4",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 4,
        "section": "3.1 Queue entry lifecycle",
        "level": "MUST",
        "capabilities": [
          "C2"
        ],
        "text": "In autonomous mode, screened → staged → cued MUST proceed automatically."
      },
      {
        "id": "REQ-SCH-5",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 5,
        "section": "3.1 Queue entry lifecycle",
        "level": "MUST",
        "capabilities": [],
        "text": "Patrons MUST NOT be able to cause a cued or playing entry to change state. Only staff and the engine may."
      },
      {
        "id": "REQ-SCH-6",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 6,
        "section": "3.2 Priority ordering",
        "level": "MUST",
        "capabilities": [],
        "text": "Staff-pinned entries MUST sort above all others regardless of score."
      },
      {
        "id": "REQ-SCH-7",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 7,
        "section": "3.2 Priority ordering",
        "level": "MUST",
        "capabilities": [],
        "text": "The ordering function MUST treat votes and boost units as two inputs to one score, so that enabling payments in v1.1 requires no scheduler change (ADR-003)."
      },
      {
        "id": "REQ-SCH-8",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 8,
        "section": "3.2 Priority ordering",
        "level": "MUST",
        "capabilities": [],
        "text": "age_bonus MUST be non-zero and monotonically increasing. Without an aging term an unpopular request never plays; anti-starvation is a correctness property, not a nicety."
      },
      {
        "id": "REQ-SCH-9",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 9,
        "section": "3.2 Priority ordering",
        "level": "MUST",
        "capabilities": [],
        "text": "All weights and intervals MUST be venue-configurable, with documented defaults (VOTE_WEIGHT=10, BOOST_WEIGHT=25, AGING_INTERVAL=5min, AGING_WEIGHT=3)."
      },
      {
        "id": "REQ-SCH-10",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 10,
        "section": "3.2 Priority ordering",
        "level": "MUST",
        "capabilities": [],
        "text": "priority_score MUST be recomputed deterministically; identical inputs give identical ordering. It MUST NOT depend on wall-clock time except through age_bonus."
      },
      {
        "id": "REQ-SCH-11",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 11,
        "section": "3.3 Position in line",
        "level": "MUST",
        "capabilities": [
          "B2"
        ],
        "text": "Every patron MUST see their entry's 1-based position in the effective play order. This is TouchTunes' single most-cited feature and is what makes waiting tolerable."
      },
      {
        "id": "REQ-SCH-12",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 12,
        "section": "3.3 Position in line",
        "level": "MUST",
        "capabilities": [],
        "text": "Position MUST update in real time over WebSocket when the ordering changes."
      },
      {
        "id": "REQ-SCH-13",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 13,
        "section": "3.3 Position in line",
        "level": "SHOULD",
        "capabilities": [],
        "text": "An estimated time-until-play SHOULD be derived from queued track durations."
      },
      {
        "id": "REQ-SCH-14",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 14,
        "section": "3.4 Fair-queue rules",
        "level": "MUST",
        "capabilities": [],
        "text": "max_pending_per_patron (default 2) MUST be enforced at request time."
      },
      {
        "id": "REQ-SCH-15",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 15,
        "section": "3.4 Fair-queue rules",
        "level": "MUST",
        "capabilities": [],
        "text": "track_cooldown (default 60 min) and artist_cooldown (default 30 min) MUST block re-requests venue-wide, counting from last play."
      },
      {
        "id": "REQ-SCH-16",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 16,
        "section": "3.4 Fair-queue rules",
        "level": "MUST",
        "capabilities": [],
        "text": "A per-patron request rate limit (default 5 per 15 min) MUST apply."
      },
      {
        "id": "REQ-SCH-17",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 17,
        "section": "3.4 Fair-queue rules",
        "level": "MUST",
        "capabilities": [],
        "text": "A patron MUST NOT vote twice for the same entry, enforced by a uniqueness constraint rather than UI logic."
      },
      {
        "id": "REQ-SCH-18",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 18,
        "section": "3.4 Fair-queue rules",
        "level": "MUST",
        "capabilities": [],
        "text": "Every rejection MUST return a specific reason so the client can explain it."
      },
      {
        "id": "REQ-SCH-19",
        "group": "SCH",
        "groupName": "Unified Scheduler",
        "adr": null,
        "num": 19,
        "section": "3.4 Fair-queue rules",
        "level": "MUST",
        "capabilities": [],
        "text": "The effective play order MUST rotate between patrons: where several patrons have pending entries, a patron MUST NOT occupy consecutive positions while another patron with a pending entry has not yet had a turn. Rotation orders turns, not outcomes — the highest-scoring entry still plays first, and staff-pinned entries (REQ-SCH-6) are unaffected. It MUST be venue-configurable (ROTATE_PATRONS=true) under REQ-SCH-9."
      },
      {
        "id": "REQ-POL-1",
        "group": "POL",
        "groupName": "Venue policy",
        "adr": null,
        "num": 1,
        "section": "3.5 Venue policy engine",
        "level": "MUST",
        "capabilities": [],
        "text": "Requests MUST be screened against: explicit-content flag, artist/genre block lists, allow-list mode, per-daypart rules, and licence class (§4.4)."
      },
      {
        "id": "REQ-POL-2",
        "group": "POL",
        "groupName": "Venue policy",
        "adr": null,
        "num": 2,
        "section": "3.5 Venue policy engine",
        "level": "MUST",
        "capabilities": [
          "C6"
        ],
        "text": "Patron search MUST be scoped by the same policy, so an unrequestable track is never offered. Filtering only at request time is a defect."
      },
      {
        "id": "REQ-POL-3",
        "group": "POL",
        "groupName": "Venue policy",
        "adr": null,
        "num": 3,
        "section": "3.5 Venue policy engine",
        "level": "MUST",
        "capabilities": [],
        "text": "Policy MUST be evaluated at request time and re-evaluated at cued, since dayparting may have changed in between."
      },
      {
        "id": "REQ-POL-4",
        "group": "POL",
        "groupName": "Venue policy",
        "adr": null,
        "num": 4,
        "section": "3.5 Venue policy engine",
        "level": "MUST",
        "capabilities": [],
        "text": "Staff MUST be able to override any policy decision, and the override MUST be logged."
      },
      {
        "id": "REQ-MODE-1",
        "group": "MODE",
        "groupName": "Mode & handoff",
        "adr": null,
        "num": 1,
        "section": "3.6 Mode and handoff",
        "level": "MUST",
        "capabilities": [],
        "text": "The venue MUST be in exactly one mode: autonomous or attended."
      },
      {
        "id": "REQ-MODE-2",
        "group": "MODE",
        "groupName": "Mode & handoff",
        "adr": null,
        "num": 2,
        "section": "3.6 Mode and handoff",
        "level": "MUST",
        "capabilities": [
          "C3"
        ],
        "text": "Mode transitions MUST NOT interrupt audio. A track playing across a handoff continues."
      },
      {
        "id": "REQ-MODE-3",
        "group": "MODE",
        "groupName": "Mode & handoff",
        "adr": null,
        "num": 3,
        "section": "3.6 Mode and handoff",
        "level": "MUST",
        "capabilities": [],
        "text": "Entering attended MUST stop automatic staged → cued promotion, leaving already cued entries intact."
      },
      {
        "id": "REQ-MODE-4",
        "group": "MODE",
        "groupName": "Mode & handoff",
        "adr": null,
        "num": 4,
        "section": "3.6 Mode and handoff",
        "level": "MUST",
        "capabilities": [],
        "text": "Entering autonomous MUST resume automatic promotion from the current queue state."
      },
      {
        "id": "REQ-MODE-5",
        "group": "MODE",
        "groupName": "Mode & handoff",
        "adr": null,
        "num": 5,
        "section": "3.6 Mode and handoff",
        "level": "MUST",
        "capabilities": [],
        "text": "In autonomous, the engine MUST beatmatch transitions using the analysed beatgrid, falling back to a timed crossfade when confidence is low."
      },
      {
        "id": "REQ-FALL-1",
        "group": "FALL",
        "groupName": "Never-silent fallback",
        "adr": null,
        "num": 1,
        "section": "3.7 Never-silent fallback",
        "level": "MUST",
        "capabilities": [],
        "text": "When the queue empties, the scheduler MUST promote from a configured fallback source (playlist, smart playlist, or CC catalog)."
      },
      {
        "id": "REQ-FALL-2",
        "group": "FALL",
        "groupName": "Never-silent fallback",
        "adr": null,
        "num": 2,
        "section": "3.7 Never-silent fallback",
        "level": "MUST",
        "capabilities": [],
        "text": "Fallback selections MUST pass the same policy screening."
      },
      {
        "id": "REQ-FALL-3",
        "group": "FALL",
        "groupName": "Never-silent fallback",
        "adr": null,
        "num": 3,
        "section": "3.7 Never-silent fallback",
        "level": "MUST",
        "capabilities": [],
        "text": "Dead air MUST NOT exceed 2 seconds under any queue state, including at venue open, after a skip, and on engine reconnect."
      },
      {
        "id": "REQ-FALL-4",
        "group": "FALL",
        "groupName": "Never-silent fallback",
        "adr": null,
        "num": 4,
        "section": "3.7 Never-silent fallback",
        "level": "MUST",
        "capabilities": [],
        "text": "If the engine connection drops, the fusion core MUST reconnect with backoff and resume from persisted queue state. The queue is durable; the engine is replaceable."
      },
      {
        "id": "REQ-DAT-1",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 1,
        "section": "4.1 Multi-venue readiness",
        "level": "MUST",
        "capabilities": [],
        "text": "Every venue-scoped table MUST carry venue_id from the first migration, even though v1 binds to one venue (ADR-004). Near-zero cost now; a migration across every table and query later."
      },
      {
        "id": "REQ-DAT-2",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 2,
        "section": "4.1 Multi-venue readiness",
        "level": "MUST",
        "capabilities": [],
        "text": "The runtime MUST bind to exactly one venue_id. Cross-venue queries are out of scope."
      },
      {
        "id": "REQ-DAT-3",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 3,
        "section": "4.3 Credit ledger (ADR-003)",
        "level": "MUST",
        "capabilities": [],
        "text": "The ledger MUST be append-only. Corrections are compensating entries, never updates."
      },
      {
        "id": "REQ-DAT-4",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 4,
        "section": "4.3 Credit ledger (ADR-003)",
        "level": "MUST",
        "capabilities": [],
        "text": "Balance MUST be derived as the sum of deltas, never stored as a mutable column."
      },
      {
        "id": "REQ-DAT-5",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 5,
        "section": "4.3 Credit ledger (ADR-003)",
        "level": "MUST",
        "capabilities": [],
        "text": "v1 MUST accept reason values staff_grant, promotion, spend, refund only. No paid top-up path exists in v1."
      },
      {
        "id": "REQ-DAT-6",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 6,
        "section": "4.3 Credit ledger (ADR-003)",
        "level": "MUST",
        "capabilities": [],
        "text": "Credits MUST NOT expire (matching the TouchTunes wallet mechanic)."
      },
      {
        "id": "REQ-DAT-7",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 7,
        "section": "4.3 Credit ledger (ADR-003)",
        "level": "MUST",
        "capabilities": [],
        "text": "Spending credits MUST be atomic with the boost it purchases; a failed boost MUST NOT consume credit."
      },
      {
        "id": "REQ-DAT-8",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 8,
        "section": "4.4 Licence class",
        "level": "MUST",
        "capabilities": [],
        "text": "Every track MUST carry a licence_class: owned_local, cc_attribution, cc_sharealike, cc_noncommercial, record_pool, licensed_stream, unknown."
      },
      {
        "id": "REQ-DAT-9",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 9,
        "section": "4.4 Licence class",
        "level": "MUST",
        "capabilities": [],
        "text": "The system MUST be able to answer \"may this venue legally play this track now?\" from licence_class + venue_licence_profile."
      },
      {
        "id": "REQ-DAT-10",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 10,
        "section": "4.4 Licence class",
        "level": "MUST",
        "capabilities": [],
        "text": "cc_noncommercial and unknown MUST default to blocked in a commercial venue profile."
      },
      {
        "id": "REQ-DAT-11",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 11,
        "section": "4.4 Licence class",
        "level": "MUST",
        "capabilities": [],
        "text": "Attribution-required tracks MUST surface attribution on the venue display while playing."
      },
      {
        "id": "REQ-DAT-12",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 12,
        "section": "4.5 Play log",
        "level": "MUST",
        "capabilities": [],
        "text": "Every performance MUST be logged with start, end, mode and licence class."
      },
      {
        "id": "REQ-DAT-13",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 13,
        "section": "4.5 Play log",
        "level": "MUST",
        "capabilities": [],
        "text": "The log MUST be exportable as CSV for PRO reporting."
      },
      {
        "id": "REQ-DAT-14",
        "group": "DAT",
        "groupName": "Data model",
        "adr": "ADR-003 / ADR-004",
        "num": 14,
        "section": "4.5 Play log",
        "level": "MUST",
        "capabilities": [
          "G6"
        ],
        "text": "The log MUST be local-only and MUST NOT be transmitted anywhere."
      },
      {
        "id": "REQ-API-1",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": 1,
        "section": "5.1 Principles",
        "level": "MUST",
        "capabilities": [
          "G3"
        ],
        "text": "The API MUST be the only way clients interact with the system. No privileged back door for first-party consoles — this is what makes third-party clients viable."
      },
      {
        "id": "REQ-API-2",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": 2,
        "section": "5.1 Principles",
        "level": "MUST",
        "capabilities": [],
        "text": "Paths MUST be namespaced /v1/venues/{venue_id}/... from the start (ADR-004), so client URLs survive the move to federation."
      },
      {
        "id": "REQ-API-3",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": 3,
        "section": "5.1 Principles",
        "level": "MUST",
        "capabilities": [],
        "text": "All mutations MUST be authenticated; patron auth is a venue-scoped session token bound to a QR join."
      },
      {
        "id": "REQ-API-4",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": 4,
        "section": "5.1 Principles",
        "level": "MUST",
        "capabilities": [],
        "text": "The API MUST be documented as OpenAPI 3.1, generated in CI."
      },
      {
        "id": "REQ-API-5",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": 5,
        "section": "5.3 Staff surface",
        "level": "MUST",
        "capabilities": [],
        "text": "Staff actions MUST be logged to queue_entry_event with the actor."
      },
      {
        "id": "REQ-API-6",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": 6,
        "section": "5.3 Staff surface",
        "level": "MUST",
        "capabilities": [],
        "text": "POST /panic MUST stop output within 500 ms."
      },
      {
        "id": "REQ-API-7",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": 7,
        "section": "5.4 DJ surface",
        "level": "MUST",
        "capabilities": [],
        "text": "The DJ console MUST drive the engine through the core, not by connecting to CDEP directly — one authority over deck state."
      },
      {
        "id": "REQ-API-8",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": 8,
        "section": "5.4 DJ surface",
        "level": "MUST",
        "capabilities": [],
        "text": "Deck state MUST stream over WebSocket at a coalesced rate suitable for UI (≥20 Hz for playposition)."
      },
      {
        "id": "REQ-API-9",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": 9,
        "section": "5.4 DJ surface",
        "level": "MUST",
        "capabilities": [
          "G1"
        ],
        "text": "The DJ console MUST be served locally by the appliance and MUST function with no WAN connectivity."
      },
      {
        "id": "REQ-API-10",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": 10,
        "section": "5.5 OpenSubsonic compatibility",
        "level": "MUST",
        "capabilities": [],
        "text": "The appliance MUST expose an OpenSubsonic-compatible subset at /rest/: ping, getLicense, search3, getAlbumList2, getPlaylists, stream, getCoverArt."
      },
      {
        "id": "REQ-API-11",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": 11,
        "section": "5.5 OpenSubsonic compatibility",
        "level": "MUST",
        "capabilities": [],
        "text": "jukeboxControl MUST be implemented. Its playlist MUST be able to represent queue entries that are not Subsonic library songs — a Creative Commons provider track, or a live MIDI instrument (REQ-INST-1) — because a queue that can only express song IDs cannot describe this product's queue."
      },
      {
        "id": "REQ-API-11a",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": null,
        "section": "5.5 OpenSubsonic compatibility",
        "level": "MUST",
        "capabilities": [],
        "text": "That capability MUST be advertised through getOpenSubsonicExtensions under a vendor-namespaced name, and entries a stock client cannot understand MUST still be returned as valid Child objects, so an unmodified Subsonic client shows a coherent queue rather than failing."
      },
      {
        "id": "REQ-API-12",
        "group": "API",
        "groupName": "Public API",
        "adr": "ADR-005",
        "num": 12,
        "section": "5.5 OpenSubsonic compatibility",
        "level": "MUST",
        "capabilities": [],
        "text": "Subsonic-authenticated clients MUST be treated as staff-level, since the Subsonic auth model has no patron concept. The Subsonic surface MUST be disabled unless explicitly configured with its own credential, and that credential MUST NOT default to the staff key."
      },
      {
        "id": "REQ-MIDI-1",
        "group": "MIDI",
        "groupName": "MIDI & mapping",
        "adr": null,
        "num": 1,
        "section": "6.1 MIDI I/O",
        "level": "MUST",
        "capabilities": [],
        "text": "The engine MUST support MIDI 1.0 and MIDI 2.0/UMP via libremidi, with RtMidi as a fallback backend behind our own port interface."
      },
      {
        "id": "REQ-MIDI-2",
        "group": "MIDI",
        "groupName": "MIDI & mapping",
        "adr": null,
        "num": 2,
        "section": "6.1 MIDI I/O",
        "level": "MUST",
        "capabilities": [],
        "text": "Ports MUST be identified by a stable identity (manufacturer, product, serial where available) and MUST NOT be bound by numeric index. Index-bound mappings break on reboot — this is a known defect class in existing tools and we design it out."
      },
      {
        "id": "REQ-MIDI-3",
        "group": "MIDI",
        "groupName": "MIDI & mapping",
        "adr": null,
        "num": 3,
        "section": "6.1 MIDI I/O",
        "level": "MUST",
        "capabilities": [],
        "text": "Hot-plug attach/detach MUST be handled without restart, and mappings MUST re-bind automatically on reattach."
      },
      {
        "id": "REQ-MIDI-4",
        "group": "MIDI",
        "groupName": "MIDI & mapping",
        "adr": null,
        "num": 4,
        "section": "6.2 Mapping and MIDI learn",
        "level": "MUST",
        "capabilities": [],
        "text": "MIDI learn MUST support soft-takeover: a physical control MUST NOT apply its value until it crosses the current software value, preventing parameter jumps."
      },
      {
        "id": "REQ-MIDI-5",
        "group": "MIDI",
        "groupName": "MIDI & mapping",
        "adr": null,
        "num": 5,
        "section": "6.2 Mapping and MIDI learn",
        "level": "MUST",
        "capabilities": [],
        "text": "The mapping format MUST be declarative, human-readable, diffable and shareable, and MUST target controls by CDEP (group, item) — so the mapping target list is generated from describe (REQ-CDEP-13) with no hard-coded engine knowledge."
      },
      {
        "id": "REQ-MIDI-6",
        "group": "MIDI",
        "groupName": "MIDI & mapping",
        "adr": null,
        "num": 6,
        "section": "6.2 Mapping and MIDI learn",
        "level": "MUST",
        "capabilities": [],
        "text": "A mapping MUST be exportable and importable as a single file."
      },
      {
        "id": "REQ-MIDI-7",
        "group": "MIDI",
        "groupName": "MIDI & mapping",
        "adr": null,
        "num": 7,
        "section": "6.2 Mapping and MIDI learn",
        "level": "SHOULD",
        "capabilities": [],
        "text": "HID SHOULD be supported for high-resolution jog wheels; 7-bit MIDI's 128 steps per rotation is insufficient for credible feel."
      },
      {
        "id": "REQ-MIDI-8",
        "group": "MIDI",
        "groupName": "MIDI & mapping",
        "adr": null,
        "num": 8,
        "section": "6.3 MIDI 2.0 self-description",
        "level": "SHOULD",
        "capabilities": [],
        "text": "Where a device supports MIDI-CI, the system SHOULD use Property Exchange to auto-populate a mapping, reducing hand-authoring."
      },
      {
        "id": "REQ-MIDI-9",
        "group": "MIDI",
        "groupName": "MIDI & mapping",
        "adr": null,
        "num": 9,
        "section": "6.3 MIDI 2.0 self-description",
        "level": "MUST",
        "capabilities": [],
        "text": "Auto-generated mappings MUST be editable and MUST be overridable by a user mapping."
      },
      {
        "id": "REQ-CLK-1",
        "group": "CLK",
        "groupName": "Clock & sync",
        "adr": null,
        "num": 1,
        "section": "6.4 Clock and sync",
        "level": "MUST",
        "capabilities": [
          "D5",
          "D6"
        ],
        "text": "The leader deck MUST be the single tempo source, publishing to MIDI Clock and Ableton Link simultaneously."
      },
      {
        "id": "REQ-CLK-2",
        "group": "CLK",
        "groupName": "Clock & sync",
        "adr": null,
        "num": 2,
        "section": "6.4 Clock and sync",
        "level": "MUST",
        "capabilities": [],
        "text": "MIDI Clock MUST be emitted at 24 PPQN."
      },
      {
        "id": "REQ-CLK-3",
        "group": "CLK",
        "groupName": "Clock & sync",
        "adr": null,
        "num": 3,
        "section": "6.4 Clock and sync",
        "level": "MUST",
        "capabilities": [],
        "text": "Ableton Link MUST support a configurable quantum and enableStartStopSync."
      },
      {
        "id": "REQ-CLK-4",
        "group": "CLK",
        "groupName": "Clock & sync",
        "adr": null,
        "num": 4,
        "section": "6.4 Clock and sync",
        "level": "MUST",
        "capabilities": [],
        "text": "Clock MUST continue across a mode handoff (§3.6) — external instruments MUST NOT lose sync when a DJ takes over or steps away."
      },
      {
        "id": "REQ-CLK-5",
        "group": "CLK",
        "groupName": "Clock & sync",
        "adr": null,
        "num": 5,
        "section": "6.4 Clock and sync",
        "level": "MUST",
        "capabilities": [],
        "text": "MTC MUST NOT be used for musical sync; positional reference only."
      },
      {
        "id": "REQ-CLK-6",
        "group": "CLK",
        "groupName": "Clock & sync",
        "adr": null,
        "num": 6,
        "section": "6.4 Clock and sync",
        "level": "MUST",
        "capabilities": [],
        "text": "Clock jitter MUST be ≤1 ms RMS measured at the MIDI output."
      },
      {
        "id": "REQ-CLK-7",
        "group": "CLK",
        "groupName": "Clock & sync",
        "adr": null,
        "num": 7,
        "section": "6.4 Clock and sync",
        "level": "MUST",
        "capabilities": [],
        "text": "Musical clock MUST NOT be carried over Wi-Fi. MIDI Clock MUST be emitted on a wired transport (USB or DIN). Wireless tempo sharing MUST use Ableton Link, which propagates tempo and beat phase as state rather than streaming pulses. Network MIDI 2.0 MAY be used for control traffic — mapping, Property Exchange, patch and transport commands — where tens of milliseconds are tolerable."
      },
      {
        "id": "REQ-INST-1",
        "group": "INST",
        "groupName": "Instruments as sources",
        "adr": null,
        "num": 1,
        "section": "6.5 Instruments as sources",
        "level": "MUST",
        "capabilities": [],
        "text": "A live MIDI instrument input MUST be registrable as a queueable source, so it can be scheduled in the queue like a track. This is the brief's distinguishing idea taken to its conclusion."
      },
      {
        "id": "REQ-INST-2",
        "group": "INST",
        "groupName": "Instruments as sources",
        "adr": null,
        "num": 2,
        "section": "6.5 Instruments as sources",
        "level": "MUST",
        "capabilities": [],
        "text": "An instrument entry MUST have a staff-set duration or an explicit end action, and MUST obey never-silent fallback (REQ-FALL-3) if it ends early."
      },
      {
        "id": "REQ-CON-1",
        "group": "CON",
        "groupName": "Content & ingest",
        "adr": null,
        "num": 1,
        "section": "7. Content and ingest — Domain E",
        "level": "MUST",
        "capabilities": [],
        "text": "Local ingest MUST tag via MusicBrainz with Chromaprint/AcoustID fingerprinting, and MUST de-duplicate by fingerprint."
      },
      {
        "id": "REQ-CON-2",
        "group": "CON",
        "groupName": "Content & ingest",
        "adr": null,
        "num": 2,
        "section": "7. Content and ingest — Domain E",
        "level": "MUST",
        "capabilities": [
          "E6"
        ],
        "text": "Ingest MUST produce the analysis cache in one pass: beatgrid, key, loudness, waveform, phrases."
      },
      {
        "id": "REQ-CON-3",
        "group": "CON",
        "groupName": "Content & ingest",
        "adr": null,
        "num": 3,
        "section": "7. Content and ingest — Domain E",
        "level": "MUST",
        "capabilities": [],
        "text": "Analysis MUST run out-of-process; it MUST NOT share a process with the audio engine."
      },
      {
        "id": "REQ-CON-4",
        "group": "CON",
        "groupName": "Content & ingest",
        "adr": null,
        "num": 4,
        "section": "7. Content and ingest — Domain E",
        "level": "MUST",
        "capabilities": [
          "E7"
        ],
        "text": "Loudness MUST be normalised (ReplayGain / EBU R128) across all sources. Mixing a CC track, a local file and a live instrument without this is unacceptable in a venue."
      },
      {
        "id": "REQ-CON-5",
        "group": "CON",
        "groupName": "Content & ingest",
        "adr": null,
        "num": 5,
        "section": "7. Content and ingest — Domain E",
        "level": "MUST",
        "capabilities": [],
        "text": "Provider adapters MUST implement one interface: search, resolve, stream URL, licence class."
      },
      {
        "id": "REQ-CON-6",
        "group": "CON",
        "groupName": "Content & ingest",
        "adr": null,
        "num": 6,
        "section": "7. Content and ingest — Domain E",
        "level": "MUST",
        "capabilities": [],
        "text": "v1 MUST ship local, opensubsonic and at least one CC provider (Jamendo), so a fresh install has legally playable music on first run."
      },
      {
        "id": "REQ-CON-7",
        "group": "CON",
        "groupName": "Content & ingest",
        "adr": null,
        "num": 7,
        "section": "7. Content and ingest — Domain E",
        "level": "MUST",
        "capabilities": [
          "H4"
        ],
        "text": "The system MUST NOT include any adapter sourcing venue playback from a consumer streaming account or a media downloader (H4, ADR-003 rationale). This is the flaw that makes the existing open-source jukeboxes unusable in venues, and it is designed out rather than documented around."
      },
      {
        "id": "REQ-NFR-1",
        "group": "NFR",
        "groupName": "Non-functional",
        "adr": null,
        "num": 1,
        "section": "8.1 Latency and real-time",
        "level": "MUST",
        "capabilities": [],
        "text": "The audio thread MUST NOT allocate, lock, log, or perform I/O."
      },
      {
        "id": "REQ-NFR-2",
        "group": "NFR",
        "groupName": "Non-functional",
        "adr": null,
        "num": 2,
        "section": "8.1 Latency and real-time",
        "level": "MUST",
        "capabilities": [],
        "text": "Audio buffer xruns MUST be counted and surfaced as a CDEP event."
      },
      {
        "id": "REQ-NFR-3",
        "group": "NFR",
        "groupName": "Non-functional",
        "adr": null,
        "num": 3,
        "section": "8.2 Availability",
        "level": "MUST",
        "capabilities": [
          "G1"
        ],
        "text": "The appliance MUST be fully functional with no WAN connectivity — the single clearest advantage over cloud jukeboxes, whose music stops when the venue's connection drops."
      },
      {
        "id": "REQ-NFR-4",
        "group": "NFR",
        "groupName": "Non-functional",
        "adr": null,
        "num": 4,
        "section": "8.2 Availability",
        "level": "MUST",
        "capabilities": [],
        "text": "Queue state MUST survive process restart."
      },
      {
        "id": "REQ-NFR-5",
        "group": "NFR",
        "groupName": "Non-functional",
        "adr": null,
        "num": 5,
        "section": "8.2 Availability",
        "level": "MUST",
        "capabilities": [],
        "text": "A fusion-core crash MUST NOT stop audio; the engine continues its cued track and the core resumes on reconnect."
      },
      {
        "id": "REQ-NFR-6",
        "group": "NFR",
        "groupName": "Non-functional",
        "adr": null,
        "num": 6,
        "section": "8.3 Privacy and security",
        "level": "MUST",
        "capabilities": [
          "G6"
        ],
        "text": "No telemetry. The system MUST NOT transmit usage data anywhere by default."
      },
      {
        "id": "REQ-NFR-7",
        "group": "NFR",
        "groupName": "Non-functional",
        "adr": null,
        "num": 7,
        "section": "8.3 Privacy and security",
        "level": "MUST",
        "capabilities": [],
        "text": "Patron sessions MUST be venue-scoped, expiring, and MUST NOT require personal data."
      },
      {
        "id": "REQ-NFR-8",
        "group": "NFR",
        "groupName": "Non-functional",
        "adr": null,
        "num": 8,
        "section": "8.3 Privacy and security",
        "level": "MUST",
        "capabilities": [],
        "text": "Staff endpoints MUST require a separate credential from patron sessions."
      },
      {
        "id": "REQ-NFR-9",
        "group": "NFR",
        "groupName": "Non-functional",
        "adr": null,
        "num": 9,
        "section": "8.3 Privacy and security",
        "level": "MUST",
        "capabilities": [],
        "text": "Outbound network access MUST be limited to enabled providers and MUST be disable-able entirely."
      },
      {
        "id": "REQ-NFR-10",
        "group": "NFR",
        "groupName": "Non-functional",
        "adr": null,
        "num": 10,
        "section": "8.4 Deployment",
        "level": "MUST",
        "capabilities": [
          "G4"
        ],
        "text": "A single-command container deploy MUST bring up a working appliance."
      },
      {
        "id": "REQ-NFR-11",
        "group": "NFR",
        "groupName": "Non-functional",
        "adr": null,
        "num": 11,
        "section": "8.4 Deployment",
        "level": "MAY",
        "capabilities": [],
        "text": "Target baseline hardware: 4-core x86-64 or ARM64, 8 GB RAM, no GPU. Stem separation is explicitly not required for v1, so no GPU dependency exists."
      }
    ],
    "acceptance": [
      {
        "id": "AC-1",
        "capabilities": [
          "C1"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given attended mode and a screened request, when it reaches the staging lane, then it MUST NOT become audible until a DJ promotes it."
      },
      {
        "id": "AC-2",
        "capabilities": [
          "C2"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given autonomous mode and ≥2 queued tracks with confident beatgrids, when one ends, then the next is beatmatched in with no gap."
      },
      {
        "id": "AC-3",
        "capabilities": [
          "C3"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given a track playing in autonomous mode, when a DJ switches to attended, then audio continues uninterrupted and auto-promotion stops."
      },
      {
        "id": "AC-4",
        "capabilities": [
          "B2"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given a patron with a queued request, when the ordering changes, then their displayed position updates within 250 ms without a page reload."
      },
      {
        "id": "AC-5",
        "capabilities": [
          "B6"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given max_pending_per_patron=2, when a patron submits a third request, then it is rejected with reason patron_limit."
      },
      {
        "id": "AC-6",
        "capabilities": [
          "B6"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given a track played 10 minutes ago and a 60-minute cooldown, when any patron requests it, then it is rejected with reason track_cooldown."
      },
      {
        "id": "AC-7",
        "capabilities": [
          "B7",
          "C6"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given explicit content is disallowed, when a patron searches, then explicit tracks appear in neither results nor request attempts."
      },
      {
        "id": "AC-8",
        "capabilities": [
          "B9"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given an empty queue, when the current track ends, then a fallback track begins within 2 seconds."
      },
      {
        "id": "AC-9",
        "capabilities": [
          "B8"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given any playback state, when staff trigger panic, then output stops within 500 ms and the event is logged."
      },
      {
        "id": "AC-10",
        "capabilities": [
          "D1",
          "D2"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given a mapped controller, when it is unplugged and replugged, then the mapping re-binds automatically with no restart."
      },
      {
        "id": "AC-11",
        "capabilities": [
          "D2"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given a physical fader at 0.0 and software at 0.8, when the fader is moved, then the value does not jump — it engages only on crossing 0.8."
      },
      {
        "id": "AC-12",
        "capabilities": [
          "D5",
          "D7"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given an external instrument slaved to MIDI Clock, when leader-deck tempo changes, then the instrument follows within one beat and ≤1 ms RMS jitter."
      },
      {
        "id": "AC-13",
        "capabilities": [
          "G1"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given WAN is disconnected, when the full day-in-the-life scenario (§0.4) runs, then every step succeeds."
      },
      {
        "id": "AC-14",
        "capabilities": [
          "H2",
          "H4"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given a cc_noncommercial track and a commercial venue profile, when it is requested, then it is rejected with reason licence_class."
      },
      {
        "id": "AC-15",
        "capabilities": [
          "E1",
          "E6"
        ],
        "adr": [],
        "requirements": [],
        "text": "Given a folder of untagged audio, when ingest runs, then every file is fingerprint-identified, de-duplicated, and has a complete analysis cache."
      },
      {
        "id": "AC-16",
        "capabilities": [],
        "adr": [
          "ADR-001"
        ],
        "requirements": [],
        "text": "Given the repository, when CI licence-lint runs, then it fails if any GPL header is reachable from Apache-2.0 code."
      },
      {
        "id": "AC-17",
        "capabilities": [],
        "adr": [
          "ADR-002"
        ],
        "requirements": [],
        "text": "Given the CDEP conformance suite, when it runs against both engines, then both pass."
      },
      {
        "id": "AC-18",
        "capabilities": [],
        "adr": [],
        "requirements": [
          "REQ-CDEP-16"
        ],
        "text": "Given a client that stops reading its socket, when high-rate updates are produced, then updates are dropped and audio is unaffected."
      }
    ]
  },
  "backlog": {
    "generated": "2026-08-27",
    "source": "BACKLOG.md",
    "note": "Sequenced work items for CrowdDeck v1. Sizes are t-shirt estimates for a small team, not commitments. 'verdict' cites the OSS triage in oss-inventory.json; 'reqs' cite SPECIFICATION.md.",
    "sizes": {
      "S": "≤1 week",
      "M": "1-3 weeks",
      "L": "3-6 weeks",
      "XL": "6-12 weeks"
    },
    "milestones": [
      {
        "id": "M0",
        "name": "De-risk",
        "goal": "Prove the two load-bearing assumptions before committing to the build."
      },
      {
        "id": "M1",
        "name": "Walking skeleton",
        "goal": "One queue drains to audio through CDEP, with no Mixxx involved."
      },
      {
        "id": "M2",
        "name": "The fusion layer",
        "goal": "The novelty: staging lane, autonomous drain, handoff, never-silent."
      },
      {
        "id": "M3",
        "name": "Crowd plane",
        "goal": "Patrons can actually use it: QR join, position in line, votes, fairness."
      },
      {
        "id": "M4",
        "name": "Real engine",
        "goal": "Swap the stub for the Mixxx-derived engine behind the same contract."
      },
      {
        "id": "M5",
        "name": "Interconnect",
        "goal": "MIDI in, clock out, instruments in time."
      },
      {
        "id": "M6",
        "name": "Venue-ready",
        "goal": "Policy, licensing, offline, deploy — the things that make a venue keep it switched on."
      },
      {
        "id": "M7",
        "name": "Standalone DJ (browser)",
        "goal": "Replace a commercial DJ application on a touchscreen desktop, in a browser, with no venue, no MIDI hardware and no native toolchain. This is the current priority."
      }
    ],
    "epics": [
      {
        "id": "E0",
        "milestone": "M0",
        "name": "De-risking spikes",
        "why": "Two assumptions carry the plan. Both are cheap to test and expensive to get wrong.",
        "stories": [
          {
            "id": "SPIKE-1",
            "name": "Headless Mixxx extraction spike",
            "size": "L",
            "verdict": "FORK",
            "reqs": [
              "REQ-CDEP-17",
              "REQ-CDEP-18"
            ],
            "detail": "Strip Mixxx to a headless binary, expose the Control bus over a socket, measure command→audio latency. Output is the validated CDEP control set (§2.10) and the §8.1 budgets. This is the single highest-value action in the whole plan. PARTIAL — the source-analysis half is done and reported in spike/SPIKE-1-REPORT.md: the enumerable-control-bus assumption ADR-002 rests on is verified, EngineMixer is confirmed GUI-free, §2.10 is validated and two errors fixed, and CDEP is amended to parameter space. The build-and-measure half is NOT done — it needs Qt6/CMake/MSVC and real audio+MIDI hardware, which this environment has none of. §8.1 latency budgets therefore remain unvalidated assumptions and are the largest residual risk in the plan.",
            "status": "partial",
            "blockedBy": "native-toolchain",
            "blockedReason": "Native toolchain dependency — MSVC, CMake, Qt6, audio interface. Superseded for the browser demo by E11, which needs none of it."
          },
          {
            "id": "LEGAL-1",
            "name": "Licence risk position for the ADR-001 boundary",
            "size": "S",
            "verdict": null,
            "reqs": [
              "REQ-LIC-2",
              "REQ-LIC-4",
              "REQ-LIC-5",
              "REQ-LIC-8",
              "REQ-LIC-9"
            ],
            "detail": "RESOLVED BY OWNER DECISION, NOT BY LEGAL REVIEW — ADR-006. The project owner chose two separate downloads (so no combined work is ever distributed), US and EU as target jurisdictions, single-GPL as an accepted fallback, and no counsel. Keeping the split therefore costs nothing: we own every line of the Apache-2.0 layer and can relicense it to GPL at any time, so the worst case equals the certain case of abandoning it now — while abandoning it is a one-way door once outside contributors arrive. Two new requirements make the position durable: REQ-LIC-8 (separate release artifacts, never one installer) and REQ-LIC-9 (DCO inbound=outbound, keeping the fallback exercisable). NOTE HONESTLY: no legal review was obtained and none is planned. This is knowing risk acceptance with a cheap remedy, not a clearance. legal/REVIEW-PACK.md stays ready with seven questions if counsel is ever engaged.",
            "status": "done"
          },
          {
            "id": "SPIKE-2",
            "name": "Audio backend selection",
            "size": "S",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-NFR-1"
            ],
            "detail": "Measure miniaudio vs PortAudio for WASAPI-exclusive/ASIO/CoreAudio/ALSA at 64-128 sample buffers on the REQ-NFR-11 baseline. WASAPI MEASURED — spike/spike-2/FINDINGS.md. The §8.1 audio-callback budget is achievable: WASAPI shared at 128 frames gave a p99 callback interval of 3.667ms against a 10ms budget on commodity laptop hardware, with 0.14% late callbacks. Three findings: (1) exclusive mode was markedly WORSE than shared (17% late vs 0.14%), inverting the usual advice — share mode must be configurable and default to shared; (2) the first run measured the default device, a USB speakerphone, whose large hardware buffer would have been misread as 'no configuration met the budget'; (3) the xrun proxy was too strict and was recalibrated from measurement, judging a rate rather than any-at-all. Built with portable GCC (w64devkit) because MSVC needs admin rights; the compiler does not materially affect a 10ms budget dominated by the OS audio stack. CROSS-PLATFORM: CoreAudio and ALSA cannot be substituted — CoreAudio IS macOS audio and ALSA IS the Linux kernel API. But compile-and-run is separable from latency: a CI workflow now builds the probe on ubuntu-latest against real ALSA headers and macos-latest against real CoreAudio frameworks, and runs the callback loop on both, every push. It caught a real bug immediately — the POSIX branch used clock_gettime with no <time.h> include and had never been compiled anywhere. STILL OUTSTANDING (all need hardware): ASIO latency (needs an interface), CoreAudio latency (needs a Mac), ALSA latency (needs real Linux with a sound card), and the PortAudio comparison.",
            "status": "partial",
            "blockedBy": "native-toolchain",
            "blockedReason": "Native toolchain dependency — MSVC, CMake, Qt6, audio interface. Superseded for the browser demo by E11, which needs none of it."
          }
        ]
      },
      {
        "id": "E1",
        "milestone": "M1",
        "name": "CDEP contract and stub engine",
        "why": "The contract is written before any engine exists so it is shaped by its consumer, not by the fork. The stub is also the permanent proof that the engine is replaceable (REQ-LIC-5).",
        "stories": [
          {
            "id": "CDEP-1",
            "name": "Specify and publish the CDEP schema",
            "size": "S",
            "verdict": null,
            "reqs": [
              "REQ-CDEP-1",
              "REQ-CDEP-2",
              "REQ-CDEP-3",
              "REQ-CDEP-7",
              "REQ-CDEP-8",
              "REQ-CDEP-9"
            ],
            "detail": "JSON Schema for every message type, versioned cdep/1, with the documented error-code enumeration. Transport is arms-length by design: no shared memory, no GPL-defined structures, because that generality is a licence requirement.",
            "status": "done"
          },
          {
            "id": "CDEP-2",
            "name": "Stub engine: handshake, describe, get/set",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-CDEP-4",
              "REQ-CDEP-11",
              "REQ-CDEP-12",
              "REQ-CDEP-13",
              "REQ-CDEP-18"
            ],
            "detail": "Apache-2.0 reference engine with a self-describing control set, accepting multiple concurrent clients with independent subscription state. No Mixxx dependency.",
            "status": "done"
          },
          {
            "id": "CDEP-3",
            "name": "Stub engine: gapless sequential playback",
            "size": "M",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-CDEP-18",
              "REQ-FALL-3"
            ],
            "detail": "Load, transport, and gap-free track-to-track playback on the chosen audio backend. Enough to develop the entire fusion core against.",
            "status": "done"
          },
          {
            "id": "CDEP-4",
            "name": "Subscriptions with coalescing and back-pressure",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-CDEP-14",
              "REQ-CDEP-15",
              "REQ-CDEP-16"
            ],
            "detail": "max_hz coalescing and bounded send queues. Includes the AC-18 test that a stalled client cannot disturb audio.",
            "status": "done"
          },
          {
            "id": "CDEP-5",
            "name": "Conformance suite",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-CDEP-17"
            ],
            "detail": "Executable suite both engines must pass, wired into CI. Gates every future engine change.",
            "status": "done"
          }
        ]
      },
      {
        "id": "E2",
        "milestone": "M1",
        "name": "Repository, licence enforcement and CI",
        "why": "The split licence is only real if it is mechanically enforced. Contributor confusion is the main practical risk, and the mitigation is automation rather than documentation.",
        "stories": [
          {
            "id": "REPO-1",
            "name": "Plane layout and SPDX headers",
            "size": "S",
            "verdict": null,
            "reqs": [
              "REQ-LIC-1"
            ],
            "detail": "Directory structure per SPECIFICATION §1.2, SPDX header on every file.",
            "status": "done"
          },
          {
            "id": "REPO-2",
            "name": "CI licence-lint gate",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-LIC-2",
              "REQ-LIC-3"
            ],
            "detail": "Fail the build if any GPL header is reachable from Apache-2.0 code, including transitively. Satisfies AC-16.",
            "status": "done"
          },
          {
            "id": "REPO-3",
            "name": "LGPL-only FFmpeg build with component audit",
            "size": "M",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-LIC-6",
              "REQ-LIC-7"
            ],
            "detail": "A GPL-configured FFmpeg silently relicenses the product. Pin the configuration and assert it in CI; generate NOTICE per artifact.",
            "status": "todo",
            "blockedBy": "native-toolchain",
            "blockedReason": "Native toolchain dependency — MSVC, CMake, Qt6, audio interface. Superseded for the browser demo by E11, which needs none of it."
          },
          {
            "id": "REPO-4",
            "name": "Assert release artifacts stay separate",
            "size": "S",
            "verdict": null,
            "reqs": [
              "REQ-LIC-8",
              "REQ-LIC-9"
            ],
            "status": "done",
            "detail": "ADR-006 rests on never shipping a combined installer, and the realistic way that is lost is a well-meaning convenience build, not a court. DONE — release.json declares the two artifacts, tools/check-artifacts.mjs fails if any artifact contains both planes (reusing licence-lint prefixes so the two cannot disagree), and a DCO job checks Signed-off-by on every PR commit (REQ-LIC-9). While wiring this up, CI was found to be running a hardcoded test-glob list that had drifted behind package.json — 76 tests, every data/, clients/ and tools/ test, had never run in CI while it reported green. CI now calls npm scripts only, and tools/test/ci-workflow.test.js fails if the duplication returns."
          }
        ]
      },
      {
        "id": "E3",
        "milestone": "M2",
        "name": "Unified Scheduler — the novelty",
        "why": "Domain C has no prior art in any product, open or closed. Built against the stub engine so it is proven before fork surgery begins.",
        "stories": [
          {
            "id": "SCH-1",
            "name": "Queue entry lifecycle state machine",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-SCH-1",
              "REQ-SCH-2",
              "REQ-SCH-5"
            ],
            "detail": "States, guarded transitions, and an append-only event log with actor and reason.",
            "status": "done"
          },
          {
            "id": "SCH-2",
            "name": "Staging lane and DJ promotion",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-SCH-3",
              "REQ-SCH-4"
            ],
            "detail": "The core design decision: requests never reach audio without a DJ or the autonomous mixer. Satisfies AC-1.",
            "status": "done"
          },
          {
            "id": "SCH-3",
            "name": "Priority ordering function",
            "size": "M",
            "verdict": "REFERENCE",
            "reqs": [
              "REQ-SCH-6",
              "REQ-SCH-7",
              "REQ-SCH-8",
              "REQ-SCH-9",
              "REQ-SCH-10"
            ],
            "detail": "Votes and boost units as two inputs to one score, plus the anti-starvation aging term. Reference Raveberry for vote decay. Payments in v1.1 need no change here.",
            "status": "done"
          },
          {
            "id": "SCH-4",
            "name": "Fair-queue anti-monopoly rules",
            "size": "M",
            "verdict": "REFERENCE",
            "reqs": [
              "REQ-SCH-14",
              "REQ-SCH-15",
              "REQ-SCH-16",
              "REQ-SCH-17",
              "REQ-SCH-18"
            ],
            "detail": "Per-patron limits, artist/track cooldown, rate limiting, one-vote-per-entry as a DB constraint. Reference Karaoke Eternal's fair queue and Mopidy-Party throttling. Satisfies AC-5, AC-6.",
            "status": "done"
          },
          {
            "id": "SCH-5",
            "name": "Autonomous drain with beatmatched transitions",
            "size": "L",
            "verdict": "REFERENCE",
            "reqs": [
              "REQ-MODE-4",
              "REQ-MODE-5"
            ],
            "detail": "Auto-mix the queue when no DJ is present, using beatgrid confidence with a timed-crossfade fallback. Satisfies AC-2.",
            "status": "done"
          },
          {
            "id": "SCH-6",
            "name": "Gapless mode handoff",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-MODE-1",
              "REQ-MODE-2",
              "REQ-MODE-3"
            ],
            "detail": "Attended ⇄ autonomous with no interruption to audio. Satisfies AC-3.",
            "status": "done"
          },
          {
            "id": "SCH-7",
            "name": "Never-silent fallback engine",
            "size": "M",
            "verdict": "REFERENCE",
            "reqs": [
              "REQ-FALL-1",
              "REQ-FALL-2",
              "REQ-FALL-3",
              "REQ-FALL-4"
            ],
            "detail": "Fallback rotation, policy-screened, ≤2s dead air in every state including engine reconnect. Reference Liquidsoap. Satisfies AC-8.",
            "status": "done"
          }
        ]
      },
      {
        "id": "E4",
        "milestone": "M2",
        "name": "Data model and persistence",
        "why": "The two things that are expensive to retrofit — venue_id and the credit ledger — land now, per ADR-003 and ADR-004.",
        "stories": [
          {
            "id": "DAT-1",
            "name": "Schema with venue_id from the first migration",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-DAT-1",
              "REQ-DAT-2"
            ],
            "detail": "Near-zero cost now; a migration across every table and query later. Built in data/src/schema.js + db.js on Node's built-in node:sqlite, so zero runtime dependencies still holds. Two tests guard it: every table in VENUE_SCOPED_TABLES carries venue_id, and any NEW table not listed there fails the suite. The venue is bound when the database is opened rather than passed per call, so no call site can read another venue's data.",
            "status": "done"
          },
          {
            "id": "DAT-2",
            "name": "Append-only credit ledger",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-DAT-3",
              "REQ-DAT-4",
              "REQ-DAT-5",
              "REQ-DAT-6",
              "REQ-DAT-7"
            ],
            "detail": "Derived balances, compensating entries, non-expiring credits, atomic spend. No paid top-up path in v1. Append-only is enforced by SQL triggers that raise on UPDATE and DELETE, not by convention. Balance is SUM(delta) with no balance column to drift. spendFor({apply}) runs the debit and the effect in one transaction, so a failed boost cannot consume credit — verified by deliberately breaking the atomicity and confirming the suite went red.",
            "status": "done"
          },
          {
            "id": "DAT-3",
            "name": "Licence-class model and gating",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-DAT-8",
              "REQ-DAT-9",
              "REQ-DAT-10",
              "REQ-DAT-11"
            ],
            "detail": "Answer 'may this venue legally play this now?' from track class plus venue profile. Satisfies AC-14. Gating logic lives in core/src/policy.js; data/src/tracks.js stores the facts it reads and refuses a track with no declared licence class — there is deliberately no default, because defaulting to 'unknown' turns 'nobody checked' into a stored fact. Attribution-required classes cannot be stored without attribution text (REQ-DAT-11).",
            "status": "done"
          },
          {
            "id": "DAT-4",
            "name": "Play log and CSV export",
            "size": "S",
            "verdict": null,
            "reqs": [
              "REQ-DAT-12",
              "REQ-DAT-13",
              "REQ-DAT-14"
            ],
            "detail": "Local-only evidence trail for PRO reporting, never transmitted. RFC 4180 quoting is tested against a title containing both a comma and quotes, because one unescaped comma shifts every later column and quietly corrupts a royalty report. REQ-DAT-14 is tested by reading the module source and failing if any transport API appears in it.",
            "status": "done"
          },
          {
            "id": "DAT-5",
            "name": "Durable queue across restart",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-NFR-4",
              "REQ-NFR-5"
            ],
            "detail": "The queue is durable and the engine is replaceable; a core crash must not stop audio. REQ-NFR-4: data/src/queue-store.js round-trips the whole entry — state, votes, voter IDENTITIES so one-vote-per-patron still holds after a restart, and the transition log that is the audit trail for staff overrides. REQ-NFR-5: core/src/engine-link.js reconnects with jittered backoff and resyncs by reading the deck FIRST, adopting a playing track rather than re-issuing load — a naive reconnect would restart the track the room is dancing to. Tested against a real engine process over a real socket.",
            "status": "done"
          }
        ]
      },
      {
        "id": "E5",
        "milestone": "M3",
        "name": "Crowd plane",
        "why": "Fork Karaoke Eternal (ISC) — it already implements QR join, rooms and a dynamic fair queue, which is most of the TouchTunes interaction model under a licence we can freely relicense.",
        "stories": [
          {
            "id": "CRW-1",
            "name": "Fork Karaoke Eternal and generalise the fair queue",
            "size": "L",
            "verdict": "FORK",
            "reqs": [
              "REQ-SCH-14",
              "REQ-SCH-19"
            ],
            "detail": "Generalise from 'singers' to 'patrons with priority'. Strip karaoke-specific media handling for v1. DONE — core/src/priority.js, rotateByPatron(), and the new REQ-SCH-19. The Unified Scheduler already had a fair queue, so what Karaoke Eternal actually contributes is the one property a pure score sort cannot give: ROTATION. Two entries from one patron can outscore the room and play back to back while someone who queued once waits behind both. No rule was violated — the queue did exactly what it was told — and the patron who waited concludes it is rigged, which priority.js itself already identifies as a correctness problem rather than a cosmetic one. That gap was demonstrated with a failing test before it was closed, and the pre-rotation behaviour is still pinned by a test so the change stays visible. Karaoke Eternal's singer rotation is the prior art: a singer with three songs queued does not get three turns in a row. Generalised, the queue is dealt out one entry per patron per round. Rotation orders TURNS, not outcomes: the highest-scoring entry still plays first, or voting would stop meaning anything. Two details would otherwise have been quiet bugs. Staff-pinned entries are excluded from the rotation and kept at the front, because interleaving a patron between two pinned tracks would break REQ-SCH-6 — the one override staff have. And an entry with no patron id is treated as its own queue rather than merged: anonymous entries (a fallback track, an imported set) would otherwise collapse into a single pseudo-patron taking one slot for all of them, starving the queue of fallback material. On by default, because the default has to be the fair one — a venue opts out of patrons taking turns, not in. 11 tests; all 610 pre-existing tests pass unchanged.",
            "status": "done"
          },
          {
            "id": "CRW-2",
            "name": "Venue-scoped patron sessions",
            "size": "M",
            "verdict": "FORK",
            "reqs": [
              "REQ-API-3",
              "REQ-NFR-7"
            ],
            "detail": "No app install, no personal data, expiring venue-scoped tokens. Join is by URL; QR generation is tracked separately as DISP-1 after a hand-rolled encoder failed decoder verification.",
            "status": "done"
          },
          {
            "id": "CRW-3",
            "name": "Live queue with position in line",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-SCH-11",
              "REQ-SCH-12",
              "REQ-SCH-13"
            ],
            "detail": "TouchTunes' single most-cited feature, and what makes paid priority meaningful later. Satisfies AC-4.",
            "status": "done"
          },
          {
            "id": "CRW-4",
            "name": "Voting with one-vote-per-patron",
            "size": "S",
            "verdict": null,
            "reqs": [
              "REQ-SCH-17"
            ],
            "detail": "Enforced by a uniqueness constraint, not UI logic.",
            "status": "done"
          },
          {
            "id": "CRW-5",
            "name": "Staff override console",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-API-5",
              "REQ-API-6"
            ],
            "detail": "Skip, veto, pin, lock, mute, panic-stop within 500ms. Satisfies AC-9.",
            "status": "done"
          },
          {
            "id": "CRW-6",
            "name": "Venue display screen",
            "size": "M",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-DAT-11"
            ],
            "detail": "Now playing, up next, QR to join, attribution for CC tracks. wavesurfer.js for waveforms.",
            "status": "done"
          },
          {
            "id": "DISP-1",
            "name": "QR code on the venue display",
            "size": "S",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-DAT-11"
            ],
            "status": "done",
            "detail": "Needs a vetted QR encoder. A hand-rolled one was written and removed after a real decoder proved it did not scan; a QR that fails in a venue is worse than none. DONE — clients/lib/qr.js implements ISO/IEC 18004 byte mode, versions 1-10, all four ECC levels, with zero runtime dependencies. The second attempt failed too at first: format information was transposed (rows and columns swapped) and the version-information generator polynomial was ten bits instead of thirteen. Both were found by diffing against an independent encoder and solving the bit mapping empirically rather than writing it from memory again. Verified end to end: 19 tests encode, rasterise and decode with jsQR (a dev-only oracle), and the QR as actually painted by the venue display decodes at 120-300px."
          }
        ]
      },
      {
        "id": "E6",
        "milestone": "M3",
        "name": "Public API and clients",
        "why": "The API is the only path in (REQ-API-1). Third-party clients are how an open project out-features a closed one.",
        "stories": [
          {
            "id": "API-1",
            "name": "HTTP + WebSocket surface, venue-namespaced",
            "size": "L",
            "verdict": null,
            "reqs": [
              "REQ-API-1",
              "REQ-API-2",
              "REQ-API-4"
            ],
            "detail": "/v1/venues/{id}/... from the start so client URLs survive the move to federation. OpenAPI 3.1 generated in CI.",
            "status": "done"
          },
          {
            "id": "API-2",
            "name": "OpenSubsonic-compatible endpoint",
            "size": "L",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-API-10",
              "REQ-API-11",
              "REQ-API-11a",
              "REQ-API-12"
            ],
            "detail": "Including jukeboxControl. Buys an existing client ecosystem on day one. DONE — api/src/subsonic.js. Subsonic's jukeboxControl means 'playback on the server's own audio hardware', which is exactly what this product is, so the mapping is unusually natural. It is a separate module because Subsonic answers HTTP 200 with the failure inside the envelope and authenticates by query string; interleaving that with a REST API that uses status codes properly would corrupt both. REQ-API-11 named a 'jukeboxMediaTypes' extension. NO SUCH EXTENSION EXISTS — the registry defines exactly ten and that is not among them; the name came from unverified concept-phase research. The intent was right, so the capability ships as crowddeck.mediaTypes, namespaced so it cannot be mistaken for a standard, and a test asserts every non-namespaced extension we advertise is a real published one. Subsonic clients are staff (REQ-API-12), which means an md5(password+salt) credential can skip and clear. The surface is therefore off until an operator gives it a password of its own, and refuses to start if that is the staff key. Staff are exempt from the patron fairness quota but never from policy: fairness is a courtesy rule, licensing is a legal control that binds the venue whoever pressed the button. Three real bugs surfaced. Queue removal used skip(), but 'skipped' is only reachable from cued or playing, so every clear silently failed — and skip() records the track in recentPlays, which would have put a track nobody heard into cooldown; removal now uses reject(). And a cross-module unit mismatch: providers and the data layer emit milliseconds while CDEP documents load.duration as seconds, so a 245,000 ms track was loaded as sixty-eight hours and the deck never reached the end. Nothing threw, which is why it survived. 37 protocol tests over a real socket, plus 6 pinning the duration boundary.",
            "status": "done"
          },
          {
            "id": "API-3",
            "name": "DJ console (web)",
            "size": "L",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-API-7",
              "REQ-API-8",
              "REQ-API-9"
            ],
            "detail": "Per ADR-005. Served locally, works with no WAN, streams deck state at ≥20Hz. Controller input bypasses the UI entirely.",
            "status": "done"
          }
        ]
      },
      {
        "id": "E7",
        "milestone": "M4",
        "name": "Mixxx-derived engine",
        "why": "Fork now that the contract is proven. Its Control bus already drives the whole engine from a scripting layer, so this is largely adding a transport over a proven abstraction.",
        "stories": [
          {
            "id": "ENG-1",
            "name": "Fork and strip to headless",
            "size": "XL",
            "verdict": "FORK",
            "reqs": [
              "REQ-LIC-4"
            ],
            "detail": "Keep engine, audio, soundio, mixer, analyzer, effects, control, controllers, sources, track. Delete skin, widget, qml, dialog, preferences, rendergraph, shaders. SPIKE-1: effects is NOT optional — per-deck EQ is routed through [EqualizerRack1_[ChannelN]_Effect1], so the rack must be retained. SPIKE-1 also found EngineMixer includes only QtCore, so the headless strip is less risky than assumed. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source.",
            "status": "todo",
            "blockedBy": "native-toolchain",
            "blockedReason": "Native toolchain dependency — MSVC, CMake, Qt6, audio interface. Superseded for the browser demo by E11, which needs none of it."
          },
          {
            "id": "ENG-2",
            "name": "CDEP server over the Control bus",
            "size": "L",
            "verdict": "FORK",
            "reqs": [
              "REQ-CDEP-5",
              "REQ-CDEP-6",
              "REQ-CDEP-12",
              "REQ-CDEP-12a"
            ],
            "detail": "Bridge ControlObject / ControlDoublePrivate::getAllInstances() to CDEP describe/get/set/subscribe. Must pass the same conformance suite as the stub. Satisfies AC-17. SPIKE-1: describe() is built from getAllInstances() + name()/description()/defaultValue(); min/max are NOT reachable, so serve parameter space via ControlDoublePrivate::getParameter/setParameter (REQ-CDEP-12a). Coalescing for REQ-CDEP-14 is inheritable from ControlObjectScript's CompressingProxy rather than built from scratch. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source.",
            "status": "todo",
            "blockedBy": "native-toolchain",
            "blockedReason": "Native toolchain dependency — MSVC, CMake, Qt6, audio interface. Superseded for the browser demo by E11, which needs none of it."
          },
          {
            "id": "ENG-3",
            "name": "Four decks with EQ, filter, crossfader",
            "size": "M",
            "verdict": "FORK",
            "reqs": [
              "REQ-CDEP-10"
            ],
            "detail": "Inherited from Mixxx; wire to the CDEP control set. SPIKE-1: EQ is an effects-rack unit, not a deck control — budget for wiring [EqualizerRack1_[ChannelN]_Effect1]/parameter1..3. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source.",
            "status": "todo",
            "blockedBy": "native-toolchain",
            "blockedReason": "Native toolchain dependency — MSVC, CMake, Qt6, audio interface. Superseded for the browser demo by E11, which needs none of it."
          },
          {
            "id": "ENG-4",
            "name": "Beatgrid, key detection and key-lock",
            "size": "L",
            "verdict": "FORK",
            "reqs": [
              "REQ-CON-2"
            ],
            "detail": "Inherited analysers. Key-lock via SoundTouch (LGPL) rather than Rubber Band, keeping the permissive option open. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source.",
            "status": "todo",
            "blockedBy": "native-toolchain",
            "blockedReason": "Native toolchain dependency — MSVC, CMake, Qt6, audio interface. Superseded for the browser demo by E11, which needs none of it."
          },
          {
            "id": "ENG-5",
            "name": "Sync lock with leader deck",
            "size": "M",
            "verdict": "FORK",
            "reqs": [
              "REQ-CLK-1"
            ],
            "detail": "The leader deck becomes the single tempo source published to every transport. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source.",
            "status": "todo",
            "blockedBy": "native-toolchain",
            "blockedReason": "Native toolchain dependency — MSVC, CMake, Qt6, audio interface. Superseded for the browser demo by E11, which needs none of it."
          },
          {
            "id": "ENG-6",
            "name": "Hot cues and loops",
            "size": "M",
            "verdict": "FORK",
            "reqs": [
              "REQ-CDEP-10"
            ],
            "detail": "Inherited from Mixxx. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source.",
            "status": "todo",
            "blockedBy": "native-toolchain",
            "blockedReason": "Native toolchain dependency — MSVC, CMake, Qt6, audio interface. Superseded for the browser demo by E11, which needs none of it."
          },
          {
            "id": "ENG-7",
            "name": "Real-time safety audit",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-NFR-1",
              "REQ-NFR-2"
            ],
            "detail": "Assert no allocation, locks, logging or I/O in the audio callback. Count and surface xruns as CDEP events. TOOLCHAIN NEEDED: MSVC Build Tools, CMake, Ninja, Qt6, and vcpkg for Mixxx's dependency tree (FFmpeg LGPL-only per REQ-LIC-6, libsndfile, taglib, chromaprint, SoundTouch, protobuf, sqlite3, opus/vorbis/FLAC, PortAudio, RtMidi). Several GB of installs and a multi-hour first build of ~640MB of source. HARDWARE GAP: AC-12 (MIDI → audible, p99 < 15ms) needs a real USB-MIDI controller — none is attached to the dev machine. A virtual loopback such as loopMIDI exercises the software path but cannot measure true latency, because that number includes USB transfer and the driver stack. SPIKE-2: replace the probe's late-callback heuristic with real xruns from the engine — the proxy measures 'the callback was late', not 'the audio glitched'.",
            "status": "todo",
            "blockedBy": "native-toolchain",
            "blockedReason": "Native toolchain dependency — MSVC, CMake, Qt6, audio interface. Superseded for the browser demo by E11, which needs none of it."
          }
        ]
      },
      {
        "id": "E8",
        "milestone": "M4",
        "name": "Content sources and ingest",
        "why": "Fork Mopidy's backend abstraction (Apache-2.0) rather than inventing a provider interface. Ship legal music in the box.",
        "stories": [
          {
            "id": "CON-1",
            "name": "Provider interface from Mopidy's backend API",
            "size": "L",
            "verdict": "FORK",
            "reqs": [
              "REQ-CON-5"
            ],
            "detail": "One interface: search, resolve, stream URL, licence class. Shaped after Mopidy's backend API. DONE — providers/src: Provider (the contract), ProviderRouter (fan-out) and LocalProvider (the venue's own library, no network at all). Two decisions carry the weight. licenceClass is part of the contract with no default: a provider that cannot establish one returns 'unknown', which policy blocks in a commercial venue — 'nobody checked' and 'checked and it's fine' must never be the same value. And a slow provider must not stall the venue: providers are searched concurrently under a per-provider timeout, and failures are reported as {tracks, errors, degraded} rather than swallowed, so the console can say which source is down instead of silently offering a smaller catalogue. That is what keeps REQ-NFR-3 real — an internet outage must not take the local library with it. Wiring it into the API exposed a name collision: the option was called 'router' and VenueApi already used this.router for its HTTP route table, so every endpoint returned 500. Renamed, and a test now pins both names apart and checks the endpoint end to end.",
            "status": "done"
          },
          {
            "id": "CON-2",
            "name": "Local ingest with fingerprint tagging",
            "size": "L",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-CON-1"
            ],
            "detail": "beets + Chromaprint/AcoustID + MusicBrainz, de-duplicating by fingerprint. Satisfies AC-15.",
            "status": "todo",
            "blockedBy": "python-tooling",
            "blockedReason": "Python tooling dependency — beets / Chromaprint / librosa. The DJ-critical part (waveform + BPM) is done in-browser by DJX-4 instead."
          },
          {
            "id": "CON-3",
            "name": "Out-of-process analysis pipeline",
            "size": "L",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-CON-2",
              "REQ-CON-3"
            ],
            "detail": "One pass produces beatgrid, key, loudness, waveform, phrases. librosa (ISC) keeps the analysis path licence-safe. Never shares a process with the audio engine.",
            "status": "todo",
            "blockedBy": "python-tooling",
            "blockedReason": "Python tooling dependency — beets / Chromaprint / librosa. The DJ-critical part (waveform + BPM) is done in-browser by DJX-4 instead."
          },
          {
            "id": "CON-4",
            "name": "OpenSubsonic consumer provider",
            "size": "M",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-CON-6"
            ],
            "detail": "Consume Navidrome and friends over HTTP — separate process, so GPL-3.0 stays out of our binary. DONE — providers/src/opensubsonic.js. A venue that already runs Navidrome, Gonic, Astiga or Airsonic has a curated, already-paid-for library, and the appliance should inherit it rather than demand it be imported again. The hard part is not HTTP, it is whose licence it is: the protocol says nothing about what rights the operator holds in the files. Inferring from tags is guessing; marking everything 'unknown' is honest but ships the provider dead, because policy blocks unknown in a commercial venue. So the operator declares the licence class — a required constructor argument with no default — and every track carries an attestation naming who declared it and when (REQ-DAT-8). A named human on a date is an answer a PRO can be given; 'the software assumed so' is not. Second concern: Subsonic authenticates every request, including stream, in the query string, so that URL reaches the engine and could land in a log. Errors therefore never quote the URL, stream URLs are minted per call with a fresh salt and never cached, and sending a plaintext password to a non-TLS non-loopback host throws. The loopback exemption parses a full IPv4 literal rather than testing a '127.' prefix — the test suite caught that an attacker publishing 127.0.0.1.evil.test would otherwise have been handed the venue's password. ReplayGain is mapped into the CON-6 loudness fields, so an analysed library normalises on first run. 51 tests, ten of them against a real socket where the server recomputes md5(password + salt) itself and rejects a mismatch — verified by swapping the concatenation order, which turns six of them red.",
            "status": "done"
          },
          {
            "id": "CON-5",
            "name": "Creative Commons provider (Jamendo)",
            "size": "M",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-CON-6"
            ],
            "detail": "So a fresh install has legally playable music on first run, with licence metadata from the API. DONE — providers/src/jamendo.js plus cc-licence.js, which is kept separate because deciding what a Creative Commons URL permits is the most legally consequential parsing in the product. The rule: any licence containing 'nc' is blocked in a commercial venue; 'nd' and 'sa' constrain derivative works, not performance, so an unmodified playback is unaffected by either — treating by-nd as unsafe would discard a large slice of legitimate catalogue for no legal reason, and treating by-nc as safe would be a breach. Anything not positively recognised is 'unknown', which policy blocks. Non-commercial tracks are filtered twice, server-side and client-side, because a silent API change would otherwise put unplayable music in front of patrons and the consequence lands on the venue. The API signals failure inside a 200 response, so checking res.ok alone would turn an invalid client ID into a silently empty catalogue; that is handled and tested. Probing the guards found the lookalike-host test was passing for an incidental reason and missing the path-embedded case, which is now covered.",
            "status": "done"
          },
          {
            "id": "CON-6",
            "name": "Loudness normalisation across sources",
            "size": "M",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-CON-4"
            ],
            "detail": "ReplayGain / EBU R128. Non-negotiable when a CC track, a local file and a live instrument follow one another. DONE — core/src/loudness.js, targeting -14 LUFS to match what patrons hear on streaming services, applied to the deck's pregain (never the DJ's volume fader, which belongs to whoever is mixing). The real work is the clipping guard: the naive gain = target - measured introduces distortion, which is WORSE than the inconsistency it fixes — uneven loudness is a comfort issue, digital clipping through a PA is audible damage. Gain is clamped by true-peak headroom under a -1 dBTP ceiling (lossy codecs overshoot 0 dBFS on decode), so a peaky track plays slightly under target rather than clipping, and says so. An unmeasured track plays as mastered rather than being guessed at, and pregain is rewritten for every track so one track's correction cannot leak onto the next. A live instrument gets an explicit soundcheck trim, labelled as not a measurement, because a performance that has not happened cannot be analysed.",
            "status": "done"
          },
          {
            "id": "CON-7",
            "name": "Assert no consumer-streaming or downloader adapters",
            "size": "S",
            "verdict": "AVOID",
            "reqs": [
              "REQ-CON-7"
            ],
            "detail": "A CI check plus an architectural note. This is the flaw that makes existing open jukeboxes unusable in venues, and designing it out is a feature. DONE — tools/check-content-sources.mjs fails the build on any import of a consumer-streaming client or a downloader, and on any source reference to their API hosts. Documentation may discuss them freely; source may not call them. The rule is NOT 'no streaming': licensed B2B services that sell public-performance rights (Soundtrack Your Brand and peers) are exactly what a venue should use and remain welcome — as do OpenSubsonic, Creative Commons repertoire and record pools. Writing the tests found a bug that had made the guard silently inert: the comment stripper treated the // in https:// as a line comment, so every banned host inside a URL was invisible. It now tracks quote state, and a test pins that.",
            "status": "done"
          }
        ]
      },
      {
        "id": "E9",
        "milestone": "M5",
        "name": "Interconnect",
        "why": "MIDI as a first-class subsystem, not a settings page. A UMP-native start is a lead available only to a project beginning now.",
        "stories": [
          {
            "id": "MID-1",
            "name": "libremidi backend with stable port identity",
            "size": "L",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-MIDI-1",
              "REQ-MIDI-2",
              "REQ-MIDI-3",
              "REQ-MIDI-7"
            ],
            "detail": "MIDI 1.0 + 2.0/UMP, hot-plug, identity-bound mappings that survive reboot. RtMidi as fallback behind our own port interface. HID for high-resolution jog wheels is a SHOULD in v1 — 7-bit MIDI's 128 steps per rotation is not enough for credible feel. Satisfies AC-10.",
            "status": "done"
          },
          {
            "id": "MID-2",
            "name": "MIDI learn with soft-takeover",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-MIDI-4"
            ],
            "detail": "No parameter jumps when a physical control is out of sync with software state. Satisfies AC-11.",
            "status": "done"
          },
          {
            "id": "MID-3",
            "name": "Declarative mapping format targeting CDEP controls",
            "size": "L",
            "verdict": "REFERENCE",
            "reqs": [
              "REQ-MIDI-5",
              "REQ-MIDI-6"
            ],
            "detail": "Reference Mixxx's XML+JS model. Target list generated from CDEP describe, so mappings need no hard-coded engine knowledge.",
            "status": "done"
          },
          {
            "id": "MID-4",
            "name": "MIDI Clock out at 24 PPQN from the leader deck",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-CLK-1",
              "REQ-CLK-2",
              "REQ-CLK-5",
              "REQ-CLK-6"
            ],
            "detail": "≤1ms RMS jitter at the output. Short clock path, no Thru daisy-chains. MTC is explicitly excluded from musical sync — its ~0.6ms resolution and traffic sensitivity make it a positional reference only.",
            "status": "done"
          },
          {
            "id": "MID-5",
            "name": "Ableton Link integration",
            "size": "M",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-CLK-3",
              "REQ-CLK-4"
            ],
            "detail": "GPL-2.0-or-later, so it lives in engine/. Quantum and start/stop sync; must survive a mode handoff.",
            "status": "todo",
            "blockedBy": "midi-hardware",
            "blockedReason": "MIDI hardware dependency — ON HOLD until a controller is available."
          },
          {
            "id": "MID-6",
            "name": "Live MIDI instrument as a queueable source",
            "size": "L",
            "verdict": null,
            "reqs": [
              "REQ-INST-1",
              "REQ-INST-2"
            ],
            "detail": "The brief's distinguishing idea: a groovebox is scheduled in the queue like a track, in time with the decks. Satisfies AC-12.",
            "status": "done"
          },
          {
            "id": "MID-7",
            "name": "MIDI-CI Property Exchange auto-mapping",
            "size": "L",
            "verdict": null,
            "reqs": [
              "REQ-MIDI-8",
              "REQ-MIDI-9"
            ],
            "detail": "Let capable controllers describe themselves. Every incumbent still hand-authors mapping files; this is the defensible lead. DONE — interconnect/src/midi-ci.js. The wire format is taken from the primary specification rather than from memory: Sub-ID#2 assignments from M2-101-UM (MIDI-CI v1.2) Appendix D, and the chunked Get Property Data layout from its Table 33. That care was warranted — a web search confidently reported 0x35 as 'Set Property Data'; it is Reply to Get Property Data, and 0x36 is Set. Building on that would have produced a client that talked past every real device, so the tests assert the constants longhand. The controller-list resource is deliberately NOT hard-coded, because neither M2-101 nor M2-105 defines one. It is discovered from the device's own ResourceList, including the X- manufacturer names the spec reserves, and any control whose type or number cannot be confidently interpreted produces no binding at all and is returned in 'skipped' with a reason an operator can act on. In a venue a fader silently bound to the wrong deck control is far worse than one not bound yet: an unmapped control costs a five-second MIDI-learn, a mis-mapped one costs a mistake in front of people. autoMap() also refuses to run without a resolveTarget callback, because which engine control a device's 'filter' means is not a decision this layer may make (REQ-CDEP-13). REQ-MIDI-9 is satisfied by merging per physical control rather than per file: a DJ who rebinds one knob keeps the other forty-nine the device described, and a user binding replaces rather than joins the auto one so a single knob cannot drive two controls. 37 tests, including chunk reassembly that is by chunk number and not arrival order — verified by reversing it, which turns that test red.",
            "status": "done"
          }
        ]
      },
      {
        "id": "E10",
        "milestone": "M6",
        "name": "Venue readiness",
        "why": "The difference between a demo and something a venue keeps switched on.",
        "stories": [
          {
            "id": "VEN-1",
            "name": "Venue policy engine",
            "size": "L",
            "verdict": null,
            "reqs": [
              "REQ-POL-1",
              "REQ-POL-3",
              "REQ-POL-4"
            ],
            "detail": "Explicit filter, allow/block lists, dayparting, licence gating, logged staff overrides.",
            "status": "done"
          },
          {
            "id": "VEN-2",
            "name": "Policy-scoped search",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-POL-2"
            ],
            "detail": "An unrequestable track is never offered. Filtering only at request time is a defect. Satisfies AC-7.",
            "status": "done"
          },
          {
            "id": "VEN-3",
            "name": "Venue licensing profile",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-DAT-9"
            ],
            "detail": "Which PRO licences the venue holds. Post-consent-decree, operators need separate ASCAP, BMI and SESAC licences — and since GMR began signing major writers away from the incumbents, a fourth — so the software tracks rather than assumes. DONE — data/src/licensing.js models each licence individually with validity dates, because a lapsed licence is not a licence. The decisive design choice is the middle outcome: when a track carries no PRO metadata (the normal case) and the venue holds some but not all licences, the answer is neither 'blocked' (which would block most of the catalogue and get switched off) nor a silent 'yes' (which manufactures false confidence) — it returns coverage:'gap' naming the missing PROs, so the venue can buy the licence or accept a known risk knowingly. Territories differ in what full coverage means (the UK splits PRS from PPL), and an unknown territory is reported as undeterminable rather than covered.",
            "status": "done"
          },
          {
            "id": "VEN-4",
            "name": "Offline-first verification",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-NFR-3",
              "REQ-NFR-9"
            ],
            "detail": "Run the full day-in-the-life scenario with WAN disconnected in CI. Satisfies AC-13.",
            "status": "done"
          },
          {
            "id": "VEN-5",
            "name": "No-telemetry guarantee",
            "size": "S",
            "verdict": null,
            "reqs": [
              "REQ-NFR-6",
              "REQ-NFR-8"
            ],
            "detail": "Assert no outbound traffic beyond enabled providers; separate staff credentials.",
            "status": "done"
          },
          {
            "id": "VEN-6",
            "name": "Single-command container deploy",
            "size": "M",
            "verdict": "ADOPT",
            "reqs": [
              "REQ-NFR-10",
              "REQ-NFR-11"
            ],
            "detail": "Compose file, sane defaults, CC catalog seeded, on 4-core/8GB with no GPU.",
            "status": "todo",
            "blockedBy": "venue",
            "blockedReason": "Venue dependency — needs a venue, patrons or an operator. Not required to DJ."
          }
        ]
      },
      {
        "id": "E11",
        "name": "Standalone DJ — browser deck",
        "milestone": "M7",
        "why": "The original plan routed audio through a Mixxx fork (E7), which needs MSVC, Qt6, CMake and hours of build. None of that is available, and none of it is necessary: **the browser is a viable audio engine.** Web Audio gives sample-accurate scheduling, per-deck gain, biquad EQ and playback-rate control — which is a DJ mixer. Writing the engine against CDEP means it is held to the same contract as the stub and validated by the same 20 conformance checks, so this is not a detour around the architecture but a second proof of REQ-LIC-5: the engine really is replaceable. It also removes the GPL question entirely for this path, since a Web Audio engine is our own Apache-2.0 code with no Mixxx in it.",
        "stories": [
          {
            "id": "DJX-1",
            "name": "Web Audio engine speaking CDEP",
            "size": "L",
            "verdict": null,
            "reqs": [
              "REQ-CDEP-1",
              "REQ-CDEP-9",
              "REQ-CDEP-11",
              "REQ-LIC-5"
            ],
            "status": "done",
            "detail": "Two decks that make actual sound, driven entirely by CDEP messages. AudioBufferSourceNode per deck into a per-deck GainNode (pregain), a three-band biquad EQ, then a channel gain and the crossfader. Must implement the same control surface the stub does so the conformance suite passes unchanged — that is the whole point, and the first time the 'any conforming engine' claim is tested against a genuinely different implementation. DONE — engine-web/src/web-engine.js. Two decks that make real sound, driven by the same CDEP control names the stub publishes. Signal path is source → pregain → 3-band EQ → volume → crossfader → master, in that order because pregain corrects the FILE (the CON-6 normalisation trim) while volume is the fader the DJ holds, and the crossfader must be able to silence a channel whose fader is up. Every gain change is a 12 ms ramp, not an assignment: a step change in gain is a discontinuity, and a discontinuity is an audible click on every EQ tweak. A brick-wall limiter sits on the master bus because two decks at unity sum past full scale and the browser's output stage hard-clips — without it a normal beatmatched blend distorts exactly when both tracks are loudest. VERIFIED IN A REAL BROWSER: 0.796 peak with the crossfader on deck A, exactly 0.0 with it on deck B, and 0.984 with both decks playing through the limiter."
          },
          {
            "id": "DJX-2",
            "name": "CDEP over WebSocket, so a browser can BE the engine",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-CDEP-1",
              "REQ-CDEP-2",
              "REQ-LIC-5"
            ],
            "status": "todo",
            "detail": "The CDEP client hard-codes net.createConnection to a unix socket / named pipe, which a browser cannot open. Add a transport seam so the same protocol runs over WebSocket, and bridge it so the existing conformance runner can test a browser engine through --socket. Without this the scheduler and the audio live in different worlds and nothing built so far applies. NOT NEEDED FOR THE STANDALONE DEMO — the browser runs the engine and the UI together, so nothing has to cross a socket to DJ. This is what connects the deck to the Node scheduler, queue and providers, i.e. the jukebox half. Deferred until that is wanted."
          },
          {
            "id": "DJX-3",
            "name": "Load tracks from the local disk",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-CON-5",
              "REQ-NFR-3"
            ],
            "status": "done",
            "detail": "A DJ's library is on the machine. File System Access API where available, drag-and-drop and a file picker as the fallback. Audio is decoded in the browser and never uploaded — no server round-trip, which is also what makes it work with no network at all. DONE — file picker and drag-and-drop onto either deck, decoded in the browser with decodeAudioData. Nothing is uploaded, so it works with no network at all. A file the browser cannot decode (a DRM'd m4a, a corrupt mp3) is reported by name rather than looking like the application breaking."
          },
          {
            "id": "DJX-4",
            "name": "Waveform and BPM in the browser",
            "size": "L",
            "verdict": null,
            "reqs": [
              "REQ-CON-2"
            ],
            "status": "done",
            "detail": "Peak extraction for the waveform and onset-based tempo detection, both from the decoded buffer in an OfflineAudioContext. Replaces the librosa dependency of CON-3 for the DJ path. Without a waveform you cannot see the phrase coming, and without a BPM you cannot beatmatch. DONE — engine-web/src/analyse.js. Peak-preserving waveform (an averaged waveform of percussive music is a smooth blob with no visible transients) and onset-autocorrelation tempo detection. THE IMPORTANT FINDING: autocorrelation always has a maximum, so it happily reports a tempo for material with no beat — caught by playing a sine tone through the real engine and watching the deck read 150 BPM with a sync button that looked ready. Worse, the correlation peak is INVERSELY related to whether a beat exists: measured, a pure tone scored 1.00 and a 128 BPM click track scored 0.66. Gating on it would have rejected every real beat and accepted every drone. The discriminator is the onset envelope's crest factor (peak over mean): 29-55 for real beats, 3-6 for tones and noise, so the threshold sits in an empty gap. Confidence is now reported from the crest factor, because putting a reassuring number next to a meaningless answer is worse than reporting nothing."
          },
          {
            "id": "DJX-5",
            "name": "Touch deck UI — the actual mixer",
            "size": "XL",
            "verdict": null,
            "reqs": [
              "REQ-API-1"
            ],
            "status": "done",
            "detail": "Two decks, transport, pitch fader, cue, crossfader, three-band EQ and channel gain, all sized for fingers rather than a mouse. The existing DJ console is a queue supervisor, not a mixer — it has no decks at all, which is the single largest gap to the Monday target. DONE — clients/deck/index.html. Two decks, transport, pitch, cue, crossfader, three-band EQ and channel faders, all driving the engine through CDEP control names. EQ faders use a curve so UNITY SITS AT THE MIDPOINT of travel: the knob range is 0..4, so a linear fader puts neutral a quarter of the way up, which looks like a cut when nothing is cut. On hardware neutral is the centre detent and that is what a hand expects."
          },
          {
            "id": "DJX-6",
            "name": "Beat sync and pitch lock between decks",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-CLK-1"
            ],
            "status": "done",
            "detail": "Playback-rate matching from the detected BPM, with the leader deck as the tempo source, mirroring the REQ-CLK-1 design so the later Ableton Link work drops in without redesign. DONE — syncRate() folds octaves, so 140 over 70 is treated as the double-time mix it is and a wrong-octave detection still beatmatches correctly. Sync REFUSES and reports rather than silently doing nothing when a tempo is unknown or the pair is beyond the pitch fader's range: a DJ told the decks are locked stops listening for drift, which is the worst possible failure. Verified in the browser — 125 BPM synced to 127.84 leaves a tempo gap of exactly 0."
          },
          {
            "id": "DJX-7",
            "name": "Surface Studio ergonomics",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-NFR-9"
            ],
            "status": "done",
            "detail": "A 28-inch screen lying flat, operated with fingers and no hover. Large hit targets, no hover-only affordances, pointer events rather than mouse events, and a layout that works at the Surface Studio's aspect ratio with the controls under your hands rather than at the top. DONE — every target is at least 56px, faders are 129px wide at Surface Studio scale, and the layout is bottom-weighted: waveforms (which you only look at) on top, mixer and faders at the bottom where your hands rest on a flat 28-inch screen. Pointer events throughout rather than mouse events, with setPointerCapture so a drag survives the finger sliding outside the control. Two bugs found by driving it: a fixed 300px mixer column pushed the layout 62px past a narrow viewport and cut deck B's transport off the edge; and the double-tap-to-reset gesture was misreading two quick EQ adjustments as a reset, snapping the band back to unity mid-mix. A double-tap now requires both taps in the same place with no drag between them."
          },
          {
            "id": "DJX-8",
            "name": "Hot cues and loops",
            "size": "L",
            "verdict": null,
            "reqs": [
              "REQ-CDEP-9"
            ],
            "status": "done",
            "detail": "The largest remaining gap between this and a commercial DJ application: a deck without hot cues cannot be re-entered at a known point, and one without loops cannot hold a section while you find the next record. DONE — engine-web/src/cues.js plus four pads and beat-loop buttons per deck, exposed through the existing CDEP names (hotcue_N_activate, loop_in, loop_out, loop_enabled). Setting and jumping are deliberately separate: a pad that is empty sets, a pad that is full jumps, and an occupied slot is never silently overwritten — losing a cue point mid-set is unrecoverable in the moment. Clearing is a long-press. Two failure modes here are silent rather than loud. An inverted or vanishing loop makes Web Audio produce no sound at all with no error, which during a set reads as the application dying, so makeLoop() refuses one. And Web Audio wraps the AUDIO inside a loop while the elapsed clock keeps rising, so without folding the position back the displayed playhead sails off the end of the track while the sound is still looping eight bars in — the display and the audio disagree, and the display is what the DJ is reading. Verified in a real browser through the actual UI: tapping an empty pad set a cue at 0:06 and lit it; tapping again from 25s jumped back to 6.2s without overwriting; a 4-beat button produced a 2.005s loop at 119.7 BPM with the source node genuinely looping; long-press cleared. 22 unit tests."
          },
          {
            "id": "DJX-9",
            "name": "The display cannot silently freeze",
            "size": "S",
            "verdict": null,
            "reqs": [
              "REQ-NFR-9"
            ],
            "status": "done",
            "detail": "requestAnimationFrame drives the playhead, meters and cue lights, and is a single point of failure for the whole display: when it stops, everything freezes while the audio keeps playing. A DJ reading a frozen playhead is worse off than one reading no playhead, because a frozen one still looks live. DONE — a watchdog notices rAF has gone quiet and drives the render itself at a lower rate. Found because rAF genuinely does not fire in a non-composited page, which froze the entire panel during verification. The first version of the watchdog guarded on document.hidden and therefore did nothing in exactly the case it existed for, since 'rAF is not running' and 'the page reports itself hidden' are the same situation — the guard was removed."
          },
          {
            "id": "DJX-10",
            "name": "Openly-licensed starter library",
            "size": "L",
            "verdict": null,
            "reqs": [
              "REQ-CON-5",
              "REQ-CON-6"
            ],
            "status": "done",
            "detail": "A DJ application with an empty library cannot be evaluated — you cannot tell whether the crossfader, the loops or the beatgrid work until something is playing, and asking someone to import their collection first is the wrong order. DONE — engine-web/src/library.js plus a browser panel along the bottom. THE CONSTRAINT THAT DECIDED THE SOURCE IS CORS, tested from a real browser rather than assumed: Internet Archive search, metadata AND audio all pass and decode; ccMixter's API sends no Access-Control-Allow-Origin at all so it is unusable from a page; Jamendo and Free Music Archive need API keys, so they stay server-side where a credential can be held. The search asks only for licences that permit commercial use, and every result is classified AGAIN on the way out by the same cc-licence.js the venue side uses — two independent filters, because the Archive's licenseurl is operator-supplied and unvalidated. The licence is shown on every row rather than buried, since it is the fact that decides whether a track may be performed. Two things were found by using it: searching title and creator alone returned ZERO results for 'chiptune' while including subject and description returned 66 — genre is how a DJ searches, and on the Archive genre lives in the subject tags. And a 30 MB download behind a button reading '…' is indistinguishable from a broken button, so the load now reports percentage, then decode, then analyse."
          },
          {
            "id": "DJX-11",
            "name": "Spinning platters",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-NFR-9"
            ],
            "status": "done",
            "detail": "The visual anchor of every DJ application, and not decoration: a platter answers three questions at a glance that no number does — is this deck moving at all, roughly how fast, and where in the revolution the beat sits. DONE — advancePlatter() in engine-web/src/analyse.js, drawn as SVG. Rotation is derived from the deck's OWN PLAYHEAD, never from wall-clock time. Driving it from elapsed real time would drift from the audio the moment a frame is dropped or the pitch fader moves; taking the delta from position means the record turns because the music is playing, so it slows with pitch and stops dead on pause. 33⅓ rpm, because a DJ's sense of 'that looks about right' is calibrated to it. The arithmetic lives in a tested module rather than in the page, because a cue jump and a loop wrap are both discontinuities in position and neither is rotation — turning by them would fling the record round, and a backward cue would spin it the wrong way. Seven unit tests cover exactly those cases. Three visual bugs were found by looking at it: the platter escaped its row and covered the track title; hiding it on short screens collapsed the EQ faders with it; and the first version was too subtle to read from a metre away, which defeats the point of having one."
          },
          {
            "id": "MID-8",
            "name": "MIDI over Wi-Fi: position and rationale",
            "size": "S",
            "verdict": null,
            "reqs": [
              "REQ-CLK-7"
            ],
            "status": "done",
            "detail": "DONE — research/midi-over-wifi.md, ratified as REQ-CLK-7. Network MIDI 2.0 is real and ratified (M2-124-UM, November 2024, UDP carrying UMP with forward error correction); RTP-MIDI (RFC 6295) is the older transport and is MIDI 1.0 ONLY. Neither is the problem. The problem is that MIDI clock is untimestamped: 24 pulses per quarter note, one every 20.83 ms at 120 BPM, fired on ARRIVAL, so a receiver cannot tell 'that pulse was late' from 'the tempo changed'. Casual Wi-Fi jitter is 4-20 ms and spikes near 500 ms with power save — the same order of magnitude as the interval being measured, and one to two orders worse than REQ-CLK-6's 1 ms budget. UMP's Jitter Reduction timestamps would fix this in principle, but Network MIDI 2.0 v1.0 defines NO time synchronisation at all, and timestamps are useless without a shared clock. Ableton Link avoids the problem instead of solving it, by sharing tempo and phase as STATE rather than streaming events. So: clock goes on a cable, wireless tempo goes over Link, and Network MIDI 2.0 is for control traffic where tens of milliseconds are tolerable. Also recorded: no platform ships native Network MIDI 2.0 over Wi-Fi today."
          },
          {
            "id": "DJX-12",
            "name": "Album art on the platter",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-NFR-9"
            ],
            "status": "done",
            "detail": "The last visible gap to the reference application, which puts the sleeve on the record. DONE — ArchiveLibrary.coverArt() plus an SVG image inside the rotating group, so the label turns with the record as a real one does. This started as a claim that had to be RETRACTED: the previous note said the Archive had no reliable cover art. Checking rather than repeating it found sleeves on most releases (TAM033-Cover.jpg, Cover1.jpg). The CORS block on archive.org/services/img is real but IRRELEVANT — an <img> needs CORS only if the pixels are read back, and nothing reads them. That distinction is the only reason artwork is possible at all. Auto-generated _spectrogram.png files are excluded by name: every audio file on the Archive gets one, and showing a spectrogram as a record label would be a confident wrong answer on most releases. THE BUG THIS EXPOSED WAS NOT ABOUT ART. With the label finally visible it became obvious the record was swinging around a point OUTSIDE itself rather than spinning in place — measured, displaced 103px right and 30px up. Cause: CSS transform-origin:50% 50% resolved to 100 CSS PIXELS while SVG's three-argument rotate(angle 100 100) uses 100 USER UNITS, which render at ~78px. The two combined into a translation. The CSS rule was redundant — the SVG rotate already carries its own centre — and removing it fixed it. A plain dark disc had hidden this completely."
          },
          {
            "id": "DJX-13",
            "reqs": [
              "REQ-CDEP-9",
              "REQ-NFR-1"
            ],
            "name": "Key lock — pitch-independent tempo",
            "size": "L",
            "detail": "The largest audible gap left against the reference application, and the one control the engine previously REFUSED outright. Without it the pitch fader drags the key with it: at the plus/minus 8 percent a 1200 offers that is up to 1.4 semitones, far enough that a vocal audibly changes key, so any track with a voice in it could not be beat-matched. DONE - a two-stage time-domain shifter (keylock.js) in an AudioWorklet, verified in a real browser: with the fader at +8 percent a 220 Hz tone is heard at 237.6 Hz without key lock and at exactly 220.0 Hz with it. WHY NOT A PHASE VOCODER: it needs an FFT, so either a dependency or hundreds of lines to prove, and it smears transients - the one artefact four-to-the-floor material cannot take. Time-domain overlap-add is what SoundTouch, and therefore Mixxx keylock, actually uses. THREE THINGS THIS GOT WRONG FIRST. (1) Resampling INSIDE each grain and then correlating the result: the splice search maximises similarity with the previous output, and for a resampled grain the best match is the one that UNDOES the resampling. It measured perfectly at 440 Hz and left 60 Hz completely uncorrected, because at 440 the search spans several periods and locks to phase, while at 60 Hz one period is 754 samples and the offset slides freely. Fixed by splitting the stages so grains are copied verbatim - a verbatim grain cannot change pitch whichever offset is chosen. (2) The search range was too small. The offsets that splice cleanly repeat once per pitch period, so a search shorter than one period can never reach one; plus/minus 128 left bass a full semitone sharp. Measured across frame and search to choose 2048/1536 rather than guessing. (3) The search only ever needs to look BACKWARD - exactly one clean offset always lies in the period behind the nominal position - which cut latency from 67ms to 49ms for identical output. LATENCY IS PAID UNCONDITIONALLY, engaged or not. If bypass were free, arming key lock mid-mix would shift that deck 49ms against the other: a flam on every beat, appearing exactly when a DJ is least able to diagnose it. A constant delay is learned once; a delay that appears when you touch a button is a fault. STEREO: one splice offset is chosen jointly across channels. Deciding per channel makes the image wander - proven by running two independent mono shifters, where the inter-channel lag drifted 3 samples while the shared decision held it exactly constant. The first version of that test used a 6-sample tolerance and PASSED on the broken implementation.",
            "verdict": null,
            "status": "done"
          },
          {
            "reqs": [
              "REQ-CDEP-9"
            ],
            "detail": "The other half of DJX-13. Key lock holds a track's key while the tempo moves; this answers what the key IS, without which there is no harmonic mixing and no way to know the record you are about to bring in clashes with the one playing. The reference application puts the key next to the BPM for exactly that reason. DONE - Goertzel filters at the 72 semitones from C2 to B7, folded to a 12-bin chroma, correlated against the Krumhansl-Kessler probe-tone profiles, and reported in Camelot notation with a compatibility check between the two decks. GOERTZEL RATHER THAN AN FFT, for the same reason keylock avoided a phase vocoder: an FFT means a dependency or a few hundred lines to prove, and it computes every bin when only 72 are wanted. Goertzel costs about one multiply-add per sample per frequency and lines the bins up with SEMITONES rather than a linear grid, which matters because uniform FFT spacing is far too coarse in the bass to separate adjacent semitones. IT REFUSES TO GUESS, on two independent gates, and both were needed. A tonality gate rejects flat chroma - measured, tonal material scores 2.7 to 3.3 and drums and noise 1.20 to 1.32, so the 1.6 threshold sits in the gap rather than on top of either population. A margin gate then rejects answers where two keys fit about equally. The second gate is not redundant: a single sustained note scores 11.07 on tonality, far above the threshold, and is still correctly refused because one note fits a dozen keys within 0.012. Musically that is right - a note does not establish a key, a progression does. This is the same discipline the tempo detector learned when autocorrelation reported a confident 150 BPM for a sine tone: the failure that matters is not being wrong, it is being confidently wrong, because a DJ who trusts a key badge will mix two records that clash and not know why. VERIFIED ON REAL AUDIO, not just synthetic: two Internet Archive tracks read as A major (11B) and D major (10B), one step apart on the wheel, and were correctly shown as compatible. Worth noting honestly that real music scored 1.83 on tonality against a 1.6 gate - a smaller margin than the synthetic tests suggest. A TEST OF MINE MEASURED NOTHING AND LOOKED FINE. The first real-track check waited for analysis.a.duration > 0, which was already true from an earlier synthetic load, so it returned instantly and reported stale data - caught only because the confidence matched the previous run to seventeen decimal places.",
            "status": "done",
            "size": "M",
            "name": "Key detection and harmonic mixing",
            "id": "DJX-14",
            "verdict": null
          },
          {
            "detail": "A correctness problem introduced by DJX-13. The deck drew its waveform playhead, platter rotation and position readout from the source node's playhead, which is not where the sound is: between them sit the key lock insert (a constant 49ms by design) and the browser's own output buffer. Measured in a real browser the total is 59ms, and at 128 BPM that is roughly an eighth of a beat - plainly visible on a waveform and exactly the sort of small wrongness that makes an application feel untrustworthy without the user being able to say why. Worth fixing only once key lock existed: the browser's own latency alone was small enough to ignore, and adding 49ms to it was not. DONE - audiblePosition() in analyse.js, applied at all three display sites. Kept as a pure function rather than a method so the arithmetic is testable without an AudioContext, which is the same reason advancePlatter lives there. Only applied while PLAYING: a paused deck emits nothing, so its playhead should show where it will resume from, and subtracting there would make cueing appear to set the cue point early. Clamped at zero, because the first 59ms of a track is the case where the correction exceeds the position itself and a negative playhead would draw off the left edge of the canvas. Falls back from outputLatency to baseLatency to zero - in headless Chromium outputLatency reports 0 while baseLatency reports 10ms, so the fallback is not hypothetical.",
            "id": "DJX-15",
            "verdict": null,
            "reqs": [
              "REQ-NFR-1"
            ],
            "size": "S",
            "status": "done",
            "name": "The display shows where the sound is"
          },
          {
            "detail": "The last thing the reference application did that this did not. A practice set you cannot keep is worth much less than one you can, and recording is also the only honest way to hear your own mixing - in the moment you are concentrating on the next track, not on the blend you just made. DONE - a REC button on the mixer taps the master bus and hands the finished file straight to the browser's downloads. VERIFIED BY DECODING IT BACK, not by checking the file exists: a 3.84s stereo 48kHz recording came back with a fundamental of exactly 330.0 Hz, the tone that was playing. A file of the right size can still be silence. MEDIARECORDER RATHER THAN WRITING A WAV, and the arithmetic decides it. Stereo 48kHz float is about 11 MB per minute, so a two-hour set is 1.3 GB held in a browser tab - which does not degrade gracefully, it crashes the tab, and it crashes it at the END of a long set, the worst possible moment to lose a recording. Compressed chunks cost tens of megabytes an hour. Lossy but it survives is the right way round for something whose entire purpose is not to lose your set. IT TAPS, IT DOES NOT SIT IN THE PATH. Connected in parallel with the speakers and downstream of the limiter, so it captures what was actually heard. In series, a recording failure would become an audio failure, and silence in front of people is far worse than a lost file. Chunks are requested every second rather than only at the end, so a tab that dies mid-set leaves something recoverable. Empty chunks are discarded because some players stop at the first zero-length block rather than skipping it, turning a good recording into a silent one. Filenames carry the local time to the second, so two takes a minute apart cannot silently overwrite each other. The MediaRecorder is injected rather than constructed, so the state machine is tested in Node without a browser - the transitions that lose recordings are the awkward ones: stopping before starting, starting twice, and stopping a recorder that has already thrown, which still yields what it captured because the set matters more than a tidy teardown.",
            "size": "M",
            "verdict": null,
            "reqs": [
              "REQ-NFR-6"
            ],
            "status": "done",
            "id": "DJX-16",
            "name": "Record the mix"
          },
          {
            "verdict": null,
            "status": "done",
            "name": "Seek and scrub the waveform",
            "size": "S",
            "detail": "The waveform showed where you were but could not take you anywhere, so the only ways to move within a track were hot cues and the cue point. DONE - tap or drag anywhere on the waveform to move the playhead, verified in a browser: a click at 25 percent of a 100s track lands at 25.0s, at 75 percent lands at 75.0s, and a drag past the right edge clamps to 100s rather than running off the end. Seeking is applied CONTINUOUSLY during the drag rather than on release, because scrubbing to find a drop is the point - a deck that only moves when you let go cannot be used to search a track by ear. Pointer events rather than mouse or touch, so a finger on the Surface Studio and a mouse take one path, with setPointerCapture to keep the drag alive when the finger leaves a 96px-tall strip, which happens constantly. THE BUG THIS EXPOSED: setPointerCapture throws InvalidPointerId for a pointer the browser no longer considers active, and it was being called BEFORE the seek - so a failed capture silently swallowed the seek entirely. Now the seek happens first and the capture is best-effort, which is the correct order anyway: capture is an enhancement for the drag, the seek is the actual function. pointercancel is handled too, or a rejected palm leaves the deck permanently scrubbing. The arithmetic lives in analyse.js as a pure function because all three of its failure modes are silent: an unclamped drag seeks past the end and stops the deck, and a zero-width canvas - what a hidden element reports - yields a NaN that propagates into the playhead.",
            "id": "DJX-17",
            "reqs": [
              "REQ-CDEP-9"
            ]
          },
          {
            "verdict": null,
            "status": "done",
            "name": "Genre and popularity in the browse list",
            "size": "S",
            "detail": "A browse list showing only title and artist gives nothing to choose between two unknown netlabel releases. DONE - genre tags, play count and size on every row. The tags come from the Archive's subject field, which is ALSO what the search reads, so showing it explains why a record came back for the word typed - previously that connection was invisible. Verified live: 24 of 25 rows carry tags, 25 of 25 carry stats, e.g. 'psicotropicodelia / experimental / melrah' and '18k plays / 471 MB'. normaliseTags handles the three shapes the field actually arrives in - an array, a plain string, and a single string holding a comma-separated list - and deduplicates case-insensitively because 'Chiptune' and 'chiptune' routinely appear on the same release and the row is one line. Capped at three tags: a release tagged with fifteen words would push the load buttons off the edge on a narrow screen.",
            "id": "DJX-18",
            "reqs": [
              "REQ-NFR-9"
            ]
          },
          {
            "verdict": null,
            "status": "done",
            "name": "Find records that will actually beat-match",
            "size": "M",
            "detail": "Sourcing by tempo against what is already playing. The compatibility question sounds like a tolerance to invent - plus or minus 5 BPM, or 10 percent - and it is not: the deck already defines it exactly, since a follower can only be beat-matched if the PITCH FADER CAN REACH IT, which is plus or minus 8 percent. So this asks syncRate, the same function the SYNC button uses, and a record this list calls mixable is one SYNC will genuinely lock. Half and double time come free because syncRate already folds them. Verified live against a playing 138.88 BPM deck: 22 of 25 results scanned, 8 mixable, ranked +0.0, +1.2, -1.2, -2.5, +3.7 percent - ascending by how far the fader must move - with unmixable rows dimmed and pushed below. THE MEASUREMENT THAT DECIDED THE DESIGN. A byte-range prefix would have made this nearly free: 256 KB decodes in 350ms for 32 seconds of audio, and the Archive supports Range with CORS. Measured against full-file analysis on ten releases it DISAGREED ON FIVE, because the opening of a record is often an intro with a different feel. A window from the middle was no better - three agreed, five disagreed, two would not decode at all. And confidence did not separate good from bad: one wrong tempo scored 0.95. So there was no honest way to show a preview figure and flag which to trust. A browse list showing a confidently wrong BPM is worse than one showing nothing, because it sends a DJ to a record that will not lock and the discovery happens in front of people. It therefore pays the bandwidth and computes the same figure the deck computes on load. Scanning is opt-in, bounded to four at a time because each one downloads and decodes a whole track and twenty-wide would starve the audio thread WHILE MUSIC IS PLAYING, stoppable with the same button, and skips anything over 12 MB rather than pulling a 60 MB DJ mix to browse it. Failures are cached as well as successes, or every rescan would retry exactly the set that was slowest to fail. Results are RANKED, never filtered: a list that empties itself is worse than one that puts the good matches on top. FOLLOW-UP DEFECT, FOUND BY ASKING WHETHER THE RANKING FOLLOWS THE DECKS: it did not. renderResults ran on search and on scan completion but never on track load, so after loading a 140 BPM record the header still read under 100.0 BPM and still recommended the 100 BPM track - an actively wrong recommendation rather than a missing one. Reproduced in a browser before fixing. The fix is split deliberately: loading a different record is a discrete decision point so the list RE-SORTS, because the question what should I play next has genuinely changed; moving the pitch fader is continuous so only the NUMBERS update, because re-sorting every frame of a fader drag would make rows jump under the finger dragging them. The leader identity therefore includes the record own analysed tempo but not its effective one - verified both halves: changing the record flipped the order and the summary, while a +4 percent fader move held the order and moved the labels from +0.0/-2.3/+3.2 to +4.0/+1.6/+7.4.",
            "id": "DJX-19",
            "reqs": [
              "REQ-CLK-1"
            ]
          },
          {
            "detail": "Someone asked to wire up YouTube as an audio source. The answer is no, on two independent grounds, and both were VERIFIED rather than asserted. FIRST, YouTube's own Terms of Service forbid the use case by name - Permissions and Restrictions clause 9: 'use the Service to view or listen to Content other than for personal, non-commercial use (for example, you may not publicly screen videos or stream music from the Service)'. DJing is publicly streaming music from the Service. That rules out the PERMITTED embed too, not just downloaders. SECOND, it could not work anyway: measured in a real browser, fetch of a watch page is CORS-blocked, the official IFrame embed's contentDocument is null, and createMediaElementSource throws TypeError when handed an iframe. Web Audio can therefore never see the samples, so there would be no crossfader, EQ, key lock, BPM detection, waveform or recording - a video player beside a deck, not a deck. REQ-CON-7 already encoded this and check-content-sources.mjs fails the build over it; proven by wiring a YouTube URL in and watching it exit 1, then restoring. So rather than only refusing, the legitimate library got bigger. DONE - Openverse (the WordPress Foundation's Creative Commons search) added as a second source, searched concurrently with the Archive and merged. It reaches Jamendo's catalogue WITHOUT an API key, which the Archive-only library could not do. Verified end to end in a browser: 45 rows from one search (25 Archive + 20 Openverse) and a Jamendo track loaded and played - 'Fantasy - Techno' by Snabisch, 314s, 140.63 BPM, key 5A, zero console errors. THE LICENCE FILTER IS THE POINT. An unfiltered Openverse search is mostly unusable here: measured on 'techno' the default response carried by-nc-nd, by-nc-sa and by-nc, every one non-commercial and unplayable in a venue. license_type=commercial removes them, and as with the Archive that filter is not trusted alone - every result is classified again on the way out by the same cc-licence.js the venue policy engine uses. Proven by deleting the second filter and watching the test fail. category=music was equally necessary: without it the response was full of Freesound material that is audio but not music, including a 926ms whoosh. THE BUG THAT COST THE MOST TIME had nothing to do with any of that. Openverse caps ANONYMOUS requests at page_size=20 and answers 401 for anything larger - not 400, not 429. The app asked for 25 to match the Archive's page, so every Openverse search failed while every hand-written probe, which used smaller numbers, worked. It presented as intermittent rate limiting and was a hard reproducible boundary: 20 returns 200, 21 returns 401. Capped, and pinned with a test, so a 401 that does reach the caller now genuinely means the documented anonymous limits of 20 requests/minute and 200/day. A pasted consumer-service link is also now explained rather than silently returning nothing, because someone who sees 'nothing found' concludes the search is broken. Traces REQ-CON-6, which requires at least one CC provider with Jamendo named: Openverse satisfies it browser-side without the API key the direct Jamendo adapter needs.",
            "verdict": null,
            "size": "M",
            "reqs": [
              "REQ-CON-7",
              "REQ-CON-5",
              "REQ-CON-6"
            ],
            "id": "DJX-20",
            "status": "done",
            "name": "Openverse as a second source; YouTube refused with reasons"
          },
          {
            "id": "DJX-21",
            "name": "The artifact check survives a moving file tree",
            "size": "S",
            "verdict": null,
            "reqs": [
              "REQ-LIC-8"
            ],
            "status": "done",
            "detail": "Went looking for an intermittent test failure seen twice (787/1 and 839/1 out of ~840) and did not find it - eighteen consecutive full-suite runs stayed green across three conditions: idle, under four-way CPU load, under Chromium saturating network and CPU with real audio downloads, and immediately after build:data on the theory that a freshly rewritten docs/ was the trigger. Reported honestly as unreproduced rather than quietly dropped. THE SEARCH FOUND A DIFFERENT, REAL BUG. Of the three tree walkers in tools/, licence-lint.mjs and check-content-sources.mjs both tolerate a file disappearing between readdirSync and statSync, and both carry a comment explaining why - readdir returns a snapshot, and an editor saving or a build cleaning up can remove an entry before it is stat-ed. check-artifacts.mjs did not, which made it the only place a routine file-system race could take the build down. That matters here specifically because build-demo.mjs CLEARS AND REWRITES the docs/demo, docs/engine-web and docs/providers subtrees that check-artifacts walks, and declaredArtifacts checks existsSync and THEN walks - a textbook time-of-check race with a real writer. Fixed to match its siblings, deliberately narrow: only ENOENT is swallowed, so a permissions problem or a corrupt directory still fails loudly. Proven by restoring the original walk and watching the new test fail, then restoring the fix and watching it pass. Two further tests guard the other direction, because tolerance must not become blindness: a real tree must still walk completely, and walking a file as though it were a directory must never be reported as an empty artifact - which would silently pass the licence-plane check that REQ-LIC-8 depends on."
          },
          {
            "verdict": null,
            "status": "done",
            "id": "DJX-22",
            "name": "Browser sources use the real provider contract",
            "size": "M",
            "reqs": [
              "REQ-CON-5",
              "REQ-NFR-3"
            ],
            "detail": "Asked whether a multi-source provider model exists, assuming DJ decks have one. It did - providers/src/provider.js has defined search/resolve/streamUrl/licenceClass since M3 per REQ-CON-5, with a ProviderRouter that fans queries out, applies per-provider timeouts and reports failures instead of silently serving a smaller catalogue. THE DECK WAS NOT USING IT. It had grown ArchiveLibrary, then OpenverseLibrary, then a hand-rolled merge in the page: two source-selection mechanisms, one tested and one not, diverging. DONE - BrowserProvider EXTENDS Provider, so it is literally the same contract and the same validateTrack licence enforcement, adding only what exists solely in a browser: fetching and decoding through a shared cache. Verified in a browser that all three providers are instanceof Provider. Adding a source is now one adapter plus one registry line; the deck does not change. THE CONTRACT GAINED ONE THING: licenceBasis, because per-item licence metadata and a collection-wide policy are very different strengths of claim and a reader deserves to know which is in play. A provider claiming COLLECTION_POLICY must cite evidence or construction throws - a policy claim without a source is an assumption wearing a suit. SESSION CACHE, chosen by measurement rather than instinct. The obvious cache holds decoded AudioBuffers since they are what plays. Measured on real tracks that is a trap: decoded audio is 9 to 44 times larger than encoded (three tracks = 137 MB decoded vs 8.8 MB encoded), while fetching is the slow variable part at 1 to 3.7 seconds against roughly one second to decode. So it caches ENCODED bytes, LRU, bounded in bytes rather than entries - counting entries would give a hundred short samples and one 60 MB DJ mix equal weight, and it is the mix that fills the tab. THE BUG THIS DESIGN HAS: decodeAudioData DETACHES the buffer it is given, so a cache returning its own instance is left holding a zero-length husk and the second play of a track is silence, with nothing thrown. Guarded - and the guard initially tested nothing, because it detached the result of a cache MISS while the bug lives on the HIT path. Caught by deliberately reintroducing the bug and watching the test still pass. THE CACHE WAS BUILT AND NOT CONNECTED. Written, unit-tested, instantiated in the deck - and the load path still called fetch() directly, so the feature was a dead variable and the claim that it worked would have been false. Caught by grepping the deck for the cache rather than trusting that creating it meant using it. Now wired through the loader, with progress reporting moved inside so a cache hit skips it and says cached. Verified by counting audio requests in a real browser: loading the same record onto the second deck - the thing a DJ does constantly - produced ZERO additional downloads, and the cache reports 1 hit, 1 miss, 0.7 MB held."
          },
          {
            "verdict": null,
            "status": "done",
            "id": "DJX-23",
            "name": "Public-domain spoken word as a source",
            "size": "S",
            "reqs": [
              "REQ-CON-5",
              "REQ-DAT-8"
            ],
            "detail": "Asked for story and history speeches useful for mixing. Spoken word genuinely works over a beat - an intro, a breakdown, a bridge - and it is the one category where public-domain material is abundant and unambiguous. DONE - LibriVox, 21,761 items, verified live: a search for history returned 40 rows, all classified public domain, all tagged as speech. LibriVox OWN API IS CORS-BLOCKED (measured: TypeError: Failed to fetch), but the Archive mirrors the whole catalogue through an API that already works here, so ArchiveLibrary gained a configurable collection and LibriVox is a few lines rather than a second client. THE LICENCE BASIS IS DIFFERENT AND WEAKER AND IS STATED AS SUCH. LibriVox items on the Archive mostly carry NO licence URL, so the per-item classifier returns unknown. That is not evidence of restriction - it is the Archive not repeating what LibriVox policy already establishes, since every LibriVox recording is dedicated to the public domain as a condition of acceptance. So this provider declares COLLECTION_POLICY and cites the policy URL, which the contract now forces. TWO COLLECTIONS WERE DELIBERATELY REJECTED. The Great 78 Project - 187,031 digitised 78rpm recordings - is tempting and was checked rather than assumed: Universal and Sony sued the Internet Archive over it in 2023, it settled confidentially in September 2025, and contested works were removed. A catalogue whose copyright status was litigated and resolved on undisclosed terms does not belong in front of a venue, and its items carry no licence URL anyway. Old-time radio was rejected for a duller reason: sampled, it is overwhelmingly by-nc, which the policy engine blocks in a commercial venue, so it would look like a broken source."
          },
          {
            "verdict": null,
            "status": "done",
            "id": "DJX-24",
            "name": "Automix — hands the set over between decks",
            "size": "M",
            "reqs": [
              "REQ-CLK-1",
              "REQ-SCH-1"
            ],
            "detail": "A DJ App Pro feature that was missing, and practically useful rather than lazy: a DJ needs to leave the booth and a venue needs music at 11am with nobody standing there. DONE - verified in a browser: armed, the crossfade ran from 8.8 seconds remaining down to 0.5, the incoming deck started, and the fader arrived at 0.91 with zero console errors. THE JUDGEMENT IS A PURE FUNCTION. All of automix decision-making is nextAction(state), which touches no audio, so every rule is tested at hundreds of points across a transition without a device. A timer-based implementation would be a pile of setTimeouts whose interactions could only be found by listening. FOUR RULES, EACH EARNING ITS PLACE. Transitions start a fixed time before the end rather than at a fraction - a fraction gives a 30-second outro on a nine-minute mix and two seconds on a jingle. The incoming deck is beat-matched BEFORE it is audible, never during, because changing tempo while a track is heard is a pitch slide rather than a crossfade. A track with no detected tempo still mixes, just without beatmatching, or the deck would strand itself on a spoken-word intro forever. And MANUAL INPUT ALWAYS WINS: if the fader moves during a transition, automix stops touching it for the rest of that transition, because a control that fights the hand on it is worse than no automatic control - the DJ cannot tell whether the deck is broken or possessed. That required comparing the fader against what automix last wrote rather than a constant, or its own ramping reads as interference. THE SWEEP TEST INITIALLY TESTED NOTHING: it held prepared:true throughout, so the PREPARE branch could never fire. Rewritten to drive the real state machine, and it now also asserts the ORDER, since preparing after starting would mean beat-matching a track the room can already hear. AND ONE MORE GAP CLOSED AFTER FIRST REPORTING IT AS A CAVEAT: automix drew from the current search results and stopped when they ran out, which is correct for play-this-list-once and wrong for the thing it is actually for. A set that repeats after forty records is enormously better than a room that goes silent at 2am, so the pool now cycles - guarded so recycling cannot fire while unplayed tracks remain, which would otherwise wipe the history and repeat records that had never been played."
          },
          {
            "verdict": null,
            "status": "done",
            "id": "DJX-25",
            "name": "Autotune on a live microphone",
            "size": "M",
            "reqs": [
              "REQ-NFR-1"
            ],
            "detail": "Asked for, and cheaper than it sounds because the hard parts existed: keylock.js is already a working pitch shifter and the repo already had validated pitch-detection technique. Autotune is the musical decision between them. DONE - proven end to end by applying the correction and RE-MEASURING, not by inspecting the ratio: a tone 40 cents sharp of A4 was detected at 450.0 Hz and came out at exactly 440.0 Hz (0 cents off); one flat of C5 detected at 515.1 came out at 523.2 (0 cents off). It tunes to the key of whichever deck is playing, using the key detection from DJX-14, so the voice is corrected to the record rather than to an arbitrary scale. TWO CONSTRAINTS STATED RATHER THAN HIDDEN. Latency: the shifter adds a constant 49 ms and the browser adds its output buffer, roughly 90 to 110 ms end to end. That is fine in the mix and UNUSABLE as a headphone monitor, since 100 ms of delay on your own voice is past the point where speech becomes hard to produce. So the corrected signal goes to the master bus, not to an earpiece. Feedback: a microphone and loudspeakers in one room is a feedback loop and a DJ application is guaranteed to have loudspeakers, so nothing in software makes it safe and the UI says headphones. THE DETECTOR TAKES THE EARLIEST STRONG PEAK, not the tallest, because autocorrelation peaks equally at every multiple of the period - the same octave error that once measured a 475 Hz tone as 237.6 Hz here. An octave error in autotune is worse than none: it drags a voice into the wrong register confidently. Corrections beyond a semitone are REFUSED rather than applied, because past that the singer is on a different note and fixing it rewrites the melody - and it is far more likely to be a detector octave error than a singer that far out. Browser echo cancellation and noise suppression are disabled: they are tuned for speech on a call and mangle a sung note before autotune sees it."
          }
        ]
      }
    ],
    "deferred": [
      {
        "item": "Payment provider integration",
        "when": "v1.1",
        "why": "ADR-003 — the ordering model and ledger ship in v1 so the scheduler needs no change. PCI scope, chargebacks and fraud are deliberately not v1 problems."
      },
      {
        "item": "Operator console and multi-venue",
        "when": "v2",
        "why": "ADR-004 — and as federation over appliances, not shared-database multi-tenancy. Offline-first rules out multi-tenant SaaS."
      },
      {
        "item": "Stem separation and per-stem deck control",
        "when": "v1.1",
        "why": "Precompute with Demucs on ingest; needs a GPU story that v1 deliberately avoids (REQ-NFR-11)."
      },
      {
        "item": "DVS timecode vinyl",
        "when": "v1.1",
        "why": "P2, and largely inherited free from the Mixxx fork once the engine lands."
      },
      {
        "item": "Licensed-streaming adapters",
        "when": "when agreements exist",
        "why": "Beatport/TIDAL/SoundCloud each require a commercial agreement. Ship the interface, not unauthorised implementations."
      },
      {
        "item": "DMX lighting and show control",
        "when": "v2",
        "why": "OLA + QLC+ integration. rekordbox's phrase-aware auto-lighting is the benchmark to match."
      },
      {
        "item": "Karaoke media and singer rotation",
        "when": "v2",
        "why": "Comes partly free from the Karaoke Eternal fork; deliberately out of v1 scope."
      },
      {
        "item": "Multi-zone synchronised audio",
        "when": "v2",
        "why": "Snapcast as a separate process at the edge."
      },
      {
        "item": "Mackie Control / HUI emulation",
        "when": "v2",
        "why": "P2. Unlocks motorised-fader surfaces no DJ app addresses."
      },
      {
        "item": "Polished mouse-only scratching",
        "when": "not planned",
        "why": "ADR-005 accepts this as mediocre. The target user is a venue with hardware."
      }
    ],
    "statuses": {
      "done": "Implemented, tested and green in CI",
      "todo": "Not started"
    }
  }
};
