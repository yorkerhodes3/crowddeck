// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Loudness normalisation — REQ-CON-4, CON-6.
 *
 * The tests that decide whether this module is fit for a venue are the clipping
 * ones. Matching loudness is arithmetic; doing it *without introducing distortion*
 * is the actual problem, because a naive normaliser trades an inconsistency
 * patrons tolerate for clipping they can hear.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeGain,
  readLoudness,
  transitionDelta,
  liveInstrumentGain,
  linearPeakToDb,
  dbToLinear,
  LoudnessSource,
  DEFAULT_TARGET_LUFS,
  DEFAULT_PEAK_CEILING_DBTP,
  MAX_BOOST_DB,
  MAX_CUT_DB
} from "../src/loudness.js";

/* ------------------------------------------------------- the basic arithmetic */

test("a quiet track is boosted and a loud one is cut", () => {
  // -20 LUFS needs +6 dB to reach -14; -8 LUFS needs -6 dB.
  const quiet = computeGain({ loudnessLufs: -20, truePeakDb: -10 });
  assert.equal(quiet.gainDb, 6);
  assert.equal(quiet.applied, true);
  assert.equal(quiet.peakLimited, false);

  const loud = computeGain({ loudnessLufs: -8, truePeakDb: -0.5 });
  assert.equal(loud.gainDb, -6);
});

test("a track already at target is left alone", () => {
  const r = computeGain({ loudnessLufs: DEFAULT_TARGET_LUFS, truePeakDb: -3 });
  assert.equal(r.gainDb, 0);
  assert.equal(r.applied, false);
});

test("the target is configurable", () => {
  // ReplayGain 2.0 references -18; broadcast uses -23.
  assert.equal(computeGain({ loudnessLufs: -20 }, { targetLufs: -18 }).gainDb, 2);
  assert.equal(computeGain({ loudnessLufs: -20 }, { targetLufs: -23 }).gainDb, -3);
});

/* -------------------------------------- the tests this module exists to pass */

test("gain is limited so normalisation cannot clip — the whole point", () => {
  // A quiet-but-peaky master: -20 LUFS wants +6 dB, but it already peaks at
  // -2 dBTP, so +6 would put it at +4 dBTP and clip hard through a PA.
  // The correct answer is to play it a bit under target, not to distort it.
  const r = computeGain({ loudnessLufs: -20, truePeakDb: -2 });

  assert.equal(r.peakLimited, true, "the peak guard must engage");
  assert.equal(r.gainDb, 1, "-2 dBTP + 1 dB = -1 dBTP, exactly the ceiling");
  assert.ok(r.gainDb < 6, "and it must be less than the loudness-only answer");
  assert.match(r.reason, /would clip/);
});

test("the peak ceiling leaves headroom for lossy-codec overshoot", () => {
  // A file peaking at exactly 0 dBFS can reconstruct above full scale after MP3
  // or AAC decoding. -1 dBTP is the usual allowance and costs nothing audible.
  assert.equal(DEFAULT_PEAK_CEILING_DBTP, -1);

  const atFullScale = computeGain({ loudnessLufs: -20, truePeakDb: 0 });
  assert.equal(atFullScale.gainDb, -1, "a track already at 0 dBTP is pulled down, not boosted");
  assert.equal(atFullScale.peakLimited, true);
});

test("peak limiting never turns a cut into a deeper cut", () => {
  // A loud track (-8 LUFS) peaking at -0.5 dBTP already needs -6 dB. Applying the
  // headroom figure (-0.5 dB) on top would double-attenuate it.
  const r = computeGain({ loudnessLufs: -8, truePeakDb: -0.5 });
  assert.equal(r.gainDb, -6, "the ordinary cut governs; peak limiting must not stack");
  assert.equal(r.peakLimited, false);
});

test("without peak data, the boost is still bounded", () => {
  // No peak measurement means no headroom guarantee, so the absolute cap is the
  // only protection left. It must still be there.
  const r = computeGain({ loudnessLufs: -40 });
  assert.equal(r.gainDb, MAX_BOOST_DB, "capped rather than +26 dB");
  assert.equal(r.clamped, true);
  assert.match(r.reason, /beyond the safe range/);
});

test("an absurd measurement cannot produce an absurd gain", () => {
  assert.equal(computeGain({ loudnessLufs: -70 }).gainDb, MAX_BOOST_DB);
  assert.equal(computeGain({ loudnessLufs: 10 }).gainDb, MAX_CUT_DB);
});

