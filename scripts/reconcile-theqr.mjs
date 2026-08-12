const archiveUrl = "https://theqr.co.uk/category/event/edinburgh-fringe-festival/";
const links = new Map();

const clean = (value) => value
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&#(?:8216|8217|x2018|x2019);/gi, "'")
  .replace(/&#039;|&#39;|&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, " ")
  .trim();

for (let page = 1; page <= 30; page += 1) {
  const pageUrl = page === 1 ? archiveUrl : `${archiveUrl}page/${page}/`;
  const response = await fetch(pageUrl, { signal: AbortSignal.timeout(12_000) });
  if (!response.ok) break;
  const html = await response.text();
  for (const match of html.matchAll(/<a[^>]+href=["'](https:\/\/theqr\.co\.uk\/2026\/[^"'#?]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const articleTitle = clean(match[2]);
    if (/^EdFringe Review:/i.test(articleTitle)) {
      links.set(match[1], articleTitle.replace(/^EdFringe Review:\s*/i, ""));
    }
  }
}

const entries = [...links.entries()];
const rows = [];
let cursor = 0;

async function worker() {
  while (cursor < entries.length) {
    const [url, title] = entries[cursor++];
    try {
      const html = await (await fetch(url, { signal: AbortSignal.timeout(12_000) })).text();
      const rating = html.match(/Rating:\s*(\d(?:\.\d)?)\s*out of 5/i);
      if (!rating) continue;
      rows.push({ title, outlet: "The Quinntessential Review", stars: Number(rating[1]), value: Math.round(Number(rating[1]) * 20), url });
    } catch {
      // A later run will retry an individual article failure.
    }
  }
}

await Promise.all(Array.from({ length: 8 }, () => worker()));
rows.sort((a, b) => a.title.localeCompare(b.title));

console.error(`Found ${rows.length} scored 2026 Fringe reviews in The Quinntessential Review archive.`);
if (process.argv[2]) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(process.argv[2], `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  console.error(`Saved ${process.argv[2]}.`);
} else {
  console.log(JSON.stringify(rows, null, 2));
}
