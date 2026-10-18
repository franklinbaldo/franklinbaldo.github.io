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
import { parseTags, slugFor } from "../../src/lib/suno-music.ts";
import { createArticleExtras } from "./article-extras.mjs";
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
const publicClips = new Map(
  catalog
    .filter((clip) => clip.isPublic === true)
    .map((clip) => [clip.id, clip])
);
// Match BlogPostPage's canonical primary-track + additional-renditions model.
// Publication of a post is not permission to expose a private Suno recording.
function normalizeMusicTracks(data) {
  if (data.postType !== "music") return [];
  const tracks = [
    ...(data.sunoId
      ? [
          {
            label: data.title,
            sunoId: data.sunoId,
            sunoImageUrl: data.sunoImageUrl,
            genre: data.genre,
            duration: data.duration,
          },
        ]
      : []),
    ...(data.tracks ?? []),
  ];
  const seen = new Set();
  return tracks
    .filter((track) => {
      if (
        !publicClips.has(track.sunoId) ||
        seen.has(track.sunoId) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          track.sunoId
        )
      )
        return false;
      seen.add(track.sunoId);
      return true;
    })
    .map((track) => {
      const clip = publicClips.get(track.sunoId);
      const image = track.sunoImageUrl || clip.imageUrl || "";
      return {
        sunoId: track.sunoId,
        label: track.label || clip.title || data.title,
        image: /^https?:\/\//i.test(image) ? image : "",
        genre: track.genre ?? parseTags(clip.styleTags),
        duration: Number(track.duration ?? clip.durationSeconds) || 0,
      };
    });
}
function musicControls(data, lang) {
  const tracks = normalizeMusicTracks(data);
  return tracks
    .map((track, index) => {
      const url = `https://suno.com/song/${track.sunoId}`;
      const seconds = Math.round(track.duration);
      const duration =
        seconds > 0
          ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
          : "";
      const details = [...track.genre, duration].filter(Boolean);
      const play = lang === "pt" ? "Ouvir" : "Play";
      const external = lang === "pt" ? "Abrir no Suno" : "Open on Suno";
      return `<article class="music-post-track" data-suno-id="${escapeHtml(track.sunoId)}" data-title="${escapeHtml(track.label)}">${index === 0 && track.image ? `<img src="${escapeHtml(track.image)}" alt="${escapeHtml(track.label)}" width="160" height="160" loading="lazy">` : ""}<h3>${escapeHtml(track.label)}</h3>${details.length ? `<p><small>${details.map(escapeHtml).join(" · ")}</small></p>` : ""}<p><a class="music-play-btn" href="${url}" aria-label="${escapeHtml(`${play} ${track.label}`)}">▶ ${play}</a> · <a href="${url}" target="_blank" rel="noopener noreferrer">${external} ↗</a></p></article>`;
    })
    .join("\n");
}
for (const clip of catalog) {
  if (clip.isPublic !== true || !clip.createdAt) continue;
  const data = {
    title: clip.title || "(sem título)",
    description: `Música de Franklin Baldo — ${clip.title || "sem título"}`,
    date: new Date(clip.createdAt).toISOString(),
    lang: "pt",
    tags: ["música"],
    postType: "music",
    sunoId: clip.id,
    sunoImageUrl: clip.imageUrl,
    genre: parseTags(clip.styleTags),
    duration: clip.durationSeconds,
  };
  const id = slugFor(clip);
  posts = posts.filter((post) => post.id !== id); // musicLoader.store.set replaces the same collection identity
  posts.push({
    id,
    data,
    path: postPath(id, data),
    source: "data/suno-catalog.jsonl",
    body: `## Letra\n\n<pre>${escapeHtml((clip.lyricsPrompt || "").trim())}</pre>\n`,
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
          `- [${p.data.title.replace(/[[\]]/g, "")}](${p.path}) · ${p.data.date.slice(0, 10)}`
      )
      .join("\n");
  const totalPages = Math.max(1, Math.ceil(selected.length / 50));
  function archiveBody(n) {
    const subset = selected.slice((n - 1) * 50, n * 50);
    const types = [...new Set(subset.map((p) => p.data.docType || "other"))];
    const label =
      lang === "pt"
        ? "Filtrar esta página por tipo"
        : "Filter this page by type";
    const searchLabel =
      lang === "pt" ? "Buscar em todo o acervo" : "Search the entire archive";
    const summary =
      lang === "pt"
        ? `Página ${n} de ${totalPages} · ${selected.length} publicações no acervo`
        : `Page ${n} of ${totalPages} · ${selected.length} posts in the archive`;
    const controls = `<p class="archive-summary">${summary}</p><form class="archive-search" action="${prefix}/search/" method="get" role="search"><label for="archive-query">${searchLabel}</label><div><input id="archive-query" type="search" name="q" required><button type="submit">${lang === "pt" ? "Buscar" : "Search"}</button></div></form><p id="archive-filter-help">${lang === "pt" ? "O filtro abaixo se aplica apenas às publicações desta página. Use a busca para pesquisar em todo o acervo." : "The filter below applies only to posts on this page. Use search to explore the entire archive."}</p><label>${label} <select data-archive-filter aria-describedby="archive-filter-help"><option value="">${lang === "pt" ? "Todos" : "All"}</option>${types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}</select></label><p role="status" data-archive-status></p>`;
    const items = subset
      .map(
        (p) =>
          `<li data-archive-type="${escapeHtml(p.data.docType || "other")}"><a href="${p.path}">${escapeHtml(p.data.title)}</a> · <time datetime="${p.data.date}">${p.data.date.slice(0, 10)}</time></li>`
      )
      .join("\n");
    const links = Array.from({ length: totalPages }, (_, i) => i + 1)
      .map((number) =>
        number === n
          ? `<strong aria-current="page">${number}</strong>`
          : `<a href="${prefix}/archive/${number === 1 ? "" : `page/${number}/`}">${number}</a>`
      )
      .join(" · ");
    return `<div data-archive>${controls}<ul>${items}</ul><nav aria-label="${lang === "pt" ? "Páginas do arquivo" : "Archive pages"}">${links}</nav></div><script src="/js/archive.js" defer></script>`;
  }
  page(
    `${prefix}/archive/`,
    lang === "pt" ? "Arquivo" : "Archive",
    archiveBody(1),
    { lang }
  );
  for (let n = 1; n <= totalPages; n++)
    page(
      `${prefix}/archive/page/${n}/`,
      lang === "pt" ? `Arquivo — ${n}` : `Archive — ${n}`,
      archiveBody(n),
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
const articleExtras = await createArticleExtras(posts, { now });
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
      tag_links: Object.fromEntries(
        (p.data.tags ?? []).map((tag) => [
          tag,
          `${lang === "pt" ? "/pt" : ""}/tags/${encodeURIComponent(tag)}/`,
        ])
      ),
      translations: pairs[p.data.translationKey],
      post_type: p.data.postType ?? "essay",
      music_controls: musicControls(p.data, lang),
      ...articleExtras(p),
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
      posts: posts.map(({ body: _body, ...p }) => p),
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

write("reading-paths.json", JSON.stringify(READING_PATHS));

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
