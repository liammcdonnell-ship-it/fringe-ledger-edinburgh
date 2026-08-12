import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = path.join(root, "app", "page.tsx");
const bcgPath = path.join(root, "app", "bcg-reviews.json");
const qrPath = path.join(root, "app", "theqr-reviews.json");
const outputPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, "app", "edfringe-listings.json");
const officialSource = "https://www.edfringe.com/tickets/whats-on";
const officialAliases = new Map([
  ["199 jokes before lunch time danny matinee", "199-jokes-before-lunchtime-danny-matinee"],
  ["aarushi agni emoji", "emoji-the-hieroglyphs-of-our-time-or-how-i-learned-to-stop-worrying-and-send-the-risky-text"],
  ["blip barp an alien love story", "blip-blarp-an-alien-love-story"],
  ["courtney b chner one of the girls", "courtney-b-chner-one-of-the-girls"],
  ["sh t theatre evita too", "evita-too"],
  ["spinqueen", "spinqueen"],
  ["the bloopers", "the-bloopers-an-improvised-musical-biopic"],
]);
const sitemapUrl = "https://www.edfringe.com/tickets/sitemap.xml";

const decodeHtml = (value) => String(value)
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&apos;/gi, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">");

const cleanTitle = (value) => decodeHtml(value)
  .replace(/\u00c2\u00bd/g, "½")
  .replace(/\u00c2/g, "")
  .replace(/\s+/g, " ")
  .trim();

const titleKey = (value) => cleanTitle(value)
  .replace(/½/g, " 1 2 ")
  .normalize("NFKD")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const slugify = (value, compactApostrophes = false) => cleanTitle(value)
  .replace(/½/g, " ")
  .normalize("NFKD")
  .toLowerCase()
  .replace(/[’']/g, compactApostrophes ? "" : " ")
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .replace(/-+/g, "-");

const slugCandidates = (title) => {
  const withoutPrefix = title.includes(":") ? title.slice(title.indexOf(":") + 1).trim() : title;
  return [...new Set([
    slugify(title),
    slugify(title, true),
    slugify(title.replace(/½/g, "")),
    slugify(title.replace(/½/g, " half")),
    slugify(title.replace(/½/g, " 1 2")),
    slugify(withoutPrefix),
  ])].filter(Boolean);
};

const tokenSet = (value) => new Set(titleKey(value).split(" ").filter(Boolean));
const titlesMatch = (expected, actual) => {
  if (titleKey(expected) === titleKey(actual)) return true;
  const expectedTokens = tokenSet(expected);
  const actualTokens = tokenSet(actual);
  const shared = [...expectedTokens].filter((token) => actualTokens.has(token)).length;
  const smaller = Math.min(expectedTokens.size, actualTokens.size);
  const union = new Set([...expectedTokens, ...actualTokens]).size;
  if (smaller < 2 || shared !== smaller) return false;
  return shared >= 4 || shared / union >= 0.45;
};

const editDistance = (left, right) => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
};

const candidateScore = (title, slug) => {
  const expected = titleKey(title);
  const candidate = titleKey(slug);
  const expectedTokens = tokenSet(title);
  const candidateTokens = tokenSet(slug);
  const shared = [...expectedTokens].filter((token) => candidateTokens.has(token)).length;
  const union = new Set([...expectedTokens, ...candidateTokens]).size;
  const tokenScore = union ? shared / union : 0;
  const editScore = 1 - editDistance(expected, candidate) / Math.max(expected.length, candidate.length, 1);
  return tokenScore * 0.65 + editScore * 0.35;
};

const parseListing = (html, url, expectedTitle, trustedAlias = false) => {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " ");
  const title = h1 ? cleanTitle(h1) : "";
  const genre = html.match(/"genre":"([^"]+)"/i)?.[1] ?? "";
  const subGenre = html.match(/"subGenre":"([^"]*)"/i)?.[1] ?? "";
  if (!title || !genre || (!trustedAlias && !titlesMatch(expectedTitle, title))) return null;
  return { title: cleanTitle(expectedTitle), officialTitle: title, genre, subGenre, url };
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const fetchPage = async (url) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "Fringe Ledger listing reconciler/1.1" },
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) return { html: await response.text(), url: response.url };
      if (response.status !== 429 && response.status < 500) return null;
    } catch {
      // Retry transient timeouts and connection failures below.
    }
    await wait(500 * (attempt + 1));
  }
  return null;
};

