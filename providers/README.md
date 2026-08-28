<!-- SPDX-License-Identifier: Apache-2.0 -->

# `providers/` — where music comes from

Apache-2.0. Implements `REQ-CON-5` … `REQ-CON-7`.

Every source of audio a venue can play reaches the scheduler through one interface:
**search, resolve, stream URL, licence class**. Nothing else in the system knows or
cares where a track came from.

## The rule that shapes this directory

> **REQ-CON-7** — the system **MUST NOT** include any adapter sourcing venue playback
> from a consumer streaming account or a media downloader.

This is the single flaw that makes the existing open-source jukeboxes unusable in a
real venue. They are often well-built and legally unshippable: they play a member of
staff's personal Spotify account through a PA system. Every consumer streaming
licence forbids public performance in plain terms, and **no amount of PRO licensing
fixes it** — a venue can hold every ASCAP, BMI, SESAC and GMR licence going and still
be in breach of the *service's* terms, because those are two different permissions
from two different parties.

Designing that out is a feature of this product, not an omission from it.

### It is enforced, not just documented

`node tools/check-content-sources.mjs` runs in CI and fails the build on any import
of a consumer-streaming client or a downloader, and on any source reference to their
API hosts. Documentation may discuss these services freely — the reasoning has to be
writable down — but source may not call them.

The check exists because *"we decided not to integrate Spotify"* is exactly the kind
of decision that erodes. Someone wires up `ytdl-core` one evening because it genuinely
makes the demo better, nobody remembers the reasoning, and a load-bearing property of
the product quietly stops being true. By the time anyone notices, other things depend
on it.

## What is permitted

The rule is **not** "no streaming". It is "no consumer accounts and no downloaders".
The test is whether the source grants the venue the right to *perform the music in
public*:

| Source | Why it is fine |
|---|---|
| The venue's own local library | Performance covered by the venue's PRO licences (`VEN-3`) |
| Self-hosted **OpenSubsonic** (Navidrome and friends) | The venue's own files, served over HTTP. Separate process, so GPL-3.0 stays out of our binary |
| **Creative Commons** repertoire (Jamendo) | The licence itself grants public performance, with machine-readable metadata |
| **Record pools** | Sold to DJs with performance rights attached |
| **Licensed background-music services** — Soundtrack Your Brand, Cloud Cover, SiriusXM Business | They sell public-performance rights *with the subscription*. This is what a venue should be using |
| **Live instruments** over MIDI (`REQ-INST-*`) | Performed live in the room |

A licensed B2B streaming adapter would be a welcome addition. A consumer one is not
a smaller version of that — it is a different thing that happens to look similar.

## The interface

All adapters implement the same four operations (`REQ-CON-5`):

```js
search(query, limit)       // → track metadata
resolve(trackId)           // → full metadata including duration and licence class
streamUrl(trackId)         // → something the engine can load
licenceClass(trackId)      // → one of the seven classes in REQ-DAT-8
```

`licenceClass` is not optional and has no default. A provider that cannot say what
licence a track carries must return `unknown`, which the policy engine blocks in a
commercial venue (`REQ-DAT-10`). That is deliberate: "nobody checked" and "checked
and it's fine" must never be the same value.

## Status

| Story | State |
|---|---|
| `CON-7` — assert no consumer-streaming or downloader adapters | ✅ Done — enforced in CI |
| `CON-1` — the provider interface | ✅ Done — `Provider`, `ProviderRouter`, `LocalProvider` |
| `CON-5` — Creative Commons (Jamendo) | ✅ Done — `JamendoProvider`, `cc-licence.js` |
| `CON-4` — OpenSubsonic consumer | ⏳ |
| `CON-6` — loudness normalisation across sources | ⏳ |

## Reading a Creative Commons licence

`cc-licence.js` is separate from any one provider because deciding what a CC URL
permits is the most legally consequential parsing in the product: a permissive
mistake means a venue publicly performing a track it may not.

**The rule, in one line: if the licence contains `nc`, a commercial venue may not
perform it.** That is the whole of the commercial question. `nd` (no derivatives)
and `sa` (share-alike) constrain *derivative works*, not performance — a venue
playing a track unmodified is unaffected by either.

That distinction is worth stating because the two possible errors are not
symmetric. Treating `by-nd` as unsafe would discard a large slice of legitimately
playable catalogue for no legal reason; treating `by-nc` as safe would be a licence
breach. "Just be cautious about everything" is not a free option.

| Licence | Class | Venue may perform |
|---|---|---|
| `CC0`, Public Domain Mark | `owned_local` | Yes, no attribution needed |
| `by`, `by-nd` | `cc_attribution` | Yes, with attribution on the display |
| `by-sa`, | `cc_sharealike` | Yes, with attribution on the display |
| `by-nc`, `by-nc-sa`, `by-nc-nd` | `cc_noncommercial` | **No** |
| anything unrecognised | `unknown` | **No** |

The mapping is lossy by design, and lossy in one direction: it keeps exactly the
distinctions that change what a venue may do. If remixing or stem separation is
ever added, `nd` starts to matter and this must be revisited — which is why
`classifyCc()` returns the full parse alongside the class rather than discarding it.

## Two decisions in the router worth knowing

**A slow provider must not stall the venue.** Every provider is searched
concurrently under a per-provider timeout, and whatever arrives in time is
returned. `REQ-NFR-3` says the appliance must be fully functional with no WAN
connectivity — a router that awaited each provider in turn would hand that
guarantee straight back, because one unreachable remote service would hang search
and take the local library down with it. That is precisely the cloud-jukebox
failure mode this product exists to avoid.

**Failures are reported, never swallowed.** The tempting implementation drops the
rejections and returns fewer results, which gives a venue whose catalogue silently
shrinks and staff who conclude the jukebox is broken. `search()` returns
`{ tracks, errors, degraded }` so the console can say *"Jamendo is unreachable,
showing 3 of 4 sources"*. A partial answer labelled as partial is useful; a partial
answer presented as complete is a lie the software is telling.

Results are grouped by provider priority rather than interleaved by relevance.
Cross-source relevance ranking needs score normalisation nobody has built, and a
plausible-looking merge would be quietly arbitrary — priority order is at least
honest about what it is.
