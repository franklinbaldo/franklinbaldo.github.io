// Native projections of the existing article affordances and editorial evidence.
// Only the factory loads Hrönir (under the preparation step's TS loader); the
// final HTML helpers are pure and can run under ordinary Node after Zola.
import { Marked } from "marked";
import { parseFragment } from "parse5";
import { escapeHtml as h, published } from "./content.mjs";

const BASE = "https://franklinbaldo.github.io";
const language = (post) => post.data.lang ?? "en";
const dateValue = (post) => Date.parse(post.data.date);
const link = (post) => `<a href="${h(post.path)}">${h(post.data.title)}</a>`;
const safeHref = (href) =>
  /^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href ?? "") ? href : null;
const markdown = new Marked({
  renderer: {
    html({ text }) {
      return /^<\/?(?:i|em|strong|b|code|kbd|sub|sup|s|del|br)\s*\/?>$/i.test(
        text.trim()
      )
        ? text
        : h(text);
    },
    link({ href, title, tokens }) {
      const url = safeHref(href);
      const text = this.parser.parseInline(tokens);
      return url
        ? `<a href="${h(url)}"${title ? ` title="${h(title)}"` : ""}>${text}</a>`
        : text;
    },
    image({ href, title, text }) {
      const url = safeHref(href);
      return url
        ? `<img src="${h(url)}" alt="${h(text)}"${title ? ` title="${h(title)}"` : ""} loading="lazy">`
        : h(text);
    },
  },
});
const renderMarkdown = (value) => markdown.parse(String(value ?? ""));
const json = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

export function articleNeighbors(post, posts) {
  const same = posts
    .filter(
      (p) =>
        language(p) === language(post) &&
        (p.data.postType === "music") === (post.data.postType === "music")
    )
    .sort((a, b) => dateValue(a) - dateValue(b) || a.id.localeCompare(b.id));
  const index = same.findIndex((p) => p.id === post.id);
  return {
    prev: index > 0 ? same[index - 1] : null,
    next: index >= 0 ? (same[index + 1] ?? null) : null,
  };
}

export function articleSeries(post, posts) {
  if (!post.data.series) return null;
  const same = posts
    .filter(
      (p) =>
        language(p) === language(post) && p.data.series === post.data.series
    )
    .sort(
      (a, b) =>
        (a.data.seriesOrder ?? Infinity) - (b.data.seriesOrder ?? Infinity) ||
        dateValue(a) - dateValue(b) ||
        a.id.localeCompare(b.id)
    );
  const index = same.findIndex((p) => p.id === post.id);
  if (index < 0) return null;
  return {
    title: post.data.series
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    posts: same,
    index,
    prev: same[index - 1],
    next: same[index + 1],
  };
}

export function relatedArticles(post, posts) {
  const candidates = posts.filter(
    (p) =>
      p.id !== post.id &&
      language(p) === language(post) &&
      p.data.postType === post.data.postType
  );
  const tags = post.data.tags ?? [];
  const byTag = candidates
    .map((p) => ({
      post: p,
      sharedTags: (p.data.tags ?? []).filter((tag) => tags.includes(tag)),
    }))
    .filter((p) => p.sharedTags.length)
    .sort(
      (a, b) =>
        b.sharedTags.length - a.sharedTags.length ||
        dateValue(b.post) - dateValue(a.post) ||
        a.post.id.localeCompare(b.post.id)
    )
    .slice(0, 3);
  const fallback = byTag.length < 2;
  const selected = new Set(byTag.map((p) => p.post.id));
  return {
    fallback,
    posts: fallback
      ? [
          ...byTag,
          ...candidates
            .filter((p) => !selected.has(p.id))
            .sort(
              (a, b) => dateValue(b) - dateValue(a) || a.id.localeCompare(b.id)
            )
            .slice(0, 3 - byTag.length)
            .map((p) => ({ post: p, sharedTags: [] })),
        ]
      : byTag,
  };
}

