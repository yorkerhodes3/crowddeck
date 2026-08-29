# engine-web — the browser audio engine

**Apache-2.0.** No Mixxx, no GPL, no native toolchain.

This is a real audio engine that runs in a browser tab. It exists because the
original plan (`E7`) routed all audio through a Mixxx fork needing MSVC, Qt6,
CMake and a multi-hour first build — and none of that is necessary in order to
DJ. Web Audio provides sample-accurate scheduling, per-deck gain, biquad filters
and playback-rate control, which is a mixer.

## Why it is written against CDEP

It would have been quicker to write a one-off. Writing it against the same
control contract as the stub means:

- the scheduler, policy engine, queue and providers drive it **unchanged**;
- it is the **second independent implementation** of CDEP, which is the strongest
  available evidence for `REQ-LIC-5` — that the engine really is replaceable;
- there is no Mixxx in it, so **`ADR-001`'s plane boundary does not arise**. The
  licence question that shaped the whole architecture simply does not exist on
  this path.

## Layout

| File | Role | Tested |
|---|---|---|
| `src/mixer.js` | Pure mixing maths — crossfader curves, EQ mapping, pitch, sync | Node, 26 tests |
| `src/analyse.js` | Waveform peaks, onset envelope, tempo detection, cue point | Node, 20 tests |
| `src/web-engine.js` | Binds the above to real `AudioNode`s; CDEP `get`/`set` | Real browser |

The split is deliberate. Everything that is *audible arithmetic* lives in
dependency-free modules that run under `node --test`, so the decisions that
actually matter can be checked without a sound card. The Web Audio layer is left
with nothing to do but apply numbers to nodes.

That matters because the interesting bugs in a mixer are arithmetic, not
plumbing: a crossfader that dips in the middle, an EQ that cannot truly kill, a
pitch fader with the wrong range. None of those throw. They just sound wrong, and
you find out in front of people.

## Decisions that are audible

**The crossfader is constant-power by default.** A linear fade puts both decks at
0.5 in the centre; uncorrelated signals sum by power, so the middle of the blend
sags about 3 dB — exactly when both tracks are playing. Taking the gains along a
quarter-circle keeps `a² + b² = 1` the whole way across. `LINEAR` is still offered
because it is the *correct* choice for the same track double-copied, where the
signals sum by amplitude instead.

**An EQ at zero is a kill, not a deep cut.** Killing the bass to bring in the next
kick is the most-used move in mixing; a −26 dB "kill" leaves a rumble and the two
kicks fight. The maths says −∞; the binding clamps to −60 dB because that is what
a `BiquadFilterNode` can express, and the clamp lives at the hardware boundary
rather than in the maths where it would misrepresent the intent.

**Gain changes are ramped over 12 ms.** A step change in gain is a discontinuity
in the waveform, and a discontinuity is a click — on every EQ tweak.

**There is a limiter on the master bus.** Two decks at unity sum past full scale
and the browser's output stage hard-clips, so without it a normal beatmatched
blend distorts at the moment both tracks are loudest.

**`keylock` is refused, not accepted and ignored.** Pitch-independent tempo needs
a phase vocoder, which is not implemented. Reporting keylock as on when it is not
would have someone mix a whole set believing the key was held.

## The tempo detector, and what it gets wrong

Autocorrelation **always** has a maximum, so a naive detector reports a confident
tempo for material with no beat at all. This was caught by playing a sine tone
through the real engine and watching the deck read 150 BPM with a sync button
that looked ready to use.

Worse, the correlation peak turns out to be *inversely* related to whether a beat
exists, because a drone's onset envelope is tiny numerical ripple that is itself
highly periodic:

| material | correlation peak | onset crest |
|---|---:|---:|
| 128 BPM clicks | 0.66 | 38.8 |
| 174 BPM clicks | 0.76 | 29.4 |
| pure 60 Hz tone | **1.00** | **3.2** |
| pure 440 Hz tone | **1.00** | **3.1** |
| white noise | 0.78 | 6.2 |

Gating on the correlation score would have rejected every real beat and accepted
every drone. What separates them is the **crest factor of the onset envelope** —
peak over mean — which is large only when transients stand out of a quiet
background, which is what a beat *is*. It is also scale-invariant, so a quiet
recording is not penalised. The threshold of 10 sits in the empty gap between the
two populations.

Confidence is now derived from the crest factor. The correlation peak is not a
measure of confidence, and presenting it as one would put a reassuring number next
to a wrong answer.

## What it does not do yet

- **Loops and hot cues.** The CDEP surface declares them; this engine does not
  implement them.
- **Key detection and key lock.** Both need work this does not have.
- **Recording the mix.**
- **`DJX-2`, CDEP over WebSocket.** The browser currently runs the engine and the
  UI together, so nothing crosses a socket. That story is what connects the deck
  to the Node scheduler and the jukebox half of the product.