const readSitemapListings = async () => {
  try {
    const page = await fetchPage(sitemapUrl);
    if (!page) return [];
    return [...page.html.matchAll(/<loc>(https:\/\/www\.edfringe\.com\/tickets\/whats-on\/[^<]+)<\/loc>/g)]
      .map((match) => decodeHtml(match[1]));
  } catch {
    return [];
  }
};

const sitemapListings = await readSitemapListings();
const sitemapBySlug = new Map(sitemapListings.map((url) => [decodeURIComponent(new URL(url).pathname.split("/").pop()), url]));

const fetchListing = async (title) => {
  const urls = new Set();
  const aliasSlug = officialAliases.get(titleKey(title))
    ?? (title.includes("Courtney") ? "courtney-b-chner-one-of-the-girls" : null)
    ?? (title.includes("SpinQueen") ? "spinqueen" : null);
  const aliasUrl = aliasSlug ? (sitemapBySlug.get(aliasSlug) ?? `${officialSource}/${aliasSlug}`) : null;
  if (aliasUrl) urls.add(aliasUrl);
  for (const slug of slugCandidates(title)) urls.add(sitemapBySlug.get(slug) ?? `${officialSource}/${slug}`);
  const fuzzyCandidates = sitemapListings
    .map((url) => ({ url, score: candidateScore(title, decodeURIComponent(new URL(url).pathname.split("/").pop())) }))
    .filter((candidate) => candidate.score >= 0.4)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
  for (const candidate of fuzzyCandidates) urls.add(candidate.url);

  for (const url of urls) {
    const page = await fetchPage(url);
    if (!page) continue;
    const listing = parseListing(page.html, page.url, title, Boolean(aliasUrl && url === aliasUrl));
    if (listing) return listing;
  }
  return null;
};

const pageSource = await fs.readFile(pagePath, "utf8");
const bcg = JSON.parse(await fs.readFile(bcgPath, "utf8"));
const qr = JSON.parse(await fs.readFile(qrPath, "utf8"));
const inlineTitles = [...pageSource.matchAll(/\{\s*title:\s*"([^"]+)"/g)].map((match) => match[1]);
const titles = [...new Map(
  [...inlineTitles, ...bcg.map((review) => review.title), ...qr.map((review) => review.title)]
    .map((title) => [titleKey(title), cleanTitle(title)]),
).values()];

const results = new Array(titles.length);
let previousListings = [];
try {
  previousListings = JSON.parse(await fs.readFile(outputPath, "utf8")).listings ?? [];
} catch {
  // First run: there is no cache to preserve.
}
const previousByTitle = new Map(previousListings.map((listing) => [titleKey(listing.title), listing]));
titles.forEach((title, index) => {
  results[index] = previousByTitle.get(titleKey(title)) ?? null;
});

let cursor = 0;
const worker = async () => {
  while (cursor < titles.length) {
    const index = cursor;
    cursor += 1;
    if (results[index]) continue;
    results[index] = await fetchListing(titles[index]);
  }
};
await Promise.all(Array.from({ length: 8 }, worker));

const listings = results.filter(Boolean).sort((left, right) => left.title.localeCompare(right.title));
const unresolved = titles.filter((title, index) => !results[index]).sort((left, right) => left.localeCompare(right));
const output = {
  checkedAt: new Date().toISOString(),
  officialSource,
  sitemapUrl,
  matched: listings.length,
  unresolved,
  listings,
};

await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ checked: titles.length, matched: listings.length, unresolved: unresolved.length, output: outputPath }, null, 2));
