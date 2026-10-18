import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const out = "dist-zola";
const manifest = JSON.parse(
  readFileSync(".cache/zola-site/manifest.json", "utf8")
);
const catalog = JSON.parse(
  readFileSync(join(out, "music-player.json"), "utf8")
);
const publicIds = new Set(
  readFileSync("data/suno-catalog.jsonl", "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .filter((song) => song.isPublic === true)
    .map((song) => song.id)
);
assert.ok(
  catalog.every((song) => publicIds.has(song.id)),
  "Only public songs in player catalog"
);
const feeds = new Map(
  ["en", "pt"].map((lang) => [
    lang,
    JSON.parse(
      readFileSync(
        join(out, lang === "pt" ? "pt/feed.json" : "feed.json"),
        "utf8"
      )
    ).items,
  ])
);
for (const post of manifest.posts) {
  const html = readFileSync(join(out, post.path, "index.html"), "utf8");
  assert.match(html, /<meta name="generator" content="Zola">/, post.path);
  assert.ok(
    html.includes(`/og/${post.id}.png`),
    `${post.path} social image metadata`
  );
  assert.ok(
    existsSync(join(out, "og", post.id + ".png")),
    `${post.path} social image asset`
  );
  const feed = feeds
    .get(post.data.lang ?? "en")
    .find((item) => item.url === "https://franklinbaldo.github.io" + post.path);
  assert.ok(feed, `${post.path} in correct language feed`);
  const content = html.match(
    /<div[^>]*\bdata-zola-content[^>]*>([\s\S]*?)<\/div>\s*<!-- \/zola-content -->/
  );
  assert.equal(
    feed.content_html,
    content?.[1],
    `${post.path} complete rendered feed content`
  );
  for (const match of html.matchAll(
    /(?:src|href)="(\/(?!\/)[^"#?]+)(?:[?#][^"]*)?"/g
  )) {
    const path = decodeURIComponent(match[1]);
    assert.ok(
      existsSync(join(out, path)) || existsSync(join(out, path, "index.html")),
      `${post.path} missing local resource ${path}`
    );
  }
}
for (const [lang, items] of feeds)
  assert.equal(
    items.length,
    manifest.posts.filter((post) => (post.data.lang ?? "en") === lang).length,
    `${lang} feed count`
  );
const sitemap = readFileSync(join(out, "sitemap-0.xml"), "utf8");
assert.ok(!sitemap.includes("/pt/404/"), "404 not indexed");
assert.equal(
  sitemap,
  readFileSync(join(out, "sitemap.xml"), "utf8"),
  "legacy sitemap remains available"
);
console.log(
  `Zola artifact checks: ${manifest.posts.length} posts, complete bilingual feeds, local resources, OG assets and public-only player passed`
);
// Literal app markup must never be reinterpreted as indented Markdown code.
const rug = readFileSync(join(out, "games/rug-pull/index.html"), "utf8");
assert.ok(
  rug.includes('<button id="rug-start"'),
  "Rug Pull start control is real HTML"
);
assert.ok(
  !rug.includes("&lt;button id=&quot;rug-start"),
  "Rug Pull markup is not escaped code"
);
for (const path of [
  "about/index.html",
  "pt/about/index.html",
  "games/index.html",
])
  assert.ok(
    !readFileSync(join(out, path), "utf8").includes("&lt;p&gt;"),
    `${path} literal prose remains HTML`
  );
