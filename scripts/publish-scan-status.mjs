import { readFile } from "node:fs/promises";

const url = process.env.SCAN_STATUS_URL;
const token = process.env.SCAN_STATUS_TOKEN;
if (!url || !token) throw new Error("SCAN_STATUS_URL and SCAN_STATUS_TOKEN are required.");
const history = await readFile("app/scan-history.json", "utf8");
const response = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: history,
});
if (!response.ok) throw new Error(`Status publication failed with HTTP ${response.status}: ${await response.text()}`);
const result = await response.json();
console.error(`Published scan status ${result.completedAt}.`);
