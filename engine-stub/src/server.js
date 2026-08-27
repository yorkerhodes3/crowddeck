// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * The CDEP server.
 *
 * Implements the transport (REQ-CDEP-1), framing (REQ-CDEP-2), handshake
 * (REQ-CDEP-9/10/11), self-description (REQ-CDEP-12/13) and — most importantly —
 * subscription coalescing and back-pressure (REQ-CDEP-14/15/16).
 *
 * ## The rule this file exists to enforce
 *
 * **The engine must never block on IPC.** A client that stops reading its socket
 * must not be able to stall the transport. Every unsolicited message
 * (`changed`, `event`) goes through {@link Connection.offer}, which drops when
 * the socket's buffer is over budget instead of waiting for drain. Coalesced
 * updates are safe to drop precisely because they are coalesced: the next flush
 * carries the latest value anyway.
 */

import net from "node:net";
import fs from "node:fs";
import {
  CdepError,
  ErrorCode,
  LineDecoder,
  MessageType,
  PROTOCOL_VERSION,
  changed,
  controlKey,
  decode,
  description,
  encode,
  error,
  event,
  negotiate,
  ok,
  optionalId,
  pong,
  requireString,
  value,
  welcome
} from "../../protocol/src/index.js";
import { CAPABILITIES, ENGINE_NAME, ENGINE_VERSION, StubEngine } from "./engine.js";

/** Bytes of un-flushed socket buffer past which we start dropping updates. */
export const SEND_BUFFER_LIMIT_BYTES = 256 * 1024;

/** Bound on distinct controls queued per flush, so a pathological client can't grow memory. */
export const MAX_COALESCED_CONTROLS = 4096;

class Connection {
  /**
   * @param {net.Socket} socket
   * @param {Server} server
   * @param {{sendBufferLimitBytes?: number}} [opts]
   */
  constructor(socket, server, opts = {}) {
    this.socket = socket;
    this.server = server;
    this.decoder = new LineDecoder();
    this.handshaken = false;
    this.client = "unknown";

    /** Injectable so tests can drive the drop path with a realistic volume. */
    this.sendBufferLimitBytes = opts.sendBufferLimitBytes ?? SEND_BUFFER_LIMIT_BYTES;

    /** Per-connection subscription state — REQ-CDEP-4. */
    this.subscriptions = new Set();
    this.maxHz = 20;

    /** key -> latest value awaiting flush. A Map gives us coalescing for free. */
    this.pending = new Map();
    this.flushTimer = null;

    this.droppedUpdates = 0;
    this.closed = false;
  }

  get flushIntervalMs() {
    return Math.max(1, Math.round(1000 / this.maxHz));
  }

  /** Correlated replies always go out; they are small and bounded. */
  reply(msg) {
    if (this.closed) return;
    this.socket.write(encode(msg));
  }

  /**
   * Offer an unsolicited message. Dropped rather than queued when the peer is
   * not keeping up — REQ-CDEP-16.
   * @returns {boolean} true if written
   */
  offer(msg) {
    if (this.closed) return false;
    if (this.socket.writableLength > this.sendBufferLimitBytes) {
      this.droppedUpdates++;
      return false;
    }
    this.socket.write(encode(msg));
    return true;
  }

  /** Queue a control change for the next coalesced flush. */
  enqueue(group, item, v) {
    const key = controlKey(group, item);
    if (!this.subscriptions.has(key)) return;
    if (!this.pending.has(key) && this.pending.size >= MAX_COALESCED_CONTROLS) {
      this.droppedUpdates++;
      return;
    }
    this.pending.set(key, { group, item, value: v });
    this.#scheduleFlush();
  }

  #scheduleFlush() {
    if (this.flushTimer || this.closed) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, this.flushIntervalMs);
    if (typeof this.flushTimer.unref === "function") this.flushTimer.unref();
  }

  flush() {
    if (this.closed || this.pending.size === 0) return;
    // Snapshot then clear: anything arriving during the write lands in the next flush.
    const batch = [...this.pending.values()];
    this.pending.clear();
    for (const u of batch) {
      let parameter;
      try {
        parameter = this.server.engine.getParameter(u.group, u.item);
      } catch {
        parameter = undefined;
      }
      if (!this.offer(changed(u.group, u.item, u.value, parameter))) break;
    }
  }

  close() {
    this.closed = true;
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.pending.clear();
    this.subscriptions.clear();
  }
}

