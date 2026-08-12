import fs from "node:fs/promises";
import path from "node:path";

const outputPath = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve("app/direct-reviews.json");
const FEST_ARCHIVE = "https://festmag.com/category/reviews/";
const SKINNY_ARCHIVES = [
  { url: "https://www.theskinny.co.uk/festivals/edinburgh-fringe/comedy", genre: "Comedy" },
  { url: "https://www.theskinny.co.uk/festivals/edinburgh-fringe/theatre", genre: "Theatre" },
];
const ED_FRINGE_SITEMAP = "https://www.edfringe.com/tickets/sitemap.xml";

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const decodeHtml = (value) => String(value)
  .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&apos;|&#x27;|&#39;/gi, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
  .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
const cleanText = (value) => decodeHtml(String(value).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const titleKey = (value) => cleanText(value).replace(/\u00bd/g, " 1 2 ").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const slugify = (value) => cleanText(value).replace(/\u00bd/g, " 1 2 ").normalize("NFKD").toLowerCase()
  .replace(/[\u2019']/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").replace(/-+/g, "-");
const canonicalUrl = (value) => {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
};

const fetchPage = async (url) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "Fringe Ledger direct review reconciler/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) return { html: await response.text(), url: response.url };
      if (response.status !== 429 && response.status < 500) return null;
    } catch {
      // Retry transient network failures below.
    }
    await wait(500 * (attempt + 1));
  }
  return null;
};

const hrefs = (html, baseUrl) => [...new Set(
  [...html.matchAll(/href=["']([^"']+)["']/gi)].flatMap((match) => {
    try { return [new URL(decodeHtml(match[1]), baseUrl).toString()]; } catch { return []; }
  }),
)];
const tokenSet = (value) => new Set(titleKey(value).split(" ").filter(Boolean));
const candidateScore = (title, slug) => {
  const left = tokenSet(title);
  const right = tokenSet(slug);
  const shared = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  if (!shared || !union) return 0;
  return (shared / union) * 0.7 + (shared / Math.min(left.size, right.size)) * 0.3;
};

const sitemapPage = await fetchPage(ED_FRINGE_SITEMAP);
if (!sitemapPage) throw new Error("Could not load the official EdFringe sitemap; refusing to import unverified productions.");
const officialSlugs = [...sitemapPage.html.matchAll(/<loc>https:\/\/www\.edfringe\.com\/tickets\/whats-on\/([^<]+)<\/loc>/gi)]
  .map((match) => decodeURIComponent(match[1]).replace(/\/$/, ""));
const officialSlugSet = new Set(officialSlugs);
const officialMatch = (title) => {
  const candidates = new Set([
    slugify(title),
    slugify(title.replace(/^the\s+/i, "")),
    slugify(title.includes(":") ? title.slice(title.indexOf(":") + 1) : title),
  ]);
  for (const candidate of candidates) if (officialSlugSet.has(candidate)) return candidate;
  const best = officialSlugs.map((slug) => ({ slug, score: candidateScore(title, slug) }))
    .sort((left, right) => right.score - left.score)[0];
  return best?.score >= 0.72 ? best.slug : null;
};

