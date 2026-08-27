// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * Play log and CSV export — REQ-DAT-12, REQ-DAT-13, REQ-DAT-14.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { openDatabase } from "../src/db.js";
import { PlayLog, csvField } from "../src/playlog.js";

function setup(t) {
  const db = openDatabase({ venueId: "v1" });
  t.after(() => db.close());
  return new PlayLog(db);
}

const T0 = 1_700_000_000_000;
const track = (over = {}) => ({
  id: "t1",
  title: "Blue Monday",
  artist: "New Order",
  licenceClass: "owned_local",
  ...over
});

test("every performance is logged with start, end, mode and licence class — REQ-DAT-12", (t) => {
  const log = setup(t);
  const id = log.start({ track: track(), mode: "unattended", startedAt: T0 });
  log.end(id, T0 + 270000);

  const [row] = log.entries();
  assert.equal(row.track_id, "t1");
  assert.equal(row.started_at, T0);
  assert.equal(row.ended_at, T0 + 270000);
  assert.equal(row.mode, "unattended");
  assert.equal(row.licence_class, "owned_local");
});

test("a performance cannot be logged without a licence class — REQ-DAT-12", (t) => {
  const log = setup(t);
  assert.throws(
    () => log.start({ track: { id: "t1" }, mode: "unattended" }),
    /no licence class/,
    "the log exists to answer a licensing question; a row that cannot is worthless"
  );
  assert.throws(() => log.start({ track: track(), mode: null }), TypeError);
});

test("a performance closes exactly once", (t) => {
  const log = setup(t);
  const id = log.start({ track: track(), mode: "attended", startedAt: T0 });
  log.end(id, T0 + 1000);
  assert.throws(() => log.end(id, T0 + 5000), /only have ended_at set once/);
  assert.throws(() => log.end("nope"), RangeError);
});

test("a performance cannot end before it started", (t) => {
  const log = setup(t);
  const id = log.start({ track: track(), mode: "attended", startedAt: T0 });
  assert.throws(() => log.end(id, T0 - 1), /cannot end before it started/);
});

test("open performances are recoverable after a restart", (t) => {
  const log = setup(t);
  log.start({ track: track(), mode: "unattended", startedAt: T0 });
  const open = log.openEntries();
  assert.equal(open.length, 1);
  assert.equal(open[0].ended_at, null);

  log.end(open[0].play_id, T0 + 100);
  assert.equal(log.openEntries().length, 0);
});

test("CSV export is well-formed for PRO reporting — REQ-DAT-13", (t) => {
  const log = setup(t);
  const a = log.start({ track: track(), mode: "unattended", startedAt: T0 });
  log.end(a, T0 + 270000);
  const b = log.start({
    track: track({ id: "t2", title: "Temptation", licenceClass: "cc_attribution" }),
    mode: "attended",
    startedAt: T0 + 300000
  });
  log.end(b, T0 + 600000);

  const csv = log.toCsv();
  const lines = csv.trim().split("\r\n");

  assert.equal(lines.length, 3, "header plus two performances");
  assert.match(lines[0], /^started_at_iso,ended_at_iso,duration_seconds,title,artist/);
  assert.ok(lines[1].includes("Blue Monday"));
  assert.ok(lines[1].includes("270"), "duration in seconds");
  assert.ok(lines[2].includes("cc_attribution"));

  // Every row has the same number of fields as the header.
  const cols = lines[0].split(",").length;
  for (const l of lines) {
    assert.equal(splitCsvLine(l).length, cols, `row has wrong field count: ${l}`);
  }
});

test("commas and quotes in titles do not corrupt the report — REQ-DAT-13", (t) => {
  const log = setup(t);
  // A real hazard: one unescaped comma shifts every later column, so licence_class
  // lands in the wrong field and the royalty report is quietly wrong.
  const nasty = 'Say "Hello", Wave Goodbye';
  const id = log.start({
    track: track({ id: "t9", title: nasty, artist: "Soft Cell" }),
    mode: "attended",
    startedAt: T0
  });
  log.end(id, T0 + 1000);

  const lines = log.toCsv().trim().split("\r\n");
  const header = lines[0].split(",");
  const fields = splitCsvLine(lines[1]);

  assert.equal(fields.length, header.length);
  assert.equal(fields[header.indexOf("title")], nasty, "the title round-trips exactly");
  assert.equal(fields[header.indexOf("licence_class")], "owned_local", "columns did not shift");
});

test("csvField quotes only what needs quoting", () => {
  assert.equal(csvField("plain"), "plain");
  assert.equal(csvField("with,comma"), '"with,comma"');
  assert.equal(csvField('say "hi"'), '"say ""hi"""');
  assert.equal(csvField("line\nbreak"), '"line\nbreak"');
  assert.equal(csvField(null), "");
  assert.equal(csvField(undefined), "");
  assert.equal(csvField(0), "0");
});

test("an unfinished performance exports with empty end and duration", (t) => {
  const log = setup(t);
  log.start({ track: track(), mode: "unattended", startedAt: T0 });
  const fields = splitCsvLine(log.toCsv().trim().split("\r\n")[1]);
  assert.equal(fields[1], "", "ended_at is blank, not a guess");
  assert.equal(fields[2], "", "duration is blank, not zero");
});

test("export writes to a local path and nothing else — REQ-DAT-14", async (t) => {
  const log = setup(t);
  const id = log.start({ track: track(), mode: "unattended", startedAt: T0 });
  log.end(id, T0 + 1000);

  const path = join(tmpdir(), `crowddeck-playlog-${randomUUID()}.csv`);
  t.after(() => rmSync(path, { force: true }));

  const res = log.exportCsvTo(path);
  assert.equal(res.path, path);
  assert.ok(res.bytes > 0);
  assert.ok(readFileSync(path, "utf8").includes("Blue Monday"));

  // REQ-DAT-14 is a promise about what this code does NOT do. The honest way to
  // check it is to read the module and confirm there is no transport in it at all.
  const src = await readFile(new URL("../src/playlog.js", import.meta.url), "utf8");
  for (const forbidden of ["node:http", "node:https", "node:net", "fetch(", "XMLHttpRequest", "WebSocket"]) {
    assert.ok(!src.includes(forbidden), `playlog.js must contain no transport — found "${forbidden}"`);
  }
});

test("date filtering narrows the report", (t) => {
  const log = setup(t);
  const a = log.start({ track: track(), mode: "unattended", startedAt: T0 });
  log.end(a, T0 + 1000);
  const b = log.start({ track: track({ id: "t2" }), mode: "unattended", startedAt: T0 + 86_400_000 });
  log.end(b, T0 + 86_400_000 + 1000);

  assert.equal(log.entries().length, 2);
  assert.equal(log.entries({ from: T0 + 1000 }).length, 1);
  assert.equal(log.toCsv({ to: T0 + 500 }).trim().split("\r\n").length, 2, "header plus one");
});

test("summary groups plays by licence class and mode", (t) => {
  const log = setup(t);
  for (const [i, cls] of ["owned_local", "owned_local", "record_pool"].entries()) {
    const id = log.start({
      track: track({ id: `t${i}`, licenceClass: cls }),
      mode: "unattended",
      startedAt: T0 + i * 1000
    });
    log.end(id, T0 + i * 1000 + 500);
  }
  const rows = log.summary();
  const owned = rows.find((r) => r.licence_class === "owned_local");
  assert.equal(Number(owned.plays), 2);
  assert.equal(Number(owned.total_ms), 1000);
});

/** Minimal RFC 4180 reader, so the test parses the CSV rather than trusting it. */
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}