export class Server {
  /**
   * @param {{engine?: StubEngine, path: string, decks?: number, sendBufferLimitBytes?: number}} opts
   */
  constructor(opts) {
    this.path = opts.path;
    this.sendBufferLimitBytes = opts.sendBufferLimitBytes ?? SEND_BUFFER_LIMIT_BYTES;
    this.engine = opts.engine ?? new StubEngine({ decks: opts.decks });
    /** @type {Set<Connection>} */
    this.connections = new Set();
    this.server = net.createServer((socket) => this.#onConnection(socket));

    this.engine.on("changed", (group, item, v) => {
      for (const c of this.connections) c.enqueue(group, item, v);
    });
    this.engine.on("event", (name, data) => {
      const msg = event(name, data);
      for (const c of this.connections) {
        if (c.handshaken) c.offer(msg);
      }
    });
  }

  async listen() {
    // A stale UDS file from an unclean shutdown would otherwise block bind.
    if (process.platform !== "win32" && fs.existsSync(this.path)) {
      try {
        fs.unlinkSync(this.path);
      } catch {
        /* if it is genuinely in use, listen() will report it */
      }
    }
    await new Promise((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(this.path, () => {
        this.server.off("error", reject);
        resolve();
      });
    });
    return this.path;
  }

  async close() {
    for (const c of this.connections) {
      c.close();
      c.socket.destroy();
    }
    this.connections.clear();
    this.engine.dispose();
    await new Promise((resolve) => this.server.close(resolve));
    if (process.platform !== "win32" && fs.existsSync(this.path)) {
      try {
        fs.unlinkSync(this.path);
      } catch {
        /* best effort */
      }
    }
  }

  #onConnection(socket) {
    const conn = new Connection(socket, this, {
      sendBufferLimitBytes: this.sendBufferLimitBytes
    });
    this.connections.add(conn);
    socket.setEncoding("utf8");

    socket.on("data", (chunk) => this.#onData(conn, chunk));
    socket.on("error", () => {
      conn.close();
      this.connections.delete(conn);
    });
    socket.on("close", () => {
      conn.close();
      this.connections.delete(conn);
    });
  }

  #onData(conn, chunk) {
    let lines;
    try {
      lines = conn.decoder.push(chunk);
    } catch (err) {
      this.#fail(conn, err, undefined);
      return;
    }

    for (const line of lines) {
      let msg;
      try {
        msg = decode(line);
      } catch (err) {
        this.#fail(conn, err, undefined);
        continue;
      }
      let id;
      try {
        id = optionalId(msg);
        this.#handle(conn, msg, id);
      } catch (err) {
        this.#fail(conn, err, id);
      }
    }
  }

