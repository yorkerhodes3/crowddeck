// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * QR encoder — DISP-1.
 *
 * The load-bearing test here is `decodes with a real decoder`. Everything else is
 * scaffolding that helps localise a failure. The first attempt at this encoder passed
 * plenty of plausible-looking unit tests and still produced codes that would not scan,
 * so the oracle is jsQR (a dev-only dependency), not my own reasoning.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import jsQR from "jsqr";
import { encodeQr, toSvg, utf8Bytes, MAX_VERSION, _internals } from "../lib/qr.js";

const { BLOCKS, SIZE, dataCapacity, generatorPoly, formatBits, versionBits, chooseVersion } =
  _internals;

/** Render a symbol to the RGBA bitmap jsQR expects, with a quiet zone. */
function toBitmap(qr, { scale = 3, quiet = 4 } = {}) {
  const dim = (qr.size + quiet * 2) * scale;
  const data = new Uint8ClampedArray(dim * dim * 4).fill(255);
  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      const mr = Math.floor(y / scale) - quiet;
      const mc = Math.floor(x / scale) - quiet;
      const dark = mr >= 0 && mr < qr.size && mc >= 0 && mc < qr.size && qr.modules[mr][mc];
      const i = (y * dim + x) * 4;
      const v = dark ? 0 : 255;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { data, width: dim, height: dim };
}

const decode = (qr) => {
  const bmp = toBitmap(qr);
  const res = jsQR(bmp.data, bmp.width, bmp.height);
  return res ? res.data : null;
};

/* ------------------------------------------------- the test that decides it */

test("a join URL encodes to a QR a real decoder can read — DISP-1", () => {
  const url = "https://venue.local/patron/index.html?venue=the-anchor";
  const qr = encodeQr(url);
  assert.equal(
    decode(qr),
    url,
    "if this fails the QR does not scan, and a QR that does not scan is worse than none"
  );
});

test("every error-correction level decodes", () => {
  const url = "https://venue.local/patron/?venue=the-anchor";
  for (const ecc of ["L", "M", "Q", "H"]) {
    const qr = encodeQr(url, { ecc });
    assert.equal(decode(qr), url, `level ${ecc} did not decode`);
  }
});

test("every mask pattern decodes", () => {
  const url = "https://venue.local/join";
  for (let mask = 0; mask < 8; mask++) {
    const qr = encodeQr(url, { mask });
    assert.equal(qr.mask, mask);
    assert.equal(decode(qr), url, `mask ${mask} did not decode`);
  }
});

test("versions 1 through 10 all decode", () => {
  // Grow the payload until each version is exercised, including v7+ where version
  // information appears and v10 where the character count widens to 16 bits.
  const seen = new Set();
  for (let len = 10; len <= 210; len += 4) {
    const text = "A".repeat(len);
    const qr = encodeQr(text, { ecc: "M" });
    if (seen.has(qr.version)) continue;
    seen.add(qr.version);
    assert.equal(decode(qr), text, `version ${qr.version} did not decode`);
  }
  assert.ok(seen.has(1), "version 1 was never produced");
  assert.ok(seen.has(7), "version 7+ carries version information and must be covered");
  assert.ok(seen.size >= 6, `expected several versions, saw ${[...seen].join(", ")}`);
});

test("UTF-8 payloads survive the round trip", () => {
  for (const text of ["Café del Mar", "Björk — Jóga", "日本語のタイトル", "emoji 🎧🎶"]) {
    const qr = encodeQr(text);
    assert.equal(decode(qr), text, `"${text}" did not round-trip`);
  }
});

test("a realistic long join URL decodes", () => {
  const url =
    "https://the-anchor.crowddeck.local/patron/index.html?venue=the-anchor&table=17&token=b3f9a2c1d4e5";
  const qr = encodeQr(url, { ecc: "Q" });
  assert.equal(decode(qr), url);
});

/* --------------------------------------------- structural sanity checks */

