// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Recording the mix — DJX-16.
 *
 * A recorder fails in ways nobody notices until the set is over and the file is
 * missing, empty, or has overwritten last night's. So the state machine and the
 * naming are tested here directly, with the browser's MediaRecorder injected as
 * a fake — the awkward transitions (stop before start, start twice, stop a
 * recorder that has already errored) are exactly the ones that lose recordings.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MIME_PREFERENCES,
  MixRecorder,
  RecorderState,
  extensionFor,
  formatElapsed,
  pickMimeType,
  recordingFilename
} from "../src/record.js";

/** Stands in for the browser's MediaRecorder. */
class FakeRecorder {
  constructor(stream, opts) {
    this.stream = stream;
    this.opts = opts;
    this.started = false;
    this.stopped = false;
    this.timeslice = null;
    FakeRecorder.last = this;
  }

  start(timeslice) {
    this.started = true;
    this.timeslice = timeslice;
  }

  stop() {
    this.stopped = true;
    if (this.onstop) this.onstop();
  }

  /** Push a chunk in, as the browser would while recording. */
  emit(size) {
    if (this.ondataavailable) this.ondataavailable({ data: { size } });
  }
}

const supportsAll = () => true;
const supportsNone = () => false;

function makeRecorder(overrides = {}) {
  return new MixRecorder({
    createRecorder: (stream, opts) => new FakeRecorder(stream, opts),
    isTypeSupported: supportsAll,
    now: overrides.now,
    ...overrides
  });
}

/* ------------------------------------------------------------ mime picking */

test("the best available container is chosen, not the first one tried", () => {
  // Only the third preference is available — a browser that supports MP4 but not
  // WebM, which is Safari.
  const only = MIME_PREFERENCES[2];
  assert.equal(pickMimeType((t) => t === only), only);
});

test("a browser supporting nothing yields null rather than a bad guess", () => {
  assert.equal(pickMimeType(supportsNone), null);
  assert.equal(pickMimeType(undefined), null);
});

test("a browser that throws on an unknown type still gets a usable answer", () => {
  // Throwing rather than returning false is a real behaviour, and letting it
  // escape would remove recording entirely instead of falling to the next
  // candidate.
  const target = MIME_PREFERENCES[1];
  const isSupported = (t) => {
    if (t === MIME_PREFERENCES[0]) throw new TypeError("nope");
    return t === target;
  };
  assert.equal(pickMimeType(isSupported), target);
});

test("the extension matches the container", () => {
  assert.equal(extensionFor("audio/webm;codecs=opus"), "webm");
  assert.equal(extensionFor("audio/mp4;codecs=mp4a.40.2"), "m4a");
  assert.equal(extensionFor("audio/ogg;codecs=opus"), "ogg");
  assert.equal(extensionFor(null), "webm", "an unknown container should still be openable");
});

/* --------------------------------------------------------------- filenames */

test("filenames sort chronologically", () => {
  const early = recordingFilename(new Date(2026, 7, 29, 9, 5, 3));
  const late = recordingFilename(new Date(2026, 7, 29, 21, 40, 12));
  assert.ok(early < late, `${early} should sort before ${late}`);
  assert.match(early, /^crowddeck-mix-2026-08-29-090503\.webm$/);
});

test("two takes a second apart do not collide", () => {
  // The failure this prevents is silent: the second file replaces the first, and
  // the first set is simply gone.
  const a = recordingFilename(new Date(2026, 7, 29, 21, 40, 12));
  const b = recordingFilename(new Date(2026, 7, 29, 21, 40, 13));
  assert.notEqual(a, b);
});

test("the filename carries the right extension for the container", () => {
  assert.match(recordingFilename(new Date(), "audio/mp4"), /\.m4a$/);
});

/* ----------------------------------------------------------------- elapsed */

test("elapsed time reads the way a DJ expects", () => {
  assert.equal(formatElapsed(0), "0:00");
  assert.equal(formatElapsed(9), "0:09");
  assert.equal(formatElapsed(75), "1:15");
  assert.equal(formatElapsed(3599), "59:59");
  assert.equal(formatElapsed(3600), "1:00:00", "hours appear only once there are hours");
  assert.equal(formatElapsed(7325), "2:02:05");
});

