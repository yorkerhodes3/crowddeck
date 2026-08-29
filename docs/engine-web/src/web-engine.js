// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The Web Audio engine — DJX-1.
 *
 * A real audio engine that runs in a browser tab and exposes the **same CDEP
 * control surface** as the stub and the eventual Mixxx fork. It exists because
 * the original plan routed all audio through a native engine needing MSVC, Qt6
 * and CMake, and none of that is necessary to DJ: Web Audio provides
 * sample-accurate scheduling, per-deck gain, biquad filters and playback-rate
 * control, which is a mixer.
 *
 * Writing it against CDEP rather than as a one-off is the point. It makes this
 * the second independent implementation of the contract, which is the strongest
 * available evidence for REQ-LIC-5 — that the engine really is replaceable — and
 * it means the scheduler, policy engine and queue built over the last weeks drive
 * it unchanged.
 *
 * It also removes the licence question for this path entirely: there is no Mixxx
 * here, so there is no GPL, so ADR-001's plane boundary does not even arise.
 *
 * ## The signal path, and why it is in this order
 *
 *   source → pregain → EQ(low,mid,high) → volume → crossfader → master → out
 *
 * `pregain` is first because it is the loudness-normalisation trim (CON-6): it
 * corrects the *file*, so everything downstream sees a level-matched signal and
 * the DJ's own moves mean the same thing on every track. `volume` is the channel
 * fader the DJ holds, and the crossfader is after it because that is the physical
 * order on every mixer ever built — the crossfader must be able to silence a
 * channel whose fader is up.
 */

import {
  CrossfaderCurve,
  DEFAULT_RATE_RANGE,
  clamp,
  crossfaderGains,
  dbToGain,
  eqKnobToDb,
  rateToPlaybackRate,
  syncRate
} from "./mixer.js";
import { HotCues, beatLoop, loopPosition, makeLoop, quantiseToBeat, scaleLoop, shiftLoop } from "./cues.js";
import { KEYLOCK_PROCESSOR, keylockLatencySamples, loadKeylockWorklet } from "./keylock-node.js";
import { keylockRatio } from "./keylock.js";

/**
 * The floor used where the maths says "kill".
 *
 * `eqKnobToDb(0)` is −Infinity, which is correct arithmetic and not a value a
 * `BiquadFilterNode` can take. −60 dB is one part in a thousand of amplitude:
 * under any programme material at all it is inaudible, and it is deeper than the
 * −26 dB most hardware mixers actually achieve on a "kill". The clamp lives here,
 * at the boundary with the hardware, rather than in the maths where it would be a
 * lie about what was intended.
 */
const KILL_FLOOR_DB = -60;

/** Crossover points for a three-band DJ EQ. */
const LOW_SHELF_HZ = 200;
const MID_PEAK_HZ = 1000;
const HIGH_SHELF_HZ = 4000;

/** Ramp applied to every gain change, so nothing clicks. */
const RAMP_SECONDS = 0.012;

export class WebDeck {
  /**
   * @param {AudioContext} ctx
   * @param {AudioNode} destination
   * @param {string} group CDEP group name, e.g. "[Channel1]"
   */
  constructor(ctx, destination, group) {
    this.ctx = ctx;
    this.group = group;

    this.buffer = null;
    this.source = null;
    this.trackId = null;
    this.bpm = null;

    this.playing = false;
    /** Where in the track we are, in seconds, when not playing. */
    this.offset = 0;
    /** ctx.currentTime at which the current source started. */
    this.startedAt = 0;
    this.cuePoint = 0;

    /** @type {{start: number, end: number, enabled: boolean}|null} */
    this.loop = null;
    this.cues = new HotCues();
    /** Pending loop-in, set but not yet closed by a loop-out. */
    this.loopIn = null;

    this.controls = {
      volume: 1,
      pregain: 1,
      rate: 0,
      rateDir: 1,
      eqLow: 1,
      eqMid: 1,
      eqHigh: 1,
      syncEnabled: 0,
      keylock: 0
    };

    this.pregainNode = ctx.createGain();
    /**
     * The keylock insert, once a worklet is available.
     *
     * Always in the chain when it exists, engaged or not — see `keylock.js` for
     * why the delay is paid unconditionally.
     * @type {AudioWorkletNode|null}
     */
    this.keylockNode = null;
    this.low = ctx.createBiquadFilter();
    this.mid = ctx.createBiquadFilter();
    this.high = ctx.createBiquadFilter();
    this.volumeNode = ctx.createGain();
    this.faderNode = ctx.createGain();

    this.low.type = "lowshelf";
    this.low.frequency.value = LOW_SHELF_HZ;
    this.mid.type = "peaking";
    this.mid.frequency.value = MID_PEAK_HZ;
    this.mid.Q.value = 0.9;
    this.high.type = "highshelf";
    this.high.frequency.value = HIGH_SHELF_HZ;

    this.pregainNode
      .connect(this.low)
      .connect(this.mid)
      .connect(this.high)
      .connect(this.volumeNode)
      .connect(this.faderNode)
      .connect(destination);

    /** Fired for track_loaded / playposition consumers. */
    this.onEvent = null;
  }

