import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

const WINDOW_HOURS = 24;
const WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000;
const HISTORY_LIMIT = 36;

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
const scanTime = (scan) => new Date(scan.completedAt).getTime();
const unique = (values) => [...new Set(values.filter(Boolean))].sort();

const hourlyRecord = (scan) => scan.hourly ?? {
  newReviews: scan.newReviews ?? 0,
  newShows: scan.newShows ?? 0,
  enteredRanking: scan.enteredRanking ?? 0,
  newShowTitles: scan.newShowTitles ?? [],
  newOutlets: scan.newOutlets ?? [],
};

const compareRankings = (current, baseline) => {
  const previousRanking = new Map((baseline?.rankingSnapshot ?? []).map((row) => [row.title, row]));
  const movers = current
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
  const newEntries = current.filter((row) => !previousRanking.has(row.title));
  return { movers, newEntries };
};

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
const existingScan = history.scans.find((scan) => scan.completedAt === audit.checked_at);
const earlierScans = history.scans
  .filter((scan) => scan.completedAt !== audit.checked_at)
  .sort((a, b) => scanTime(b) - scanTime(a));
const previous = earlierScans[0];
const immediateComparison = compareRankings(currentRanking, previous);

const previousReviewRows = [
  ...previousFile("app/bcg-reviews.json", []),
  ...previousFile("app/theqr-reviews.json", []),
  ...previousFile("app/direct-reviews.json", []),
];
const currentReviewRows = [
  ...await readJson("app/bcg-reviews.json", []),
  ...await readJson("app/theqr-reviews.json", []),
  ...await readJson("app/direct-reviews.json", []),
];
const previousUrls = new Set(previousReviewRows.map((row) => canonical(row.url)));
const previousTitles = new Set(previousReviewRows.map((row) => row.title));
const additions = currentReviewRows.filter((row) => !previousUrls.has(canonical(row.url)));
const detectedNewShowTitles = unique(additions.map((row) => row.title).filter((title) => title && !previousTitles.has(title)));

const currentPageSource = await readFile("app/page.tsx", "utf8");
let previousPageSource = "";
try {
  const gitPrefix = existsSync("work/publish.git") ? ["--git-dir=work/publish.git"] : [];
  previousPageSource = execFileSync("git", [...gitPrefix, "show", "HEAD:app/page.tsx"], { encoding: "utf8" });
} catch {}
const previousSources = new Set(parseSources(previousPageSource));
const detectedNewOutlets = parseSources(currentPageSource).filter((name) => !previousSources.has(name));

const hourly = existingScan ? hourlyRecord(existingScan) : {
  newReviews: audit.summary.new_review_notices,
  newShows: previous ? totalShows - previous.totalShows : detectedNewShowTitles.length,
  enteredRanking: immediateComparison.newEntries.length,
  newShowTitles: detectedNewShowTitles,
  newOutlets: detectedNewOutlets,
};

const accessFailures = audit.sources.filter((source) => source.status === "access-failed").map((source) => source.publication);
const duplicates = audit.sources.reduce((sum, source) => sum + (source.duplicates ?? 0), 0);
const ambiguous = audit.sources.reduce((sum, source) => sum + (source.ambiguous_matches ?? 0), 0);
const currentBase = {
  id: audit.checked_at,
  completedAt: audit.checked_at,
  status: audit.status,
  sourcesListed: audit.summary.publications_listed,
  sourcesAttempted: audit.summary.publications_attempted,
  sourcesChecked: audit.summary.checked,
  accessFailed: audit.summary.access_failed,
  totalShows,
  totalNotices,
  defaultVisible: currentRanking.length,
  duplicates,
  ambiguous,
  accessFailures,
  rankingSnapshot: currentRanking,
  hourly,
};

const chronological = [currentBase, ...earlierScans].sort((a, b) => scanTime(b) - scanTime(a));
const completedTime = scanTime(currentBase);
const targetTime = completedTime - WINDOW_MS;
const baseline = earlierScans.length
  ? [...earlierScans].sort((a, b) => Math.abs(scanTime(a) - targetTime) - Math.abs(scanTime(b) - targetTime))[0]
  : null;
const baselineTime = baseline ? scanTime(baseline) : completedTime;
const windowScans = chronological.filter((scan) => scanTime(scan) > baselineTime && scanTime(scan) <= completedTime);
const comparison = compareRankings(currentRanking, baseline);
const windowNewShowTitles = unique(windowScans.flatMap((scan) => hourlyRecord(scan).newShowTitles ?? []));
const windowNewOutlets = unique(windowScans.flatMap((scan) => hourlyRecord(scan).newOutlets ?? []));
const coverageHours = baseline ? Math.round(((completedTime - baselineTime) / 3_600_000) * 10) / 10 : 0;

const scan = {
  ...currentBase,
  windowHours: WINDOW_HOURS,
  windowStartedAt: baseline?.completedAt ?? audit.checked_at,
  windowEndedAt: audit.checked_at,
  windowCoverageHours: coverageHours,
  scansInWindow: windowScans.length,
  newReviews: windowScans.reduce((sum, item) => sum + Math.max(0, hourlyRecord(item).newReviews ?? 0), 0),
  newShows: baseline ? totalShows - baseline.totalShows : hourly.newShows,
  enteredRanking: comparison.newEntries.length,
  newOutlets: windowNewOutlets,
  movers: comparison.movers,
  newEntries: comparison.newEntries,
  newShowTitles: windowNewShowTitles,
};

history.scans = [scan, ...earlierScans].sort((a, b) => scanTime(b) - scanTime(a)).slice(0, HISTORY_LIMIT);
await writeFile("app/scan-history.json", `${JSON.stringify(history, null, 2)}\n`, "utf8");
const publicScan = { ...scan };
delete publicScan.rankingSnapshot;
delete publicScan.hourly;
await writeFile("app/scan-latest.json", `${JSON.stringify({ version: 2, scans: [publicScan] }, null, 2)}\n`, "utf8");
console.error(`Recorded rolling ${WINDOW_HOURS}-hour update ending ${scan.completedAt}: ${scan.newReviews} reviews, ${scan.newShows} net shows, ${scan.enteredRanking} ranking entries across ${scan.scansInWindow} scans.`);