test("a nonsense elapsed time shows zero rather than NaN", () => {
  assert.equal(formatElapsed(NaN), "0:00");
  assert.equal(formatElapsed(-5), "0:00");
  assert.equal(formatElapsed(undefined), "0:00");
});

/* ----------------------------------------------------------- state machine */

test("a browser without MediaRecorder reports unsupported rather than failing later", () => {
  const rec = new MixRecorder({ createRecorder: null, isTypeSupported: supportsNone });
  assert.equal(rec.supported, false);
  assert.equal(rec.state, RecorderState.UNSUPPORTED);
  assert.equal(rec.start({}), false, "starting should be refused, not attempted");
});

test("recording starts, and asks for chunks during the set", () => {
  const rec = makeRecorder();
  assert.equal(rec.start({}), true);
  assert.equal(rec.state, RecorderState.RECORDING);
  // A timeslice is what makes a mid-set crash survivable: without it every byte
  // is still inside the recorder when the tab dies.
  assert.equal(FakeRecorder.last.timeslice, 1000);
});

test("starting twice is refused rather than silently replacing the recording", () => {
  const rec = makeRecorder();
  rec.start({});
  const first = FakeRecorder.last;
  assert.equal(rec.start({}), false);
  assert.equal(FakeRecorder.last, first, "the running recorder must not be discarded");
});

test("stopping when nothing is recording resolves to null, it does not throw", async () => {
  const rec = makeRecorder();
  assert.equal(await rec.stop(), null);
});

test("a completed recording comes back with audio, a name and a duration", async () => {
  let clock = 1000;
  const rec = makeRecorder({ now: () => clock });
  rec.start({});
  FakeRecorder.last.emit(2048);
  FakeRecorder.last.emit(4096);
  clock += 65000;
  const result = await rec.stop();

  assert.ok(result, "a recording with data should not be null");
  assert.ok(Math.abs(result.seconds - 65) < 0.01, `got ${result.seconds}s`);
  assert.match(result.filename, /^crowddeck-mix-.*\.webm$/);
  assert.equal(rec.state, RecorderState.IDLE, "it should be ready to record again");
});

test("empty chunks are discarded, so the file cannot start with a blank block", () => {
  // Some players stop at the first zero-length block rather than skipping it,
  // which turns a good recording into a silent one.
  const rec = makeRecorder();
  rec.start({});
  FakeRecorder.last.emit(0);
  FakeRecorder.last.emit(0);
  assert.equal(rec.chunks.length, 0);
  FakeRecorder.last.emit(512);
  assert.equal(rec.chunks.length, 1);
});

test("a recording that captured nothing is null, not an empty file", async () => {
  // Handing back a zero-byte file looks like success and is discovered later.
  const rec = makeRecorder();
  rec.start({});
  assert.equal(await rec.stop(), null);
  assert.equal(rec.state, RecorderState.IDLE);
});

test("a recorder that throws on stop still yields what it captured", async () => {
  // The set matters more than a tidy teardown.
  const rec = makeRecorder();
  rec.start({});
  FakeRecorder.last.emit(1024);
  FakeRecorder.last.stop = function throwing() {
    throw new Error("already stopped");
  };
  const result = await rec.stop();
  assert.ok(result, "the captured audio should survive a failed stop");
  assert.ok(rec.error, "and the failure should be recorded rather than hidden");
});

test("a recorder that cannot be constructed does not leave a half-started state", () => {
  const rec = new MixRecorder({
    createRecorder: () => { throw new Error("no"); },
    isTypeSupported: supportsAll
  });
  assert.equal(rec.start({}), false);
  assert.equal(rec.state, RecorderState.IDLE, "it must remain startable");
  assert.ok(rec.error);
});

test("elapsed time is zero unless actually recording", () => {
  let clock = 0;
  const rec = makeRecorder({ now: () => clock });
  assert.equal(rec.elapsedSeconds, 0);
  rec.start({});
  clock = 5000;
  assert.equal(rec.elapsedSeconds, 5);
});
