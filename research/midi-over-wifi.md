# MIDI over Wi-Fi — what works, what does not, and why

**Status:** research note, ratified into `SPECIFICATION.md` §6.5 as `REQ-CLK-7`.
**Date:** 2026-08-28.

Everything here is sourced from primary documents. Where a figure comes from
vendor content or community data rather than a controlled experiment, it says so.

---

## The short answer

**Yes, MIDI 2.0 runs over Wi-Fi — there is a ratified specification for it — but
you should not put a musical clock on that link.**

The transport works. The problem is not MIDI 2.0 and not Wi-Fi in isolation; it is
that **MIDI clock is a stream of untimestamped events whose meaning is their
arrival time**, and Wi-Fi's whole design trades timing determinism for
flexibility. Those two facts do not compose.

---

## 1. What is specified

### Network MIDI 2.0 — **M2-124-UM**

- *"Network MIDI 2.0: User Datagram Protocol for Universal MIDI Packets"*
- **Ratified November 2024** by The MIDI Association and AMEI.
- UDP over IP. Not RTP, not TCP.
- Discovery via mDNS/DNS-SD, service type `_midi2`.
- Carries **Universal MIDI Packets**, so both MIDI 1.0 and MIDI 2.0 messages.
- **Forward Error Correction**: a sender routinely repeats the two most recent
  UMP data commands in each packet. Optional retransmit on top.
- Optional password/PIN authentication. **No encryption in v1.0.**

Source: <https://midi.org/network-midi-2-0-udp-overview>. The specification PDF
itself is behind member access; the AMEI document directory returned HTTP 403
during research, so the exact filename on that server is unconfirmed.

### RTP-MIDI — **RFC 6295**

- *"RTP Payload Format for MIDI"*, IETF Standards Track, June 2011. Obsoletes
  RFC 4695 (2006).
- The abstract is explicit: it *"encodes all commands that may legally appear on a
  **MIDI 1.0 DIN cable**."*
- **MIDI 1.0 only.** It predates MIDI 2.0 by about nine years, and the MIDI
  Association's own comparison table lists its MIDI 2.0 and UMP support as "No".
- Apple's implementation ("AppleMIDI") is a session layer over this, advertised as
  `_apple-midi._udp`.

Source: <https://www.rfc-editor.org/rfc/rfc6295.html>.

---

## 2. The timing problem, precisely

### MIDI clock has no timestamps

MIDI clock is 24 pulses per quarter note, sent as single bytes (`0xF8`). At
**120 BPM that is one pulse every 20.83 ms**. There is no time information in the
message — the receiver fires on *arrival*.

So a receiver cannot distinguish **"that pulse was late"** from **"the tempo
changed"**. That is not an implementation weakness; it is what the message is.

### Wi-Fi jitter is the same order of magnitude as the pulse interval

| Scenario | Typical jitter | Spikes |
|---|---:|---:|
| 5 GHz, lightly loaded | 4–20 ms | — |
| Heavy contention | 20–80 ms | 80 ms+ |
| **Power save enabled** | ~32 ms avg | **~500 ms** |
| Power save disabled | ~6 ms avg | ~30 ms |
| Wired Ethernet | ~0.1 ms | negligible |

⚠️ These ranges come from vendor documentation and community measurements, not
from peer-reviewed experiments on MIDI traffic. No controlled academic study of
RTP-MIDI or Network MIDI 2.0 latency over Wi-Fi was found. Treat them as
indicative.

**Put the two together.** The pulse interval at 120 BPM is 20.83 ms and casual
Wi-Fi jitter is 4–20 ms. The timing error is *the same size as the thing being
timed*. At 174 BPM the interval falls to 14.4 ms and the same jitter is
proportionally worse.

Three mechanisms produce it, and all three are inherent rather than incidental:

1. **CSMA/CA contention.** Every station waits a random backoff before
   transmitting. More stations, more backoff, more variance. This is the MAC
   design, not a defect.
2. **Power save.** A sleeping radio wakes on a beacon schedule. Android exposes
   `WIFI_MODE_FULL_LOW_LATENCY` specifically to disable it, documenting that the
   transceiver otherwise sleeps and cannot receive with minimum delay. A venue
   laptop on battery is doing exactly this.
3. **Retransmission.** Network MIDI 2.0's optional retransmit costs multiple round
   trips: detect the gap, request, search the buffer, resend. This is why the
   specification recommends FEC — which adds no latency — for all devices.

