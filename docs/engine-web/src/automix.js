// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Automix — DJX-24.
 *
 * The feature that lets a deck run itself: when the playing track nears its end,
 * cue the other deck, match its tempo, and crossfade. Asked for directly, and
 * the reason is practical rather than lazy — a DJ needs to leave the booth, and
 * a venue needs music at 11am when nobody is standing there.
 *
 * ## It is a decision function, not a timer
 *
 * The whole of automix's judgement lives in `nextAction`, a pure function of
 * observed state. Nothing in it touches Web Audio, so every rule can be tested
 * at a hundred points across a transition without an audio device — and the
 * rules are where the mistakes are. A timer-based implementation would be a
 * pile of `setTimeout`s whose interactions could only be found by listening.
 *
 * ## The rules, and why each exists
 *
 * **Transitions start a fixed time before the end, not at a fixed fraction.**
 * A fraction gives a 30-second outro on a nine-minute mix and a two-second one
 * on a jingle. The interesting quantity is seconds of overlap.
 *
 * **The incoming deck is beat-matched before it is heard, never during.**
 * Changing tempo while a track is audible is a pitch slide — obvious, and not
 * what a crossfade should sound like. So `sync` happens at cue time, while the
 * fader is still fully on the outgoing deck.
 *
 * **A track with no detected tempo still mixes.** It just gets a plain fade
 * rather than a beatmatched one. Refusing to transition because the analyser
 * could not find a beat would strand the deck on a spoken-word intro forever.
 *
 * **Manual input always wins.** If the fader moves while automix is
 * transitioning, automix stops touching it for the rest of that transition. An
 * automatic system that fights the hand on the control is worse than no
 * automatic system: the DJ cannot tell whether the deck is broken or possessed.
 */

/** Seconds of overlap. Long enough to be a mix, short enough not to be a medley. */
export const DEFAULT_CROSSFADE_SECONDS = 12;

/**
 * How far ahead of the crossfade the next deck is prepared.
 *
 * Loading and analysing a track takes seconds — measured at 1–4 for an Archive
 * download. Preparing only at the moment the fade should begin would mean the
 * fade begins late, every time, by however long the network took.
 */
export const DEFAULT_PREPARE_SECONDS = 25;

/** Below this the fader is treated as fully committed to one side. */
const FADER_EPSILON = 0.02;

export const AutomixAction = Object.freeze({
  NONE: "none",
  PREPARE: "prepare",
  START_NEXT: "start_next",
  CROSSFADE: "crossfade",
  FINISH: "finish"
});

/**
 * Decide what automix should do right now.
 *
 * @param {object} state
 * @param {boolean} state.enabled
 * @param {"a"|"b"} state.playingSide The deck currently carrying the set.
 * @param {number} state.position Playhead on the playing deck, seconds.
 * @param {number} state.duration Length of the playing track, seconds.
 * @param {boolean} state.otherLoaded Is a track ready on the other deck?
 * @param {boolean} state.otherPlaying
 * @param {number} state.crossfader −1 (full A) … +1 (full B).
 * @param {boolean} [state.manualOverride] The DJ has touched the fader.
 * @param {boolean} [state.prepared] The other deck has already been cued and synced.
 * @param {object} [opts]
 * @param {number} [opts.crossfadeSeconds]
 * @param {number} [opts.prepareSeconds]
 * @returns {{action: string, progress: number, target: number|null, reason: string}}
 */
