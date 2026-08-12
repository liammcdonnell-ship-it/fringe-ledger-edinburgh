import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

const readJson = async (path, fallback) => {
  try { return JSON.parse(await readFile(path, "utf8")); } catch { return fallback; }
};
const decode = (text) => text
  .replace(/<!--\s*-->/g, "")
  .replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'")
  .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const plain = (html) => decode(html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
const canonical = (value) => {
  try {
    const url = new URL(value); url.hash = ""; url.hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    url.pathname = url.pathname.replace(/\/$/, ""); return url.toString();
  } catch { return value; }
};
const previousFile = (path, fallback) => {
  try {
    const gitPrefix = existsSync("work/publish.git") ? ["--git-dir=work/publish.git"] : [];
    return JSON.parse(execFileSync("git", [...gitPrefix, "show", `HEAD:${path}`], { encoding: "utf8" }));
  } catch { return fallback; }
};
const parseRanking = (html) => {
  const rows = [];
  for (const match of html.matchAll(/<article class="showEntry[\s\S]*?<\/article>/g)) {
    const article = match[0];
    const title = article.match(/<span class="show"><b>([\s\S]*?)<\/b>/)?.[1];
    const score = article.match(/<span class="score[^"]*">(\d+)<\/span>/)?.[1];
    const reviews = article.match(/<span class="reviews"><b>(\d+)<\/b>/)?.[1];
    if (title && score && reviews) rows.push({ title: plain(title), score: Number(score), reviews: Number(reviews) });
  }
  return rows;
};
const parseSources = (source) => [...source.matchAll(/\{\s*name:\s*"([^"]+)"/g)].map((match) => match[1]);

const audit = await readJson("app/source-audit.json", null);
if (!audit?.checked_at || !audit?.summary || !Array.isArray(audit.sources)) throw new Error("A complete source audit is required before scan history can be updated.");
if (audit.summary.publications_attempted !== audit.summary.publications_listed) throw new Error("Source audit is incomplete; refusing to publish scan history.");

const html = await readFile("work/cloudflare-static/index.html", "utf8");
const currentRanking = parseRanking(html);
if (currentRanking.length < 1) throw new Error("Could not parse the rendered ranking.");
const totals = html.replace(/<!--\s*-->/g, "").match(/Showing\s+\d+\s+of\s+(\d+)\s+scored productions[^\d]+(\d+)\s+linked notices/);
if (!totals) throw new Error("Could not parse show and notice totals from the rendered site.");
const totalShows = Number(totals[1]);
const totalNotices = Number(totals[2]);

const history = await readJson("app/scan-history.json", { scans: [] });
const sameScan = history.scans.find((scan) => scan.completedAt === audit.checked_at);
if (sameScan) {
  sameScan.rankingSnapshot = currentRanking;
  await writeFile("app/scan-history.json", `${JSON.stringify(history, null, 2)}\n`, "utf8");
  console.error(`Added a ${currentRanking.length}-show comparison snapshot to the current scan.`);
  process.exit(0);
}

const previous = history.scans[0];
const previousRanking = new Map((previous?.rankingSnapshot ?? []).map((row) => [row.title, row]));
const movers = currentRanking
  .filter((row) => previousRanking.has(row.title) && previousRanking.get(row.title).score !== row.score)
  .map((row) => ({
    title: row.title,
    previousScore: previousRanking.get(row.title).score,
    currentScore: row.score,
    delta: row.score - previousRanking.get(row.title).score,
    previousReviews: previousRanking.get(row.title).reviews,
    currentReviews: row.reviews,
  }))
  .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || b.currentReviews - a.currentReviews)
  .slice(0, 12);
const newEntries = currentRanking.filter((row) => !previousRanking.has(row.title));

const previousReviewRows = [...previousFile("app/bcg-reviews.json", []), ...previousFile("app/theqr-reviews.json", [])];
const currentReviewRows = [
  ...await readJson("app/bcg-reviews.json", []),
  ...await readJson("app/theqr-reviews.json", []),
];
const previousUrls = new Set(previousReviewRows.map((row) => canonical(row.url)));
const previousTitles = new Set(previousReviewRows.map((row) => row.title));
const additions = currentReviewRows.filter((row) => !previousUrls.has(canonical(row.url)));
const newShowTitles = [...new Set(additions.map((row) => row.title).filter((title) => title && !previousTitles.has(title)))].sort();

const currentPageSource = await readFile("app/page.tsx", "utf8");
let previousPageSource = "";
try {
  const gitPrefix = existsSync("work/publish.git") ? ["--git-dir=work/publish.git"] : [];
  previousPageSource = execFileSync("git", [...gitPrefix, "show", "HEAD:app/page.tsx"], { encoding: "utf8" });
} catch {}
const previousSources = new Set(parseSources(previousPageSource));
const newOutlets = parseSources(currentPageSource).filter((name) => !previousSources.has(name));
const accessFailures = audit.sources.filter((source) => source.status === "access-failed").map((source) => source.publication);
const duplicates = audit.sources.reduce((sum, source) => sum + (source.duplicates ?? 0), 0);
const ambiguous = audit.sources.reduce((sum, source) => sum + (source.ambiguous_matches ?? 0), 0);

const scan = {
  id: audit.checked_at,
  completedAt: audit.checked_at,
  status: audit.status,
  sourcesListed: audit.summary.publications_listed,
  sourcesAttempted: audit.summary.publications_attempted,
  sourcesChecked: audit.summary.checked,
  accessFailed: audit.summary.access_failed,
  newReviews: audit.summary.new_review_notices,
  newShows: previous ? totalShows - previous.totalShows : newShowTitles.length,
  enteredRanking: newEntries.length,
  totalShows,
  totalNotices,
  defaultVisible: currentRanking.length,
  newOutlets,
  duplicates,
  ambiguous,
  movers,
  newEntries,
  newShowTitles,
  accessFailures,
  rankingSnapshot: currentRanking,
};
history.scans = [scan, ...history.scans].slice(0, 30);
await writeFile("app/scan-history.json", `${JSON.stringify(history, null, 2)}\n`, "utf8");
console.error(`Recorded scan ${scan.completedAt}: ${scan.newReviews} reviews, ${scan.newShows} shows, ${scan.enteredRanking} ranking entries.`);


