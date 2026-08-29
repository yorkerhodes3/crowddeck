#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * crowddeck-server — the whole appliance in one process.
 *
 * Starts a CDEP engine, the fusion core and the venue API, then serves the
 * patron and display clients. This is the demo that makes the concept tangible:
 * open the patron page on a phone, queue something, and watch it move through
 * the staging lane onto a deck.
 *
 * The engine is the stub, so **nothing is audible yet** — the deck state is real
 * but silent. Audio arrives with the Mixxx-derived engine (epic E7), and
 * nothing above the engine adapter changes when it does. That is the point of
 * having written the contract first.
 *
 *   node api/bin/crowddeck-server.js --port 8080
 */

import { readFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { CdepClient } from "../../protocol/src/index.js";
import { Scheduler, Mode } from "../../core/src/scheduler.js";
import { EngineAdapter } from "../../core/src/engine-adapter.js";
import { VenueApi } from "../src/server.js";
import { DemoCatalog } from "../src/demo-catalog.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const clientsDir = path.join(repoRoot, "clients");
const engineWebDir = path.join(repoRoot, "engine-web");

function parseArgs(argv) {
  const args = {
    port: 8080,
    host: "127.0.0.1",
    venueId: "the-anchor",
    venueName: "The Anchor",
    staffKey: "demo-staff-key",
    mode: Mode.AUTONOMOUS
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--port" || a === "-p") args.port = Number(argv[++i]);
    else if (a === "--host") args.host = argv[++i];
    else if (a === "--venue") args.venueId = argv[++i];
    else if (a === "--name") args.venueName = argv[++i];
    else if (a === "--staff-key") args.staffKey = argv[++i];
    else if (a === "--attended") args.mode = Mode.ATTENDED;
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
  console.log(`crowddeck-server

  --port, -p <n>     HTTP port (default 8080)
  --host <addr>      bind address (default 127.0.0.1)
  --venue <id>       venue id (default the-anchor)
  --name <name>      venue display name
  --staff-key <key>  staff credential (default demo-staff-key)
  --attended         start in attended mode instead of autonomous
  --help, -h         show this message
`);
  process.exit(0);
}

/* ------------------------------------------------------------------ engine */

const socketPath = process.platform === "win32"
  ? `\\\\.\\pipe\\crowddeck-${process.pid}`
  : path.join(os.tmpdir(), `crowddeck-${process.pid}.sock`);

const engineProcess = spawn(
  process.execPath,
  [path.join(repoRoot, "engine-stub", "bin", "crowddeck-engine-stub.js"), "--socket", socketPath],
  { stdio: ["ignore", "pipe", "inherit"] }
);

await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("engine did not start within 10s")), 10000);
  let out = "";
  engineProcess.stdout.setEncoding("utf8");
  engineProcess.stdout.on("data", (d) => {
    out += d;
    if (out.includes("cdep listening")) {
      clearTimeout(timer);
      resolve();
    }
  });
  engineProcess.once("exit", (code) => {
    clearTimeout(timer);
    reject(new Error(`engine exited with code ${code}`));
  });
});

const client = new CdepClient({ path: socketPath, client: "crowddeck-server/0.1.0" });
const welcome = await client.connect();

/* ------------------------------------------------------- core and catalog */

const catalog = new DemoCatalog();
const scheduler = new Scheduler({
  venueId: args.venueId,
  mode: args.mode,
  // Short cooldowns so a demo is not boring after three songs.
  fairness: { trackCooldownMs: 2 * 60 * 1000, artistCooldownMs: 60 * 1000 },
  policy: { commercial: true, explicitAllowed: false }
});
scheduler.fallbackProvider = catalog.fallbackProvider(scheduler);

const adapter = new EngineAdapter({ scheduler, client });
await adapter.start();

/* -------------------------------------------------------------------- api */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

/**
 * Serve the bundled clients, and the browser engine's modules.
 *
 * The deck page (DJX-5) imports the Web Audio engine as ES modules, which live in
 * `engine-web/` rather than under `clients/` because they are engine code, not
 * client code — the same modules are unit-tested in Node. Both roots are served,
 * and each is confined to itself.
 *
 * Path traversal is refused explicitly rather than relied upon: `path.normalize`
 * resolves `..` *before* the prefix check, so the check is meaningful.
 */
function staticHandler(pathname) {
  const clean = pathname === "/" ? "/patron/index.html" : pathname;

  const roots = clean.startsWith("/engine-web/")
    ? [{ dir: engineWebDir, rel: clean.slice("/engine-web".length) }]
    : [{ dir: clientsDir, rel: clean }];

  for (const { dir, rel } of roots) {
    const target = path.normalize(path.join(dir, rel));
    // path.sep guards against a sibling directory sharing the prefix.
    if (target !== dir && !target.startsWith(dir + path.sep)) continue;
    if (!existsSync(target)) continue;
    const ext = path.extname(target);
    if (!MIME[ext]) continue;
    return { body: readFileSync(target), contentType: MIME[ext] };
  }
  return null;
}

const api = new VenueApi({
  scheduler,
  catalog,
  adapter,
  venueId: args.venueId,
  venueName: args.venueName,
  staffKey: args.staffKey,
  staticHandler
});

await api.listen(args.port, args.host);

// Keep the autonomous mixer moving.
const ticker = setInterval(() => scheduler.tick(), 1000);
ticker.unref?.();
scheduler.tick();

const base = `http://${args.host}:${args.port}`;
console.log(`
  CrowdDeck  —  ${args.venueName}

  engine    ${welcome.engine}  (${welcome.decks} decks, no audio output yet)
  mode      ${scheduler.mode}
  catalog   ${catalog.tracks.length} demo tracks

  patron    ${base}/patron/index.html?venue=${args.venueId}
  display   ${base}/display/index.html?venue=${args.venueId}
  api       ${base}/v1/venues/${args.venueId}/queue
  staff key ${args.staffKey}

  Ctrl-C to stop.
`);

let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nshutting down (${signal})`);
  clearInterval(ticker);
  adapter.stop();
  client.close();
  await api.close();
  engineProcess.kill();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
