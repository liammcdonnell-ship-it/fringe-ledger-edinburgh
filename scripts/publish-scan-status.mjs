import { readFile } from "node:fs/promises";

const url = process.env.SCAN_STATUS_URL;
const token = process.env.SCAN_STATUS_TOKEN;
if (!url || !token) throw new Error("SCAN_STATUS_URL and SCAN_STATUS_TOKEN are required.");

const history = JSON.parse(await readFile("app/scan-latest.json", "utf8"));
const latest = history.scans?.[0];
if (!latest) throw new Error("A completed scan is required before status publication.");

// Detailed snapshots stay in scan-history.json; this compact record is all the browser needs.
const publicHistory = JSON.stringify(history);
const response = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: publicHistory,
});
if (!response.ok) throw new Error(`Status publication failed with HTTP ${response.status}: ${await response.text()}`);
const result = await response.json();
console.error(`Published compact scan status ${result.completedAt} (${Buffer.byteLength(publicHistory)} bytes).`);