  /**
   * Splice the keylock insert in ahead of the EQ.
   *
   * Done once, before anything plays, because inserting it later would add its
   * delay to a deck that is already running and shift it against the other one.
   *
   * @param {AudioWorkletNode} node
   */
  attachKeylock(node) {
    if (this.keylockNode) return;
    this.keylockNode = node;
    this.pregainNode.disconnect();
    this.pregainNode.connect(node).connect(this.low);
    this.#pushKeylockRatio();
  }

  /** Tell the worklet what to do, if there is one. */
  #pushKeylockRatio() {
    if (!this.keylockNode) return;
    const ratio = this.controls.keylock ? keylockRatio(this.playbackRate) : 1;
    this.keylockNode.port.postMessage({ ratio });
  }

  get duration() {
    return this.buffer ? this.buffer.duration : 0;
  }

  get playbackRate() {
    return rateToPlaybackRate(this.controls.rate, DEFAULT_RATE_RANGE, this.controls.rateDir);
  }

  /** Current playhead in seconds. */
  get position() {
    if (!this.buffer) return 0;
    if (!this.playing) return this.offset;
    const elapsed = (this.ctx.currentTime - this.startedAt) * this.playbackRate;
    const raw = this.offset + elapsed;
    // Web Audio wraps the audio inside an active loop but the elapsed clock keeps
    // rising, so the raw figure must be folded back or the displayed playhead
    // sails off the end while the sound is still looping.
    if (this.loop && this.loop.enabled) return loopPosition(raw, this.loop);
    return Math.min(this.buffer.duration, raw);
  }

  /**
   * @param {AudioBuffer} buffer
   * @param {{id?: string, bpm?: number|null, cuePoint?: number}} meta
   */
  load(buffer, meta = {}) {
    this.stop();
    this.buffer = buffer;
    this.trackId = meta.id ?? null;
    this.bpm = Number.isFinite(meta.bpm) ? meta.bpm : null;
    this.cuePoint = meta.cuePoint ?? 0;
    // Loops and cues belong to the previous track, not to the deck.
    this.loop = null;
    this.loopIn = null;
    this.cues = meta.cues instanceof HotCues ? meta.cues : new HotCues();
    // Land on the first audible moment, not on the file's first sample. Two
    // seconds of digital silence at the head of a file means the mix starts late.
    this.offset = this.cuePoint;
    this.#emit("track_loaded", { track: this.trackId, duration: buffer.duration });
  }

  play() {
    if (!this.buffer || this.playing) return;

    // A source node is single-use: it cannot be restarted once stopped, so every
    // play builds a new one. This is Web Audio's design, not a workaround.
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.playbackRate.value = this.playbackRate;
    src.connect(this.pregainNode);
    this.#applyLoopTo(src);
    src.onended = () => {
      // `stop()` also fires onended, so only report a genuine end-of-track.
      if (this.source === src && this.playing) {
        this.playing = false;
        this.offset = this.buffer.duration;
        this.#emit("track_ended", { track: this.trackId });
      }
    };
    src.start(0, Math.min(this.offset, this.buffer.duration));

    this.source = src;
    this.startedAt = this.ctx.currentTime;
    this.playing = true;
    this.#emit("play", { track: this.trackId });
  }

  pause() {
    if (!this.playing) return;
    // Read the position *before* tearing the source down, or the playhead jumps
    // back to wherever the last start was.
    const pos = this.position;
    this.stop();
    this.offset = pos;
  }

  stop() {
    if (this.source) {
      this.source.onended = null;
      try {
        this.source.stop();
      } catch {
        // Already stopped; Web Audio throws rather than ignoring it.
      }
      this.source.disconnect();
      this.source = null;
    }
    this.playing = false;
  }

  /** @param {number} seconds */
  seek(seconds) {
    const target = clamp(seconds, 0, this.duration);
    if (this.playing) {
      this.stop();
      this.offset = target;
      this.play();
    } else {
      this.offset = target;
    }
  }

  /**
   * Cue, in the sense every DJ expects: return to the cue point and stop.
   *
   * Setting the cue point is a separate action. Conflating them is how you lose
   * a cue point mid-set by tapping the wrong control.
   */
  cue() {
    this.seek(this.cuePoint);
    if (this.playing) this.pause();
  }

  setCuePoint(seconds = null) {
    this.cuePoint = clamp(seconds ?? this.position, 0, this.duration);
    return this.cuePoint;
  }

  /* ------------------------------------------------------ loops — DJX-8 */

  /**
   * Push the current loop onto a live source node.
   *
   * Web Audio loops natively, so this is genuinely just three assignments — but
   * they must be reapplied to every new source, because `play()` builds a fresh
   * node each time and a new node defaults to not looping.
   */
  #applyLoopTo(src) {
    if (!src) return;
    if (this.loop && this.loop.enabled && this.loop.end > this.loop.start) {
      src.loopStart = this.loop.start;
      src.loopEnd = this.loop.end;
      src.loop = true;
    } else {
      src.loop = false;
    }
  }

  /** Mark the start of a loop. Quantised to the beat when a tempo is known. */
  markLoopIn(seconds = null) {
    this.loopIn = quantiseToBeat(seconds ?? this.position, this.bpm, this.cuePoint);
    return this.loopIn;
  }

  /**
   * Close the loop and enable it.
   *
   * Returns null and changes nothing if the region is unusable — an inverted or
   * vanishing loop silences the deck in Web Audio with no error at all.
   */
  markLoopOut(seconds = null) {
    if (this.loopIn === null) return null;
    const out = quantiseToBeat(seconds ?? this.position, this.bpm, this.cuePoint);
    const loop = makeLoop(this.loopIn, out, this.duration);
    if (!loop) return null;
    this.loop = loop;
    this.loopIn = null;
    this.#applyLoopTo(this.source);
    return this.loop;
  }

  /** Loop `beats` beats from where the playhead is now. */
  setBeatLoop(beats) {
    const from = quantiseToBeat(this.position, this.bpm, this.cuePoint);
    const loop = beatLoop(from, this.bpm, beats, this.duration);
    if (!loop) return null;
    this.loop = loop;
    this.#applyLoopTo(this.source);
    return this.loop;
  }

  /** @param {number} factor 0.5 to halve, 2 to double */
  scaleLoop(factor) {
    const next = scaleLoop(this.loop, factor, this.duration);
    if (!next) return null;
    this.loop = next;
    this.#applyLoopTo(this.source);
    return this.loop;
  }

  /** @param {number} direction */
  shiftLoop(direction) {
    const next = shiftLoop(this.loop, direction, this.duration);
    if (!next) return null;
    this.loop = next;
    this.#applyLoopTo(this.source);
    return this.loop;
  }

  /**
   * Turn an existing loop on or off without forgetting it.
   *
   * Exiting a loop must keep the region, because "loop out, let it run, loop back
   * in" is a normal move and re-marking the points by hand mid-mix is not
   * realistic.
   */
  enableLoop(on) {
    if (!this.loop) return false;
    this.loop = { ...this.loop, enabled: Boolean(on) };
    this.#applyLoopTo(this.source);
    return true;
  }

  clearLoop() {
    this.loop = null;
    this.loopIn = null;
    this.#applyLoopTo(this.source);
  }

  /* --------------------------------------------------- hot cues — DJX-8 */

  /** @param {number} n @param {number} [seconds] */
  setHotcue(n, seconds = null) {
    return this.cues.set(n, seconds ?? this.position);
  }

  /**
   * Jump to a hot cue.
   *
   * Playing decks keep playing and stopped decks stay stopped: a jump changes
   * *where* you are, never *whether* you are running. A cue that started playback
   * would make a deck audible at a moment the DJ was only auditioning.
   */
  jumpHotcue(n) {
    const at = this.cues.get(n);
    if (at === null) return false;
    this.seek(at);
    return true;
  }

  clearHotcue(n) {
    return this.cues.clear(n);
  }

  /**
   * Apply control values to the graph.
   *
   * @param {number} faderGain the crossfader's contribution for this deck
   */
  apply(faderGain) {
    const t = this.ctx.currentTime;
    const c = this.controls;

    // Ramps rather than assignments. A step change in gain is a discontinuity in
    // the waveform, and a discontinuity is a click — audible on every EQ tweak.
    ramp(this.pregainNode.gain, clamp(c.pregain, 0, 4), t);
    ramp(this.volumeNode.gain, clamp(c.volume, 0, 1), t);
    ramp(this.faderNode.gain, clamp(faderGain, 0, 1), t);

    ramp(this.low.gain, floorDb(eqKnobToDb(c.eqLow)), t);
    ramp(this.mid.gain, floorDb(eqKnobToDb(c.eqMid)), t);
    ramp(this.high.gain, floorDb(eqKnobToDb(c.eqHigh)), t);

    if (this.source) {
      ramp(this.source.playbackRate, this.playbackRate, t);
    }

    // The shifter has to track the pitch fader continuously, not just when
    // keylock is toggled — otherwise nudging the pitch mid-mix silently detunes
    // the deck, which is the exact failure keylock exists to prevent.
    this.#pushKeylockRatio();
  }

  #emit(event, detail) {
    if (this.onEvent) this.onEvent({ event, group: this.group, ...detail });
  }
}

