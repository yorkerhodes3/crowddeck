<!-- SPDX-License-Identifier: Apache-2.0 -->

# LEGAL-1 — review pack for counsel

**Status:** open. **Blocks:** first public distribution. **Does not block:** development.

> **This document is not legal advice and does not attempt to give any.** It is a factual brief
> prepared *for* a qualified reviewer, so that the engagement can be short and specific. It states what
> the software does, what is already enforced, and the exact questions we need answered.

## 1. The question in one paragraph

CrowdDeck ships **two executables**. One is a venue/jukebox layer under **Apache-2.0**. The other is an
audio engine derived from [Mixxx](https://github.com/mixxxdj/mixxx) and therefore under
**GPL-2.0-or-later**. They communicate only over a local socket using a documented, versioned,
general-purpose protocol (CDEP). No Apache-2.0 source includes, links to, or vendors any GPL code.

**We need to know whether that boundary is sufficient**, in the jurisdictions we intend to distribute in,
to keep the Apache-2.0 layer a separate work rather than a derivative of the GPL engine.

We are aware this is contested. The "separate processes are separate works" reading is widely practised;
the Free Software Foundation reads it more narrowly, weighing the *intimacy* of the communication and
whether the parts form a single program in substance. We have designed against the narrow reading rather
than assuming the permissive one, but we are not qualified to judge whether we succeeded.

## 2. Why the split exists (commercial context)

The genuinely novel component is the venue layer — a scheduler that serves a DJ and a crowd-request
jukebox from one queue. Under Apache-2.0 a hotel group, cruise line, POS vendor or fitness chain can embed
it. Under GPL, in practice, almost none of them will. **That adoption is the project's strategic value.**

The engine is not novel — it is Mixxx, and it stays GPL, matching upstream exactly so patches can flow both
ways.

If the boundary does not hold, the fallback is to relicense everything as GPL. That costs the reuse
above but **requires no code changes**, because the architecture is sound independently of licensing.

## 3. What is already true and mechanically enforced

These are not aspirations. Each is a requirement in
[`SPECIFICATION.md`](../SPECIFICATION.md) §1.2 and is verified by CI on every commit.

| # | Property | How it is enforced | Evidence |
|---|---|---|---|
| REQ-LIC-1 | Every file carries an SPDX header matching its plane | `tools/licence-lint.mjs` | 81 files checked, 0 violations |
| REQ-LIC-2 | Apache-2.0 code never includes, vendors, statically links or `#include`s GPL code | licence-lint checks **all five** module-loading forms — `import…from`, bare side-effect `import`, dynamic `import()`, `require()`, `#include` | 6 tests in `tools/test/licence-lint.test.js` each construct a violation and assert it is caught |
| REQ-LIC-3 | CI fails the build on any violation | `npm run check` in GitHub Actions | Green on every commit |
| REQ-LIC-4 | The engine is a standalone, independently runnable executable | Architecture; the stub already ships as its own binary with its own `bin/` entry point | `engine-stub/bin/crowddeck-engine-stub.js` |
| REQ-LIC-5 | A conforming alternative engine remains possible | A second, wholly independent Apache-2.0 engine implementation exists and passes the same 20-check conformance suite | `engine-stub/` — **permanently green in CI** |
| REQ-LIC-6 | FFmpeg built LGPL-only | Pending (`REPO-3`) | Not yet implemented |
| REQ-LIC-7 | NOTICE file generated per release artifact | Pending (`REPO-3`) | Not yet implemented |

### The point we consider strongest

**REQ-LIC-5 is not a promise, it is a running program.** `engine-stub/` is a complete, independent,
Apache-2.0 engine that satisfies the same protocol contract and passes the same conformance suite as the
GPL engine will. The venue layer is developed against it daily and does not know which engine it is talking
to.

This matters because a common test for "single program in substance" asks whether one part is useless
without the specific other. Ours is demonstrably not: **the GPL engine is interchangeable, and today it does
not even exist** — `engine/` currently contains zero source files, and the product runs.

## 4. Technical facts a reviewer will want

**The interface.** CDEP — CrowdDeck Engine Protocol. Newline-delimited JSON over a Unix domain socket
(POSIX) or named pipe (Windows). Published schema:
[`protocol/cdep-1.schema.json`](../protocol/cdep-1.schema.json), `$id: https://crowddeck.dev/schema/cdep-1.json`,
explicitly versioned (`cdep/1`) with negotiation.

**What crosses the boundary.** Strings and numbers only: control names such as `[Channel1]`/`play`, values,
and normalised `0.0..1.0` parameters. **No shared memory. No GPL-defined structs. No function pointers. No
callbacks into GPL code.** The vocabulary (`group`, `item`, `value`) is a general-purpose control-bus
abstraction, not a Mixxx-specific ABI.

**Direction of dependency.** The Apache-2.0 layer depends on *the protocol*, not on the engine. It is
written against a published schema that predates the engine fork — the contract was deliberately specified
and implemented **before** any Mixxx code was forked, precisely so the boundary could not be shaped by the
GPL side.

**Process separation.** Separate executables, separate address spaces, separate crash domains. The venue
layer reconnects and resynchronises if the engine restarts, and vice versa
([`core/src/engine-link.js`](../core/src/engine-link.js)) — the engine keeps playing audio when the venue
layer dies, which is a tested property, not a claim.

**Repository layout.** `engine/` is GPL-2.0-or-later and physically separate. Everything else is
Apache-2.0. The boundary is visible in every diff.

**Third-party GPL source in the repository.** `spike/mixxx-src/` contains ~150 KB of **unmodified** Mixxx
source, retained purely as citable evidence for a feasibility report. It is not compiled, imported or
linked by anything. Provenance, commit hash and per-file rationale:
[`spike/mixxx-src/PROVENANCE.md`](../spike/mixxx-src/PROVENANCE.md). **We would like this reviewed too** —
if retaining it is judged unwise, it can be deleted with no loss, since every citation resolves against the
upstream commit.

## 5. Questions we need answered

1. **Is the CDEP boundary sufficient** to keep the Apache-2.0 layer a separate work, in the jurisdictions
   named in §6? If it is borderline, what specifically would move it?
2. **Does the existence and permanence of the independent stub engine** (REQ-LIC-5) materially strengthen
   the position, as we believe it does?
3. **Does distribution shape change the answer** — specifically, shipping both binaries in one installer
   versus two separate downloads? See §6; this is the decision we most need guidance on, because it is
   cheap to change now and expensive later.
4. **Does GPL-2.0-or-later's "or later" clause** give us a usable compatibility route if a combined
   distribution is ever unavoidable? ADR-001 assumes electing v3 for such a combination resolves the
   Apache-2.0/GPL-2.0-only incompatibility. Is that sound?
5. **Is retaining unmodified upstream GPL source** as documentation evidence (§4, last item) acceptable in
   an otherwise Apache-2.0 repository?
6. **What must the NOTICE and attribution** (REQ-LIC-7) contain to satisfy both licences per artifact?
7. **Are there obligations we have missed entirely?** We would rather hear it now than after release.

## 6. Facts the project owner must supply before the review

These are business decisions, not legal ones, and the answers change the analysis. **They are currently
unanswered.**

| Question | Why it matters |
|---|---|
| **Distribution shape** — one installer containing both binaries, or two separate downloads? | Probably the single largest factor in how §5.1 is answered |
| **Jurisdictions** — US only, EU, both, elsewhere? | Determines whose case law applies |
| **Commercial model** — pure open source, open core, hosted service, appliance sales? | Affects which obligations bite |
| **Fallback appetite** — is Apache-2.0 venue-layer reuse non-negotiable, or is single-GPL acceptable? | Determines whether an unfavourable answer is fatal or merely disappointing |
| **Who contributes** — will there be a CLA or DCO? | Affects the ability to relicense later if the fallback is needed |

## 7. What happens with each outcome

- **Boundary holds** → proceed as specified. No changes.
- **Boundary is borderline** → tighten whatever counsel identifies (likely candidates: separate download
  artifacts, a clearer NOTICE, more explicit protocol documentation), then proceed.
- **Boundary fails** → relicense the whole project GPL-2.0-or-later. Costs the venue-layer reuse argument in
  ADR-001 §"Why split rather than single-GPL". **Costs no engineering** — every technical property above
  (separate processes, versioned protocol, replaceable engine, crash isolation) is good architecture we
  would keep regardless. That is deliberate: the licence split rides on an architecture we wanted anyway.

---

*Prepared from [`DECISIONS.md`](../DECISIONS.md) ADR-001 and [`SPECIFICATION.md`](../SPECIFICATION.md) §1.2.
Every claim in §3 is verifiable by running `npm run check` at the repository root.*
