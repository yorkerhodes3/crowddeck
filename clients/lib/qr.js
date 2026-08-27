// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * QR Code encoder — ISO/IEC 18004, Model 2, byte mode. **DISP-1.**
 *
 * ## Why this exists rather than a dependency
 *
 * The venue display needs a QR so patrons can join by pointing a phone at a screen.
 * The project has **zero runtime dependencies** and this file keeps that true: it is
 * plain ES module JavaScript that runs unchanged in a browser and in Node.
 *
 * ## Why this is the second attempt
 *
 * A hand-rolled encoder was written earlier and **deleted**. Checked against a real
 * decoder it produced codes that did not scan — one confirmed bug (format-information
 * bits are placed LSB-first, which the first version got backwards) and 260 modules
 * still differing from a reference. A QR that fails in a venue is worse than no QR,
 * because the whole purpose of that screen is getting people to join.
 *
 * The lesson taken from that: **an encoder is only correct if a real decoder can read
 * it.** So `qr.test.js` renders the output to a bitmap and decodes it with `jsQR` — a
 * dev-only dependency used purely as an oracle. Unit tests over intermediate values
 * are useful but cannot tell you the thing you actually need to know.
 *
 * ## Scope
 *
 * Byte mode, versions 1–10, all four error-correction levels. A version-10 symbol at
 * level M holds 213 bytes, far more than any join URL, and stopping at 10 avoids the
 * larger alignment-pattern tables for capacity nobody needs.
 */

/* ------------------------------------------------------------------ tables */

/** Error-correction level → the two bits used in format information. */
export const ECC = Object.freeze({ L: 0b01, M: 0b00, Q: 0b11, H: 0b10 });

const ECC_ORDER = ["L", "M", "Q", "H"];

/**
 * Block structure per version and level: `[eccPerBlock, g1Blocks, g1Data, g2Blocks, g2Data]`.
 *
 * Transcribed from ISO/IEC 18004 Table 9. Transcription is exactly the kind of thing
 * that fails silently, so `qr.test.js` recomputes each row's total codeword count from
 * the symbol's geometry and fails if any entry disagrees.
 */
const BLOCKS = Object.freeze({
  1: { L: [7, 1, 19, 0, 0], M: [10, 1, 16, 0, 0], Q: [13, 1, 13, 0, 0], H: [17, 1, 9, 0, 0] },
  2: { L: [10, 1, 34, 0, 0], M: [16, 1, 28, 0, 0], Q: [22, 1, 22, 0, 0], H: [28, 1, 16, 0, 0] },
  3: { L: [15, 1, 55, 0, 0], M: [26, 1, 44, 0, 0], Q: [18, 2, 17, 0, 0], H: [22, 2, 13, 0, 0] },
  4: { L: [20, 1, 80, 0, 0], M: [18, 2, 32, 0, 0], Q: [26, 2, 24, 0, 0], H: [16, 4, 9, 0, 0] },
  5: { L: [26, 1, 108, 0, 0], M: [24, 2, 43, 0, 0], Q: [18, 2, 15, 2, 16], H: [22, 2, 11, 2, 12] },
  6: { L: [18, 2, 68, 0, 0], M: [16, 4, 27, 0, 0], Q: [24, 4, 19, 0, 0], H: [28, 4, 15, 0, 0] },
  7: { L: [20, 2, 78, 0, 0], M: [18, 4, 31, 0, 0], Q: [18, 2, 14, 4, 15], H: [26, 4, 13, 1, 14] },
  8: { L: [24, 2, 97, 0, 0], M: [22, 2, 38, 2, 39], Q: [22, 4, 18, 2, 19], H: [26, 4, 14, 2, 15] },
  9: { L: [30, 2, 116, 0, 0], M: [22, 3, 36, 2, 37], Q: [20, 4, 16, 4, 17], H: [24, 4, 12, 4, 13] },
  10: { L: [18, 2, 68, 2, 69], M: [26, 4, 43, 1, 44], Q: [24, 6, 19, 2, 20], H: [28, 6, 15, 2, 16] }
});

export const MAX_VERSION = 10;

/** Alignment-pattern centre coordinates. Version 1 has none. */
const ALIGNMENT = Object.freeze({
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
});

/* ------------------------------------------------------- GF(256) arithmetic */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // the QR field's primitive polynomial
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

/** Reed–Solomon generator polynomial for `degree` error-correction codewords. */
function generatorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