  #fail(conn, err, id) {
    const e = err instanceof CdepError
      ? err
      : new CdepError(ErrorCode.MALFORMED, err?.message ?? "unhandled error");
    conn.reply(error(e.code, e.message, id));
    if (e.fatal) {
      conn.close();
      conn.socket.end();
    }
  }

  #handle(conn, msg, id) {
    const type = msg.t;
    if (typeof type !== "string") {
      throw new CdepError(ErrorCode.UNKNOWN_TYPE, `missing "t"`);
    }

    if (type === MessageType.HELLO) {
      if (conn.handshaken) {
        throw new CdepError(ErrorCode.ALREADY_HANDSHAKEN, "handshake already completed");
      }
      negotiate(msg, [PROTOCOL_VERSION]); // throws fatal unsupported_protocol
      conn.handshaken = true;
      conn.client = typeof msg.client === "string" ? msg.client : "unknown";
      conn.reply({
        ...welcome({
          engine: `${ENGINE_NAME}/${ENGINE_VERSION}`,
          decks: this.engine.deckCount,
          sampleRate: this.engine.sampleRate,
          latencyMs: this.engine.latencyMs,
          capabilities: [...CAPABILITIES]
        }),
        ...(id === undefined ? {} : { id })
      });
      return;
    }

    if (!conn.handshaken) {
      throw new CdepError(ErrorCode.NOT_HANDSHAKEN, `"${type}" before hello`);
    }

    switch (type) {
      case MessageType.PING:
        conn.reply(pong(id));
        return;

      case MessageType.DESCRIBE:
        conn.reply(description(id, this.engine.describe()));
        return;

      case MessageType.GET: {
        const group = requireString(msg, "group");
        const item = requireString(msg, "item");
        conn.reply(
          value(id, group, item, this.engine.get(group, item), this.engine.getParameter(group, item))
        );
        return;
      }

      case MessageType.SET: {
        const group = requireString(msg, "group");
        const item = requireString(msg, "item");
        // Either representation is accepted; parameter space is preferred for
        // anything driven by a physical control (SPIKE-1 §4.3).
        if (msg.parameter !== undefined) {
          if (typeof msg.parameter !== "number") {
            throw new CdepError(ErrorCode.INVALID_FIELD, `"parameter" must be a number`);
          }
          this.engine.setParameter(group, item, msg.parameter);
        } else if (typeof msg.value === "number") {
          this.engine.set(group, item, msg.value);
        } else {
          throw new CdepError(ErrorCode.INVALID_FIELD, `"value" or "parameter" is required`);
        }
        conn.reply(ok(id));
        return;
      }

      case MessageType.SUBSCRIBE: {
        const controls = this.#requireControlList(msg);
        if (msg.max_hz !== undefined) {
          if (typeof msg.max_hz !== "number" || msg.max_hz <= 0 || msg.max_hz > 1000) {
            throw new CdepError(ErrorCode.INVALID_FIELD, `"max_hz" must be in (0, 1000]`);
          }
          conn.maxHz = msg.max_hz;
        }
        for (const c of controls) {
          if (!this.engine.has(c.group, c.item)) {
            throw new CdepError(ErrorCode.UNKNOWN_CONTROL, `${c.group}/${c.item}`);
          }
          conn.subscriptions.add(controlKey(c.group, c.item));
        }
        conn.reply(ok(id));
        return;
      }

      case MessageType.UNSUBSCRIBE: {
        const controls = this.#requireControlList(msg);
        for (const c of controls) conn.subscriptions.delete(controlKey(c.group, c.item));
        conn.reply(ok(id));
        return;
      }

      case MessageType.LOAD: {
        const group = requireString(msg, "group");
        const track = msg.track;
        const normalised = typeof track === "string" ? { id: track } : track;
        if (!normalised || typeof normalised !== "object") {
          throw new CdepError(ErrorCode.INVALID_FIELD, `"track" must be an object or string id`);
        }
        this.engine.load(group, normalised);
        if (msg.next && typeof msg.next === "object") {
          this.engine.queueNext(group, msg.next);
        }
        conn.reply(ok(id));
        return;
      }

      case MessageType.QUEUE: {
        const group = requireString(msg, "group");
        const track = msg.track;
        const normalised = typeof track === "string" ? { id: track } : track;
        if (!normalised || typeof normalised !== "object") {
          throw new CdepError(ErrorCode.INVALID_FIELD, `"track" must be an object or string id`);
        }
        // Deliberately does not touch the playing track — that is the whole
        // difference between `queue` and `load`.
        this.engine.queueNext(group, normalised);
        conn.reply(ok(id));
        return;
      }

      default:
        throw new CdepError(ErrorCode.UNKNOWN_TYPE, `unknown message type "${type}"`);
    }
  }

  #requireControlList(msg) {
    if (!Array.isArray(msg.controls)) {
      throw new CdepError(ErrorCode.INVALID_FIELD, `"controls" must be an array`);
    }
    return msg.controls.map((c) => {
      if (!c || typeof c !== "object") {
        throw new CdepError(ErrorCode.INVALID_FIELD, `each control must be an object`);
      }
      return { group: requireString(c, "group"), item: requireString(c, "item") };
    });
  }
}