function ramp(param, value, now) {
  if (!Number.isFinite(value)) return;
  // cancelScheduledValues + setValueAtTime pins the curve's start to where the
  // parameter actually is, otherwise successive ramps fight each other.
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + RAMP_SECONDS);
}

function floorDb(db) {
  return db === -Infinity || db < KILL_FLOOR_DB ? KILL_FLOOR_DB : db;
}

/**
 * Two decks and a mixer, addressed by CDEP group and item.
 *
 * The control names are exactly the stub's, so anything written against one
 * engine drives the other — which is the claim ADR-001 and REQ-LIC-5 rest on.
 */
export class WebEngine {
  /**
   * @param {AudioContext} ctx
   * @param {{decks?: number}} [opts]
   */
  constructor(ctx, opts = {}) {
    this.ctx = ctx;
    this.master = ctx.createGain();

    // A limiter on the master bus. Two decks at unity sum above full scale, and
    // the browser's output stage hard-clips: without this, a normal beatmatched
    // blend distorts at exactly the moment both tracks are loudest. The
    // compressor is set as a brick wall rather than as an effect.
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -1;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.12;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;

    this.master.connect(this.limiter).connect(this.analyser).connect(ctx.destination);

    const count = opts.decks ?? 2;
    /** @type {WebDeck[]} */
    this.decks = [];
    for (let i = 0; i < count; i++) {
      this.decks.push(new WebDeck(ctx, this.master, `[Channel${i + 1}]`));
    }

    this.masterControls = {
      crossfader: 0,
      gain: 1,
      curve: CrossfaderCurve.CONSTANT_POWER
    };

    /** True once every deck has a keylock insert. */
    this.keylockReady = false;
    /** The insert's delay, in seconds, once known. */
    this.keylockLatencySeconds = 0;
    /** @type {MediaStreamAudioDestinationNode|null} */
    this.recordingTap = null;
    this.refresh();
  }