const parseFest = (html, url) => {
  const title = cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "")
    .replace(/^(?:kids\s+)?review:\s*/i, "").trim();
  const stars = Number(html.match(/"reviewRating"\s*:\s*\{[\s\S]{0,250}?"ratingValue"\s*:\s*([0-5](?:\.5)?)/i)?.[1] ?? 0);
  const publishedAt = html.match(/article:published_time["'][^>]+content=["']([^"']+)/i)?.[1]
    ?? html.match(/"datePublished"\s*:\s*"([^"]+)"/i)?.[1] ?? null;
  if (!title || !stars || !String(publishedAt).includes("2026")) return null;
  return { title, outlet: "Fest Mag", stars, value: Math.round(stars * 20), url: canonicalUrl(url), publishedAt };
};
const parseSkinny = (html, url, genre) => {
  const heading = cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const title = heading.replace(/\s+@\s+.+$/, "").trim();
  const ratingHtml = html.match(/<div[^>]+class=["'][^"']*star-rating[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "";
  const stars = (ratingHtml.match(/&#x2605;|&#9733;|\u2605/gi) ?? []).length;
  const publishedAt = cleanText(html).match(/\|\s*(\d{1,2}\s+[A-Z][a-z]{2}\s+2026)\b/)?.[1] ?? null;
  if (!title || !stars || !publishedAt) return null;
  return { title, outlet: "The Skinny", stars, value: stars * 20, url: canonicalUrl(url), publishedAt, genre };
};

const festArchive = await fetchPage(FEST_ARCHIVE);
if (!festArchive) throw new Error("Could not load Fest's review archive.");
const festUrls = hrefs(festArchive.html, FEST_ARCHIVE).filter((value) => {
  const url = new URL(value);
  return url.hostname.replace(/^www\./, "") === "festmag.com" && /^\/2026\/\d{2}\/\d{2}\//.test(url.pathname);
});

const skinnyCandidates = new Map();
for (const archive of SKINNY_ARCHIVES) {
  let foundCurrentYear = false;
  for (let pageNumber = 1; pageNumber <= 8; pageNumber += 1) {
    const url = pageNumber === 1 ? archive.url : archive.url + "?page=" + pageNumber;
    const page = await fetchPage(url);
    if (!page) throw new Error("Could not load The Skinny archive: " + url);
    const hasCurrentYear = /item-published-on[^>]*>[^<]*\b2026\b/i.test(page.html);
    if (hasCurrentYear) foundCurrentYear = true;
    for (const value of hrefs(page.html, archive.url)) {
      const parsed = new URL(value);
      if (parsed.hostname.replace(/^www\./, "") !== "theskinny.co.uk") continue;
      if (!parsed.pathname.startsWith("/festivals/edinburgh-fringe/" + archive.genre.toLowerCase() + "/")) continue;
      skinnyCandidates.set(canonicalUrl(value), archive.genre);
    }
    if (foundCurrentYear && !hasCurrentYear) break;
  }
}

const candidates = [
  ...festUrls.map((url) => ({ outlet: "Fest Mag", url })),
  ...[...skinnyCandidates].map(([url, genre]) => ({ outlet: "The Skinny", url, genre })),
];
const parsedRows = [];
let cursor = 0;
const worker = async () => {
  while (cursor < candidates.length) {
    const candidate = candidates[cursor];
    cursor += 1;
    const page = await fetchPage(candidate.url);
    if (!page) continue;
    const row = candidate.outlet === "Fest Mag" ? parseFest(page.html, page.url) : parseSkinny(page.html, page.url, candidate.genre);
    if (row) parsedRows.push(row);
  }
};
await Promise.all(Array.from({ length: 10 }, worker));

const heldBack = [];
const verified = [];
for (const row of parsedRows) {
  const officialSlug = officialMatch(row.title);
  if (!officialSlug) {
    heldBack.push(row);
    continue;
  }
  verified.push({ ...row, officialUrl: "https://www.edfringe.com/tickets/whats-on/" + officialSlug });
}
const deduped = [...new Map(verified.map((row) => [canonicalUrl(row.url), row])).values()]
  .sort((left, right) => left.outlet.localeCompare(right.outlet) || left.title.localeCompare(right.title));

await fs.writeFile(outputPath, JSON.stringify(deduped, null, 2) + "\n", "utf8");
console.error("Fest: " + deduped.filter((row) => row.outlet === "Fest Mag").length + " verified 2026 Fringe reviews.");
console.error("The Skinny: " + deduped.filter((row) => row.outlet === "The Skinny").length + " verified 2026 Fringe reviews.");
console.error("Held back " + heldBack.length + " scored articles without a confident official EdFringe match: "
  + (heldBack.map((row) => row.outlet + " - " + row.title).join("; ") || "none") + ".");
console.error("Saved " + outputPath + ".");




