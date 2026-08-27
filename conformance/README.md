# `conformance/` — the CDEP conformance suite

**Licence: Apache-2.0** · Implements REQ-CDEP-17 and AC-17

Every engine claiming CDEP support must pass this suite. The specification requires **both**
[`engine-stub/`](../engine-stub) and the future Mixxx-derived [`engine/`](../engine) to pass it.

## Why it matters beyond correctness

[ADR-001](../DECISIONS.md#adr-001--licence-structure) keeps the Apache-2.0 core and the GPL engine on
opposite sides of an arms-length boundary, and that position depends on the engine being **replaceable**
(REQ-LIC-5). A suite that two independent implementations both pass turns replaceability from a claim into
a tested property.

The runner never imports engine internals. An engine passes or fails purely on its behaviour over the
socket.

## Running it

```bash
# Spawn the bundled stub and test it
node conformance/bin/cdep-conformance.js --engine engine-stub

# Test any other engine command
node conformance/bin/cdep-conformance.js --engine "./build/crowddeck-engine"

# Test an engine that is already running
node conformance/bin/cdep-conformance.js --socket /tmp/crowddeck.sock

# Narrow to specific checks, or emit machine-readable output
node conformance/bin/cdep-conformance.js --only C16,C17 --json
```

Exit code `0` means conformant, `1` means a check failed, `2` means the run itself failed.

An engine spawned by the runner must accept `--socket <path>` and print `cdep listening <path>` on stdout
when it is ready to accept connections.

## The checks

| ID | Requirement | What it proves |
|---|---|---|
| C01 | REQ-CDEP-9 | Handshake negotiates a version and returns a welcome |
| C02 | REQ-CDEP-11 | Capabilities are advertised so clients can degrade |
| C03 | REQ-CDEP-12 | Every control has a complete descriptor |
| C04 | REQ-CDEP-13 | The description can drive a UI and a mapping target list |
| C05 | REQ-CDEP-6 | Group naming convention is followed |
| C06 | §2.10 | The minimum control set is present |
| C07 | REQ-CDEP-12 | get/set round-trips; readonly controls are refused |
| C08 | REQ-CDEP-8 | Errors carry documented machine-readable codes |
| C09 | REQ-CDEP-7 | Unknown fields are ignored, so the protocol can extend |
| C10 | REQ-CDEP-4 | Concurrent clients hold independent subscription state |
| C11 | REQ-CDEP-14 | Updates coalesce to `max_hz` and settle on the latest value |
| C12 | REQ-CDEP-15 | High-rate controls stay silent until subscribed |
| C13 | REQ-CDEP-18 | `load` populates deck state and emits `track_loaded` |
| C14 | REQ-CDEP-18 | Transport advances the playhead; pause holds it |
| C15 | REQ-FALL-3 | A queued next track continues gaplessly |
| **C16** | **REQ-CDEP-16** | **A stalled peer does not stall the engine** |
| C17 | REQ-CDEP-10 | An unsupported version is refused and the connection closed |
| C18 | REQ-CDEP-1 | Messages before the handshake are refused |

**C16 is the one that matters most.** The entire two-plane architecture is justified by the guarantee that
a client which stops reading cannot glitch the room's audio. If C16 fails, putting the engine in its own
process has bought nothing.

## Optional capabilities

Checks skip cleanly when an engine does not advertise the relevant capability in `welcome` — C15 is skipped
unless the engine advertises `gapless`, for instance. That is REQ-CDEP-11 working as intended: a minimal
engine can be conformant without implementing everything.