### What MIDI 2.0 does about it, and what it does not

UMP carries **Jitter Reduction timestamps** at 32 µs resolution, end to end. That
is a genuine improvement: a timestamped message can be scheduled at its *intended*
time rather than fired on arrival, so transport delay stops being timing error.

But **Network MIDI 2.0 v1.0 defines no time synchronisation mechanism at all.**
From the specification overview:

> *"In the first version, the Network MIDI 2.0 standard does not define any
> mechanism for time synchronization."*

JR timestamps only help if both ends already share a clock. Establishing that
shared clock is left to the implementation.

---

## 3. Why Ableton Link works over Wi-Fi when MIDI clock does not

Link is designed for exactly this network and solves the problem by **not having
it**. From Ableton's own documentation:

> *"It is not designed to orchestrate multiple instruments so that they play
> together in lock-step along a shared timeline. In fact, Link-enabled apps each
> have their own independent timelines."*

The difference is architectural:

| | MIDI clock | Ableton Link |
|---|---|---|
| What crosses the network | 24 pulses per quarter note | tempo and beat phase, on change |
| What a late packet means | a timing error you hear | nothing; state is already known |
| Timing source | the network | each device's own high-resolution clock |
| Failure mode | audible drift, flamming | brief disagreement, then re-converge |

Link shares **state, not events**. Each participant maps its own system clock onto
the shared beat timeline and computes where it should be locally; the audio
callback never waits for a packet. A 20 ms late message does not mean the tempo
wobbled, because nothing was riding on that message's arrival time.

It also compensates for output latency explicitly, so audio aligns **at the
speaker** rather than at the software buffer.

Sources: <https://github.com/Ableton/link>, <https://ableton.github.io/link/>.

---

## 4. What actually ships today

| Platform | RTP-MIDI (MIDI 1.0) | Network MIDI 2.0 |
|---|---|---|
| macOS | ✅ native in CoreMIDI | ❌ not native; app-level possible |
| iOS / iPadOS | ✅ native in CoreMIDI | ❌ not native; app-level possible |
| Windows 11 | ⚠️ third-party driver only | 🔜 announced, in development |
| Linux (6.5+) | ⚠️ third-party | ⚠️ `amidi2net` reference implementation |
| Android | ❌ none native | ❌ none native |

Notes:

- **Windows MIDI Services** ships today on Windows 11 24H2/25H2/26H1 and brings
  the MIDI 2.0 infrastructure. Network MIDI 2.0 is announced but not yet shipped.
- **Linux** has UMP in the kernel since **6.5**. Network MIDI 2.0 exists as
  `amidi2net` by Takashi Iwai — a developer reference implementation in userland,
  not a system component.
- ⚠️ Apple's Network MIDI 2.0 status was not confirmed from Apple's own developer
  documentation; it is inferred from the MIDI Association's comparison table.

**So in August 2026 there is no platform on which Network MIDI 2.0 over Wi-Fi is a
thing you can simply switch on.**

---

## 5. What this means for CrowdDeck

The concept research already concluded that the browser cannot be the MIDI path,
for a different reason: Safari has no Web MIDI. This adds a second, independent
reason to keep musical timing off the network.

**The decisions:**

1. **The tempo master is never on Wi-Fi.** `REQ-CLK-1` makes the leader deck the
   single tempo source; it publishes to MIDI Clock over a **cable** and to Ableton
   Link over the network *simultaneously*. Those are not two routes to the same
   thing — the cable carries pulses, and Link carries state.
2. **Ableton Link is the wireless sync path (`MID-5`), and MIDI Clock is not.**
   This note is why. Link is built for lossy shared networks; MIDI clock is built
   for a 31,250 baud current loop with deterministic delivery.
3. **Network MIDI 2.0 is worth adopting for control, not for clock.** Patch
   changes, mapping, Property Exchange (`MID-7`) and transport commands tolerate
   tens of milliseconds. Beats do not.
4. **If a cable is available for the clock, use it.** A USB or DIN link has
   jitter around 1 ms; Wi-Fi has 4–20 ms on a good day and 500 ms spikes on a
   laptop that has decided to save power.

`REQ-CLK-6` budgets ≤1 ms RMS clock jitter. **Wi-Fi cannot meet that budget by
one to two orders of magnitude**, which is the finding this note exists to record.
