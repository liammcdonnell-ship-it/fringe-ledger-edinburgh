import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Fringe Ledger and its rolling update view", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /FRINGE LEDGER/);
  assert.match(html, /What changed in the last 24 hours/);
  assert.match(html, /The main Ledger is still rebuilt every hour/);
  assert.match(html, /Publications monitored hourly/);
});

test("the browser status is compact and matches the retained rolling history", async () => {
  const [latestText, historyText] = await Promise.all([
    readFile(new URL("../app/scan-latest.json", import.meta.url), "utf8"),
    readFile(new URL("../app/scan-history.json", import.meta.url), "utf8"),
  ]);
  const latestPayload = JSON.parse(latestText);
  const history = JSON.parse(historyText);
  const latest = latestPayload.scans[0];

  assert.equal(latestPayload.version, 2);
  assert.equal(latest.completedAt, history.scans[0].completedAt);
  assert.equal(latest.windowHours, 24);
  assert.ok(latest.scansInWindow >= 1);
  assert.ok(Date.parse(latest.windowStartedAt) <= Date.parse(latest.completedAt));
  assert.ok(Array.isArray(latest.movers));
  assert.ok(Array.isArray(latest.newEntries));
  assert.equal("rankingSnapshot" in latest, false);
  assert.equal("hourly" in latest, false);
  assert.ok(Buffer.byteLength(JSON.stringify(latestPayload)) < 100_000);
});
