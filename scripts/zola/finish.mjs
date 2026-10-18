import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { escapeHtml } from "./content.mjs";
const base = "https://franklinbaldo.github.io";
const out = "dist-zola";
const manifest = JSON.parse(
  readFileSync(".cache/zola-site/manifest.json", "utf8")
);
function write(path, content) {
  const file = join(out, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}
for (const p of manifest.posts) {
  const html = readFileSync(join(out, p.path, "index.html"), "utf8");
  const match = html.match(
    /<div[^>]*\bdata-zola-content[^>]*>([\s\S]*?)<\/div><!-- \/zola-content -->/
  );
  if (!match) throw new Error(`Missing full-content feed boundary: ${p.path}`);
  p.html = match[1];
}
for (const lang of ["en", "pt"]) {
  const prefix = lang === "pt" ? "pt/" : "";
  const posts = manifest.posts.filter((p) => (p.data.lang ?? "en") === lang);
  const items = posts.map((p) => ({
    id: base + p.path,
    url: base + p.path,
    title: p.data.title,
    content_html: p.html,
    summary: p.data.description,
    date_published: p.data.date,
    tags: p.data.tags ?? [],
  }));
  write(
    `${prefix}feed.json`,
    JSON.stringify(
      {
        version: "https://jsonfeed.org/version/1.1",
        title: "Franklin Baldo",
        home_page_url: base + "/",
        feed_url: base + "/" + prefix + "feed.json",
        language: lang === "pt" ? "pt-br" : "en-us",
        items,
      },
      null,
      2
    ) + "\n"
  );
  const xml = posts
    .map(
      (p) =>
        `<item><title>${escapeHtml(p.data.title)}</title><link>${escapeHtml(base + p.path)}</link><guid isPermaLink="true">${escapeHtml(base + p.path)}</guid><pubDate>${new Date(p.data.date).toUTCString()}</pubDate><description>${escapeHtml(p.data.description)}</description><content:encoded>${escapeHtml(p.html)}</content:encoded>${(p.data.tags ?? []).map((t) => `<category>${escapeHtml(t)}</category>`).join("")}</item>`
    )
    .join("\n");
  write(
    `${prefix}rss.xml`,
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Franklin Baldo</title><link>${base}/</link><description>Essays, code, and music</description><language>${lang === "pt" ? "pt-br" : "en-us"}</language><atom:link href="${base}/${prefix}rss.xml" rel="self" type="application/rss+xml"/>${xml}</channel></rss>\n`
  );
}
console.log(
  "Zola feeds: EN/PT RSS and JSON Feed with exact rendered article content"
);