  /** @param {string} group */
  deck(group) {
    return this.decks.find((d) => d.group === group) ?? null;
  }

  /**
   * Everything between a source node and the speakers, in seconds.
   *
   * The keylock insert plus whatever the browser is buffering. `outputLatency`
   * is the honest figure and is what Chrome reports; `baseLatency` is the
   * fallback for engines that do not expose it, and zero is the last resort —
   * a slightly optimistic display is better than a thrown error.
   */
  get displayLatencySeconds() {
    const ctx = this.ctx;
    const output = Number.isFinite(ctx.outputLatency) && ctx.outputLatency > 0
      ? ctx.outputLatency
      : (Number.isFinite(ctx.baseLatency) ? ctx.baseLatency : 0);
    return this.keylockLatencySeconds + output;
  }

  /**
   * Make key lock available, by putting a shifter in every deck's chain.
   *
   * Must be awaited **before anything plays**. The insert imposes a constant
   * delay, and adding it to a deck that is already running would shift that deck
   * against the others by ~49ms — an audible flam appearing from nowhere. Doing
   * it up front, on every deck at once, means the delay is simply part of the
   * engine rather than something that arrives later.
   *
   * Returns false rather than throwing when the browser cannot do it; the decks
   * then behave exactly as they did before DJX-13, refusing `keylock` honestly.
   *
   * @param {string|URL} [sourceUrl]
   * @returns {Promise<boolean>}
   */
  async initKeylock(sourceUrl) {
    if (this.keylockReady) return true;
    const ok = await loadKeylockWorklet(this.ctx, sourceUrl);
    if (!ok) return false;

    try {
      for (const deck of this.decks) {
        const node = new AudioWorkletNode(this.ctx, KEYLOCK_PROCESSOR, {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [2],
          processorOptions: { channels: 2 }
        });
        deck.attachKeylock(node);
      }
    } catch {
      return false;
    }

    this.keylockReady = true;
    this.keylockLatencySeconds = keylockLatencySamples() / this.ctx.sampleRate;
    return true;
  }