/* ------------------------------------------------------------ unknown data */

test("an unmeasured track plays as mastered rather than being guessed at", () => {
  // A wrong guess is an audible error. "We don't know" is honest and inaudible.
  for (const track of [{}, { title: "no data" }, null, { loudnessLufs: NaN }]) {
    const r = computeGain(track);
    assert.equal(r.gainDb, 0, "no gain is applied");
    assert.equal(r.applied, false);
    assert.equal(r.source, LoudnessSource.NONE);
    assert.match(r.reason, /no loudness measurement/);
  }
});

test("the console can tell where a figure came from", () => {
  assert.equal(readLoudness({ loudnessLufs: -14 }).source, LoudnessSource.ANALYSIS);
  assert.equal(readLoudness({ replayGainDb: -4 }).source, LoudnessSource.TAGS);
  assert.equal(readLoudness({ providerLufs: -14 }).source, LoudnessSource.PROVIDER);
  assert.equal(readLoudness({}).source, LoudnessSource.NONE);
});

test("our own measurement outranks a tag", () => {
  // Some encoders write a nominal ReplayGain value rather than a measured one, so
  // a real analysis wins when we have both.
  const both = { loudnessLufs: -16, replayGainDb: -99 };
  assert.equal(readLoudness(both).lufs, -16);
  assert.equal(readLoudness(both).source, LoudnessSource.ANALYSIS);
});

/* --------------------------------------------------------- ReplayGain tags */

test("ReplayGain tags are converted from gain to loudness", () => {
  // A tag says "apply -4 dB", and ReplayGain 2.0 references -18 LUFS — so the
  // track measures -14 LUFS. Treating the tag as a loudness would be 4 dB out.
  const r = readLoudness({ replayGainDb: -4 });
  assert.equal(r.lufs, -14);

  // And so it needs no further gain to reach a -14 target.
  assert.equal(computeGain({ replayGainDb: -4 }).gainDb, 0);
});

test("a non-standard ReplayGain reference is honoured", () => {
  assert.equal(readLoudness({ replayGainDb: -5, replayGainReferenceLufs: -23 }).lufs, -18);
});

test("a ReplayGain linear peak becomes dBTP", () => {
  assert.equal(Math.round(linearPeakToDb(1.0)), 0);
  assert.equal(Math.round(linearPeakToDb(0.5)), -6);
  assert.equal(linearPeakToDb(0), -Infinity);

  // A tagged peak feeds the clipping guard, same as a measured one.
  const r = computeGain({ replayGainDb: 2, replayGainPeak: 0.9 });
  assert.equal(r.peakLimited, true, "a tagged peak must protect against clipping too");
});

test("dB and linear conversions round-trip", () => {
  for (const db of [-12, -6, 0, 3]) {
    assert.ok(Math.abs(linearPeakToDb(dbToLinear(db)) - db) < 1e-9);
  }
});

/* ------------------------------------------------------- live instruments */

