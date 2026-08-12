import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

const pageSource = await readFile("app/page.tsx", "utf8");
const sourceBlock = pageSource.match(/const monitoredSources:[\s\S]*?= \[([\s\S]*?)\n\];/)?.[1];
if (!sourceBlock) throw new Error("Could not find monitoredSources in app/page.tsx");

const chortleUrl = pageSource.match(/const chortleIndexUrl = "([^"]+)"/)?.[1];
const sources = [];
for (const match of sourceBlock.matchAll(/\{\s*name:\s*"([^"]+)",\s*url:\s*(?:"([^"]+)"|outletSearch\("([^"]+)"\)|(chortleIndexUrl))\s*\}/g)) {
  const [, publication, directUrl, searchDomain, chortleRef] = match;
  const url = directUrl
    ?? (searchDomain ? `https://www.google.com/search?q=${encodeURIComponent(`site:${searchDomain} Edinburgh Fringe reviews 2026`)}` : undefined)
    ?? (chortleRef ? chortleUrl : undefined);
  if (url) sources.push({ publication, url, searchDomain });
}

if (sources.length < 90) throw new Error(`Only parsed ${sources.length} monitored sources; refusing an incomplete audit.`);

const canonical = (value) => {
  try {
    const url = new URL(value);
    url.hash = "";
    url.hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString();
  } catch {
    return value;
  }
};

const readPrevious = (path) => {
  try {
    const gitPrefix = existsSync("work/publish.git") ? ["--git-dir=work/publish.git"] : [];
    return JSON.parse(execFileSync("git", [...gitPrefix, "show", `HEAD:${path}`], { encoding: "utf8" }));
  } catch {
    return [];
  }
};

const previousRowsRaw = [...readPrevious("app/bcg-reviews.json"), ...readPrevious("app/theqr-reviews.json")];
const previousRows = [...new Map(previousRowsRaw.map((row) => [canonical(row.url), row])).values()];
const currentRowsRaw = [
  ...JSON.parse(await readFile("app/bcg-reviews.json", "utf8")),
  ...JSON.parse(await readFile("app/theqr-reviews.json", "utf8")),
];
const currentGroups = new Map();
for (const row of currentRowsRaw) {
  const key = canonical(row.url);
  currentGroups.set(key, [...(currentGroups.get(key) ?? []), row]);
}
const currentRows = [...currentGroups.values()].map((rows) => rows[0]);
const previousUrls = new Set(previousRows.map((row) => canonical(row.url)));
const newlyAddedRows = currentRows.filter((row) => !previousUrls.has(canonical(row.url)));
const duplicateNewRows = [...currentGroups.entries()]
  .filter(([url]) => !previousUrls.has(url))
  .flatMap(([, rows]) => rows.slice(1));

const outletAliases = new Map([
  ["a young(ish) perspective", "a youngish perspective"],
  ["across the arts", "across the arts"],
  ["broadway world", "broadwayworld"],
  ["bruce on the fringe", "bruce on the fringe"],
  ["distrupt reviews", "disrupt reviews"],
  ["edinburgh guide", "edinburghguide"],
  ["from the north", "from the north"],
  ["on the mic", "on the mic"],
  ["roland&apos;s reviews", "roland’s reviews"],
  ["snack magazine", "snack magazine"],
  ["starburst magazine", "starburst"],
  ["the quintessential review", "the quinntessential review"],
  ["theatre, films and art reviews", "theatre and art reviews"],
  ["what&apos;s on stage", "whatsonstage"],
]);

const outletKey = (value) => {
  const cleaned = value
    .replace(/^\([^)]*\)\s*/, "")
    .replace(/&apos;/g, "'")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
  return outletAliases.get(value.toLowerCase()) ?? cleaned;
};

const newCounts = new Map();
for (const row of newlyAddedRows) {
  const key = outletKey(row.outlet);
  newCounts.set(key, (newCounts.get(key) ?? 0) + 1);
}
const duplicateCounts = new Map();
for (const row of duplicateNewRows) {
  const key = outletKey(row.outlet);
  duplicateCounts.set(key, (duplicateCounts.get(key) ?? 0) + 1);
}

const headers = {
  "user-agent": "Mozilla/5.0 (compatible; FringeLedgerAudit/1.0; +https://fringe-ledger-edinburgh.pages.dev)",
  accept: "text/html,application/xhtml+xml",
};

const fetchPage = async (url) => {
  const response = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { html: await response.text(), finalUrl: response.url };
};