/** @param {number[]} data @param {number} eccLen @returns {number[]} */
function reedSolomon(data, eccLen) {
  const gen = generatorPoly(eccLen);
  const rem = new Array(eccLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem[0];
    rem.shift();
    rem.push(0);
    for (let i = 0; i < eccLen; i++) rem[i] ^= gfMul(gen[i + 1], factor);
  }
  return rem;
}

/* ------------------------------------------------------------- bit plumbing */

class BitBuffer {
  constructor() {
    this.bits = [];
  }
  put(value, length) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }
  get length() {
    return this.bits.length;
  }
  toBytes() {
    const out = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | (this.bits[i + j] ?? 0);
      out.push(b);
    }
    return out;
  }
}

/** Total data codewords available at a version and level. */
function dataCapacity(version, level) {
  const [, g1, d1, g2, d2] = BLOCKS[version][level];
  return g1 * d1 + g2 * d2;
}

/** Byte-mode character-count indicator is 8 bits below version 10, else 16. */
const countBits = (version) => (version < 10 ? 8 : 16);

function chooseVersion(byteLength, level, minVersion = 1) {
  for (let v = Math.max(1, minVersion); v <= MAX_VERSION; v++) {
    const needed = 4 + countBits(v) + byteLength * 8;
    if (needed <= dataCapacity(v, level) * 8) return v;
  }
  throw new RangeError(
    `${byteLength} bytes does not fit in a version-${MAX_VERSION} symbol at level ${level}`
  );
}

/* --------------------------------------------------------------- codewords */

function buildCodewords(bytes, version, level) {
  const [eccLen, g1, d1, g2, d2] = BLOCKS[version][level];
  const capacity = dataCapacity(version, level);

  const bb = new BitBuffer();
  bb.put(0b0100, 4); // byte mode
  bb.put(bytes.length, countBits(version));
  for (const b of bytes) bb.put(b, 8);

  // Terminator, up to four zero bits, then pad to a byte boundary.
  const spare = capacity * 8 - bb.length;
  bb.put(0, Math.min(4, spare));
  while (bb.length % 8 !== 0) bb.put(0, 1);

  const data = bb.toBytes();
  // Alternating pad bytes specified by the standard.
  const PADS = [0xec, 0x11];
  for (let i = 0; data.length < capacity; i++) data.push(PADS[i % 2]);

  // Split into blocks, compute ECC per block.
  const blocks = [];
  let offset = 0;
  for (let i = 0; i < g1 + g2; i++) {
    const size = i < g1 ? d1 : d2;
    const chunk = data.slice(offset, offset + size);
    offset += size;
    blocks.push({ data: chunk, ecc: reedSolomon(chunk, eccLen) });
  }

  // Interleave: all blocks' first data codeword, then all seconds, and so on.
  const out = [];
  const maxData = Math.max(d1, d2);
  for (let i = 0; i < maxData; i++) {
    for (const blk of blocks) if (i < blk.data.length) out.push(blk.data[i]);
  }
  for (let i = 0; i < eccLen; i++) {
    for (const blk of blocks) out.push(blk.ecc[i]);
  }
  return out;
}

/* ------------------------------------------------------------------ matrix */

const SIZE = (version) => version * 4 + 17;

/**
 * `modules` holds the symbol; `reserved` marks function patterns, which masking
 * must never touch and data placement must skip.
 */
function blankMatrix(version) {
  const n = SIZE(version);
  return {
    size: n,
    modules: Array.from({ length: n }, () => new Uint8Array(n)),
    reserved: Array.from({ length: n }, () => new Uint8Array(n))
  };
}

function setFunction(m, row, col, dark) {
  m.modules[row][col] = dark ? 1 : 0;
  m.reserved[row][col] = 1;
}

function placeFinder(m, row, col) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || rr >= m.size || cc < 0 || cc >= m.size) continue;
      const inRing =
        (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      setFunction(m, rr, cc, inRing || inCore);
    }
  }
}

