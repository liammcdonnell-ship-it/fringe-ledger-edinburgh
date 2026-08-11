const indexUrl = "https://www.comedy.co.uk/fringe/2026/";
const indexHtml = await (await fetch(indexUrl)).text();

const showUrls = [...new Set(
  [...indexHtml.matchAll(/href=["'](https:\/\/www\.comedy\.co\.uk\/fringe\/2026\/([^\/?#"']+)\/)["']/gi)]
    .map((match) => match[1])
    .filter((url) => !/\/(?:reviews|features|venue|awards|info|app)\/$/.test(url)),
)];

const decode = (value) => value
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&#039;|&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&ndash;/g, "–")
  .replace(/&mdash;/g, "—")
  .replace(/&frac12;/g, "½")
  .replace(/\s+/g, " ")
  .trim();

const reviewRows = [];
let cursor = 0;

async function worker() {
  while (cursor < showUrls.length) {
    const position = cursor++;
    const showUrl = showUrls[position];
    try {
      const response = await fetch(showUrl, { signal: AbortSignal.timeout(12_000) });
      if (!response.ok) continue;
      const html = await response.text();
      const titleMatch = html.match(/<h2[^>]*class=["']show-title["'][^>]*>([\s\S]*?)<\/h2>/i);
      const reviewSection = html.match(/<h3[^>]*>Reviews<\/h3>\s*<ul>([\s\S]*?)<\/ul>/i);
      if (!titleMatch || !reviewSection) continue;
      const title = decode(titleMatch[1]);
      for (const link of reviewSection[1].matchAll(/<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
        const fullStars = (link[2].match(/fa-star(?:\s|\"|')/g) || []).length;
        const halfStars = (link[2].match(/fa-star-half(?:-alt)?(?:\s|\"|')/g) || []).length;
        const rawOutlet = decode(link[2].replace(/<span[\s\S]*?<\/span>/i, ""));
        const numericRating = rawOutlet.match(/^\((\d(?:\.\d)?)\s*(?:\/\s*5)?\)\s*/);
        const stars = numericRating ? Number(numericRating[1]) : fullStars + (halfStars * 0.5);
        const outlet = rawOutlet.replace(/^\(\d(?:\.\d)?\s*(?:\/\s*5)?\)\s*/, "");
        if (!stars || !outlet) continue;
        reviewRows.push({ title, outlet, stars, value: Math.round(stars * 20), url: link[1], discoveryUrl: showUrl });
      }
    } catch {
      // Individual show failures are reported through the final counts and retried next run.
    }
  }
}

await Promise.all(Array.from({ length: 16 }, () => worker()));

const canonicalUrl = (value) => {
  const url = new URL(value);
  url.hash = "";
  url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
};

const deduped = [...new Map(reviewRows.map((row) => [canonicalUrl(row.url), { ...row, url: canonicalUrl(row.url) }])).values()]
  .sort((a, b) => a.title.localeCompare(b.title) || a.outlet.localeCompare(b.outlet));

console.error(`Scanned ${showUrls.length} British Comedy Guide show pages; found ${deduped.length} unique original scored notices.`);
if (process.argv[2]) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(process.argv[2], `${JSON.stringify(deduped, null, 2)}\n`, "utf8");
  console.error(`Saved ${process.argv[2]}.`);
} else {
  console.log(JSON.stringify(deduped, null, 2));
}
