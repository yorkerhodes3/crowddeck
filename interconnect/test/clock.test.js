// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * MIDI clock tests.
 *
 * A virtual clock and timer are injected throughout, so pulse timing is exact
 * and the suite runs instantly. The one test that uses real timers measures
 * achievable jitter and reports it rather than asserting the REQ-CLK-6 budget —
 * see the note in that test for why.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { MidiClock, PPQN, pulseIntervalMs, mtcNotSupportedForMusicalSync } from "../src/clock.js";
import { Status } from "../src/ports.js";

/** A deterministic scheduler: time only moves when the test says so. */
function virtualTimer() {
  let now = 0;
  let pending = null;
  // Pulse deadlines are irrational (60000/bpm/24), so a pulse due exactly at the
  // advance boundary can land a fraction above it through accumulated rounding.
  // An epsilon makes the harness model reality — a pulse due at t fires at t —
  // rather than exposing float noise as a fake failure.
  const EPS = 1e-6;
  return {
    now: () => now,
    setTimer: (fn, ms) => { pending = { fn, at: now + ms }; return pending; },
    clearTimer: () => { pending = null; },
    /** Advance time, firing anything that comes due. */
    advance(ms) {
      const target = now + ms;
      let guard = 0;
      while (pending && pending.at <= target + EPS) {
        if (++guard > 100000) throw new Error("runaway timer");
        now = pending.at;
        const fn = pending.fn;
        pending = null;
        fn();
      }
      now = target;
    }
  };
}

function makeClock(bpm = 120) {
  const vt = virtualTimer();
  const sent = [];
  const clock = new MidiClock({
    bpm,
    send: (d) => sent.push(d),
    now: vt.now,
    setTimer: vt.setTimer,
    clearTimer: vt.clearTimer
  });
  return { clock, sent, vt };
}

test("pulse interval follows the tempo", () => {
  // 120 BPM = 2 beats/sec; 24 PPQN => 48 pulses/sec => 20.833ms
  assert.ok(Math.abs(pulseIntervalMs(120) - 20.8333) < 0.001);
  assert.ok(Math.abs(pulseIntervalMs(60) - 41.6667) < 0.001);
  assert.throws(() => pulseIntervalMs(0), RangeError);
  assert.throws(() => pulseIntervalMs(-5), RangeError);
});

test("start emits a START byte then a pulse train — REQ-CLK-2", () => {
  const { clock, sent, vt } = makeClock(120);
  clock.start();

  assert.deepEqual(sent[0], [Status.START]);

  // One second at 120 BPM should be 48 pulses.
  vt.advance(1000);
  const pulses = sent.filter((m) => m[0] === Status.CLOCK).length;
  assert.equal(pulses, 48, `expected 48 pulses in one second, got ${pulses}`);
});

test("24 pulses make one beat", () => {
  const { clock, vt } = makeClock(120);
  const beats = [];
  clock.on("beat", (n) => beats.push(n));

  clock.start();
  vt.advance(1000); // 2 beats at 120 BPM

  assert.equal(beats.length, 2);
  assert.deepEqual(beats, [1, 2]);
  assert.equal(clock.beats, 2);
});

test("pulse count matches PPQN exactly over several beats", () => {
  const { clock, sent, vt } = makeClock(60); // 1 beat per second
  clock.start();
  vt.advance(4000);

  const pulses = sent.filter((m) => m[0] === Status.CLOCK).length;
  assert.equal(pulses, 4 * PPQN);
});

test("stop emits a STOP byte and halts the train", () => {
  const { clock, sent, vt } = makeClock(120);
  clock.start();
  vt.advance(500);
  const before = sent.filter((m) => m[0] === Status.CLOCK).length;

  clock.stop();
  assert.ok(sent.some((m) => m[0] === Status.STOP));

  vt.advance(1000);
  const after = sent.filter((m) => m[0] === Status.CLOCK).length;
  assert.equal(after, before, "no pulses after stop");
});