test("a live source is trimmed, not measured — REQ-INST", () => {
  // There is no file and the performance has not happened yet. Claiming a
  // measurement would be the worst available answer.
  const untrimmed = liveInstrumentGain({});
  assert.equal(untrimmed.gainDb, 0);
  assert.equal(untrimmed.source, LoudnessSource.NONE);
  assert.match(untrimmed.reason, /performer's responsibility/);

  const trimmed = liveInstrumentGain({ trimDb: -3 });
  assert.equal(trimmed.gainDb, -3);
  assert.match(trimmed.reason, /cannot be measured in advance/);
});

test("a live trim is bounded like any other gain", () => {
  assert.equal(liveInstrumentGain({ trimDb: 40 }).gainDb, MAX_BOOST_DB);
  assert.equal(liveInstrumentGain({ trimDb: -80 }).gainDb, MAX_CUT_DB);
});

/* --------------------------------------------------------- the transition */

test("mixing sources produces matched transitions — REQ-CON-4", () => {
  // The scenario the requirement names: a loudness-war CD master followed by a
  // Creative Commons track from a bedroom studio. 12 dB apart as mastered.
  const cdMaster = { loudnessLufs: -6, truePeakDb: -0.3 };
  const bedroomCc = { loudnessLufs: -18, truePeakDb: -6 };

  const before = Math.abs(-6 - -18);
  assert.equal(before, 12, "unnormalised, these are 12 dB apart");

  const t = transitionDelta(cdMaster, bedroomCc);
  assert.ok(
    Math.abs(t.deltaDb) < 3,
    `normalised, the step is ${t.deltaDb} dB — was ${before} dB`
  );
  assert.equal(t.noticeable, false);
});

test("a transition that will still be audible is flagged", () => {
  // Peak limiting can leave a track short of target. That is the right trade, but
  // the console should say so rather than let the room discover it.
  const peaky = { loudnessLufs: -24, truePeakDb: -1 };
  const normal = { loudnessLufs: -14, truePeakDb: -6 };

  const t = transitionDelta(peaky, normal);
  assert.equal(t.outgoing.peakLimited, true);
  assert.equal(t.noticeable, true);
  assert.match(t.reason, /louder|quieter/);
});

test("a transition involving unmeasured audio says so", () => {
  const known = { loudnessLufs: -14, truePeakDb: -3 };
  const unknown = { title: "freshly ingested, not yet analysed" };

  const t = transitionDelta(known, unknown);
  // The delta is a guess when one side is unmeasured, and the reason must admit it
  // rather than presenting a confident number.
  if (t.noticeable) assert.match(t.reason, /no loudness measurement/);
  assert.equal(t.incoming.source, LoudnessSource.NONE);
});

test("three heterogeneous sources in a row — REQ-CON-4's actual scenario", () => {
  // A Creative Commons track, a local file and a live instrument, as the
  // requirement names them.
  const cc = { loudnessLufs: -19, truePeakDb: -4 };
  const local = { loudnessLufs: -9, truePeakDb: -0.8 };
  const live = { trimDb: 0 };

  const ccGain = computeGain(cc);
  const localGain = computeGain(local);
  const liveGain = liveInstrumentGain(live);

  // The local file reaches target exactly: it has the headroom for a -5 dB cut.
  assert.equal(localGain.gainDb, -5);
  assert.equal(Math.round((-9 + localGain.gainDb) * 10) / 10, DEFAULT_TARGET_LUFS);

  // The CC track does NOT reach target, and that is correct. It wants +5 dB but
  // peaks at -4 dBTP, so only +3 dB fits under the -1 dBTP ceiling. It lands at
  // -16 LUFS: 2 dB shy of target, and undistorted.
  //
  // An earlier version of this test asserted both hit target exactly, which would
  // only be true of a normaliser that clips. The fixture was wrong, not the code.
  assert.equal(ccGain.peakLimited, true);
  assert.equal(ccGain.gainDb, 3);
  assert.equal(Math.round((-19 + ccGain.gainDb) * 10) / 10, -16);

  // 2 dB short is well inside the ~3 dB that reads as a level change, so the
  // transition is still comfortable — which is the point of the trade.
  const t = transitionDelta(cc, local);
  assert.equal(t.noticeable, false, `step of ${t.deltaDb} dB should be unremarkable`);
  assert.ok(Math.abs(t.deltaDb) <= 2);

  // The live source is the honest exception: it cannot be normalised, only trimmed.
  assert.equal(liveGain.source, LoudnessSource.NONE);
  assert.equal(liveGain.gainDb, 0);
});

/* ---------------------------------------------------------------- honesty */

test("every result explains itself", () => {
  // A DJ console showing "-2.1 dB" is less useful than one showing
  // "-2.1 dB (peak-limited)". Silently doing something other than what was asked
  // is how people stop trusting the feature.
  const cases = [
    { loudnessLufs: -20, truePeakDb: -10 },
    { loudnessLufs: -20, truePeakDb: -2 },
    { loudnessLufs: -40 },
    {}
  ];
  for (const c of cases) {
    const r = computeGain(c);
    assert.ok(r.reason && r.reason.length > 15, `thin reason for ${JSON.stringify(c)}`);
    assert.equal(typeof r.peakLimited, "boolean");
    assert.equal(typeof r.clamped, "boolean");
  }
});

test("no dynamic-range processing is applied", async () => {
  // This module chooses a gain. It does not compress or limit the audio, because
  // both change how the music sounds and a venue that wants them should have them
  // in the signal chain where an engineer can see them.
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../src/loudness.js", import.meta.url), "utf8");
  for (const term of ["compressor", "ratio", "attackMs", "releaseMs", "kneeDb"]) {
    assert.ok(!src.includes(term), `loudness.js should not implement dynamics — found "${term}"`);
  }
});
