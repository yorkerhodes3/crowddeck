# `engine/` — the performance plane

**Licence: GPL-2.0-or-later. This directory is the only copyleft plane in the repository.**

This directory is intentionally empty. It will hold the **Mixxx-derived headless engine**
([ADR-002](../DECISIONS.md#adr-002--engine-fork-mixxx-or-build-new)), which lands in epic **E7** after
`SPIKE-1` has measured the extraction cost.

## Why it is empty right now

ADR-002 sequences the work **contract-first, stub second, fork third**:

1. ✅ **Contract** — [`protocol/`](../protocol) defines CDEP, written before any engine existed so the
   contract is shaped by its consumer rather than dictated by the fork.
2. ✅ **Stub** — [`engine-stub/`](../engine-stub) is a conformant engine with no audio output. It lets the
   fusion core be built and tested now, and it permanently demonstrates that the engine is
   **replaceable** (REQ-LIC-5) — the property the licence split depends on.
3. ⏳ **Fork** — this directory, once `SPIKE-1` confirms the approach.

Starting with the fork would have inverted the risk: the highest-uncertainty work (the fusion layer, which
has no prior art anywhere) would have waited behind the most expensive work.

## What will live here

Kept from Mixxx: `engine`, `audio`, `soundio`, `mixer`, `analyzer`, `effects`, `vinylcontrol`, `control`,
`controllers`, `sources`, `track`.

Discarded: `skin`, `widget`, `qml`, `dialog`, `preferences`, `rendergraph`, `shaders` — this engine is
headless, and per [ADR-005](../DECISIONS.md#adr-005--native-qt-shell-or-thin-native-engine-plus-web-consoles)
all consoles are web.

The extraction is tractable because Mixxx's `src/control` already exposes an enumerable, named,
change-notifying parameter bus (`ControlObject`, `ControlObjectScript`, `ControlModel`) that its JavaScript
controller layer drives the entire engine through. CDEP adopts that vocabulary, so the work is largely
adding a transport over a proven abstraction rather than inventing one.

## Rules for code in this directory

- Every file **MUST** carry `SPDX-License-Identifier: GPL-2.0-or-later`.
- Nothing outside this directory may import from it. Apache-2.0 code reaches the engine **only over CDEP**
  (REQ-LIC-2), and `node tools/licence-lint.mjs` fails the build if that is violated.
- Keep the fork **thin**. Contribute general fixes upstream so divergence stays manageable — which is also
  why the fork stays at GPL-2.0-or-later rather than narrowing to v3, preserving two-way patch flow with
  Mixxx.
- Whatever is built here **MUST** pass the same conformance suite the stub passes:
  `node conformance/bin/cdep-conformance.js --engine "<command>"` (REQ-CDEP-17, AC-17).