test("a tempo change takes effect without interrupting the train", () => {
  const { clock, sent, vt } = makeClock(60);
  clock.start();
  vt.advance(1000); // 24 pulses at 60 BPM
  assert.equal(sent.filter((m) => m[0] === Status.CLOCK).length, 24);

  clock.setTempo(120);

  // The pulse already scheduled keeps its original deadline — rescheduling it
  // could fire two pulses close together, which an instrument would hear as a
  // stumble. The new rate therefore applies from the following pulse, so the
  // count over the next second is 47 or 48 depending on where the change fell.
  const before = sent.filter((m) => m[0] === Status.CLOCK).length;
  vt.advance(1000);
  const added = sent.filter((m) => m[0] === Status.CLOCK).length - before;

  assert.ok(added >= 47 && added <= 48, `expected ~48 pulses at 120 BPM, got ${added}`);
  assert.ok(
    !sent.slice(1).some((m) => m[0] === Status.START),
    "a tempo change must not restart the transport — that would be audible"
  );
});

test("an instrument following the clock tracks a tempo change within a beat", () => {
  const { clock, sent, vt } = makeClock(120);
  clock.start();
  vt.advance(500);

  clock.setTempo(140);
  const before = sent.filter((m) => m[0] === Status.CLOCK).length;

  // One beat at 140 BPM is ~428ms and should carry 24 pulses.
  vt.advance(60000 / 140);
  const inOneBeat = sent.filter((m) => m[0] === Status.CLOCK).length - before;
  assert.ok(
    inOneBeat >= 23 && inOneBeat <= 25,
    `expected about 24 pulses in one beat at the new tempo, got ${inOneBeat}`
  );
});

test("the clock follows the leader deck — REQ-CLK-1", () => {
  const { clock } = makeClock(120);
  const tempos = [];
  clock.on("tempo", (b) => tempos.push(b));

  clock.followLeader(128);
  assert.equal(clock.bpm, 128);

  clock.followLeader(128); // unchanged
  assert.deepEqual(tempos, [128], "no event when the tempo has not moved");

  clock.followLeader(0); // meaningless: ignored rather than throwing mid-set
  assert.equal(clock.bpm, 128);
});

test("a late pulse does not push every later pulse late", () => {
  const { clock, sent, vt } = makeClock(120);
  clock.start();

  // Jump forward past several deadlines at once, as a stalled event loop would.
  vt.advance(100);
  const count = sent.filter((m) => m[0] === Status.CLOCK).length;

  // Deadlines are absolute, so the train catches up rather than drifting.
  vt.advance(900);
  const total = sent.filter((m) => m[0] === Status.CLOCK).length;
  assert.ok(total >= 47 && total <= 48, `expected ~48 pulses in 1s, got ${total} (first burst ${count})`);
});

test("start is idempotent and stop on a stopped clock is harmless", () => {
  const { clock, sent, vt } = makeClock(120);
  clock.start();
  clock.start();
  assert.equal(sent.filter((m) => m[0] === Status.START).length, 1);

  clock.stop();
  clock.stop();
  assert.equal(sent.filter((m) => m[0] === Status.STOP).length, 1);
  vt.advance(100);
});

test("an invalid tempo is refused", () => {
  const { clock } = makeClock();
  assert.throws(() => clock.setTempo(0), RangeError);
  assert.throws(() => clock.setTempo(-1), RangeError);
});

test("MTC is explicitly refused for musical sync — REQ-CLK-5", () => {
  // Recorded as a refusal rather than an omission, so the reasoning is
  // discoverable at the moment someone reaches for it.
  assert.throws(() => mtcNotSupportedForMusicalSync(), /not tempo/);
});

test("jitter is measured and reported, not assumed", async () => {
  // This is the one test on real timers. It does NOT assert the REQ-CLK-6
  // budget of <=1ms RMS: a JavaScript timer cannot meet that, and a test that
  // pretended otherwise would be dishonest. The budget belongs to the native
  // engine plane. What is asserted is that the clock measures itself, so the
  // shortfall is visible rather than hidden.
  const sent = [];
  const clock = new MidiClock({ bpm: 120, send: (d) => sent.push(d) });
  clock.start();
  await new Promise((r) => setTimeout(r, 300));
  clock.stop();

  const j = clock.jitter();
  assert.ok(j.samples > 5, `expected jitter samples, got ${j.samples}`);
  assert.equal(typeof j.rmsMs, "number");
  assert.equal(typeof j.maxMs, "number");
  assert.equal(typeof j.withinBudget, "boolean");
  assert.ok(sent.filter((m) => m[0] === Status.CLOCK).length > 5, "pulses were emitted");
});

test("jitter on a fresh clock reports zero samples rather than NaN", () => {
  const { clock } = makeClock();
  const j = clock.jitter();
  assert.equal(j.samples, 0);
  assert.equal(j.rmsMs, 0);
  assert.equal(j.withinBudget, true);
});
