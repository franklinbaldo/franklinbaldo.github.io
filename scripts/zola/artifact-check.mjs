import assert from "node:assert/strict";
import { parse } from "parse5";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { READING_PATHS } from "../../src/lib/reading-paths-data.mjs";
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

for (const path of ["index.html", "about/index.html", "archive/index.html"]) {
  assert.match(
    readFileSync(join(out, path), "utf8"),
    /<meta name="description" content="[^"]+/,
    path + " SEO description"
  );
}
for (const path of ["music/index.html", "pt/musicas/index.html"]) {
  const ids = [];
  function visit(node) {
    if (
      node.attrs?.some(
        (attr) => attr.name === "class" && attr.value === "song-card"
      )
    ) {
      ids.push(node.attrs.find((attr) => attr.name === "data-suno-id")?.value);
    }
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(parse(readFileSync(join(out, path), "utf8")));
  assert.deepEqual(
    ids.toSorted(),
    catalog.map((song) => song.id).toSorted(),
    path + " rendered gallery/catalog parity"
  );
}

// Home discovery reuses the canonical reading paths in each language.
for (const lang of ["en", "pt"]) {
  const prefix = lang === "pt" ? "/pt" : "";
  const home = readFileSync(join(out, prefix, "index.html"), "utf8");
  const discovery = home.match(
    /<section class="start-here"[\s\S]*?<\/section>/
  )?.[0];
  assert.ok(discovery, `${lang} home discovery section`);
  assert.ok(
    home.indexOf('id="start-here-heading"') <
      home.indexOf('id="recent-heading"'),
    `${lang} reading paths precede recent posts`
  );
  for (const path of READING_PATHS) {
    const url = `${prefix}/paths/${path.slug}/`;
    assert.ok(discovery.includes(`href="${url}"`), `${lang} path ${path.slug}`);
    assert.ok(
      discovery.includes(path.title[lang]),
      `${lang} canonical path title`
    );
    assert.ok(
      discovery.includes(path.blurb[lang]),
      `${lang} canonical path blurb`
    );
    const destination = readFileSync(join(out, url, "index.html"), "utf8");
    assert.match(destination, /<ol>/, `${url} contains a reading sequence`);
    for (const link of destination.matchAll(
      /href="(\/(?:pt\/)?blog\/[^"#?]+)"/g
    ))
      assert.ok(
        existsSync(join(out, link[1], "index.html")),
        `${url} reading destination ${link[1]} exists`
      );
  }
  for (const route of ["archive", "tags", "search"]) {
    const url = `${prefix}/${route}/`;
    assert.ok(discovery.includes(`href="${url}"`), `${lang} ${route} shortcut`);
    assert.ok(existsSync(join(out, url, "index.html")), `${url} exists`);
  }
}
console.log(
  "Home discovery: bilingual canonical paths and archive shortcuts passed"
);

for (const prefix of ["", "pt/"]) {
  const archive = readFileSync(join(out, prefix, "archive/index.html"), "utf8");
  assert.ok(archive.includes(`action="/${prefix}search/"`));
  assert.ok(archive.includes('aria-describedby="archive-filter-help"'));
  assert.ok(archive.includes('class="archive-summary"'));
  assert.equal(
    (archive.match(/<section aria-labelledby="more-group-/g) || []).length,
    3
  );
}
const demo = readFileSync(join(out, "demos/fourier-below-nlogn.html"), "utf8");
assert.ok(
  demo.includes('href="/blog/fourier-below-nlogn-interactive/" target="_top"')
);
assert.ok(
  existsSync(join(out, "blog/fourier-below-nlogn-interactive/index.html"))
);
console.log(
  "Archive search, grouped navigation and Fourier article return passed"
);