function placeFunctionPatterns(m, version) {
  placeFinder(m, 0, 0);
  placeFinder(m, 0, m.size - 7);
  placeFinder(m, m.size - 7, 0);

  // Timing patterns.
  for (let i = 8; i < m.size - 8; i++) {
    setFunction(m, 6, i, i % 2 === 0);
    setFunction(m, i, 6, i % 2 === 0);
  }

  // Alignment patterns, except where they would collide with a finder.
  const centres = ALIGNMENT[version];
  for (const r of centres) {
    for (const c of centres) {
      const nearFinder =
        (r <= 8 && c <= 8) || (r <= 8 && c >= m.size - 9) || (r >= m.size - 9 && c <= 8);
      if (nearFinder) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const ring = Math.max(Math.abs(dr), Math.abs(dc));
          setFunction(m, r + dr, c + dc, ring !== 1);
        }
      }
    }
  }

  // Reserve the format-information areas.
  for (let i = 0; i < 9; i++) {
    if (!m.reserved[8][i]) setFunction(m, 8, i, false);
    if (!m.reserved[i][8]) setFunction(m, i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    setFunction(m, 8, m.size - 1 - i, false);
    setFunction(m, m.size - 1 - i, 8, false);
  }

  // The dark module — always set, always at this position.
  setFunction(m, 4 * version + 9, 8, true);

  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const r = Math.floor(i / 3);
      const c = m.size - 11 + (i % 3);
      setFunction(m, r, c, false);
      setFunction(m, c, r, false);
    }
  }
}

/** Zig-zag placement, right to left in two-column strips, skipping the timing column. */
function placeData(m, codewords) {
  let bitIndex = 0;
  let upward = true;

  for (let right = m.size - 1; right >= 1; right -= 2) {
    // Column 6 is the vertical timing pattern; strips shift left by one past it.
    if (right === 6) right = 5;

    for (let step = 0; step < m.size; step++) {
      const row = upward ? m.size - 1 - step : step;
      for (let c = 0; c < 2; c++) {
        const col = right - c;
        if (m.reserved[row][col]) continue;
        const byte = codewords[bitIndex >>> 3];
        const bit = byte === undefined ? 0 : (byte >>> (7 - (bitIndex & 7))) & 1;
        m.modules[row][col] = bit;
        bitIndex++;
      }
    }
    upward = !upward;
  }
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
];

function applyMask(m, maskIndex) {
  const fn = MASKS[maskIndex];
  for (let r = 0; r < m.size; r++) {
    for (let c = 0; c < m.size; c++) {
      if (m.reserved[r][c]) continue;
      if (fn(r, c)) m.modules[r][c] ^= 1;
    }
  }
}

/** ISO/IEC 18004 §8.8.2 penalty rules. Lower is better. */
function penalty(m) {
  const n = m.size;
  let score = 0;

  // Rule 1 — runs of five or more identical modules.
  for (let i = 0; i < n; i++) {
    for (const horizontal of [true, false]) {
      let run = 1;
      let prev = horizontal ? m.modules[i][0] : m.modules[0][i];
      for (let j = 1; j < n; j++) {
        const v = horizontal ? m.modules[i][j] : m.modules[j][i];
        if (v === prev) {
          run++;
        } else {
          if (run >= 5) score += run - 2;
          prev = v;
          run = 1;
        }
      }
      if (run >= 5) score += run - 2;
    }
  }

  // Rule 2 — 2×2 blocks of one colour.
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = m.modules[r][c];
      if (v === m.modules[r][c + 1] && v === m.modules[r + 1][c] && v === m.modules[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  // Rule 3 — finder-like 1:1:3:1:1 patterns with four light modules on one side.
  const A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const matches = (get, j) => {
    let a = true;
    let b = true;
    for (let k = 0; k < 11; k++) {
      const v = get(j + k);
      if (v !== A[k]) a = false;
      if (v !== B[k]) b = false;
    }
    return a || b;
  };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j + 11 <= n; j++) {
      if (matches((x) => m.modules[i][x], j)) score += 40;
      if (matches((x) => m.modules[x][i], j)) score += 40;
    }
  }

  // Rule 4 — deviation of dark-module proportion from 50%.
  let dark = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) dark += m.modules[r][c];
  const percent = (dark * 100) / (n * n);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

/** BCH(15,5) format information, XOR-masked as the standard requires. */
function formatBits(level, maskIndex) {
  const data = (ECC[level] << 3) | maskIndex;
  let rem = data;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >>> 9) * 0b10100110111);
  }
  return (((data << 10) | rem) ^ 0b101010000010010) & 0x7fff;
}

/** BCH(18,6) version information, versions 7 and above. */
function versionBits(version) {
  // The generator is x^12+x^11+x^10+x^9+x^8+x^5+x^2+1 = 0x1F25, thirteen bits.
  // The first attempt used a ten-bit constant, which produced plausible-looking
  // output that no decoder could read.
  let rem = version;
  for (let i = 0; i < 12; i++) {
    rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  }
  return ((version << 12) | rem) & 0x3ffff;
}

