import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const staticDir = path.join(root, "work", "cloudflare-static");
await fs.mkdir(staticDir, { recursive: true });
await fs.cp(path.join(root, "dist", "client"), staticDir, { recursive: true, force: true });

const workerUrl = pathToFileURL(path.join(root, "dist", "server", "index.js"));
workerUrl.searchParams.set("static", Date.now().toString());
const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(
  new Request("https://fringe-ledger-edinburgh.pages.dev/"),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);
if (!response.ok) throw new Error(`Static render failed with HTTP ${response.status}`);

const release = Date.now().toString(36);
const html = (await response.text()).replace(
  /(["']\/assets\/[^"'?]+\.(?:js|css))(["'])/g,
  `$1?v=${release}$2`,
);
await fs.writeFile(path.join(staticDir, "index.html"), html, "utf8");
console.error(`Rendered ${Buffer.byteLength(html)} bytes to work/cloudflare-static/index.html.`);
