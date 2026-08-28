# `interconnect/` — MIDI and systems interconnection

**Licence: Apache-2.0** · Specification: [`SPECIFICATION.md`](../SPECIFICATION.md) §6, Domain D

The brief that started this project asked for a DJ app that "uses MIDI to interface musical instruments
and other song source content." That phrasing matters: **every DJ application treats MIDI as a control
surface** — a way to read knobs. Domain D takes it literally and treats MIDI as an interface to
*instruments and sources*.

## What is here

| File | Role |
|---|---|
| `ports.js` | Port abstraction with **stable identity**, hot-plug, message decoding |
| `mapping.js` | Declarative mappings targeting CDEP controls, MIDI learn, **soft-takeover** |
| `clock.js` | MIDI Clock at 24 PPQN from the leader deck, with jitter measurement |
| `instrument.js` | **Live instruments as queueable sources** — the distinguishing idea |
| `midi-ci.js` | **MIDI-CI Property Exchange** — devices that describe themselves need no hand-written mapping |

## Four design positions

**Ports are addressed by identity, never by index.** RtMidi and the Web MIDI API both enumerate ports by
position, so unplugging a controller or rebooting silently re-points every saved mapping at the wrong
hardware. CrowdDeck derives an identity from manufacturer, product and serial (REQ-MIDI-2), so mappings
survive a reboot and re-bind on reattach (AC-10). Two identical controllers without serials will collide;
that is a better failure than every mapping breaking whenever anything is replugged.

**Soft-takeover is not optional.** A physical fader sits where the DJ left it while software state moves
on — another controller, a loaded track, the autonomous mixer. Touching the fader without protection makes
the parameter *jump*, which in a venue is an audible glitch in front of people. Controls stay suppressed
until the hardware crosses the software value (REQ-MIDI-4, AC-11), and re-arm whenever software moves
behind the hardware's back.

**Mappings target CDEP, not engine internals.** A binding names a `(group, item)` pair, and the list of
legal targets is generated from CDEP `describe` (REQ-CDEP-13). The mapping layer holds **no hard-coded
knowledge of any engine**, so swapping the stub for the Mixxx-derived engine leaves mappings working.

**MIDI Clock, never MTC.** Clock carries tempo at 24 PPQN; MTC carries SMPTE position. MTC's ~0.6 ms
resolution and susceptibility to traffic delay make it unfit for beat-accurate sync (REQ-CLK-5). Reaching
for it throws, with the reasoning attached — an explicit refusal is more useful than a silent omission.

## Instruments as sources — the point of all this

```js
const inst = registry.register({
  portIdentity: "akai:mpk-mini:1",
  name: "Live — Nina's SP-404",
  performer: "Nina",
  durationSec: 300
});

scheduler.request({ track: inst.toTrack(), patronId: "staff" });
```

A performance becomes a queue entry like any track: **same scheduler, same policy screen, same priority
function, same queue, same position in line**. Patrons can vote a recording above the live set, and the
policy engine screens a live source exactly as it screens a recording — both are tested.

Two consequences follow. The instrument follows the leader deck's clock, so a live performance sits on the
same timeline as recorded tracks. And a slot has a duration plus an idle timeout, so if the performer
stops early the never-silent fallback takes the room back (REQ-INST-2) — a human forgetting to finish is
not allowed to become dead air.

## Honest limitations

**No real hardware yet.** `MidiBackend` is the seam a native driver (libremidi, per the OSS triage) drops
into; `FakeMidiBackend` is what exists today. Everything *interesting* — identity, hot-plug rebinding,
mapping, soft-takeover, clock arithmetic, instrument lifecycle — is transport-independent and fully
tested. Real I/O lands with the engine plane.

**The clock cannot meet its own budget in JavaScript.** REQ-CLK-6 sets ≤1 ms RMS jitter at the MIDI
output. A JS timer cannot honour that. The scheduler is therefore written to be *correct about when a
pulse is due* — absolute deadlines, never accumulated intervals, so a late pulse does not drift the whole
train — and it **measures and reports the jitter it actually achieves** via `clock.jitter()`. The test
deliberately does not assert the budget; a test that pretended to meet it would be dishonest. Meeting it
belongs to the native engine plane.

**MIDI 2.0 / UMP is designed for, not implemented.** REQ-MIDI-8's self-describing controllers via MIDI-CI
Property Exchange is the defensible lead identified in the research, and it pairs naturally with CDEP's
own self-description. It needs the native backend first.

## Testing

```bash
node --test "interconnect/test/**/*.test.js"
```

A virtual clock and timer are injected throughout, so pulse timing is exact and the suite runs instantly.
The one test on real timers measures jitter and reports it rather than asserting a budget it cannot meet.

## Devices that describe themselves

Every incumbent DJ application ships hand-authored mapping files, one per
controller, maintained forever. `MID-7` implements **MIDI-CI Property Exchange**
(`REQ-MIDI-8`) so a capable device can describe its own controls and be mapped
without a file.

### The wire format is taken from the specification

Not from memory, and not from a search result. The Sub-ID#2 assignments come from
**M2-101-UM, MIDI-CI v1.2, Appendix D**, and the chunked `Get Property Data`
layout from its Table 33. `ResourceList`, `DeviceInfo` and `ChannelList` are the
Foundational Resources of **M2-105-UM v1.01**.

That care was warranted: a web search confidently reported `0x35` as *Set Property
Data*. It is **Reply to Get Property Data** — `0x36` is Set. Building on it would
have produced a client that talked past every real device, and the tests assert the
constants longhand so nobody can 'fix' them back.

### A known gap, stated rather than papered over

**The controller-list resource is not hard-coded, because neither document defines
one.** `findControllerResource()` discovers it from the device's own
`ResourceList`, including the `X-` manufacturer-specific names the spec reserves.

Any control whose type or number cannot be confidently interpreted produces **no
binding at all**, and is returned in `skipped` with a reason. That is the whole
discipline of this module: in a venue, a fader silently bound to the wrong deck
control is far worse than a fader that is not bound yet. An unmapped control costs
a five-second MIDI-learn; a mis-mapped one costs a mistake in front of people.

`autoMap()` also refuses to run without a `resolveTarget` callback. Deciding which
engine control a device's "filter" means is not a decision this layer may make on
its own — the mapping layer holds no hard-coded knowledge of any engine
(`REQ-CDEP-13`).

### The human always wins — REQ-MIDI-9

`mergeMappings(auto, user)` overrides **per physical control, not per file**. A DJ
who re-binds one knob must not lose the other forty-nine the device described, or
they will stop using auto-mapping altogether. A user binding *replaces* the auto
binding for that control rather than sitting beside it — otherwise one turn of a
knob would drive two engine controls.