function placeFormat(m, version, level, maskIndex) {
  const bits = formatBits(level, maskIndex);

  // Bit 0 is the LSB. The mapping below was derived empirically against a reference
  // encoder rather than written from memory, because this is precisely where the
  // first attempt failed: it had rows and columns transposed, which produces a
  // symbol that looks entirely plausible and decodes as nothing.
  for (let i = 0; i < 15; i++) {
    const bit = (bits >>> i) & 1;

    // Copy one: up the left edge of the top-left finder, then along row 8.
    if (i < 6) m.modules[i][8] = bit;
    else if (i === 6) m.modules[7][8] = bit; // row 6 is the timing pattern
    else if (i === 7) m.modules[8][8] = bit;
    else if (i === 8) m.modules[8][7] = bit; // column 6 is the timing pattern
    else m.modules[8][14 - i] = bit;

    // Copy two: right-to-left along row 8, then down the left of the bottom finder.
    if (i < 8) m.modules[8][m.size - 1 - i] = bit;
    else m.modules[m.size - 15 + i][8] = bit;
  }

  m.modules[4 * version + 9][8] = 1; // the dark module survives masking
}

function placeVersion(m, version) {
  if (version < 7) return;
  const bits = versionBits(version);
  for (let i = 0; i < 18; i++) {
    const bit = (bits >>> i) & 1;
    const r = Math.floor(i / 3);
    const c = m.size - 11 + (i % 3);
    m.modules[r][c] = bit;
    m.modules[c][r] = bit;
  }
}

/* -------------------------------------------------------------- public API */

/**
 * @param {string} text
 * @param {{ecc?: "L"|"M"|"Q"|"H", minVersion?: number, mask?: number}} [opts]
 * @returns {{size: number, version: number, mask: number, ecc: string, modules: Uint8Array[]}}
 */
export function encodeQr(text, opts = {}) {
  const level = opts.ecc ?? "M";
  if (!ECC_ORDER.includes(level)) {
    throw new RangeError(`unknown error-correction level ${JSON.stringify(level)}`);
  }

  const bytes = utf8Bytes(text);
  const version = chooseVersion(bytes.length, level, opts.minVersion);
  const codewords = buildCodewords(bytes, version, level);

  let best = null;
  const candidates = opts.mask === undefined ? [0, 1, 2, 3, 4, 5, 6, 7] : [opts.mask];

  for (const maskIndex of candidates) {
    const m = blankMatrix(version);
    placeFunctionPatterns(m, version);
    placeData(m, codewords);
    applyMask(m, maskIndex);
    placeFormat(m, version, level, maskIndex);
    placeVersion(m, version);

    const score = penalty(m);
    if (!best || score < best.score) best = { m, score, maskIndex };
  }

  return {
    size: best.m.size,
    version,
    mask: best.maskIndex,
    ecc: level,
    modules: best.m.modules
  };
}

/** UTF-8 without depending on TextEncoder, so this runs anywhere. */
export function utf8Bytes(str) {
  const out = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    else {
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 63),
        0x80 | ((cp >> 6) & 63),
        0x80 | (cp & 63)
      );
    }
  }
  return out;
}

/**
 * An SVG string. One path of rectangles rather than a `<rect>` per module keeps the
 * DOM small on a display that may run for weeks without a reload.
 *
 * @param {ReturnType<typeof encodeQr>} qr
 * @param {{scale?: number, quiet?: number, dark?: string, light?: string}} [opts]
 */
export function toSvg(qr, opts = {}) {
  const scale = opts.scale ?? 4;
  // Four modules of quiet zone is the standard's minimum; less and scanners struggle.
  const quiet = opts.quiet ?? 4;
  const dim = (qr.size + quiet * 2) * scale;

  let d = "";
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.modules[r][c]) {
        d += `M${(c + quiet) * scale} ${(r + quiet) * scale}h${scale}v${scale}h-${scale}z`;
      }
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" ` +
    `viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges" role="img" ` +
    `aria-label="QR code to join">` +
    `<rect width="${dim}" height="${dim}" fill="${opts.light ?? "#ffffff"}"/>` +
    `<path d="${d}" fill="${opts.dark ?? "#000000"}"/>` +
    `</svg>`
  );
}

export const _internals = {
  BLOCKS,
  ALIGNMENT,
  SIZE,
  dataCapacity,
  reedSolomon,
  generatorPoly,
  formatBits,
  versionBits,
  chooseVersion,
  buildCodewords,
  penalty
};