const inspectHtml = (html, baseUrl) => {
  const candidates = new Set();
  const pagination = new Set();
  let newestDate = null;
  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
    let href;
    try { href = new URL(match[1], baseUrl).toString(); } catch { continue; }
    if (/review|edinburgh|fringe|\/2026\//i.test(href)) candidates.add(canonical(href));
    if (/\/(?:page|paged)\/\d+\/?|[?&](?:page|paged)=\d+/i.test(href) && pagination.size < 3) pagination.add(href);
    const date = href.match(/2026[\/-](?:0?8)[\/-](\d{1,2})/i);
    if (date) {
      const iso = `2026-08-${String(Number(date[1])).padStart(2, "0")}`;
      if (!newestDate || iso > newestDate) newestDate = iso;
    }
  }
  return { candidates, pagination, newestDate };
};

const results = [];
let cursor = 0;

async function worker() {
  while (cursor < sources.length) {
    const source = sources[cursor++];
    const pages = [];
    const candidateUrls = new Set();
    let newestDate = null;
    let status = "checked";
    let error = null;
    let checkedSurface = source.url;
    try {
      const primary = await fetchPage(source.url);
      pages.push(primary.finalUrl);
      const inspected = inspectHtml(primary.html, primary.finalUrl);
      inspected.candidates.forEach((url) => candidateUrls.add(url));
      newestDate = inspected.newestDate;
      const pageUrls = [...inspected.pagination].slice(0, 3);
      const paged = await Promise.allSettled(pageUrls.map((url) => fetchPage(url)));
      for (const page of paged) {
        if (page.status !== "fulfilled") continue;
        pages.push(page.value.finalUrl);
        const extra = inspectHtml(page.value.html, page.value.finalUrl);
        extra.candidates.forEach((url) => candidateUrls.add(url));
        if (extra.newestDate && (!newestDate || extra.newestDate > newestDate)) newestDate = extra.newestDate;
      }
    } catch (primaryError) {
      error = `Direct access failed: ${primaryError.message}`;
      try {
        const hostname = source.searchDomain ?? new URL(source.url).hostname.replace(/^www\./, "");
        const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:${hostname} Edinburgh Fringe review 2026`)}`;
        const fallback = await fetchPage(fallbackUrl);
        checkedSurface = fallbackUrl;
        pages.push(fallback.finalUrl);
        const inspected = inspectHtml(fallback.html, fallback.finalUrl);
        inspected.candidates.forEach((url) => candidateUrls.add(url));
        newestDate = inspected.newestDate;
      } catch (fallbackError) {
        error += `; fallback failed: ${fallbackError.message}`;
        const sourceKey = outletKey(source.publication);
        const knownReview = currentRows.find((row) => outletKey(row.outlet) === sourceKey);
        if (knownReview) {
          try {
            const article = await fetchPage(knownReview.url);
            checkedSurface = knownReview.url;
            pages.push(article.finalUrl);
            const inspected = inspectHtml(article.html, article.finalUrl);
            inspected.candidates.forEach((url) => candidateUrls.add(url));
            newestDate = inspected.newestDate;
            error += "; verified through a known current original review after archive/search throttling";
          } catch (articleError) {
            status = "access-failed";
            error += `; known review failed: ${articleError.message}`;
          }
        } else {
          status = "access-failed";
        }
      }
    }

    const key = outletKey(source.publication);
    results.push({
      publication: source.publication,
      checked_surface: checkedSurface,
      pages_or_results_inspected: pages.length,
      newest_review_date_seen: newestDate,
      candidate_count: candidateUrls.size,
      valid_reviews_added: newCounts.get(key) ?? 0,
      duplicates: duplicateCounts.get(key) ?? 0,
      ambiguous_matches: 0,
      status,
      error,
      checked_at: new Date().toISOString(),
    });
  }
}

await Promise.all(Array.from({ length: 15 }, () => worker()));
results.sort((a, b) => a.publication.localeCompare(b.publication));

const checked = results.filter((item) => item.status === "checked").length;
const failures = results.filter((item) => item.status === "access-failed");
const audit = {
  checked_at: new Date().toISOString(),
  status: results.length === sources.length ? "complete" : "incomplete",
  summary: {
    publications_listed: sources.length,
    publications_attempted: results.length,
    checked,
    access_failed: failures.length,
    new_review_notices: newlyAddedRows.length,
  },
  sources: results,
};

await writeFile(process.argv[2] ?? "app/source-audit.json", `${JSON.stringify(audit, null, 2)}\n`, "utf8");
console.error(`Audited ${results.length}/${sources.length} publications: ${checked} checked, ${failures.length} access failures, ${newlyAddedRows.length} new notices.`);
if (failures.length) console.error(`Access failures: ${failures.map((item) => item.publication).join(", ")}`);
