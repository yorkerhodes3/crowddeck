# `core/` — the fusion core

**Licence: Apache-2.0** · Specification: [`SPECIFICATION.md`](../SPECIFICATION.md) §3

The Unified Scheduler and the adapter that binds it to a CDEP engine. **This is the novelty.** No product
surveyed — djay Pro AI, Serato, rekordbox, Traktor, VirtualDJ, Mixxx, TouchTunes, AMI, Rockbot, Festify —
spans both halves of the problem. DJ software gives the audience no voice; jukebox platforms give the
music no craft. Domain C is the only part of the capability set with no prior art anywhere.

## One queue, two consumers

Requests land in a **staging lane**. In `attended` mode a DJ promotes from it; in `autonomous` mode the
mixer drains it automatically. Same queue, same fairness rules, same policy — only the consumer differs.

```
                    ┌──────────► rejected
                    │
requested ──► screened ──► staged ──► cued ──► playing ──► played
                    │          │        │
                    │          │        └────► skipped
                    └──────────┴─────────────► expired
```

**A crowd request can only become audible by passing through `cued`, and only a DJ or the autonomous mixer
may put it there.** Patrons have no legal transition into `cued` at all — the state machine enforces it by
actor, so a new code path cannot forget to check. That single constraint is what lets a jukebox and a DJ
rig share one set of speakers.

## Files

| File | Role |
|---|---|
| `priority.js` | The ordering function. Votes and boosts are **two inputs to one score** (ADR-003), plus an anti-starvation aging term. |
| `fairness.js` | Per-patron limits, artist/track cooldown, rate limiting, one-vote-per-entry. |
| `policy.js` | Explicit filter, allow/block lists, dayparting, and the licence-class gate. |
| `queue.js` | The lifecycle state machine, with a per-entry audit log. |
| `scheduler.js` | Orchestration: requests, votes, promotion, modes, fallback. |
| `engine-adapter.js` | Translates scheduler intents into CDEP calls, and engine events back into state. |

## Two design notes worth keeping

**The scheduler emits intents, not audio calls.** It knows nothing about CDEP, decks or sockets — it emits
`cue` and `preload`, and `engine-adapter.js` translates. That keeps the interesting logic pure and testable
with a fake clock, and keeps the Apache-2.0 core from ever linking against the GPL engine (ADR-001).

**The clock is injectable.** Every score depends on wall time only through an explicit `nowMs`
(REQ-SCH-10), so ordering is reproducible and the whole suite runs in milliseconds.

## What aging actually guarantees

"Aging prevents starvation" is imprecise, and the precision matters. Aging applies to every entry equally,
so it cannot separate two entries that arrived together. What it guarantees is that a **waiting** entry
eventually outranks **fresh arrivals** — which is the real starvation case: an old request being buried
forever under a stream of newer, more popular ones.

With default weights, a zero-vote entry overtakes a fresh 3-vote request after 50 minutes. `agingWeight`
may not be configured to zero, because that would silently reintroduce the failure it exists to prevent.

## Testing

```bash
node --test "core/test/**/*.test.js"
```

`integration.test.js` is the walking skeleton: a patron request goes through policy, fairness and the
priority queue, into the staging lane, across the CDEP socket, and onto a real (if silent) engine deck.
Everything else is unit-tested against a fake clock; the integration tests exercise the plane boundary.

### Bugs these tests caught

Worth recording, because they were all real and none were obvious from reading the code:

- **`promote()` re-triggered a load** for a track the engine had already continued into via its gapless
  follower, restarting it. Led to adding a distinct `queue` message to CDEP: `load` replaces what is on the
  deck now, `queue` sets the follower without disturbing playback. They are genuinely different operations.
- **`track_ended` and `deck_empty` both drove selection**, double-promoting. `track_ended` now only does
  accounting; `deck_empty` chooses what plays next.
- **The scheduler stranded its own follower.** `onDeckEmpty` excluded the preloaded entry from selection,
  so a follower the adapter had never actually handed to the engine could never play.
- **`onPreload` raced ahead of `onCue`**, seeing a null `loaded` and skipping the follower. The deck is now
  claimed before awaiting.
