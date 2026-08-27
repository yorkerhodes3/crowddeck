# `api/` and `clients/` — the venue surface

**Licence: Apache-2.0** · Specification: [`SPECIFICATION.md`](../SPECIFICATION.md) §5

The **only** way anything talks to CrowdDeck (REQ-API-1). The patron page, the venue display and any
third-party client all use this same surface — there is no privileged back door. That is what makes
third-party clients viable, which is how an open project out-features a closed one (G3).

## Running it

```bash
npm start
# or: node api/bin/crowddeck-server.js --port 8080
```

This starts the whole appliance in one process: a CDEP engine, the fusion core, the venue API and the
clients. **Nothing is audible** — the engine is the stub, so deck state is real but silent. Audio arrives
with the Mixxx-derived engine (epic E7); nothing in this directory changes when it does.

## Design points

**Venue-namespaced from day one.** Every route is `/v1/venues/:venueId/...` (REQ-API-2), so client URLs
survive the eventual move to a federation of appliances (ADR-004) without a breaking change. The runtime
still binds to exactly one venue, and a token issued for one venue is rejected by another.

**Sessions carry no personal data.** A patron joins and gets an opaque token — no email, no phone, no
account (REQ-NFR-7). There is nothing to leak, which is the cheapest way to honour "all data stays in the
venue" (G6). The patron id is *derived* from the token rather than being the token, so it can appear in
logs and vote records without exposing a credential.

**Staff credentials are separate** from patron sessions (REQ-NFR-8), and every staff action is logged.

**Search and requests share one filter.** `filterSearch` and the request path both call the same policy
screen (REQ-POL-2, C6). Filtering only at request time is a defect: offering a patron a track and then
refusing it is worse than never showing it.

## The WebSocket

`src/ws.js` is a hand-written RFC 6455 implementation, because the repository is deliberately
zero-dependency and what is needed is small: server→client text frames for queue and position updates
(REQ-SCH-12), plus correct close and ping handling.

Implemented: text/binary frames, fragmentation, ping/pong/close, masked client frames.
Not implemented: permessage-deflate, extensions, subprotocol negotiation. If this ever needs to carry heavy
traffic, replace it with `ws`.

> A bug worth remembering: the connection class originally assumed it was always server-side and rejected
> unmasked frames. Server→client frames are never masked, so it could not be used to *drive* a client —
> which the test suite needs. It now takes a `role`.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/v1/health` | — | Liveness |
| `GET` | `/v1/venues/:v` | — | Venue name, mode, now playing |
| `POST` | `/v1/venues/:v/join` | — | Get a patron token |
| `GET` | `/v1/venues/:v/search?q=` | — | **Policy-scoped** results |
| `GET` | `/v1/venues/:v/queue` | — | Public queue with positions |
| `POST` | `/v1/venues/:v/queue` | patron | Request a track |
| `POST` | `/v1/venues/:v/queue/:id/votes` | patron | Vote once |
| `POST` | `/v1/venues/:v/queue/:id/boost` | patron | Spend credits for priority |
| `GET` | `/v1/venues/:v/me` | patron | Your session and requests |
| `WS` | `/v1/venues/:v/events` | optional | Live queue, position and now-playing |
| `GET` | `/v1/venues/:v/staging` | staff | The staging lane |
| `POST` | `/v1/venues/:v/staging/:id/promote` | staff | Put it on a deck |
| `POST` | `/v1/venues/:v/staging/:id/reject` | staff | Veto |
| `POST` | `/v1/venues/:v/queue/:id/pin` · `/skip` | staff | Override the crowd |
| `POST` | `/v1/venues/:v/mode` | staff | autonomous ⇄ attended |
| `POST` | `/v1/venues/:v/panic` | staff | Stop within 500 ms |
| `GET` | `/v1/venues/:v/play-log.csv` | staff | PRO reporting export |

A refused request returns **409** with a machine-readable `error` and a human `message`, so the client can
explain *which* rule was hit. A patron who understands the rule accepts it; one who hits an unexplained
wall assumes the system is broken.

## Clients

`clients/patron/` — search, request, vote, and a prominent **position in line**, which the research
identified as TouchTunes' single most-cited feature and the thing that makes waiting tolerable. Reconnects
automatically, because an offline-first venue box (G1) may restart underneath it.

`clients/display/` — now playing, up next, and a join prompt for the room.

> **No QR code yet.** A hand-rolled QR encoder was written, verified against a real decoder, found not to
> scan, and removed. A QR that fails in a venue is worse than none, since joining is the display's entire
> purpose. Tracked as `DISP-1`; it needs a vetted encoder rather than a bespoke one. Until then the join
> affordance is a plain URL, which always works.
