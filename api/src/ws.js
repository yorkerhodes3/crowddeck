// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * A minimal RFC 6455 WebSocket server.
 *
 * Written rather than depended on because the repository is deliberately
 * zero-dependency, and because what the venue API actually needs is small:
 * server→client text frames for queue and position updates (REQ-SCH-12), plus
 * correct close and ping handling so browsers behave.
 *
 * Scope, stated honestly:
 *   - text and binary data frames, fragmented or not
 *   - ping / pong / close
 *   - client→server frames (which are always masked, per the RFC)
 *   - NOT implemented: permessage-deflate, extensions, subprotocol negotiation
 *
 * If this ever needs to carry heavy traffic, replace it with `ws`. For pushing a
 * queue to a room full of phones it is more than adequate.
 */

import crypto from "node:crypto";
import { EventEmitter } from "node:events";

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const OpCode = Object.freeze({
  CONTINUATION: 0x0,
  TEXT: 0x1,
  BINARY: 0x2,
  CLOSE: 0x8,
  PING: 0x9,
  PONG: 0xa
});

/** Refuse absurd frames rather than allocating for them. */
export const MAX_FRAME_BYTES = 1 << 20; // 1 MiB

export function isWebSocketUpgrade(req) {
  return (
    req.headers.upgrade?.toLowerCase() === "websocket" &&
    typeof req.headers["sec-websocket-key"] === "string"
  );
}

/** Compute the RFC 6455 handshake response value. */
export function acceptKey(key) {
  return crypto.createHash("sha1").update(key + GUID).digest("base64");
}

export class WebSocketConnection extends EventEmitter {
  #buffer = Buffer.alloc(0);
  #fragments = [];
  #fragmentOp = null;

  /**
   * @param {import("node:net").Socket} socket
   * @param {{role?: "server"|"client"}} [opts]
   *   `server` (default) requires incoming frames to be masked, as the RFC
   *   demands of clients. `client` accepts unmasked frames, because server→client
   *   frames are never masked — needed so this class can also drive a client,
   *   which is what the test suite does.
   */
  constructor(socket, opts = {}) {
    super();
    this.socket = socket;
    this.role = opts.role ?? "server";
    this.closed = false;

    socket.on("data", (chunk) => this.#onData(chunk));
    socket.on("close", () => this.#onClose());
    socket.on("error", (err) => {
      this.emit("error", err);
      this.#onClose();
    });
  }

  /** @param {string} data */
  send(data) {
    if (this.closed) return false;
    try {
      this.socket.write(encodeFrame(OpCode.TEXT, Buffer.from(data, "utf8")));
      return true;
    } catch {
      return false;
    }
  }

  /** @param {object} obj */
  sendJson(obj) {
    return this.send(JSON.stringify(obj));
  }

  ping() {
    if (!this.closed) this.socket.write(encodeFrame(OpCode.PING, Buffer.alloc(0)));
  }

  close(code = 1000, reason = "") {
    if (this.closed) return;
    this.closed = true;
    const payload = Buffer.alloc(2 + Buffer.byteLength(reason));
    payload.writeUInt16BE(code, 0);
    payload.write(reason, 2);
    try {
      this.socket.write(encodeFrame(OpCode.CLOSE, payload));
      this.socket.end();
    } catch {
      this.socket.destroy();
    }
  }

  #onClose() {
    if (this.closed) return;
    this.closed = true;
    this.emit("close");
  }

  #onData(chunk) {
    this.#buffer = Buffer.concat([this.#buffer, chunk]);

    for (;;) {
      const frame = decodeFrame(this.#buffer, { requireMask: this.role === "server" });
      if (!frame) return; // need more bytes
      if (frame.error) {
        this.close(1002, frame.error);
        return;
      }
      this.#buffer = this.#buffer.subarray(frame.consumed);
      this.#handleFrame(frame);
    }
  }

  #handleFrame(frame) {
    switch (frame.opcode) {
      case OpCode.CLOSE:
        this.close(1000, "");
        return;

      case OpCode.PING:
        if (!this.closed) this.socket.write(encodeFrame(OpCode.PONG, frame.payload));
        return;

      case OpCode.PONG:
        this.emit("pong");
        return;

      case OpCode.CONTINUATION: {
        if (this.#fragmentOp === null) {
          this.close(1002, "continuation without a start frame");
          return;
        }
        this.#fragments.push(frame.payload);
        if (frame.fin) this.#deliverFragments();
        return;
      }

      case OpCode.TEXT:
      case OpCode.BINARY: {
        if (!frame.fin) {
          this.#fragmentOp = frame.opcode;
          this.#fragments = [frame.payload];
          return;
        }
        this.#deliver(frame.opcode, frame.payload);
        return;
      }

      default:
        this.close(1002, `unknown opcode ${frame.opcode}`);
    }
  }