test("the transcribed block table matches the symbol geometry", () => {
  // The block table is hand-transcribed from the standard, which is exactly the kind
  // of data that goes wrong silently. Total codewords are derivable from the module
  // count, so the table can be checked rather than trusted.
  for (let v = 1; v <= MAX_VERSION; v++) {
    const n = SIZE(v);
    let functionModules = 3 * 8 * 8; // three finders with separators
    functionModules += 2 * (n - 16); // timing patterns
    functionModules += 31; // format information (31 modules incl. the dark one)
    if (v >= 7) functionModules += 36; // version information, two copies

    const centres = _internals.ALIGNMENT[v];
    let alignments = 0;
    for (const r of centres) {
      for (const c of centres) {
        const nearFinder = (r <= 8 && c <= 8) || (r <= 8 && c >= n - 9) || (r >= n - 9 && c <= 8);
        if (!nearFinder) alignments++;
      }
    }
    // Each alignment pattern is 25 modules, less 5 where it overlaps a timing line.
    const onTiming = centres.includes(6) ? Math.max(0, centres.length - 2) * 2 : 0;
    functionModules += alignments * 25 - onTiming * 5;

    const totalCodewords = Math.floor((n * n - functionModules) / 8);

    for (const level of ["L", "M", "Q", "H"]) {
      const [ecc, g1, d1, g2, d2] = BLOCKS[v][level];
      const fromTable = g1 * (d1 + ecc) + g2 * (d2 + ecc);
      assert.equal(
        fromTable,
        totalCodewords,
        `v${v}${level}: table says ${fromTable} codewords, geometry says ${totalCodewords}`
      );
    }
  }
});

test("capacity grows monotonically with version and shrinks with ECC level", () => {
  for (let v = 1; v <= MAX_VERSION; v++) {
    assert.ok(dataCapacity(v, "L") > dataCapacity(v, "M"));
    assert.ok(dataCapacity(v, "M") > dataCapacity(v, "Q"));
    assert.ok(dataCapacity(v, "Q") > dataCapacity(v, "H"));
    if (v > 1) assert.ok(dataCapacity(v, "M") > dataCapacity(v - 1, "M"));
  }
});

test("format information matches the standard's published values", () => {
  // ISO/IEC 18004 Table C.1, all 32 values. Writing the whole table out rather than
  // spot-checking is deliberate: my first pass asserted three values from memory and
  // two of them were wrong — I had transcribed level-L mask-5 against mask 7. A wrong
  // expectation is worse than no test, because it sends you hunting a working
  // function while the real bug sits elsewhere.
  const TABLE = {
    L: ["111011111000100", "111001011110011", "111110110101010", "111100010011101",
        "110011000101111", "110001100011000", "110110001000001", "110100101110110"],
    M: ["101010000010010", "101000100100101", "101111001111100", "101101101001011",
        "100010111111001", "100000011001110", "100111110010111", "100101010100000"],
    Q: ["011010101011111", "011000001101000", "011111100110001", "011101000000110",
        "010010010110100", "010000110000011", "010111011011010", "010101111101101"],
    H: ["001011010001001", "001001110111110", "001110011100111", "001100111010000",
        "000011101100010", "000001001010101", "000110100001100", "000100000111011"]
  };

  for (const [level, masks] of Object.entries(TABLE)) {
    for (let m = 0; m < 8; m++) {
      assert.equal(
        formatBits(level, m).toString(2).padStart(15, "0"),
        masks[m],
        `format bits for level ${level}, mask ${m}`
      );
    }
  }

  // All 32 must be distinct, or a decoder cannot recover the level and mask.
  const seen = new Set(Object.entries(TABLE).flatMap(([l]) => [0, 1, 2, 3, 4, 5, 6, 7].map((m) => formatBits(l, m))));
  assert.equal(seen.size, 32);
});

test("version information matches the standard's published values", () => {
  // ISO/IEC 18004 Table D.1, versions 7 upward. The first implementation used a
  // ten-bit generator polynomial instead of the thirteen-bit 0x1F25 and produced
  // output that looked reasonable and decoded as nothing.
  const KNOWN = [
    0x07c94, 0x085bc, 0x09a99, 0x0a4d3, 0x0bbf6, 0x0c762, 0x0d847, 0x0e60d, 0x0f928,
    0x10b78, 0x1145d, 0x12a17, 0x13532, 0x149a6
  ];
  for (let v = 7; v <= MAX_VERSION; v++) {
    assert.equal(versionBits(v), KNOWN[v - 7], `version information for v${v}`);
  }
});

