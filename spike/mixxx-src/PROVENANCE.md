<!--
SPDX-License-Identifier: Apache-2.0
This file (the provenance record itself) is CrowdDeck documentation.
The source files it describes are NOT. See below.
-->

# Provenance — third-party source, retained as evidence

**Everything in this directory is unmodified third-party source code from the Mixxx project.
It is not CrowdDeck code. It is not compiled, imported, bundled or linked by anything in this
repository.** It exists so the citations in [`../SPIKE-1-REPORT.md`](../SPIKE-1-REPORT.md) can be checked
without trusting my summary of them.

| | |
|---|---|
| **Upstream** | [`mixxxdj/mixxx`](https://github.com/mixxxdj/mixxx) |
| **Commit** | `545040613d0fa440190f2b5e5c380f83340ee81b` (2026-08-27) |
| **Licence** | **GPL-2.0-or-later** — see [upstream `COPYING`](https://github.com/mixxxdj/mixxx/blob/main/COPYING) |
| **Modified?** | No. Byte-for-byte as fetched. |

GitHub's licence API reports `NOASSERTION` for Mixxx because its `COPYING` file is not a bare, unmodified
licence text. The actual licence was confirmed by reading `COPYING` directly, which is the same method used
throughout [`CONCEPT-IDEA.md`](../../CONCEPT-IDEA.md) and which corrected 12 projects during Phase 1.

## Why this does not breach the licence boundary

[ADR-001](../../DECISIONS.md) splits the project into an Apache-2.0 plane and a GPL plane, and
[`tools/licence-lint.mjs`](../../tools/licence-lint.mjs) enforces that Apache-2.0 code never imports GPL
code. Copyleft obligations attach to **distribution of a combined work**. These files are:

- not `#include`d or imported by any CrowdDeck source file;
- not referenced by any build script, `package.json`, or CI job;
- not transformed, adapted or excerpted into CrowdDeck code.

They sit here the way a quoted passage sits in a bibliography. `licence-lint` treats this directory as a
distinct `upstream-reference` plane and **fails the build if any CrowdDeck file imports from it** — the same
mechanism that guards `engine/`.

If retaining them is ever judged too close to the line, they can be deleted without loss: every citation in
the report gives a file and line number resolvable against the commit above. `LEGAL-1` should confirm this
reading along with the rest of the boundary.

## Files and their upstream paths

| File here | Upstream path | Cited for |
|---|---|---|
| `control.h` | `src/control/control.h` | `getAllInstances()`, parameter-space API, privately-held behavior |
| `controlobject.h` | `src/control/controlobject.h` | The control vocabulary CDEP adopts |
| `controlobjectscript.h` | `src/control/controlobjectscript.h` | `CompressingProxy`, `m_skipSuperseded` — upstream coalescing |
| `controlmodel.h` | `src/control/controlmodel.h` | Correcting my own `ControlModel` claim |
| `controlproxy.h` | `src/control/controlproxy.h` | Change-notification model |
| `controlbehavior.h` | `src/control/controlbehavior.h` | `min`/`max` are protected; value⇄parameter curves |
| `controlpotmeter.h` | `src/control/controlpotmeter.h` | `setRange()` has no getter |
| `controlpushbutton.h` | `src/control/controlpushbutton.h` | Button semantics |
| `enginemixer.h` | `src/engine/enginemixer.h` | **QtCore-only includes — the engine is not GUI-coupled** |
| `enginemixer.cpp` | `src/engine/enginemixer.cpp` | Master/head gain really being -14..14 dB |
| `soundmanager.h` | `src/soundio/soundmanager.h` | Audio device layer for the headless build |
| `common-controller-scripts.js` | `res/controllers/common-controller-scripts.js` | EQ routed via `[EqualizerRack1_…]` |
| `engine-api.d.ts` | `res/controllers/engine-api.d.ts` | The full scripting surface, typed |
