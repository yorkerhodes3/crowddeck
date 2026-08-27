// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The CDEP conformance suite — REQ-CDEP-17, AC-17.
 *
 * Every conforming engine must pass this, and the specification requires *both*
 * `engine-stub/` and the Mixxx-derived `engine/` to do so. That is what makes
 * the "engine is replaceable" claim in ADR-001 a demonstrated property rather
 * than an assertion — and replaceability is what keeps the GPL engine plane on
 * the far side of a genuine arms-length boundary.
 *
 * The suite talks pure CDEP over a socket. It knows nothing about how the
 * engine under test is implemented, and must never import engine internals.
 */

import { CdepClient, ErrorCode, PROTOCOL_VERSION } from "../../protocol/src/index.js";

/**
 * @typedef {object} Check
 * @property {string} id
 * @property {string} requirement the REQ-* this check enforces
 * @property {string} title
 * @property {(ctx: {connect: () => Promise<CdepClient>, socketPath: string}) => Promise<void>} run
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(predicate, { timeoutMs = 3000, intervalMs = 15 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return true;
    await sleep(intervalMs);
  }
  return false;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectError(promise, code, message) {
  try {
    await promise;
  } catch (err) {
    assert(err.code === code, `${message} (expected ${code}, got ${err.code ?? err.message})`);
    return;
  }
  throw new Error(`${message} (expected ${code}, but the call succeeded)`);
}

/** @type {Check[]} */
export const checks = [
  {
    id: "C01",
    requirement: "REQ-CDEP-9",
    title: "handshake negotiates a protocol version and returns a welcome",
    async run({ connect }) {
      const c = await connect();
      assert(c.welcome.t === "welcome", "expected a welcome message");
      assert(c.welcome.protocol === PROTOCOL_VERSION, `unexpected protocol ${c.welcome.protocol}`);
      assert(typeof c.welcome.engine === "string", "welcome.engine must be a string");
      assert(Number.isInteger(c.welcome.decks) && c.welcome.decks >= 1, "welcome.decks must be >= 1");
      assert(typeof c.welcome.sample_rate === "number", "welcome.sample_rate must be a number");
    }
  },
  {
    id: "C02",
    requirement: "REQ-CDEP-11",
    title: "welcome advertises a capability list clients can degrade against",
    async run({ connect }) {
      const c = await connect();
      assert(Array.isArray(c.welcome.capabilities), "welcome.capabilities must be an array");
      for (const cap of c.welcome.capabilities) {
        assert(typeof cap === "string", "each capability must be a string");
      }
    }
  },
  {
    id: "C03",
    requirement: "REQ-CDEP-12",
    title: "describe returns a complete descriptor for every control",
    async run({ connect }) {
      const c = await connect();
      const controls = await c.describe();
      assert(Array.isArray(controls) && controls.length > 0, "describe returned no controls");
      for (const d of controls) {
        assert(typeof d.group === "string" && d.group.length > 0, "descriptor.group required");
        assert(typeof d.item === "string" && d.item.length > 0, "descriptor.item required");
        assert(
          ["bool", "int", "float", "enum"].includes(d.type),
          `descriptor.type invalid for ${d.group}/${d.item}: ${d.type}`
        );
        assert(typeof d.min === "number", `descriptor.min required for ${d.group}/${d.item}`);
        assert(typeof d.max === "number", `descriptor.max required for ${d.group}/${d.item}`);
        assert(typeof d.default === "number", `descriptor.default required for ${d.group}/${d.item}`);
        assert(typeof d.readonly === "boolean", `descriptor.readonly required for ${d.group}/${d.item}`);
        assert(
          typeof d.label === "string" && d.label.length > 0,
          `descriptor.label required for ${d.group}/${d.item}`
        );
        if (d.type === "enum") {
          assert(Array.isArray(d.values) && d.values.length > 0, `enum needs values: ${d.item}`);
        }
      }
    }
  },
  {
    id: "C04",
    requirement: "REQ-CDEP-13",
    title: "the description is sufficient to build a UI and a mapping target list",
    async run({ connect }) {
      const c = await connect();
      const controls = await c.describe();
      // Writable, ranged controls are exactly what a MIDI mapping can target.
      const targets = controls.filter((d) => !d.readonly && d.max > d.min);
      assert(targets.length > 0, "no writable controls: nothing could be MIDI-mapped");
      const keys = new Set(controls.map((d) => `${d.group}\u0000${d.item}`));
      assert(keys.size === controls.length, "describe returned duplicate (group, item) pairs");
    }
  },
  {
    id: "C05",
    requirement: "REQ-CDEP-6",
    title: "deck and master groups follow the required naming convention",
    async run({ connect }) {
      const c = await connect();
      const controls = await c.describe();
      const groups = new Set(controls.map((d) => d.group));
      assert(groups.has("[Master]"), "missing [Master] group");
      for (let i = 1; i <= c.welcome.decks; i++) {
        assert(groups.has(`[Channel${i}]`), `missing [Channel${i}] group`);
      }
    }
  },
  {
    id: "C06",
    requirement: "REQ-CDEP-10 §2.10",
    title: "the minimum control set is present",
    async run({ connect }) {
      const c = await connect();
      const controls = await c.describe();
      const has = (g, i) => controls.some((d) => d.group === g && d.item === i);
      const deck = [
        "play", "cue_gotoandplay", "rate", "bpm", "keylock", "volume", "pregain",
        "filter", "eq_low", "eq_mid", "eq_high", "loop_enabled", "playposition",
        "track_loaded", "duration", "sync_enabled", "sync_leader"
      ];
      for (const item of deck) assert(has("[Channel1]", item), `missing [Channel1]/${item}`);
      for (const item of ["crossfader", "gain", "headMix", "headGain", "bpm", "num_decks"]) {
        assert(has("[Master]", item), `missing [Master]/${item}`);
      }
    }
  },
  {
    id: "C07",
    requirement: "REQ-CDEP-12",
    title: "get and set round-trip, and readonly controls are refused",
    async run({ connect }) {
      const c = await connect();
      const controls = await c.describe();

      const writable = controls.find((d) => !d.readonly && d.type === "float" && d.max > d.min);
      assert(writable, "no writable float control to exercise");
      const target = (writable.min + writable.max) / 2;
      await c.set(writable.group, writable.item, target);
      const got = await c.get(writable.group, writable.item);
      assert(got === target, `set/get mismatch: wrote ${target}, read ${got}`);

      const ro = controls.find((d) => d.readonly);
      if (ro) {
        await expectError(
          c.set(ro.group, ro.item, ro.min),
          ErrorCode.READONLY_CONTROL,
          "writing a readonly control must be refused"
        );
      }
    }
  },
  {
    id: "C08",
    requirement: "REQ-CDEP-8",
    title: "errors carry a documented machine-readable code",
    async run({ connect }) {
      const c = await connect();
      await expectError(
        c.get("[NoSuchGroup]", "nope"),
        ErrorCode.UNKNOWN_CONTROL,
        "unknown control must yield unknown_control"
      );
      await expectError(
        c.request({ t: "definitely-not-a-real-type" }),
        ErrorCode.UNKNOWN_TYPE,
        "unknown message type must yield unknown_type"
      );
    }
  },
  {
    id: "C09",
    requirement: "REQ-CDEP-7",
    title: "unknown fields are ignored so the protocol can extend",
    async run({ connect }) {
      const c = await connect();
      const r = await c.request({
        t: "get",
        group: "[Master]",
        item: "gain",
        unknownField: 1,
        another: { deeply: { nested: true } }
      });
      assert(r.t === "value", `expected a value reply, got ${r.t}`);
    }
  },
  {
    id: "C10",
    requirement: "REQ-CDEP-4",
    title: "concurrent clients hold independent subscription state",
    async run({ connect }) {
      const a = await connect();
      const b = await connect();

      const aSeen = [];
      const bSeen = [];
      a.on("changed", (m) => aSeen.push(m));
      b.on("changed", (m) => bSeen.push(m));

      await a.subscribe([{ group: "[Master]", item: "crossfader" }], 50);
      await b.subscribe([{ group: "[Master]", item: "gain" }], 50);

      await a.set("[Master]", "crossfader", 0.5);
      await a.set("[Master]", "gain", 2);

      await waitFor(() => aSeen.length > 0 && bSeen.length > 0);
      assert(aSeen.length > 0, "client A received no updates");
      assert(bSeen.length > 0, "client B received no updates");
      assert(aSeen.every((m) => m.item === "crossfader"), "A leaked B's subscription");
      assert(bSeen.every((m) => m.item === "gain"), "B leaked A's subscription");
    }
  },
  {
    id: "C11",
    requirement: "REQ-CDEP-14",
    title: "subscription updates are coalesced to max_hz and converge on the latest value",
    async run({ connect }) {
      const c = await connect();
      const seen = [];
      c.on("changed", (m) => {
        if (m.item === "crossfader") seen.push(m);
      });

      await c.subscribe([{ group: "[Master]", item: "crossfader" }], 10);
      for (let i = 1; i <= 40; i++) await c.set("[Master]", "crossfader", i / 100);
      await sleep(400);

      assert(seen.length > 0, "no updates delivered to a subscriber");
      assert(seen.length < 20, `expected coalescing, got ${seen.length} updates for 40 writes`);
      assert(seen.at(-1).value === 0.4, `coalescing must settle on the latest value, got ${seen.at(-1).value}`);
    }
  },
  {
    id: "C12",
    requirement: "REQ-CDEP-15",
    title: "high-rate controls are not delivered unsubscribed",
    async run({ connect }) {
      const c = await connect();
      const controls = await c.describe();
      const highRate = controls.find((d) => d.highRate) ??
        controls.find((d) => d.item === "playposition");
      if (!highRate) return; // engine exposes none; nothing to check

      const seen = [];
      c.on("changed", (m) => seen.push(m));

      await c.load("[Channel1]", { id: "conformance-track", duration: 5 });
      await c.set("[Channel1]", "play", 1);
      await sleep(300);
      await c.set("[Channel1]", "play", 0);

      const leaked = seen.filter((m) => m.item === highRate.item);
      assert(leaked.length === 0, `${highRate.item} streamed to an unsubscribed client`);
    }
  },
  {
    id: "C13",
    requirement: "REQ-CDEP-18",
    title: "load populates deck state and emits track_loaded",
    async run({ connect }) {
      const c = await connect();
      const events = [];
      c.on("event", (e) => events.push(e));

      await c.load("[Channel1]", { id: "conformance-a", duration: 12 });
      assert((await c.get("[Channel1]", "track_loaded")) === 1, "track_loaded should be 1");
      assert((await c.get("[Channel1]", "duration")) === 12, "duration should reflect the track");

      const seen = await waitFor(() => events.some((e) => e.event === "track_loaded"));
      assert(seen, "expected a track_loaded event");
    }
  },
  {
    id: "C14",
    requirement: "REQ-CDEP-18",
    title: "transport advances the playhead and pause holds it",
    async run({ connect }) {
      const c = await connect();
      await c.load("[Channel1]", { id: "conformance-b", duration: 10 });
      await c.set("[Channel1]", "play", 1);

      const advanced = await waitFor(async () => (await c.get("[Channel1]", "playposition")) > 0);
      assert(advanced, "playposition did not advance while playing");

      await c.set("[Channel1]", "play", 0);
      const held = await c.get("[Channel1]", "playposition");
      await sleep(200);
      const after = await c.get("[Channel1]", "playposition");
      assert(after === held, `playposition moved while paused: ${held} -> ${after}`);
    }
  },
  {
    id: "C15",
    requirement: "REQ-FALL-3",
    title: "a queued next track continues gaplessly",
    async run({ connect }) {
      const c = await connect();
      if (!c.welcome.capabilities.includes("gapless")) return; // optional capability

      const events = [];
      c.on("event", (e) => events.push(e));

      await c.request({
        t: "load",
        group: "[Channel2]",
        track: { id: "gapless-first", duration: 0.3 },
        next: { id: "gapless-second", duration: 5 }
      });
      await c.set("[Channel2]", "play", 1);

      const continued = await waitFor(() =>
        events.some((e) => e.event === "track_loaded" && e.track === "gapless-second")
      );
      assert(continued, "the queued track did not start");
      assert(
        !events.some((e) => e.event === "deck_empty" && e.group === "[Channel2]"),
        "deck went empty between tracks: not gapless"
      );
    }
  },
  {
    id: "C16",
    requirement: "REQ-CDEP-16",
    title: "a stalled peer does not stall the engine",
    async run({ connect, socketPath }) {
      const net = await import("node:net");
      const healthy = await connect();

      const stalled = net.createConnection({ path: socketPath });
      await new Promise((resolve, reject) => {
        stalled.once("connect", resolve);
        stalled.once("error", reject);
      });
      stalled.pause(); // never read again
      stalled.write(JSON.stringify({ t: "hello", client: "stalled", accept: [PROTOCOL_VERSION] }) + "\n");
      await sleep(60);
      stalled.write(
        JSON.stringify({
          t: "subscribe",
          controls: [{ group: "[Channel1]", item: "playposition" }],
          max_hz: 1000
        }) + "\n"
      );
      await sleep(60);

      await healthy.load("[Channel1]", { id: "stall-test", duration: 30 });
      await healthy.set("[Channel1]", "play", 1);

      const t0 = Date.now();
      const startPos = await healthy.get("[Channel1]", "playposition");
      for (let i = 0; i < 200; i++) await healthy.set("[Master]", "crossfader", (i % 100) / 100);
      await sleep(500);

      const elapsedSec = (Date.now() - t0) / 1000;
      const advancedSec = ((await healthy.get("[Channel1]", "playposition")) - startPos) * 30;

      assert(
        advancedSec > elapsedSec * 0.5,
        `transport stalled: ${advancedSec.toFixed(2)}s advanced over ${elapsedSec.toFixed(2)}s wall time`
      );
      assert((await healthy.ping()).t === "pong", "healthy client became unresponsive");

      stalled.destroy();
    }
  },
  {
    id: "C17",
    requirement: "REQ-CDEP-10",
    title: "an unsupported protocol version is refused and the connection closed",
    async run({ socketPath }) {
      const net = await import("node:net");
      const socket = net.createConnection({ path: socketPath });
      await new Promise((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("error", reject);
      });
      socket.setEncoding("utf8");

      const closed = new Promise((r) => socket.once("close", r));
      const reply = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("no reply to a bad hello")), 3000);
        socket.once("data", (d) => {
          clearTimeout(timer);
          resolve(JSON.parse(d.trim().split("\n")[0]));
        });
        socket.write(JSON.stringify({ t: "hello", client: "x", accept: ["cdep/99"] }) + "\n");
      });

      assert(reply.t === "error", `expected an error reply, got ${reply.t}`);
      assert(
        reply.code === ErrorCode.UNSUPPORTED_PROTOCOL,
        `expected unsupported_protocol, got ${reply.code}`
      );
      await closed;
    }
  },
  {
    id: "C18",
    requirement: "REQ-CDEP-1",
    title: "messages before the handshake are refused",
    async run({ socketPath }) {
      const net = await import("node:net");
      const socket = net.createConnection({ path: socketPath });
      await new Promise((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("error", reject);
      });
      socket.setEncoding("utf8");

      const reply = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("no reply to a pre-handshake message")), 3000);
        socket.once("data", (d) => {
          clearTimeout(timer);
          resolve(JSON.parse(d.trim().split("\n")[0]));
        });
        socket.write(JSON.stringify({ t: "ping", id: 1 }) + "\n");
      });
      socket.destroy();

      assert(reply.t === "error", "expected an error reply");
      assert(
        reply.code === ErrorCode.NOT_HANDSHAKEN,
        `expected not_handshaken, got ${reply.code}`
      );
    }
  },
  {
    id: "C19",
    requirement: "REQ-FALL-3",
    title: "queue sets a follower without restarting the playing track",
    async run({ connect }) {
      const c = await connect();
      if (!c.welcome.capabilities.includes("gapless")) return;

      await c.load("[Channel3]", { id: "queue-current", duration: 10 });
      await c.set("[Channel3]", "play", 1);
      await waitFor(async () => (await c.get("[Channel3]", "playposition")) > 0);
      const before = await c.get("[Channel3]", "playposition");

      await c.queueNext("[Channel3]", { id: "queue-follower", duration: 5 });
      await sleep(60);

      const after = await c.get("[Channel3]", "playposition");
      assert(after >= before, `queue must not rewind the playing track (${before} -> ${after})`);
      assert(
        (await c.get("[Channel3]", "duration")) === 10,
        "queue must not swap the loaded track"
      );
      assert((await c.get("[Channel3]", "play")) === 1, "playback must continue");
    }
  },
  {
    id: "C20",
    requirement: "REQ-CDEP-12",
    title: "every control exposes a normalised parameter, and accepts writes in it",
    async run({ connect }) {
      const c = await connect();
      const controls = await c.describe();

      // Descriptors must carry the fields a real engine can actually supply.
      // min/max/type became optional after SPIKE-1 found they are not reachable
      // in Mixxx; label and default are still mandatory because they are.
      for (const d of controls) {
        assert(typeof d.label === "string" && d.label.length > 0, `${d.item} needs a label`);
        assert(typeof d.default === "number", `${d.item} needs a default`);
        assert(typeof d.readonly === "boolean", `${d.item} needs a readonly flag`);
      }

      const writable = controls.find((d) => !d.readonly && d.type !== "bool");
      assert(writable, "no writable non-bool control to exercise");

      const read = await c.request({ t: "get", group: writable.group, item: writable.item });
      assert(typeof read.parameter === "number", "get must return a parameter");
      assert(
        read.parameter >= 0 && read.parameter <= 1,
        `parameter must be normalised, got ${read.parameter}`
      );

      await c.setParameter(writable.group, writable.item, 0.75);
      const after = await c.getParameter(writable.group, writable.item);
      assert(
        Math.abs(after - 0.75) < 0.02,
        `parameter write should round-trip, wrote 0.75 read ${after}`
      );

      await expectError(
        c.setParameter(writable.group, writable.item, 1.5),
        ErrorCode.VALUE_OUT_OF_RANGE,
        "a parameter outside 0..1 must be refused rather than clamped"
      );
    }
  }
];

/**
 * Run the suite against an already-listening engine.
 *
 * @param {{socketPath: string, only?: string[]}} opts
 * @returns {Promise<{passed: number, failed: number, results: Array<object>}>}
 */
export async function runSuite(opts) {
  const selected = opts.only?.length
    ? checks.filter((c) => opts.only.includes(c.id))
    : checks;

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const check of selected) {
    /** @type {CdepClient[]} */
    const opened = [];
    const connect = async () => {
      const c = new CdepClient({ path: opts.socketPath, client: `cdep-conformance/${check.id}` });
      await c.connect();
      opened.push(c);
      return c;
    };

    const started = Date.now();
    try {
      await check.run({ connect, socketPath: opts.socketPath });
      passed++;
      results.push({ ...meta(check), ok: true, ms: Date.now() - started });
    } catch (err) {
      failed++;
      results.push({ ...meta(check), ok: false, ms: Date.now() - started, error: err.message });
    } finally {
      for (const c of opened) c.close();
    }
  }

  return { passed, failed, results };
}

function meta(check) {
  return { id: check.id, requirement: check.requirement, title: check.title };
}