function neighborHtml({ prev, next }, pt, series = false) {
  if (!prev && !next) return "";
  const label = series
    ? pt
      ? "Navegação da série"
      : "Series navigation"
    : pt
      ? "Navegação entre publicações"
      : "Post navigation";
  return `<nav class="article-neighbors${series ? " article-series-nav" : ""}" aria-label="${label}">${prev ? `<a href="${h(prev.path)}" rel="prev"><small>← ${pt ? "Anterior" : "Previous"}</small><span>${h(prev.data.title)}</span></a>` : "<span></span>"}${next ? `<a href="${h(next.path)}" rel="next"><small>${pt ? "Próxima" : "Next"} →</small><span>${h(next.data.title)}</span></a>` : ""}</nav>`;
}

function renderRelated(post, posts, pt) {
  const related = relatedArticles(post, posts);
  if (related.posts.length < 2) return "";
  const heading = related.fallback
    ? pt
      ? "Continue lendo"
      : "Keep reading"
    : pt
      ? "Você também pode gostar"
      : "You might also like";
  return `<section class="article-related" aria-labelledby="related-posts-heading"><h2 id="related-posts-heading">${heading}</h2><div>${related.posts.map(({ post: p, sharedTags }) => `<article><h3>${link(p)}</h3><time datetime="${h(p.data.date)}">${h(p.data.date.slice(0, 10))}</time><p>${h(p.data.description.length > 120 ? p.data.description.slice(0, 120) + "…" : p.data.description)}</p>${!related.fallback && sharedTags.length ? `<p class="article-related-tags">${sharedTags.map((tag) => `<a href="${pt ? "/pt" : ""}/tags/${encodeURIComponent(tag)}/" rel="tag">#${h(tag)}</a>`).join(" ")}</p>` : ""}</article>`).join("")}</div></section>`;
}

function authorHtml(pt) {
  const prefix = pt ? "/pt" : "";
  return `<aside class="article-author" aria-labelledby="author-bio-heading"><img src="/avatar.png" alt="" width="64" height="64" loading="lazy"><div><h2 id="author-bio-heading">Franklin Baldo</h2><p>${pt ? "Escreve, programa e faz música na fronteira entre IA, filosofia e literatura." : "Writes, builds software, and makes music at the border of AI, philosophy, and literature."}</p><p><a href="${prefix}/about/">${pt ? "Sobre o autor" : "About the author"}</a> · <a href="${prefix}/rss.xml">RSS</a> · <a href="https://github.com/franklinbaldo" rel="me">GitHub</a></p></div></aside>`;
}

export async function createArticleExtras(posts, options = {}) {
  posts = posts.filter((post) =>
    published(post.data, options.now ?? new Date())
  );
  let { duels, ranks } = options;
  if (!duels || !ranks) {
    const canonical = await import("../../src/lib/hronir-rank.ts");
    duels ??= canonical.getDuels({ kind: "work" });
    ranks ??= canonical.getRankByKey();
  }
  const byKey = new Map();
  for (const post of posts) {
    const key = post.data.translationKey;
    if (key && (!byKey.has(key) || language(post) === "en"))
      byKey.set(key, post);
  }
  const byWork = new Map();
  for (const duel of duels) {
    // Even fixture/injected inputs must honor the canonical public work scope.
    if (duel.isVersionDuel) continue;
    for (const key of new Set([duel.postAKey, duel.postBKey].filter(Boolean))) {
      if (!byWork.has(key)) byWork.set(key, []);
      byWork.get(key).push(duel);
    }
  }
  const reviewCache = new Map();
  function reviews(key, pt) {
    if (!key) return "";
    const cacheKey = `${key}:${pt}`;
    if (reviewCache.has(cacheKey)) return reviewCache.get(cacheKey);
    const cards = (byWork.get(key) ?? []).flatMap((duel) => {
      const isA = duel.postAKey === key;
      const review = isA
        ? duel.parsedContent?.postAAnalysis
        : duel.parsedContent?.postBAnalysis;
      if (!review) return [];
      return [
        {
          duel,
          review,
          rate: isA ? duel.rateA : duel.rateB,
          won: duel.winnerKey === key,
          opponent: byKey.get(isA ? duel.postBKey : duel.postAKey),
        },
      ];
    });
    if (!cards.length) return "";
    const groups = [
      cards
        .filter((c) => c.won)
        .sort(
          (a, b) =>
            (b.rate ?? 0) - (a.rate ?? 0) ||
            b.duel.runAt.localeCompare(a.duel.runAt)
        ),
      cards
        .filter((c) => !c.won)
        .sort(
          (a, b) =>
            (a.rate ?? 0) - (b.rate ?? 0) ||
            b.duel.runAt.localeCompare(a.duel.runAt)
        ),
    ];
    const result = `<section class="article-reviews" aria-labelledby="hronir-reviews-heading"><h2 id="hronir-reviews-heading">${pt ? "Avaliações Hrönir" : "Hrönir reviews"}</h2><p>${pt ? "Resenhas dos duelos par-a-par, escritas a partir de uma perspectiva de leitura sorteada." : "Reviews from pairwise duels, each written from a randomly assigned reader perspective."}</p>${groups.map((group, i) => (!group.length ? "" : `<div class="article-review-group"><h3>${i === 0 ? (pt ? "Melhores avaliações" : "Best reviews") : pt ? "Piores avaliações" : "Worst reviews"} (${group.length})</h3>${group.map(({ duel: d, review, rate, won, opponent }) => `<details class="article-review" data-hronir-duel="${h(d.id)}"><summary><span>${won ? (pt ? "✓ Venceu" : "✓ Won") : pt ? "✗ Perdeu" : "✗ Lost"}${rate != null ? ` · ${Number(rate).toLocaleString(pt ? "pt-BR" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}★` : ""}</span> <time datetime="${h(d.runAt)}">${h(d.runAt.slice(0, 10))}</time>${d.perspectiveId ? ` · ${h(d.perspectiveId.replace(/-/g, " "))}` : ""}</summary><div class="article-review-body"${d.reviewLang ? ` lang="${h(d.reviewLang)}"` : ""}><p class="article-review-meta">${opponent ? `vs ${link(opponent)} · ` : ""}<a href="/ranking/battles/${encodeURIComponent(d.id)}/">${pt ? "Confronto completo" : "Full battle"}</a>${d.perspectiveId ? ` · <a href="/ranking/perspectives/${encodeURIComponent(d.perspectiveId)}/">${pt ? "Perspectiva" : "Perspective"}</a>` : ""}${d.agentId ? ` · ${h(d.agentId)}` : ""}</p>${renderMarkdown(review)}${d.parsedContent?.verdict ? `<details class="article-verdict"><summary>${pt ? "Veredito do confronto" : "Clash verdict"}</summary>${renderMarkdown(d.parsedContent.verdict)}</details>` : ""}${d.evaluatorMood || d.evaluatorMoodAfter ? `<dl class="article-review-moods">${d.evaluatorMood ? `<dt>${pt ? "Humor inicial" : "Initial mood"}</dt><dd>${h(d.evaluatorMood)}</dd>` : ""}${d.evaluatorMoodAfter ? `<dt>${pt ? "Humor final" : "After mood"}</dt><dd>${h(d.evaluatorMoodAfter)}</dd>` : ""}</dl>` : ""}</div></details>`).join("")}</div>`)).join("")}</section>`;
    reviewCache.set(cacheKey, result);
    return result;
  }
  return (post) => {
    const pt = language(post) === "pt";
    const series = articleSeries(post, posts);
    const rank = ranks.get(post.data.translationKey);
    const rankHtml = rank
      ? `<p class="article-rank"><a href="${pt ? "/pt/ranking/" : `/ranking/posts/${encodeURIComponent(post.data.translationKey)}/`}">Hrönir #${rank.rank}/${rank.total}</a></p>`
      : "";
    const seriesHtml = series
      ? `<aside class="article-series" aria-label="${pt ? "Série" : "Series"}"><p>${pt ? "Parte" : "Part"} ${series.index + 1} ${pt ? "de" : "of"} ${series.posts.length} · <strong>${h(series.title)}</strong></p><details><summary>${pt ? "Todas as publicações da série" : "All posts in this series"}</summary><ol>${series.posts.map((p) => `<li>${p.id === post.id ? `<strong aria-current="page">${h(p.data.title)}</strong>` : link(p)}</li>`).join("")}</ol></details></aside>`
      : "";
    const previous = post.data.previousVersion;
    const previousHtml =
      previous?.url && safeHref(previous.url)
        ? `<p class="article-previous-version">${pt ? "Versão anterior" : "Previous version"}: <a href="${h(previous.url)}" rel="external nofollow">${h(previous.timestamp?.slice(0, 10) || previous.uuid)}</a>${previous.msg ? ` · ${h(previous.msg)}` : ""}</p>`
        : "";
    const actions = `<div class="article-actions"><button type="button" data-article-share data-title="${h(post.data.title)}" data-url="${h(BASE + post.path)}" data-label="${pt ? "Compartilhar" : "Share"}" data-copied="${pt ? "Link copiado" : "Link copied"}" data-error="${pt ? "Não foi possível copiar o link" : "Could not copy the link"}">↗ <span>${pt ? "Compartilhar" : "Share"}</span></button><span data-share-status role="status" aria-live="polite"></span><a href="#main" class="article-top" data-article-top>${pt ? "↑ Voltar ao topo" : "↑ Back to top"}</a></div>`;
    return {
      article_intro: rankHtml + seriesHtml,
      article_end: previousHtml + actions,
      article_extras:
        authorHtml(pt) +
        reviews(post.data.translationKey, pt) +
        renderRelated(post, posts, pt) +
        (series ? neighborHtml(series, pt, true) : "") +
        neighborHtml(articleNeighbors(post, posts), pt),
    };
  };
}

function htmlTree(html) {
  const tree = parseFragment(html);
  const text = (node) =>
    node.nodeName === "#text"
      ? node.value
      : (node.childNodes ?? []).map(text).join("");
  const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
  return { tree, text, attr };
}

export function renderArticleToc(html, lang = "en") {
  const { tree, text, attr } = htmlTree(html);
  const headings = [];
  function walk(node) {
    if (["h2", "h3"].includes(node.tagName) && attr(node, "id"))
      headings.push({
        depth: Number(node.tagName[1]),
        id: attr(node, "id"),
        text: text(node).replace(/#\s*$/, "").trim(),
        children: [],
      });
    for (const child of node.childNodes ?? []) walk(child);
  }
  walk(tree);
  if (headings.length < 3) return "";
  const roots = [];
  for (const heading of headings) {
    if (heading.depth === 2 || !roots.length) roots.push(heading);
    else roots[roots.length - 1].children.push(heading);
  }
  const item = (heading) =>
    `<li><a href="#${h(heading.id)}">${h(heading.text)}</a>${heading.children.length ? `<ol>${heading.children.map(item).join("")}</ol>` : ""}</li>`;
  return `<nav class="article-toc" data-article-toc aria-label="${lang === "pt" ? "Conteúdo" : "Contents"}" data-pagefind-ignore><details open><summary>${lang === "pt" ? "Conteúdo" : "Contents"}</summary><ol>${roots.map(item).join("")}</ol></details></nav>`;
}

export function articleSchema(post, html, base = BASE) {
  const { tree, text } = htmlTree(html);
  const words = text(tree).trim().split(/\s+/).filter(Boolean).length;
  const url = base + post.path;
  const prefix = language(post) === "pt" ? "/pt" : "";
  return json({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${base}/#person`,
        name: "Franklin Baldo",
        url: `${base}/`,
        image: `${base}/avatar.png`,
        sameAs: [
          "https://github.com/franklinbaldo",
          "https://twitter.com/franklinbaldo",
        ],
      },
      {
        "@type": "BlogPosting",
        headline: post.data.title,
        description: post.data.description,
        inLanguage: language(post) === "pt" ? "pt-BR" : "en",
        author: { "@id": `${base}/#person` },
        publisher: { "@id": `${base}/#person` },
        datePublished: post.data.date,
        mainEntityOfPage: url,
        url,
        image: post.hero
          ? new URL(post.hero, base).href
          : `${base}/og/${post.id}.png`,
        isAccessibleForFree: true,
        ...((post.data.tags ?? []).length
          ? {
              keywords: post.data.tags.join(", "),
              articleSection: post.data.tags[0],
            }
          : {}),
        ...(words
          ? {
              wordCount: words,
              timeRequired: `PT${Math.max(1, Math.ceil(words / 200))}M`,
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: prefix ? "Início" : "Home",
            item: `${base}${prefix}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: prefix ? "Arquivo" : "Archive",
            item: `${base}${prefix}/archive/`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.data.title,
            item: url,
          },
        ],
      },
    ],
  });
}
