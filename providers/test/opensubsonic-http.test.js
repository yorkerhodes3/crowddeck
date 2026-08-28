// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 CrowdDeck contributors

/**
 * OpenSubsonic provider over a real socket — CON-4.
 *
 * The unit tests inject `fetch`, which proves the mapping but not the protocol: a
 * malformed URL, a parameter we never actually send, or a token computed over the
 * wrong bytes would all pass against a stub that only looks at what we hand it.
 *
 * So this runs the provider against a small `node:http` server that behaves like a
 * Subsonic server rather than agreeing with us — it recomputes md5(password + salt)
 * itself and rejects the request with error 40 if it does not match. If our token
 * derivation were wrong in any way, these tests fail, which is the assurance the
 * stub cannot give.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { OpenSubsonicProvider } from "../src/opensubsonic.js";

const PASSWORD = "sesame";
const USERNAME = "joe";
const API_KEY = "43504ab81e2bfae1";
const AUDIO = Buffer.from("fLaC\u0000\u0000\u0000\u0022RIFF-ish payload standing in for audio");

const SONG = {
  id: "300",
  isDir: false,
  title: "Harbour Lights",
  album: "Slack Water",
  artist: "Ora Marsh",
  duration: 245,
  contentType: "audio/flac",
  suffix: "flac",
  isVideo: false,
  replayGain: { trackGain: -6.2, trackPeak: 0.98, baseGain: 0 }
};

const fail = (code, message) => ({
  "subsonic-response": { status: "failed", version: "1.16.1", type: "fake", openSubsonic: true, error: { code, message } }
});

const ok = (body) => ({
  "subsonic-response": { status: "ok", version: "1.16.1", type: "fake", serverVersion: "0.0.1", openSubsonic: true, ...body }
});

/**
 * A Subsonic server that actually checks the credentials, rather than one that
 * agrees with whatever the client sends.
 */
async function startServer({ requireApiKey = false } = {}) {
  const requests = [];

  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const q = url.searchParams;
    const method = url.pathname.replace(/^\/rest\//, "");
    requests.push({ method, params: Object.fromEntries(q) });

    const send = (obj, status = 200) => {
      const body = JSON.stringify(obj);
      res.writeHead(status, { "content-type": "application/json" });
      res.end(body);
    };

    // Error 43: the spec requires a server to reject conflicting mechanisms.
    if (q.get("apiKey") && (q.get("u") || q.get("t") || q.get("p"))) {
      return send(fail(43, "Multiple conflicting authentication mechanisms provided"));
    }

    if (requireApiKey) {
      if (q.get("apiKey") !== API_KEY) return send(fail(44, "Invalid API key"));
    } else {
      if (q.get("p")) return send(fail(42, "Password authentication is disabled"));
      const salt = q.get("s");
      const token = q.get("t");
      if (!salt || !token) return send(fail(10, "Required parameter is missing"));
      // Computed here, independently. This is the assertion that matters.
      const expected = createHash("md5").update(`${PASSWORD}${salt}`, "utf8").digest("hex");
      if (q.get("u") !== USERNAME || token !== expected) {
        return send(fail(40, "Wrong username or password"));
      }
    }

    if (q.get("v") !== "1.16.1") return send(fail(20, "Incompatible protocol version"));
    if (q.get("c") !== "CrowdDeck") return send(fail(10, "Required parameter c is missing"));
    // Everything downstream assumes JSON; a server honouring the default would
    // return XML and the client would break.
    if (q.get("f") !== "json") {
      res.writeHead(200, { "content-type": "application/xml" });
      return res.end('<?xml version="1.0"?><subsonic-response status="ok"/>');
    }

    switch (method) {
      case "ping":
        return send(ok({}));
      case "search3": {
        if (q.get("query") === null) return send(fail(10, "Required parameter query is missing"));
        const match = q.get("query") === "" || SONG.title.toLowerCase().includes(q.get("query").toLowerCase());
        return send(ok({ searchResult3: match ? { song: [SONG] } : {} }));
      }
      case "getSong":
        return q.get("id") === SONG.id ? send(ok({ song: SONG })) : send(fail(70, "Song not found"));
      case "stream": {
        if (q.get("id") !== SONG.id) return send(fail(70, "Song not found"));
        res.writeHead(200, { "content-type": "audio/flac", "content-length": String(AUDIO.length) });
        return res.end(AUDIO);
      }
      default:
        return send(fail(0, `unknown method ${method}`));
    }
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();

  let closed = false;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    async close() {
      // Idempotent, so a test that closes the server as part of what it is testing
      // can still close it again in a finally block.
      if (closed) return;
      closed = true;
      // closeAllConnections, not just close: an HTTP/1.1 keep-alive socket — or a
      // response body a failing test never consumed — holds the server open
      // indefinitely otherwise. Without this a failed assertion hangs the run
      // instead of reporting, which turns a red test into a stuck CI job.
      server.closeAllConnections();
      server.close();
      await once(server, "close");
    }
  };
}

