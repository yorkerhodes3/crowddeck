<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 CrowdDeck contributors -->

# Sources, and how to add one

Everything CrowdDeck can play comes through the adapter contract in
[`providers/src/provider.js`](../../../providers/src/provider.js) — the same one
the venue-side adapters use, defined by `REQ-CON-5`. There is not a browser
contract and a server contract; there is one, and `BrowserProvider` extends it.

## What ships, and what each needs

| provider | catalogue | key | CORS | licence basis | setup |
|---|---|---|---|---|---|
| `archive` | Internet Archive netlabels — openly-licensed music | none | search + audio | per-item CC URL | none |
| `openverse` | Jamendo, Freesound, ccMixter, Wikimedia via Openverse | none | search + audio | per-item CC URL | none |
| `librivox` | LibriVox public-domain speech, via the Archive mirror | none | search + audio | collection policy | none |

**All three work with no account, no key and no server.** That is not a
coincidence; it is the selection criterion. A source that needs a credential
cannot ship in a static page without either a backend or publishing the
credential.

## Sources that were evaluated and rejected

Recorded because the question comes round again, and because "we looked and
decided not to" is worth more than silence.

| source | why not |
|---|---|
| **YouTube** | Its terms forbid the use case by name — *"you may not publicly screen videos or stream music from the Service"*. Separately, it cannot work: `fetch` of a watch page is CORS-blocked, the official embed's `contentDocument` is `null`, and `createMediaElementSource` throws on an iframe, so Web Audio can never see the samples. |
| **Spotify / Apple Music / TIDAL / Beatport LINK / Beatsource / SoundCloud Go+** | These are what commercial DJ applications use, and every one is a *negotiated commercial agreement*, not an open API. DJ use involves mixing, which triggers different licensing than passive streaming. |
| **Great 78 Project** (187,031 digitised 78s on the Archive) | Universal and Sony sued the Internet Archive over it in 2023. It settled confidentially in September 2025 and contested works were removed. A catalogue whose copyright status was litigated and resolved on undisclosed terms does not belong in front of a venue — and its items carry no licence URL, so every one would classify as `unknown` anyway. |
| **Old-time radio** (Archive) | Sampled, overwhelmingly `by-nc`. The policy engine blocks non-commercial material in a venue, so the filter would drop nearly everything and the source would look broken. |
| **Free Music Archive** | Its API was shut down and hotlinking is not permitted. |
| **ccMixter, Freesound (direct)** | No CORS. Reachable only through Openverse, which aggregates both. |
| **Jamendo (direct)** | Needs a client ID. Reachable without one through Openverse. Supported directly venue-side in [`providers/src/jamendo.js`](../../../providers/src/jamendo.js), where a server can hold the credential. |

### The one commercial catalogue worth investigating

**Apple MusicKit JS** is a genuinely public browser SDK, and the developer pays
nothing for streaming rights — each listener's own subscription covers them. It
needs an Apple Developer Program membership for a developer token.

The likely blocker is the same wall YouTube hit: playback goes through Apple's
DRM-protected player, and DRM-protected media almost certainly cannot be routed
into Web Audio, which means no crossfader, EQ, key lock or recording. **That has
not been tested here** — it needs a paid developer account — so it is recorded
as an open question rather than as a conclusion.

## Does Openverse need an API key?

**No, and one could not be used from a browser anyway.**

A registered application raises the limits considerably:

| | anonymous | registered |
|---|---|---|
| burst | 20/min | 100/min |
| sustained | 200/day | 10,000/day |
| `page_size` cap | 20 | 50 |

Those figures are from Openverse's own source
(`api/api/constants/restricted_features.py` and `conf/settings/rest_framework.py`),
not from its documentation — documentation elsewhere claims a page cap of 500,
which is wrong.

**But the token cannot be obtained in a page.** Registration issues a
*confidential* client, and `POST /v1/auth_tokens/token/` requires the
`client_secret` in the request body. There is no PKCE flow and no public-client
variant, so a browser-side exchange would publish the secret to anyone who opens
dev tools.

`OpenverseLibrary` therefore *accepts* a token and never fetches one. A
deployment that already runs a server can mint one there and pass it in;
the static demo stays anonymous, which is genuinely adequate — 200 searches a
day is far more than an evening needs.

### If you do want a key, the steps are

1. `POST https://api.openverse.org/v1/auth_tokens/register/` with JSON
   `{ "name": "...", "description": "...", "email": "..." }`. `name` must be
   unique across all Openverse applications. Throttled to 10 per day.
2. Response carries `client_id` and `client_secret`.
3. **Click the verification link emailed to you.** Until verified, the
   application is still subject to *anonymous* limits — registering alone
   changes nothing.
4. `POST https://api.openverse.org/v1/auth_tokens/token/` as
   `application/x-www-form-urlencoded` with
   `grant_type=client_credentials&client_id=...&client_secret=...`.
5. Pass the resulting bearer token to `new OpenverseLibrary({ apiToken })` —
   **from a server**, never from page source.

## Adding a source

1. **Subclass `BrowserProvider`** in [`sources.js`](./sources.js). Implement
   `search`, `streamUrl` and `licenceClass`; add `art` and `detectTempo` if the
   source can supply them.
2. **Declare a `licenceBasis`.** `PER_ITEM` when every result carries its own
   machine-readable licence, `COLLECTION_POLICY` when the catalogue's published
   policy establishes it. The latter *requires* `licenceEvidence` — a URL —
   and the constructor throws without one. A policy claim with no source is an
   assumption wearing a suit.
3. **Register it** in [`registry.js`](./registry.js) with a priority.
4. That is all. The deck reads the registry; nothing in the page changes.

### What a provider must never do

- **Never default a licence class.** `validateTrack` throws on a missing one.
  "Nobody checked" and "checked, it is fine" must not be the same value.
- **Never swallow a failure into an empty result.** An unreachable source and a
  source with no matches look identical to a user and mean opposite things.
- **Never fetch audio directly.** Use `fetchAudio`, so the session cache is
  shared and two providers serving the same file download it once.

## The session cache

Holds **encoded** bytes, not decoded `AudioBuffer`s, LRU, bounded in bytes.

That is not the obvious choice, and it was measured rather than guessed:

| track | encoded | decoded | ratio | fetch | decode |
|---|---:|---:|---:|---:|---:|
| 165 s | 6.3 MB | 55.5 MB | 8.8x | 3745 ms | 1207 ms |
| 209 s | 2.2 MB | 70.5 MB | 31.4x | 1323 ms | 2361 ms |
| 33 s | 0.3 MB | 11.2 MB | 43.9x | 978 ms | 532 ms |

Three tracks cost 137 MB decoded and 8.8 MB encoded. Fetching is also the slow,
variable part, and the part that costs someone else bandwidth — so trading a
second of local CPU to avoid a repeat download is the right way round.

**`decodeAudioData` detaches the buffer it is given**, so the cache hands out
copies. Returning the stored instance leaves a zero-length husk behind and the
*second* play of a track is silence, with nothing thrown anywhere.

## Attribution is a licence condition

CC BY and CC BY-SA require credit as a condition of use, so credits are shown on
screen while a track plays and accumulate into a pasteable session list
([`credits.js`](../credits.js)). Public domain carries no such obligation and is
labelled rather than credited — inventing a credit misrepresents a licence just
as much as omitting a real one.