test("the Reed–Solomon generator polynomial matches known coefficients", () => {
  // Degree 7, the version-1-L generator, from the standard's worked example.
  assert.deepEqual(generatorPoly(7), [1, 127, 122, 154, 164, 11, 68, 117]);
  for (const d of [10, 13, 16, 17, 26]) {
    assert.equal(generatorPoly(d).length, d + 1);
  }
});

test("version selection picks the smallest that fits", () => {
  assert.equal(chooseVersion(10, "M"), 1);
  assert.equal(chooseVersion(dataCapacity(1, "M") - 2, "M"), 1);
  assert.equal(chooseVersion(dataCapacity(1, "M"), "M"), 2, "one byte too many must step up");
  assert.throws(() => chooseVersion(5000, "H"), RangeError);
});

test("function patterns land where the standard says", () => {
  const qr = encodeQr("hello", { ecc: "M" });
  const m = qr.modules;
  assert.equal(qr.size, 21, "a short payload is version 1");

  // Finder centres are dark, their surrounding ring light.
  for (const [r, c] of [[3, 3], [3, qr.size - 4], [qr.size - 4, 3]]) {
    assert.equal(m[r][c], 1, `finder centre at ${r},${c}`);
  }
  // Timing patterns alternate.
  for (let i = 8; i < qr.size - 8; i++) {
    assert.equal(m[6][i], i % 2 === 0 ? 1 : 0, `horizontal timing at ${i}`);
    assert.equal(m[i][6], i % 2 === 0 ? 1 : 0, `vertical timing at ${i}`);
  }
  // The dark module is always set.
  assert.equal(m[4 * qr.version + 9][8], 1, "dark module");
});

test("mask selection actually minimises the penalty", () => {
  const text = "https://venue.local/patron/?venue=the-anchor";
  const auto = encodeQr(text);
  const scores = [];
  for (let mask = 0; mask < 8; mask++) {
    scores.push(_internals.penalty({ size: encodeQr(text, { mask }).size, modules: encodeQr(text, { mask }).modules }));
  }
  const bestScore = Math.min(...scores);
  assert.equal(scores[auto.mask], bestScore, "the chosen mask must be the lowest-penalty one");
});

/* ------------------------------------------------------------------- SVG */

test("SVG output is well-formed and sized correctly", () => {
  const qr = encodeQr("https://venue.local/join");
  const svg = toSvg(qr, { scale: 4, quiet: 4 });
  const dim = (qr.size + 8) * 4;

  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.ok(svg.includes(`width="${dim}"`) && svg.includes(`height="${dim}"`));
  assert.ok(svg.includes(`viewBox="0 0 ${dim} ${dim}"`));
  assert.ok(svg.trim().endsWith("</svg>"));
  assert.ok(svg.includes('role="img"'), "a display QR still needs an accessible name");
  // Balanced tags, no stray characters.
  assert.equal((svg.match(/</g) || []).length, (svg.match(/>/g) || []).length);
});

test("the quiet zone is present, because scanners need it", () => {
  const qr = encodeQr("x");
  const withZone = toSvg(qr, { scale: 1, quiet: 4 });
  const without = toSvg(qr, { scale: 1, quiet: 0 });
  assert.ok(withZone.includes(`width="${qr.size + 8}"`));
  assert.ok(without.includes(`width="${qr.size}"`));
});

/* ----------------------------------------------------------------- misc */

test("utf8Bytes matches Node's own encoder", () => {
  for (const s of ["plain", "Café", "日本語", "🎧", "mixed 日本 🎶 text"]) {
    assert.deepEqual(utf8Bytes(s), [...Buffer.from(s, "utf8")], `mismatch for "${s}"`);
  }
});

test("an unknown ECC level is refused", () => {
  assert.throws(() => encodeQr("x", { ecc: "Z" }), RangeError);
});

test("an over-long payload is refused rather than silently truncated", () => {
  assert.throws(() => encodeQr("A".repeat(5000)), RangeError);
});
