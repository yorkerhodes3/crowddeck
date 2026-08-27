#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * cdep-conformance — run the CDEP conformance suite against any engine.
 *
 * Two modes:
 *   --engine engine-stub          spawn the bundled stub and test it
 *   --engine "<command>"          spawn an arbitrary engine command
 *   --socket <path>               test an engine that is already running
 *
 * The runner never imports engine internals. An engine passes or fails purely
 * on its behaviour over the socket, which is what makes "any conforming engine
 * is interchangeable" (REQ-LIC-5) a testable claim.
 */

import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSuite } from "../src/suite.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");

function parseArgs(argv) {
  const args = { engine: "engine-stub", socket: null, only: [], json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--engine" || a === "-e") args.engine = argv[++i];
    else if (a === "--socket" || a === "-s") args.socket = argv[++i];
    else if (a === "--only") args.only = argv[++i].split(",").map((s) => s.trim());
    else if (a === "--json") args.json = true;
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
  console.log(`cdep-conformance

  --engine, -e <name|cmd>  engine to spawn ("engine-stub" or a shell command)
  --socket, -s <path>      test an already-running engine instead of spawning
  --only <C01,C02>         run only these checks
  --json                   machine-readable output
  --help,   -h             show this message
`);
  process.exit(0);
}

/** Spawn an engine and wait for it to report its socket. */
async function spawnEngine(spec) {
  const socketPath = process.platform === "win32"
    ? `\\\\.\\pipe\\cdep-conformance-${process.pid}`
    : path.join(os.tmpdir(), `cdep-conformance-${process.pid}.sock`);

  const cmd = spec === "engine-stub"
    ? { command: process.execPath, cliArgs: [path.join(repoRoot, "engine-stub", "bin", "crowddeck-engine-stub.js"), "--socket", socketPath] }
    : { command: spec, cliArgs: ["--socket", socketPath], shell: true };

  const child = spawn(cmd.command, cmd.cliArgs, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: cmd.shell ?? false
  });

  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("engine did not report readiness within 10s")), 10000);
    let out = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (d) => {
      out += d;
      if (out.includes("cdep listening")) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (d) => process.stderr.write(`[engine] ${d}`));
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`engine exited early with code ${code}`));
    });
  });

  await ready;
  return { child, socketPath };
}

let spawned = null;
let socketPath = args.socket;

try {
  if (!socketPath) {
    spawned = await spawnEngine(args.engine);
    socketPath = spawned.socketPath;
  }

  const target = args.socket ? `socket ${socketPath}` : args.engine;
  if (!args.json) {
    console.log(`\nCDEP conformance suite  —  target: ${target}\n`);
  }

  const { passed, failed, results } = await runSuite({ socketPath, only: args.only });

  if (args.json) {
    console.log(JSON.stringify({ target, passed, failed, results }, null, 2));
  } else {
    for (const r of results) {
      const mark = r.ok ? "\u2714" : "\u2716";
      console.log(`  ${mark} ${r.id}  ${r.title}`);
      console.log(`      ${r.requirement}  (${r.ms}ms)`);
      if (!r.ok) console.log(`      -> ${r.error}`);
    }
    console.log(
      `\n  ${passed} passed, ${failed} failed, ${results.length} total\n` +
        (failed === 0
          ? "  This engine is CDEP-conformant.\n"
          : "  This engine is NOT conformant.\n")
    );
  }

  process.exitCode = failed === 0 ? 0 : 1;
} catch (err) {
  console.error(`conformance run failed: ${err.message}`);
  process.exitCode = 2;
} finally {
  if (spawned) spawned.child.kill();
}
