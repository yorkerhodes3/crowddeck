// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Control addressing and descriptors — REQ-CDEP-5, REQ-CDEP-6, REQ-CDEP-12.
 *
 * Controls are addressed by `(group, item)`, mirroring the vocabulary Mixxx's
 * Control bus already exposes to its scripting layer. Adopting that vocabulary
 * rather than inventing one is what makes the headless extraction in ADR-002
 * tractable.
 */

import { CdepError, ErrorCode } from "./errors.js";

/** @typedef {"bool"|"int"|"float"|"enum"} ControlType */

/**
 * @typedef {object} ControlDescriptor
 * @property {string} group    e.g. "[Channel1]", "[Master]"
 * @property {string} item     e.g. "play", "rate"
 * @property {ControlType} type
 * @property {number} min
 * @property {number} max
 * @property {number} default
 * @property {boolean} readonly
 * @property {string} label    human-readable, for UI and mapping target lists
 * @property {string[]} [values] enum member names, when type === "enum"
 * @property {boolean} [highRate] true for controls that change continuously
 *   (playposition, meters). These are never sent unsubscribed — REQ-CDEP-15.
 */

/** Deck group names are `[Channel1]`…`[ChannelN]` — REQ-CDEP-6. */
export function deckGroup(index) {
  if (!Number.isInteger(index) || index < 1) {
    throw new RangeError(`deck index must be a positive integer, got ${index}`);
  }
  return `[Channel${index}]`;
}

/** The master bus group — REQ-CDEP-6. */
export const MASTER_GROUP = "[Master]";

/**
 * @param {string} group
 * @param {string} item
 * @returns {string} a stable key for maps and subscription sets
 */
export function controlKey(group, item) {
  return `${group}\u0000${item}`;
}

/**
 * Build a descriptor, filling defaults so call sites stay readable.
 * @param {Partial<ControlDescriptor> & {group: string, item: string, label: string}} d
 * @returns {ControlDescriptor}
 */
export function control(d) {
  const type = d.type ?? "float";
  const min = d.min ?? (type === "bool" ? 0 : 0);
  const max = d.max ?? (type === "bool" ? 1 : 1);
  return {
    group: d.group,
    item: d.item,
    type,
    min,
    max,
    default: d.default ?? min,
    readonly: d.readonly ?? false,
    label: d.label,
    ...(d.values ? { values: d.values } : {}),
    ...(d.highRate ? { highRate: true } : {})
  };
}

/**
 * Validate and normalise a value against a descriptor.
 *
 * Out-of-range values are rejected rather than clamped: silently clamping hides
 * mapping bugs, and a MIDI mapping that sends 1.5 to a 0..1 control is a defect
 * the author should see.
 *
 * @param {ControlDescriptor} desc
 * @param {unknown} value
 * @returns {number}
 * @throws {CdepError}
 */
export function coerceValue(desc, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new CdepError(
      ErrorCode.INVALID_FIELD,
      `${desc.group}/${desc.item}: value must be a finite number`
    );
  }
  if (desc.type === "bool") {
    if (value !== 0 && value !== 1) {
      throw new CdepError(
        ErrorCode.VALUE_OUT_OF_RANGE,
        `${desc.group}/${desc.item}: bool accepts 0 or 1, got ${value}`
      );
    }
    return value;
  }
  if (desc.type === "int" && !Number.isInteger(value)) {
    throw new CdepError(
      ErrorCode.VALUE_OUT_OF_RANGE,
      `${desc.group}/${desc.item}: expects an integer, got ${value}`
    );
  }
  if (value < desc.min || value > desc.max) {
    throw new CdepError(
      ErrorCode.VALUE_OUT_OF_RANGE,
      `${desc.group}/${desc.item}: ${value} outside [${desc.min}, ${desc.max}]`
    );
  }
  return value;
}
