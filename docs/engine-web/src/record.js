// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Recording the mix — DJX-16.
 *
 * The last thing the reference application does that this did not. A practice
 * set you cannot keep is worth much less than one you can, and recording is also
 * the only way to hear your own mixing honestly — in the moment you are
 * concentrating on the next track, not on the blend you just made.
 *
 * ## Why MediaRecorder rather than writing a WAV
 *
 * Capturing raw PCM in a worklet and encoding a WAV would be lossless, and it
 * was the first instinct. The arithmetic rules it out: stereo 48 kHz float is
 * about 11 MB per minute, so a two-hour set is **1.3 GB held in a browser tab**.
 * That does not degrade gracefully — it crashes the tab, and it crashes it at the
 * end of a long set, which is the worst possible moment to lose the recording.
 *
 * MediaRecorder streams to compressed chunks instead, so an hour costs tens of
 * megabytes. Opus at a reasonable bitrate is transparent enough for a practice
 * recording, and the honest trade — lossy, but it survives — is the right way
 * round for something whose whole purpose is not to lose your set.
 *
 * ## It taps, it does not sit in the path
 *
 * The recorder is connected **in parallel** with the speakers, downstream of the
 * limiter so it captures what was actually heard. Putting a recorder in series
 * with the output would make a recording failure into an audio failure, and
 * silence in a club is worse than a lost file.
 *
 * The state machine and the naming are kept pure and injected, because they are
 * where the mistakes are — a recorder that silently overwrites yesterday's set,
 * or that cannot be stopped, fails in ways that only appear once it matters.
 */

/**
 * Container and codec preferences, best first.
 *
 * Opus in WebM is what Chromium and Firefox both produce and is a genuinely good
 * codec at these bitrates. The MP4/AAC entries are for Safari, which historically
 * supports neither WebM nor Opus; without them recording would simply be
 * unavailable there rather than merely different.
 */
export const MIME_PREFERENCES = Object.freeze([
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/ogg;codecs=opus"
]);

/** Bitrate for the recording. 192k stereo Opus is beyond transparent for a mix. */
export const DEFAULT_BITS_PER_SECOND = 192000;

/**
 * Pick the best container the browser will actually produce.
 *
 * @param {(type: string) => boolean} isSupported
 * @returns {string|null} null when none of them work.
 */
export function pickMimeType(isSupported) {
  if (typeof isSupported !== "function") return null;
  for (const type of MIME_PREFERENCES) {
    try {
      if (isSupported(type)) return type;
    } catch {
      // A browser that throws on an unknown type should fall through to the next
      // candidate rather than lose recording altogether.
    }
  }
  return null;
}

/** The file extension implied by a MIME type. */
export function extensionFor(mimeType) {
  const type = String(mimeType || "");
  if (type.includes("mp4")) return "m4a";
  if (type.includes("ogg")) return "ogg";
  return "webm";
}

/**
 * A filename that sorts chronologically and never collides.
 *
 * Local time rather than UTC, and to the second. A DJ looking for "the one from
 * Tuesday night" wants the clock on the wall, and two takes of the same track a
 * minute apart must not overwrite each other — losing the earlier take silently
 * is exactly the failure this is meant to prevent.
 *
 * @param {Date} [at]
 * @param {string} [mimeType]
 * @returns {string}
 */
export function recordingFilename(at = new Date(), mimeType = "audio/webm") {
  const p = (n, width = 2) => String(n).padStart(width, "0");
  const stamp =
    `${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())}` +
    `-${p(at.getHours())}${p(at.getMinutes())}${p(at.getSeconds())}`;
  return `crowddeck-mix-${stamp}.${extensionFor(mimeType)}`;
}

/**
 * Elapsed time as a DJ reads it.
 *
 * Hours appear only once there are hours, so a normal set is not padded with a
 * leading zero that never changes.
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatElapsed(seconds) {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}

/** States a recording can be in. */
export const RecorderState = Object.freeze({
  IDLE: "idle",
  RECORDING: "recording",
  UNSUPPORTED: "unsupported"
});

