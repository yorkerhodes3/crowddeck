# CDEP — the CrowdDeck Engine Protocol

**Licence: Apache-2.0** · Specification: [`SPECIFICATION.md`](../SPECIFICATION.md) §2

The contract between the Apache-2.0 fusion core and the GPL performance engine. Written **before either
engine existed** ([ADR-002](../DECISIONS.md#adr-002--engine-fork-mixxx-or-build-new)) so it is shaped by
its consumer rather than dictated by the fork.

## Design in one page

**Transport.** A local stream socket — Unix domain socket on POSIX, named pipe on Windows (REQ-CDEP-1).
**Framing.** Newline-delimited JSON, one object per line (REQ-CDEP-2).

That it is a *text* protocol over a socket is not an accident of convenience. ADR-001 puts a licence
boundary here, so the interface has to be genuinely arms-length: no shared memory, and no structures whose
layout is defined by GPL headers (REQ-CDEP-3).

**Addressing.** Controls are `(group, item)` — `[Channel1]`/`play`, `[Master]`/`crossfader` — mirroring the
vocabulary Mixxx's Control bus already exposes to its scripting layer. Adopting it rather than inventing
one is what makes the headless extraction tractable.

**Self-description.** `describe` returns every control with a full descriptor: type, range, default,
readonly flag and a human label (REQ-CDEP-12). A client can build a complete control UI *and* a complete
MIDI mapping target list with no hard-coded knowledge of the engine (REQ-CDEP-13).

> This is deliberately symmetric with MIDI-CI Property Exchange on the hardware side: the same
> "the device describes itself" principle applied at both edges of the system.

**Back-pressure.** Subscriptions carry a `max_hz` cap and updates are coalesced to it (REQ-CDEP-14).
When a peer stops reading, updates are **dropped rather than queued** (REQ-CDEP-16) — safe precisely
because they are coalesced, since the next flush carries the latest value anyway.

> **The rule the whole architecture exists to protect:** the engine must never block on IPC. A wedged
> browser tab or a crashed fusion core must not be able to glitch the room's audio. `C16` in the
> conformance suite and `AC-18` in the tests both assert it.

## Message types

| Type | Direction | Purpose |
|---|---|---|
| `hello` / `welcome` | C→E / E→C | Version negotiation and capability advertisement |
| `describe` / `description` | C→E / E→C | Enumerate the control set with descriptors |
| `get` / `value` | C→E / E→C | Read a control |
| `set` | C→E | Write a control |
| `subscribe` / `unsubscribe` | C→E | Manage change notification, with a rate cap |
| `changed` | E→C | Control value changed |
| `load` | C→E | Load a track onto a deck (optionally queueing the next) |
| `event` | E→C | `track_loaded`, `track_ended`, `deck_empty`, `beat`, `phase`, `xrun`, `device_error` |
| `ping` / `pong` | both | Liveness |
| `ok` / `error` | E→C | Correlated replies |

Two conventions keep the protocol extensible: **receivers ignore unknown fields** (REQ-CDEP-7), so new
fields need no version bump; and the protocol is versioned `cdep/<major>` (REQ-CDEP-9), with an
unsupported version refused fatally (REQ-CDEP-10).

## Usage

```js
import { CdepClient, defaultSocketPath } from "./protocol/src/index.js";

const client = new CdepClient({ path: defaultSocketPath(), client: "my-app/1.0.0" });
const welcome = await client.connect();

const controls = await client.describe();          // build a UI from this
await client.load("[Channel1]", { id: "track-1", duration: 210 });
await client.subscribe([{ group: "[Channel1]", item: "playposition" }], 20);
client.on("changed", (m) => console.log(m.item, m.value));
await client.set("[Channel1]", "play", 1);
```

## Layout

```
src/
  index.js      public surface
  messages.js   message constructors, version negotiation
  controls.js   (group, item) addressing, descriptors, value coercion
  framing.js    NDJSON encode/decode and an incremental line splitter
  errors.js     the closed error-code enumeration
  client.js     a minimal client, used by the conformance suite and the core
test/           unit tests — `node --test`
```

## Conformance

Any engine claiming CDEP support must pass the suite:

```bash
node conformance/bin/cdep-conformance.js --engine engine-stub
```

Both [`engine-stub/`](../engine-stub) and, later, [`engine/`](../engine) must pass it (REQ-CDEP-17, AC-17).
That is what makes "any conforming engine is interchangeable" a tested property rather than a claim.
