const HISTORY_KEY = "scan-history";
const MAX_BODY_BYTES = 1_000_000;

const publicHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=60",
  "Content-Type": "application/json; charset=utf-8",
};

function json(body, init = {}) {
  const headers = new Headers(init.headers);
  for (const [name, value] of Object.entries(publicHeaders)) headers.set(name, value);
  return new Response(JSON.stringify(body), { ...init, headers });
}

async function tokensMatch(provided, expected) {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(providedHash);
  const right = new Uint8Array(expectedHash);
  let difference = left.length ^ right.length;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function validHistory(value) {
  if (!value || typeof value !== "object" || !("scans" in value) || !Array.isArray(value.scans) || value.scans.length === 0) return false;
  return value.scans.every((scan) => scan && typeof scan === "object" && "completedAt" in scan && typeof scan.completedAt === "string");
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/scan-history.json") return json({ error: "Not found" }, { status: 404 });

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method === "GET") {
      const stored = await env.SCAN_STATUS.get(HISTORY_KEY);
      if (!stored) return json({ error: "No completed scan has been published yet" }, { status: 404 });
      return new Response(stored, { headers: publicHeaders });
    }

    if (request.method !== "POST") return json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET, POST, OPTIONS" } });

    const authorization = request.headers.get("Authorization") ?? "";
    const providedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!providedToken || !(await tokensMatch(providedToken, env.INGEST_TOKEN))) return json({ error: "Unauthorized" }, { status: 401 });

    const contentLength = Number(request.headers.get("Content-Length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) return json({ error: "Payload too large" }, { status: 413 });

    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) return json({ error: "Payload too large" }, { status: 413 });

    let history;
    try {
      history = JSON.parse(bodyText);
    } catch {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (!validHistory(history)) return json({ error: "Expected a non-empty scans array" }, { status: 400 });

    await env.SCAN_STATUS.put(HISTORY_KEY, JSON.stringify(history));
    return json({ ok: true, completedAt: history.scans[0].completedAt });
  },
};

export default worker;