  #deliverFragments() {
    const op = this.#fragmentOp;
    const payload = Buffer.concat(this.#fragments);
    this.#fragments = [];
    this.#fragmentOp = null;
    this.#deliver(op, payload);
  }

  #deliver(opcode, payload) {
    if (opcode === OpCode.TEXT) this.emit("message", payload.toString("utf8"));
    else this.emit("binary", payload);
  }
}

/**
 * Complete the upgrade handshake and return a live connection.
 *
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:net").Socket} socket
 * @returns {WebSocketConnection|null}
 */
export function upgrade(req, socket) {
  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    return null;
  }

  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${acceptKey(key)}\r\n` +
      "\r\n"
  );
  socket.setNoDelay(true);
  return new WebSocketConnection(socket);
}

/* --------------------------------------------------------------- framing */

/**
 * Encode a server→client frame. Server frames are never masked.
 * Exported for tests.
 */
export function encodeFrame(opcode, payload) {
  const len = payload.length;
  let header;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  header[0] = 0x80 | opcode; // FIN + opcode

  return Buffer.concat([header, payload]);
}

/**
 * Decode one frame from the head of `buf`.
 * @param {Buffer} buf
 * @param {{requireMask?: boolean}} [opts] servers require masked client frames;
 *   clients must accept unmasked server frames.
 * @returns {{fin: boolean, opcode: number, payload: Buffer, consumed: number, error?: string}|null}
 */
export function decodeFrame(buf, opts = {}) {
  const requireMask = opts.requireMask ?? true;
  if (buf.length < 2) return null;

  const fin = (buf[0] & 0x80) !== 0;
  const rsv = buf[0] & 0x70;
  const opcode = buf[0] & 0x0f;
  const masked = (buf[1] & 0x80) !== 0;
  let len = buf[1] & 0x7f;
  let offset = 2;

  if (rsv !== 0) {
    return { error: "reserved bits must be zero", consumed: buf.length, opcode, fin, payload: Buffer.alloc(0) };
  }

  if (len === 126) {
    if (buf.length < offset + 2) return null;
    len = buf.readUInt16BE(offset);
    offset += 2;
  } else if (len === 127) {
    if (buf.length < offset + 8) return null;
    const big = buf.readBigUInt64BE(offset);
    if (big > BigInt(MAX_FRAME_BYTES)) {
      return { error: "frame too large", consumed: buf.length, opcode, fin, payload: Buffer.alloc(0) };
    }
    len = Number(big);
    offset += 8;
  }

  if (len > MAX_FRAME_BYTES) {
    return { error: "frame too large", consumed: buf.length, opcode, fin, payload: Buffer.alloc(0) };
  }

  // The RFC requires client frames to be masked; server frames must not be.
  if (requireMask && !masked) {
    return { error: "client frames must be masked", consumed: buf.length, opcode, fin, payload: Buffer.alloc(0) };
  }

  let payload;
  if (masked) {
    if (buf.length < offset + 4 + len) return null;
    const mask = buf.subarray(offset, offset + 4);
    offset += 4;
    payload = Buffer.allocUnsafe(len);
    for (let i = 0; i < len; i++) payload[i] = buf[offset + i] ^ mask[i & 3];
  } else {
    if (buf.length < offset + len) return null;
    payload = Buffer.from(buf.subarray(offset, offset + len));
  }

  return { fin, opcode, payload, consumed: offset + len };
}

export { OpCode };