  /**
   * A parallel tap of the master bus, for recording.
   *
   * Taken **downstream of the limiter**, so what is captured is what was
   * actually heard rather than a pre-limiter mix that clips on playback.
   *
   * Connected in parallel rather than in series, deliberately: if the recorder
   * were in the signal path, a recording failure would become an audio failure,
   * and silence in front of people is far worse than a lost file.
   *
   * @returns {MediaStream|null} null where the browser cannot do it.
   */
  createRecordingTap() {
    if (typeof this.ctx.createMediaStreamDestination !== "function") return null;
    if (!this.recordingTap) {
      this.recordingTap = this.ctx.createMediaStreamDestination();
      this.analyser.connect(this.recordingTap);
    }
    return this.recordingTap.stream;
  }

  /** Push every control value into the audio graph. */
  refresh() {
    const xf = crossfaderGains(this.masterControls.crossfader, this.masterControls.curve);
    const t = this.ctx.currentTime;
    ramp(this.master.gain, clamp(this.masterControls.gain, 0, 4), t);

    this.decks.forEach((deck, i) => {
      // With more than two decks, odd decks sit on the left of the crossfader and
      // even on the right, which is the convention every four-channel mixer uses.
      deck.apply(i % 2 === 0 ? xf.a : xf.b);
    });
  }

  /**
   * @param {string} group
   * @param {string} item
   * @returns {number|null}
   */
  get(group, item) {
    if (group === "[Master]") {
      switch (item) {
        case "crossfader": return this.masterControls.crossfader;
        case "gain": return this.masterControls.gain;
        case "num_decks": return this.decks.length;
        case "bpm": {
          const leader = this.decks.find((d) => d.playing && d.bpm);
          return leader ? leader.bpm * leader.playbackRate : null;
        }
        default: return null;
      }
    }

    const deck = this.deck(group);
    if (!deck) return null;

    switch (item) {
      case "play": return deck.playing ? 1 : 0;
      case "volume": return deck.controls.volume;
      case "pregain": return deck.controls.pregain;
      case "rate": return deck.controls.rate;
      case "rate_dir": return deck.controls.rateDir;
      case "eq_low": return deck.controls.eqLow;
      case "eq_mid": return deck.controls.eqMid;
      case "eq_high": return deck.controls.eqHigh;
      case "sync_enabled": return deck.controls.syncEnabled;
      case "bpm": return deck.bpm === null ? null : deck.bpm * deck.playbackRate;
      case "duration": return deck.duration;
      case "track_loaded": return deck.buffer ? 1 : 0;
      case "playposition": return deck.duration ? deck.position / deck.duration : 0;
      // No longer refused: DJX-13 implements pitch-independent tempo with a
      // two-stage time-domain shifter (see keylock.js). Still honest, though —
      // it reports on only when a worklet is actually carrying the audio.
      case "keylock": return deck.keylockNode && deck.controls.keylock ? 1 : 0;
      case "loop_enabled": return deck.loop && deck.loop.enabled ? 1 : 0;
      case "loop_in": return deck.loop ? deck.loop.start : (deck.loopIn ?? 0);
      case "loop_out": return deck.loop ? deck.loop.end : 0;
      default: {
        // hotcue_N_activate reads as set (1) or empty (0), which is what a
        // controller's LED needs to know.
        const hot = /^hotcue_(\d+)_activate$/.exec(item);
        if (hot) return deck.cues.get(Number(hot[1])) === null ? 0 : 1;
        return null;
      }
    }
  }

