# `engine-stub/` — a conformant CDEP engine with no audio

**Licence: Apache-2.0**

## Why this exists

Two reasons, both structural rather than convenient.

**1. It unblocks the risky work.** [ADR-002](../DECISIONS.md#adr-002--engine-fork-mixxx-or-build-new)
sequences the build **contract-first, stub second, fork third**. The fusion layer — the staging lane and
autonomous drain — has no prior art in any product, open or closed. It is the highest-uncertainty part of
the plan, so it gets proven against a throwaway engine *before* anyone spends months extracting a headless
Mixxx.

**2. It is the licence-boundary proof.** ADR-001 keeps the Apache-2.0 core and the GPL engine on opposite
sides of an arms-length interface, and that argument depends on the engine being genuinely **replaceable**
(REQ-LIC-5). A second, independently-licensed, working implementation demonstrates replaceability instead
of asserting it. The stub therefore stays in the repository permanently, and stays green in CI, long after
the real engine lands.

## What it does and does not do

| Does | Does not |
|---|---|
| Full CDEP handshake, describe, get/set, subscribe/changed, load, transport | Produce any sound |
| A complete SPECIFICATION §2.10 control set across 4 decks | Decode audio files |
| Gapless track-to-track continuation | Beatmatch, key-detect or time-stretch |
| Coalescing, back-pressure, multi-client isolation | Talk to any audio device |

**Its job is to be a conformant CDEP peer, not a good audio player.** REQ-CDEP-18 asks for "enough for the
fusion core to be developed and tested against it with no Mixxx dependency" — no more.

Playback is modelled by `SimulatedSink`, which advances a monotonic playhead in real time against absolute
deadlines. That is a deliberate benefit, not only a limitation: tests are deterministic and CI needs no
audio device. `AudioSink` is the seam a native sink drops into without the transport or the server
changing.

## Running it

```bash
node engine-stub/bin/crowddeck-engine-stub.js --socket /tmp/crowddeck.sock --decks 4
```

It prints `cdep listening <path>` once ready — the conformance runner waits for that line.

## Verifying it

```bash
node --test "engine-stub/test/**/*.test.js"          # unit + integration
node conformance/bin/cdep-conformance.js --engine engine-stub
```

## A note on the back-pressure tests

`test/backpressure.test.js` asserts REQ-CDEP-16 and AC-18: a client that stops reading must not stall the
engine.

An earlier version of that test passed **even with the guard deleted**, because coalescing alone kept the
socket buffer under the production 256 KiB limit — so it was really testing coalescing, not the guard. The
send-buffer limit is therefore injectable, and the test drives it with a small budget and many distinct
controls so the drop path genuinely executes. Removing the guard now fails the suite.

Worth remembering when adding tests here: a guard test that cannot fail is not a test.
