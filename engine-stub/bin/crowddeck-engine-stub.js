#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * crowddeck-engine-stub — a conformant CDEP engine with no audio output.
 *
 * Exists so the fusion core can be built and tested before the Mixxx-derived
 * engine lands (ADR-002: contract first, stub second, fork third), and so the
 * "engine is replaceable" property that the licence split depends on is
 * demonstrated by a real second implementation rather than asserted
 * (REQ-LIC-5).
 *
 * Usage:
 *   crowddeck-engine-stub [--socket <path>] [--decks 4]
 */

import { Server } from "../src/server.js";
import { StubEngine } from "../src/engine.js";
import { defaultSocketPath } from "../../protocol/src/index.js";

function parseArgs(argv) {
  const args = { socket: defaultSocketPath(), decks: 4 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--socket" || a === "-s") args.socket = argv[++i];
    else if (a === "--decks" || a === "-d") args.decks = Number(argv[++i]);
    else if (a === "--help" || a === "-h") args.help = true;
    else {
      console.error(`unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

const args = parseArgs(process.argv);

if (args.help) {
  console.log(`crowddeck-engine-stub

  --socket, -s <path>   socket / named pipe to listen on
                        (default: ${defaultSocketPath()})
  --decks,  -d <n>      number of decks to expose (default: 4)
  --help,   -h          show this message
`);
  process.exit(0);
}

if (!Number.isInteger(args.decks) || args.decks < 1 || args.decks > 16) {
  console.error("--decks must be an integer in [1, 16]");
  process.exit(2);
}

const server = new Server({
  path: args.socket,
  engine: new StubEngine({ decks: args.decks })
});

await server.listen();
// The conformance runner waits for this line before connecting.
console.log(`cdep listening ${args.socket}`);

let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nshutting down (${signal})`);
  await server.close();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