const provider = (url, over = {}) =>
  new OpenSubsonicProvider({
    url,
    licenceClass: "owned_local",
    declaredBy: "Dana Okoye, venue manager",
    username: USERNAME,
    password: PASSWORD,
    ...over
  });

test("the provider authenticates against a server that checks the token itself", async () => {
  const server = await startServer();
  try {
    const p = provider(server.url);
    assert.equal(await p.healthy(), true);
    assert.equal(server.requests[0].method, "ping");
  } finally {
    await server.close();
  }
});

test("a wrong password is rejected by the server, not silently accepted", async () => {
  const server = await startServer();
  try {
    const p = provider(server.url, { password: "not-sesame" });
    await assert.rejects(p.search("harbour"), (err) => {
      assert.equal(err.code, "auth_error");
      assert.match(err.message, /Wrong username or password/);
      return true;
    });
  } finally {
    await server.close();
  }
});

test("search returns a mapped track over a real connection", async () => {
  const server = await startServer();
  try {
    const [t] = await provider(server.url).search("harbour");
    assert.equal(t.id, "300");
    assert.equal(t.title, "Harbour Lights");
    assert.equal(t.duration, 245_000);
    assert.equal(t.licenceClass, "owned_local");
    assert.equal(t.replayGainDb, -6.2);
  } finally {
    await server.close();
  }
});

test("an empty query is accepted by the server, so browsing works", async () => {
  const server = await startServer();
  try {
    const tracks = await provider(server.url).search("");
    assert.equal(tracks.length, 1);
    assert.equal(server.requests.at(-1).params.query, "");
  } finally {
    await server.close();
  }
});

test("the stream url returns actual audio bytes when fetched", async () => {
  const server = await startServer();
  try {
    const url = await provider(server.url).streamUrl("300");
    // Fetched with a bare fetch, exactly as the engine would: no headers, no
    // cookies, nothing but the URL. If authentication were header-based this
    // would fail, which is the point of checking it this way.
    const res = await fetch(url);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "audio/flac");
    const body = Buffer.from(await res.arrayBuffer());
    assert.deepEqual(body, AUDIO);
  } finally {
    await server.close();
  }
});

test("an apiKey server accepts the key and never sees a username", async () => {
  const server = await startServer({ requireApiKey: true });
  try {
    const p = new OpenSubsonicProvider({
      url: server.url,
      licenceClass: "owned_local",
      apiKey: API_KEY
    });
    assert.equal(await p.healthy(), true);
    const sent = server.requests.at(-1).params;
    assert.equal(sent.apiKey, API_KEY);
    assert.equal(sent.u, undefined);
    assert.equal(sent.t, undefined);
  } finally {
    await server.close();
  }
});

test("a bad api key surfaces as an auth error, not an empty library", async () => {
  const server = await startServer({ requireApiKey: true });
  try {
    const p = new OpenSubsonicProvider({
      url: server.url,
      licenceClass: "owned_local",
      apiKey: "wrong"
    });
    await assert.rejects(p.search("harbour"), (err) => {
      assert.equal(err.code, "auth_error");
      assert.match(err.message, /Invalid API key/);
      return true;
    });
  } finally {
    await server.close();
  }
});

test("a track the server has dropped resolves to null", async () => {
  const server = await startServer();
  try {
    assert.equal(await provider(server.url).resolve("999"), null);
  } finally {
    await server.close();
  }
});

test("a search can be abandoned by its caller", async () => {
  const server = await startServer();
  try {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      provider(server.url).search("harbour", { signal: controller.signal }),
      (err) => err.code === "network_error"
    );
  } finally {
    await server.close();
  }
});

test("a server that has gone away is reported as unhealthy, not as no music", async () => {
  const server = await startServer();
  try {
    const p = provider(server.url);
    assert.equal(await p.healthy(), true);
    await server.close();
    assert.equal(await p.healthy(), false);
    await assert.rejects(p.search("harbour"), (err) => {
      assert.equal(err.code, "network_error");
      assert.equal(err.retryable, true);
      return true;
    });
  } finally {
    // Unconditional: without it, a failed assertion above leaks a listening
    // server and `node --test` never exits — a hang instead of a red test.
    await server.close();
  }
});
