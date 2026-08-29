// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Running the pitch shifter inside an AudioWorklet — DJX-13.
 *
 * ## Why this file exists at all
 *
 * An AudioWorklet module **cannot use `import`**. Verified rather than assumed:
 * loading a worklet whose first line is `import { NUM } from "./mod.js"` fails
 * with "Unable to load a worklet's module", with no further detail — the module
 * simply never registers, and the only symptom is a deck that produces silence.
 *
 * That leaves three ways to get `keylock.js` into the worklet, and only one of
 * them keeps a single copy of the algorithm:
 *
 * - Paste the algorithm into the worklet. Two copies, guaranteed to drift, and
 *   the copy that gets tested is the one that is not used.
 * - Generate the worklet at build time. Works, but adds a build step to a
 *   project whose demo is meant to be openable as a plain static page.
 * - **Fetch the module's source and assemble the worklet at runtime.** One copy,
 *   no build step, and the tested file is literally the file that runs.
 *
 * The third is what this does. `export` statements are harmless inside the
 * assembled module — also verified — so the source needs no rewriting.
 */

import { PitchShifter } from "./keylock.js";

/** The processor name registered inside the worklet. */
export const KEYLOCK_PROCESSOR = "crowddeck-keylock";

/**
 * The part that is genuinely worklet-specific: adapting Web Audio's channel
 * arrays to the shifter, and carrying control changes across the thread
 * boundary. Everything else is the shared module.
 */
const PROCESSOR_SHELL = `
class KeylockProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.shifter = new PitchShifter({ channels: opts.channels || 2 });
    this.silentBlocks = 0;
    this.port.onmessage = (event) => {
      const msg = event.data || {};
      if (typeof msg.ratio === "number") this.shifter.setRatio(msg.ratio);
      if (msg.reset) this.shifter.reset();
    };
    // The node's delay is decided by the algorithm, not by the caller, so the
    // engine is told rather than asked.
    this.port.postMessage({ latency: this.shifter.latency });
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    if (!input || input.length === 0) {
      // A disconnected source gives no input at all. Feeding silence through
      // keeps the delay line running so the buffered tail still drains, rather
      // than freezing the last block for as long as the source is idle.
      const silence = new Float32Array(output[0].length);
      const ins = [];
      for (let c = 0; c < output.length; c += 1) ins.push(silence);
      this.shifter.processChannels(ins, output);
      return true;
    }

    const ins = [];
    for (let c = 0; c < output.length; c += 1) {
      // Web Audio may hand us fewer input channels than output channels; a mono
      // source feeding a stereo node is normal rather than an error.
      ins.push(input[c < input.length ? c : input.length - 1]);
    }
    this.shifter.processChannels(ins, output);
    return true;
  }
}

registerProcessor(${JSON.stringify(KEYLOCK_PROCESSOR)}, KeylockProcessor);
`;

/** Caches the load per AudioContext — `addModule` twice is an error. */
const loaded = new WeakMap();

/**
 * Make the keylock processor available on `ctx`.
 *
 * Resolves to `true` when the worklet is ready, and `false` when it is not
 * available for any reason. It deliberately does not throw: a browser without
 * AudioWorklet should lose *keylock*, not the ability to play records, and the
 * engine reports the control as unsupported exactly as it did before.
 *
 * @param {BaseAudioContext} ctx
 * @param {string|URL} [sourceUrl] Where to fetch `keylock.js` from.
 * @returns {Promise<boolean>}
 */
export async function loadKeylockWorklet(ctx, sourceUrl) {
  if (!ctx || !ctx.audioWorklet) return false;
  if (loaded.has(ctx)) return loaded.get(ctx);

  const attempt = (async () => {
    try {
      const url = sourceUrl ?? new URL("./keylock.js", import.meta.url);
      const response = await fetch(url);
      if (!response.ok) return false;
      const algorithm = await response.text();

      const blob = new Blob([algorithm, "\n", PROCESSOR_SHELL], { type: "text/javascript" });
      const blobUrl = URL.createObjectURL(blob);
      try {
        await ctx.audioWorklet.addModule(blobUrl);
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
      return true;
    } catch {
      return false;
    }
  })();

  loaded.set(ctx, attempt);
  return attempt;
}

/**
 * The delay the shifter imposes, in samples, without needing a worklet.
 *
 * The engine has to know this before any audio flows — it is what lets every
 * deck be delayed identically whether or not keylock is engaged — and asking
 * the worklet would make it available only after an async round trip.
 *
 * @param {object} [opts]
 * @returns {number}
 */
export function keylockLatencySamples(opts) {
  return new PitchShifter(opts).latency;
}
