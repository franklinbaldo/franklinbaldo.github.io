// Read-only projection of canonical editorial sources into disposable Zola input.
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import matter from "gray-matter";
import { listPostFiles, postIdFromPath } from "../lib/content.mjs";
import { READING_PATHS } from "../../src/lib/reading-paths-data.mjs";
import { slugFor } from "../../src/lib/suno-music.ts";
import {
  convertBody,
  escapeHtml,
  frontmatter,
  postPath,
  published,
  rewriteImages,
  stableName,
} from "./content.mjs";

const root = process.cwd();
const target = resolve(root, ".cache/zola-site");
const now = new Date(process.env.ZOLA_BUILD_DATE || Date.now());
if (!Number.isFinite(now.valueOf())) throw new Error("Invalid ZOLA_BUILD_DATE");
rmSync(target, { recursive: true, force: true });
cpSync(join(root, "zola"), target, { recursive: true });
cpSync(join(root, "public"), join(target, "static"), { recursive: true });
function write(path, content) {
  const out = join(target, path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, content);
}
function page(path, title, body, extra = {}) {
  write(
    `content/pages/${stableName(path)}.md`,
    frontmatter({ title, path, template: "page.html" }, extra) + body
  );
}
function asset(source) {
  const abs = resolve(source);
  if (!abs.startsWith(join(root, "src/content/blog") + "/"))
    throw new Error(`Asset outside blog: ${source}`);
  if (!existsSync(abs)) throw new Error(`Missing content asset: ${source}`);
  const url = `/blog-assets/${stableName(relative(root, abs))}${extname(abs)}`;
  const dest = join(target, "static", url);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(abs, dest);
  return url;
}
let posts = [];
const excluded = [];
for (const file of listPostFiles()) {
  const { data, content } = matter(readFileSync(file, "utf8"));
  const id = postIdFromPath(file);
  if (!published(data, now)) {
    excluded.push(id);
    continue;
  }
  if (!data.title || !data.description || !data.date)
    throw new Error(`Incomplete metadata: ${file}`);
  const date = new Date(data.date);
  if (!Number.isFinite(date.valueOf()))
    throw new Error(`Invalid date: ${file}`);
  const body = convertBody(
    rewriteImages(content, (url) => asset(resolve(dirname(file), url)))
  );
  posts.push({
    id,
    data: { ...data, date: date.toISOString() },
    path: postPath(id, data),
    body,
    source: relative(root, file),
    hero: data.heroImage ? asset(resolve(dirname(file), data.heroImage)) : null,
  });
}
const catalog = readFileSync("data/suno-catalog.jsonl", "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));
for (const clip of catalog) {
  if (!clip.isPublic || !clip.createdAt) continue;
  const data = {
    title: clip.title || "(sem título)",
    description: `Música de Franklin Baldo — ${clip.title || "sem título"}`,
    date: new Date(clip.createdAt).toISOString(),
    lang: "pt",
    tags: ["música"],
    postType: "music",
    sunoId: clip.id,
  };
  const id = slugFor(clip);
  const audio = clip.audioUrl
    ? `<audio controls preload="none" src="${escapeHtml(clip.audioUrl)}"></audio>\n\n`
    : "";
  posts = posts.filter((post) => post.id !== id); // musicLoader.store.set replaces the same collection identity
  posts.push({
    id,
    data,
    path: postPath(id, data),
    source: "data/suno-catalog.jsonl",
    body: `${audio}## Letra\n\n<pre>${escapeHtml((clip.lyricsPrompt || "").trim())}</pre>\n`,
  });
}
posts.sort(
  (a, b) =>
    b.data.date.localeCompare(a.data.date) || a.path.localeCompare(b.path)
);
const paths = new Set();
for (const post of posts) {
  if (paths.has(post.path))
    throw new Error(`Duplicate canonical URL: ${post.path}`);
  paths.add(post.path);
}
const pairs = {};
for (const p of posts)
  if (p.data.translationKey)
    (pairs[p.data.translationKey] ??= {})[p.data.lang ?? "en"] = p.path;
write(
  "content/_index.md",
  frontmatter(
    { title: "Franklin Baldo", template: "index.html" },
    { lang: "en", kind: "home" }
  )
);
write(
  "content/pt/_index.md",
  frontmatter(
    { title: "Franklin Baldo", template: "section.html" },
    { lang: "pt", kind: "home" }
  )
);
for (const lang of ["en", "pt"]) {
  const prefix = lang === "pt" ? "/pt" : "";
  write(
    `content/${lang === "pt" ? "pt/" : ""}blog/_index.md`,
    frontmatter(
      {
        title: lang === "pt" ? "Arquivo" : "Archive",
        sort_by: "date",
        template: "section.html",
      },
      { lang }
    )
  );
  const selected = posts.filter((p) => (p.data.lang ?? "en") === lang);
  const list = (ps) =>
    ps
      .map(
        (p) =>
          `- [${p.data.title.replace(/[\[\]]/g, "")}](${p.path}) · ${p.data.date.slice(0, 10)}`
      )
      .join("\n");
  page(
    `${prefix}/archive/`,
    lang === "pt" ? "Arquivo" : "Archive",
    list(selected),
    { lang }
  );
  for (let n = 1; n <= Math.ceil(selected.length / 50); n++)
    page(
      `${prefix}/archive/page/${n}/`,
      lang === "pt" ? `Arquivo — ${n}` : `Archive — ${n}`,
      list(selected.slice((n - 1) * 50, n * 50)),
      { lang }
    );
  page(`${prefix}/search/`, lang === "pt" ? "Busca" : "Search", "", {
    lang,
    kind: "search",
  });
  const tags = [...new Set(selected.flatMap((p) => p.data.tags ?? []))].sort();
  page(
    `${prefix}/tags/`,
    "Tags",
    tags
      .map((t) => `- [${t}](<${prefix}/tags/${encodeURIComponent(t)}/>)`)
      .join("\n"),
    { lang }
  );
  for (const tag of tags)
    page(
      `${prefix}/tags/${tag}/`,
      `#${tag}`,
      list(selected.filter((p) => p.data.tags?.includes(tag))),
      { lang }
    );
}
for (const p of posts) {
  const lang = p.data.lang ?? "en";
  const metadata = {
    title: p.data.title,
    description: p.data.description,
    date: p.data.date,
    path: p.path,
    template: "page.html",
  };
  write(
    `content/${lang === "pt" ? "pt/" : ""}blog/${stableName(p.path)}.md`,
    frontmatter(metadata, {
      lang,
      original_id: p.id,
      source: p.source,
      hero_image: p.hero,
      hero_image_alt: p.data.heroImageAlt ?? "",
      tags: p.data.tags ?? [],
      translations: pairs[p.data.translationKey],
      post_type: p.data.postType ?? "essay",
    }) + p.body
  );
}
// Keep generated historical redirects plus cross-language route compatibility.
const redirects = {
  "/musicas/": "/music/",
  "/pt/blog/be-me-borges/": "/pt/blog/borges-e-eu/",
  "/blog/be-me-borges-en/": "/blog/borges-and-i/",
  "/pt/blog/borges-and-me/": "/pt/blog/borges-e-eu/",
  "/blog/borges-and-me-en/": "/blog/borges-and-i/",
  "/blog/borges-e-eu-en/": "/blog/borges-and-i/",
  ...JSON.parse(readFileSync("src/generated/blog-redirects.json", "utf8")),
};
for (const p of posts)
  redirects[
    `${p.data.lang === "pt" ? "" : "/pt"}/blog/${p.data.slug ?? p.id}/`
  ] = p.path;
for (const [from, to] of Object.entries(redirects)) {
  if (paths.has(from)) continue;
  write(
    `static/${from.replace(/^\//, "")}index.html`,
    `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><link rel="canonical" href="https://franklinbaldo.github.io${escapeHtml(to)}"><meta http-equiv="refresh" content="0;url=${escapeHtml(to)}"></head><body><a href="${escapeHtml(to)}">Continue</a></body></html>\n`
  );
}
write(
  "manifest.json",
  JSON.stringify(
    {
      generated_at: now.toISOString(),
      posts: posts.map(({ body, ...p }) => p),
      excluded,
      redirects,
    },
    null,
    2
  ) + "\n"
);
console.log(
  `Zola input: ${posts.length} public posts (${posts.filter((p) => p.source === "data/suno-catalog.jsonl").length} synthesized music), ${excluded.length} excluded; public assets copied verbatim`
);

for (const path of READING_PATHS)
  for (const lang of ["en", "pt"]) {
    let selected;
    if (path.source.type === "series")
      selected = posts
        .filter(
          (p) =>
            p.data.series === path.source.series &&
            (p.data.lang ?? "en") === lang
        )
        .sort(
          (a, b) =>
            (a.data.seriesOrder ?? Infinity) -
              (b.data.seriesOrder ?? Infinity) ||
            a.data.date.localeCompare(b.data.date)
        );
    else
      selected = (path.source.posts[lang] ?? [])
        .map((id) => posts.find((p) => p.id === id))
        .filter(Boolean);
    page(
      `${lang === "pt" ? "/pt" : ""}/paths/${path.slug}/`,
      path.title[lang],
      `${path.blurb[lang]}\n\n${selected.map((p) => `1. [${p.data.title}](${p.path})\n   ${p.data.description}`).join("\n")}`,
      {
        lang,
        translations: {
          en: `/paths/${path.slug}/`,
          pt: `/pt/paths/${path.slug}/`,
        },
      }
    );
  }
page("/pt/404/", "Página não encontrada", "[Voltar ao início](/pt/)", {
  lang: "pt",
});