export function nextAction(state, opts = {}) {
  const fade = opts.crossfadeSeconds ?? DEFAULT_CROSSFADE_SECONDS;
  const prepare = Math.max(opts.prepareSeconds ?? DEFAULT_PREPARE_SECONDS, fade);
  const idle = (reason) => ({ action: AutomixAction.NONE, progress: 0, target: null, reason });

  if (!state?.enabled) return idle("automix is off");
  if (state.manualOverride) {
    // Deliberate and total: for the rest of this transition automix is a
    // spectator. Anything else is a control fighting the hand that is on it.
    return idle("a manual fader move has taken over this transition");
  }
  if (!Number.isFinite(state.duration) || state.duration <= 0) return idle("nothing playing");
  if (!Number.isFinite(state.position)) return idle("no playhead");

  const remaining = state.duration - state.position;
  if (remaining <= 0) return idle("track has ended");

  if (!state.otherLoaded) {
    // Said rather than silently doing nothing: a DJ who armed automix and walked
    // away deserves to know it will not fire.
    return remaining <= prepare
      ? idle("no track on the other deck — load one to hand over to")
      : idle("waiting");
  }

  // Where the fader should end up: fully on the deck taking over.
  const target = state.playingSide === "a" ? 1 : -1;

  if (remaining > prepare) return idle("waiting");

  if (remaining > fade) {
    return state.prepared
      ? idle("ready — waiting for the crossfade point")
      : { action: AutomixAction.PREPARE, progress: 0, target, reason: "cue and beat-match the next track" };
  }

  if (!state.otherPlaying) {
    return {
      action: AutomixAction.START_NEXT,
      progress: 0,
      target,
      reason: "start the incoming deck as the crossfade begins"
    };
  }

  // Linear in time. The *fader curve* is constant-power — that lives in
  // `mixer.js` and is already tested — so easing here as well would compound two
  // curves and dip in the middle.
  const progress = Math.min(1, Math.max(0, (fade - remaining) / fade));

  if (Math.abs(state.crossfader - target) < FADER_EPSILON) {
    return { action: AutomixAction.FINISH, progress: 1, target, reason: "handover complete" };
  }

  return {
    action: AutomixAction.CROSSFADE,
    progress,
    target,
    reason: `crossfading, ${remaining.toFixed(1)}s left`
  };
}

/**
 * Fader position part-way through a transition.
 *
 * @param {"a"|"b"} fromSide
 * @param {number} progress 0..1
 * @returns {number} −1 … +1
 */
export function faderAt(fromSide, progress) {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  // A→B runs −1 → +1; B→A runs +1 → −1.
  return fromSide === "a" ? -1 + 2 * p : 1 - 2 * p;
}

/**
 * Has the DJ moved the fader themselves?
 *
 * Compares where the fader is against where automix last put it. A tolerance is
 * needed because the UI rounds and the audio graph ramps; too tight and every
 * transition reports a phantom override, too loose and a real nudge is ignored.
 * 0.05 of full travel is about 2.5% of the crossfader — smaller than anyone
 * moves a control on purpose, larger than any rounding here.
 *
 * @param {number} observed
 * @param {number|null} expected Where automix last set it, or null if it has not.
 * @returns {boolean}
 */
export function detectManualMove(observed, expected, tolerance = 0.05) {
  if (expected === null || expected === undefined) return false;
  if (!Number.isFinite(observed)) return false;
  return Math.abs(observed - expected) > tolerance;
}

/**
 * Pick what to play next.
 *
 * Prefers a tempo the outgoing track can actually be mixed into — the same
 * ±8% pitch-fader reachability `syncRate` enforces, via `tempoMatch`. Falls back
 * to the first playable candidate rather than stopping, because an automix that
 * halts when nothing matches has failed at its one job.
 *
 * @param {object[]} candidates Rows with `bpm` (may be null).
 * @param {number|null} currentBpm
 * @param {(a: number|null, b: number|null) => {mixable: boolean, percent: number|null}} tempoMatch
 * @param {Set<string>} [played] Ids already used this session.
 * @returns {object|null}
 */
export function chooseNext(candidates, currentBpm, tempoMatch, played = new Set()) {
  const fresh = (candidates ?? []).filter((c) => c && !played.has(c.id));
  if (!fresh.length) return null;

  const mixable = fresh
    .map((c) => ({ c, m: tempoMatch(currentBpm, c.bpm) }))
    .filter((x) => x.m.mixable)
    .sort((a, b) => Math.abs(a.m.percent) - Math.abs(b.m.percent));

  // The easiest mix, or — if nothing is reachable — simply the next record.
  // Silence is the one outcome automix must never produce.
  return mixable.length ? mixable[0].c : fresh[0];
}
