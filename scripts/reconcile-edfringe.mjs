import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = path.join(root, "app", "page.tsx");
const bcgPath = path.join(root, "app", "bcg-reviews.json");
const qrPath = path.join(root, "app", "theqr-reviews.json");
const outputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, "app", "edfringe-listings.json");

const decodeHtml = (value) => value
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&#(?:x27|39);/gi, "'")
  .replace(/&apos;/gi, "'")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">");

const cleanTitle = (value) => decodeHtml(value)
  .replace(/Ã‚Â½/g, "½")
  .replace(/Ã‚/g, "")
  .replace(/\s+/g, " ")
  .trim();

const titleKey = (value) => cleanTitle(value)
  .normalize("NFKD")
  .toLowerCase()
  .replace(/½/g, " 1 2 ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const slugify = (value) => cleanTitle(value)
  .normalize("NFKD")
  .toLowerCase()
  .replace(/[’']/g, "")
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .replace(/-+/g, "-");

const slugCandidates = (title) => {
  const candidates = new Set([
    slugify(title),
    slugify(title.replace(/½/g, "")),
    slugify(title.replace(/½/g, " half")),
    slugify(title.replace(/½/g, " 1 2")),
  ]);
  return [...candidates].filter(Boolean);
};

const parseListing = (html, url, expectedTitle) => {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    ?.replace(/<[^>]+>/g, " ");
  const title = h1 ? cleanTitle(h1) : "";
  const genre = html.match(/"genre":"([^"]+)"/i)?.[1] ?? "";
  const subGenre = html.match(/"subGenre":"([^"]*)"/i)?.[1] ?? "";

  if (!title || !genre || titleKey(title) !== titleKey(expectedTitle)) return null;
  return { title, genre, subGenre, url };
};

const fetchListing = async (title) => {
  for (const slug of slugCandidates(title)) {
    const url = `https://www.edfringe.com/tickets/whats-on/${slug}`;
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "Fringe Ledger listing reconciler/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) continue;
      const listing = parseListing(await response.text(), response.url, title);
      if (listing) return listing;
    } catch {
      // Try the next deterministic slug. A missed official match is retained
      // as unresolved rather than guessed.
    }
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
    const index = cursor++;
    if (results[index]) continue;
    results[index] = await fetchListing(titles[index]);
  }
};

await Promise.all(Array.from({ length: 24 }, worker));

const listings = results.filter(Boolean).sort((a, b) => a.title.localeCompare(b.title));
const unresolved = titles.filter((title, index) => !results[index]).sort((a, b) => a.localeCompare(b));
const output = {
  checkedAt: new Date().toISOString(),
  officialSource: "https://www.edfringe.com/tickets/whats-on",
  matched: listings.length,
  unresolved,
  listings,
};

await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ checked: titles.length, matched: listings.length, unresolved: unresolved.length, output: outputPath }, null, 2));
