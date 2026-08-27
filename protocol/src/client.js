// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * A minimal CDEP client.
 *
 * Used by the conformance suite and, later, by the fusion core. It is
 * deliberately transport-agnostic about *which* engine it talks to: any
 * conforming engine is interchangeable (REQ-LIC-5).
 */

import net from "node:net";
import { EventEmitter } from "node:events";
import { LineDecoder, decode, encode } from "./framing.js";
import { MessageType, PROTOCOL_VERSION, hello } from "./messages.js";
import { CdepError, ErrorCode } from "./errors.js";

export class CdepClient extends EventEmitter {
  #socket = null;
  #decoder = new LineDecoder();
  #nextId = 1;
  #pending = new Map();
  #closed = false;

  /** @type {object|null} the `welcome` payload, once handshaken */
  welcome = null;

  /**
   * @param {{path: string, client?: string}} opts
   */
  constructor(opts) {
    super();
    this.path = opts.path;
    this.clientName = opts.client ?? "cdep-client/0.1.0";
  }

  /**
   * Connect and complete the handshake.
   * @param {{timeoutMs?: number}} [opts]
   */
  async connect(opts = {}) {
    const timeoutMs = opts.timeoutMs ?? 5000;

    await new Promise((resolve, reject) => {
      const s = net.createConnection({ path: this.path });
      const onError = (err) => { s.destroy(); reject(err); };
      s.once("error", onError);
      s.once("connect", () => {
        s.off("error", onError);
        this.#socket = s;
        resolve();
      });
    });

    this.#socket.setEncoding("utf8");
    this.#socket.on("data", (chunk) => this.#onData(chunk));
    this.#socket.on("close", () => {
      this.#closed = true;
      for (const [, p] of this.#pending) {
        p.reject(new CdepError(ErrorCode.UNAVAILABLE, "connection closed"));
      }
      this.#pending.clear();
      this.emit("close");
    });
    this.#socket.on("error", (err) => this.emit("error", err));

    this.welcome = await this.request(hello({ client: this.clientName }), {
      expect: MessageType.WELCOME,
      timeoutMs
    });
    return this.welcome;
  }

  #onData(chunk) {
    let lines;
    try {
      lines = this.#decoder.push(chunk);
    } catch (err) {
      this.emit("error", err);
      return;
    }
    for (const line of lines) {
      let msg;
      try {
        msg = decode(line);
      } catch (err) {
        this.emit("error", err);
        continue;
      }
      this.#dispatch(msg);
    }
  }

  #dispatch(msg) {
    // Unsolicited traffic: change notifications and engine events.
    if (msg.t === MessageType.CHANGED) {
      this.emit("changed", msg);
      return;
    }
    if (msg.t === MessageType.EVENT) {
      this.emit("event", msg);
      return;
    }

    if (typeof msg.id === "number" && this.#pending.has(msg.id)) {
      const p = this.#pending.get(msg.id);
      this.#pending.delete(msg.id);
      clearTimeout(p.timer);
      if (msg.t === MessageType.ERROR) {
        p.reject(new CdepError(msg.code, msg.message ?? "engine error"));
      } else {
        p.resolve(msg);
      }
      return;
    }

    // A welcome arrives in reply to hello, which may not carry an id.
    if (msg.t === MessageType.WELCOME || msg.t === MessageType.ERROR) {
      const first = this.#pending.values().next();
      if (!first.done) {
        const p = first.value;
        this.#pending.delete(p.id);
        clearTimeout(p.timer);
        if (msg.t === MessageType.ERROR) {
          p.reject(new CdepError(msg.code, msg.message ?? "engine error"));
        } else {
          p.resolve(msg);
        }
        return;
      }
    }

    this.emit("message", msg);
  }

  /**
   * Send a message and await its correlated reply.
   * @param {object} msg
   * @param {{expect?: string, timeoutMs?: number}} [opts]
   */
  request(msg, opts = {}) {
    if (this.#closed) {
      return Promise.reject(new CdepError(ErrorCode.UNAVAILABLE, "connection closed"));
    }
    const id = this.#nextId++;
    const timeoutMs = opts.timeoutMs ?? 5000;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`CDEP request "${msg.t}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      // Do not hold the event loop open on a pending request.
      if (typeof timer.unref === "function") timer.unref();

      this.#pending.set(id, { id, resolve, reject, timer });
      this.#socket.write(encode({ ...msg, id }));
    });
  }

  /** Fire-and-forget; used for notifications that expect no reply. */
  send(msg) {
    this.#socket.write(encode(msg));
  }

  /* ------------------------------------------------------- convenience */

  async describe() {
    const r = await this.request({ t: MessageType.DESCRIBE });
    return r.controls;
  }

  async get(group, item) {
    const r = await this.request({ t: MessageType.GET, group, item });
    return r.value;
  }

  async set(group, item, value) {
    await this.request({ t: MessageType.SET, group, item, value });
  }

  /**
   * @param {Array<{group: string, item: string}>} controls
   * @param {number} [maxHz] coalescing cap — REQ-CDEP-14
   */
  async subscribe(controls, maxHz = 20) {
    await this.request({ t: MessageType.SUBSCRIBE, controls, max_hz: maxHz });
  }

  async unsubscribe(controls) {
    await this.request({ t: MessageType.UNSUBSCRIBE, controls });
  }

  async load(group, track) {
    await this.request({ t: MessageType.LOAD, group, track });
  }

  async ping() {
    return this.request({ t: MessageType.PING });
  }

  close() {
    this.#closed = true;
    if (this.#socket) this.#socket.destroy();
  }

  /** The raw socket, for tests that need to stall reads (AC-18). */
  get socket() {
    return this.#socket;
  }
}

export { PROTOCOL_VERSION };