  /**
   * @param {string} group
   * @param {string} item
   * @param {number} value
   */
  set(group, item, value) {
    if (group === "[Master]") {
      if (item === "crossfader") this.masterControls.crossfader = clamp(value, -1, 1);
      else if (item === "gain") this.masterControls.gain = clamp(value, 0, 4);
      else return false;
      this.refresh();
      return true;
    }

    const deck = this.deck(group);
    if (!deck) return false;

    switch (item) {
      case "play":
        value >= 0.5 ? deck.play() : deck.pause();
        break;
      case "cue_gotoandplay":
        if (value >= 0.5) deck.cue();
        break;
      case "volume": deck.controls.volume = clamp(value, 0, 1); break;
      case "pregain": deck.controls.pregain = clamp(value, 0, 4); break;
      case "rate": deck.controls.rate = clamp(value, -1, 1); break;
      case "rate_dir": deck.controls.rateDir = value < 0 ? -1 : 1; break;
      case "eq_low": deck.controls.eqLow = clamp(value, 0, 4); break;
      case "eq_mid": deck.controls.eqMid = clamp(value, 0, 4); break;
      case "eq_high": deck.controls.eqHigh = clamp(value, 0, 4); break;
      case "playposition":
        deck.seek(clamp(value, 0, 1) * deck.duration);
        break;
      case "sync_enabled":
        deck.controls.syncEnabled = value >= 0.5 ? 1 : 0;
        if (value >= 0.5) this.sync(group);
        break;
      case "keylock":
        // Still refused when no worklet is carrying the audio — accepting it
        // would report the key as held while the pitch kept moving, which is the
        // one failure mode worse than not having the feature.
        if (!deck.keylockNode) return false;
        deck.controls.keylock = value >= 0.5 ? 1 : 0;
        break;
      case "loop_in":
        if (value >= 0.5) deck.markLoopIn();
        break;
      case "loop_out":
        if (value >= 0.5) deck.markLoopOut();
        break;
      case "loop_enabled":
        if (value >= 0.5) {
          // Enabling with no region yet is a request for a sensible default
          // rather than an error: four beats is the loop a DJ reaches for.
          if (!deck.loop) deck.setBeatLoop(4);
          else deck.enableLoop(true);
        } else {
          deck.enableLoop(false);
        }
        break;
      default: {
        const hot = /^hotcue_(\d+)_activate$/.exec(item);
        if (hot) {
          const n = Number(hot[1]);
          if (value < 0.5) return false;
          // Jump if it exists, set if it does not. Setting is destructive, so it
          // only ever happens to an *empty* slot — an occupied one is never
          // silently overwritten by the activate control.
          if (deck.cues.get(n) === null) deck.setHotcue(n);
          else deck.jumpHotcue(n);
          break;
        }
        return false;
      }
    }

    this.refresh();
    return true;
  }

  /**
   * Match `group` to the other playing deck's tempo — DJX-6.
   *
   * Returns false when it cannot, and changes nothing. A sync that silently does
   * nothing is worse than one that reports failure, because the DJ believes the
   * decks are locked and stops listening for drift.
   *
   * @param {string} group
   */
  sync(group) {
    const follower = this.deck(group);
    if (!follower || !follower.bpm) return false;

    const leader = this.decks.find((d) => d !== follower && d.playing && d.bpm);
    if (!leader) return false;

    const result = syncRate(leader.bpm * leader.playbackRate, follower.bpm);
    if (!result) return false;

    follower.controls.rate = clamp(result.rate, -1, 1);
    this.refresh();
    return true;
  }

  /** Peak level of the master bus, 0..1, for a meter. */
  masterLevel() {
    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    let peak = 0;
    for (let i = 0; i < buf.length; i++) {
      const a = Math.abs(buf[i]);
      if (a > peak) peak = a;
    }
    return peak;
  }

  dispose() {
    for (const d of this.decks) d.stop();
  }
}

export { dbToGain, KILL_FLOOR_DB };