/**
 * Records the master bus to a file.
 *
 * The MediaRecorder itself is injected rather than constructed, so the state
 * machine can be tested without a browser — which matters because the states
 * that break things are the awkward ones: stopping when not started, starting
 * twice, and stopping a recorder that has already errored.
 */
export class MixRecorder {
  /**
   * @param {object} deps
   * @param {(stream: any, opts: object) => any} deps.createRecorder
   * @param {(type: string) => boolean} deps.isTypeSupported
   * @param {() => number} [deps.now] Milliseconds; injected for deterministic tests.
   */
  constructor(deps = {}) {
    this.createRecorder = deps.createRecorder;
    this.isTypeSupported = deps.isTypeSupported;
    this.now = deps.now ?? (() => Date.now());

    this.mimeType = pickMimeType(this.isTypeSupported);
    this.state = this.mimeType && this.createRecorder ? RecorderState.IDLE : RecorderState.UNSUPPORTED;

    this.recorder = null;
    this.chunks = [];
    this.startedAt = 0;
    /** Set when the recorder reports a failure, so `stop` can explain it. */
    this.error = null;
  }

  /** Whether recording is possible at all in this browser. */
  get supported() {
    return this.state !== RecorderState.UNSUPPORTED;
  }

  /** Seconds since recording began, or 0. */
  get elapsedSeconds() {
    if (this.state !== RecorderState.RECORDING) return 0;
    return Math.max(0, (this.now() - this.startedAt) / 1000);
  }

  /**
   * Begin recording `stream`.
   *
   * @param {MediaStream} stream
   * @returns {boolean} false when unsupported or already running.
   */
  start(stream) {
    if (this.state !== RecorderState.IDLE) return false;

    let recorder;
    try {
      recorder = this.createRecorder(stream, {
        mimeType: this.mimeType,
        audioBitsPerSecond: DEFAULT_BITS_PER_SECOND
      });
    } catch (err) {
      this.error = err;
      return false;
    }

    this.chunks = [];
    this.error = null;
    recorder.ondataavailable = (event) => {
      // Zero-length chunks are normal at the boundaries and must not be kept:
      // some players stop at the first empty block rather than skipping it.
      if (event && event.data && event.data.size > 0) this.chunks.push(event.data);
    };
    recorder.onerror = (event) => {
      this.error = (event && event.error) || new Error("recording failed");
    };

    this.recorder = recorder;
    this.startedAt = this.now();
    this.state = RecorderState.RECORDING;

    // A timeslice means chunks arrive during the set rather than only at the
    // end. If the tab dies mid-set, what has already been handed over is
    // recoverable; without it, everything is still inside the recorder.
    recorder.start(1000);
    return true;
  }

  /**
   * Stop, and resolve with the finished recording.
   *
   * @returns {Promise<{blob: Blob, filename: string, seconds: number}|null>}
   */
  stop() {
    if (this.state !== RecorderState.RECORDING || !this.recorder) return Promise.resolve(null);

    const seconds = this.elapsedSeconds;
    const recorder = this.recorder;

    return new Promise((resolve) => {
      recorder.onstop = () => {
        this.state = RecorderState.IDLE;
        this.recorder = null;
        const chunks = this.chunks;
        this.chunks = [];
        if (chunks.length === 0) {
          resolve(null);
          return;
        }
        const blob = new Blob(chunks, { type: this.mimeType });
        resolve({ blob, filename: recordingFilename(new Date(), this.mimeType), seconds });
      };
      try {
        recorder.stop();
      } catch (err) {
        // Already stopped, or stopped by the browser. Salvage whatever arrived
        // rather than throwing away a set because the teardown was untidy.
        this.error = err;
        recorder.onstop();
      }
    });
  }
}
