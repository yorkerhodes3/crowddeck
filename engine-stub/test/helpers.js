// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

import net from "node:net";
import os from "node:os";
import path from "node:path";
import { Server } from "../src/server.js";
import { StubEngine } from "../src/engine.js";
import { CdepClient } from "../../protocol/src/index.js";

let counter = 0;

/** A unique socket path per test, so tests can run concurrently. */
export function tempSocketPath() {
  const name = `crowddeck-test-${process.pid}-${counter++}`;
  return process.platform === "win32"
    ? `\\\\.\\pipe\\${name}`
    : path.join(os.tmpdir(), `${name}.sock`);
}

/**
 * Start a stub engine server and a connected client.
 * @param {{decks?: number, sendBufferLimitBytes?: number}} [opts]
 */
export async function startEngine(opts = {}) {
  const socketPath = tempSocketPath();
  const engine = new StubEngine({ decks: opts.decks ?? 4 });
  const server = new Server({
    path: socketPath,
    engine,
    ...(opts.sendBufferLimitBytes === undefined
      ? {}
      : { sendBufferLimitBytes: opts.sendBufferLimitBytes })
  });
  await server.listen();

  const clients = [];
  const connect = async () => {
    const c = new CdepClient({ path: socketPath, client: "test/1.0.0" });
    await c.connect();
    clients.push(c);
    return c;
  };

  const client = await connect();

  return {
    socketPath,
    engine,
    server,
    client,
    connect,
    async stop() {
      for (const c of clients) c.close();
      await server.close();
    }
  };
}

/**
 * A raw socket that completes the handshake then never reads again.
 * Used to prove a stalled peer cannot stall the engine (AC-18, REQ-CDEP-16).
 */
export async function connectStalled(socketPath) {
  const socket = net.createConnection({ path: socketPath });
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });
  // Pausing means the kernel buffer, then the engine's writable buffer, fill up.
  socket.pause();
  return socket;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Wait until `predicate()` is truthy or the deadline passes.
 * Awaits the result, so async predicates (e.g. a CDEP `get`) work correctly —
 * a non-awaited async predicate would return a truthy Promise and resolve
 * instantly, which silently defeats the wait.
 *
 * @param {() => boolean | Promise<boolean>} predicate
 */
export async function waitFor(predicate, { timeoutMs = 2000, intervalMs = 10 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return true;
    await sleep(intervalMs);
  }
  return false;
}
