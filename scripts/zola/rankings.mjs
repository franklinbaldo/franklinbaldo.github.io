// Native Zola projection of the canonical Hrönir records. No Astro runtime,
// components, or generated Astro output are consumed by this exporter.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";
import { escapeHtml as h, frontmatter, stableName } from "./content.mjs";
import {
  getRanking,
  getRankingStats,
  getDuels,
  getPerPerspectiveRankings,
  getPerspectives,
  getSnapshotDelta,
  loadSnapshot,
  perspectiveLabel,
} from "../../src/lib/hronir-rank.ts";
import {
  computeAbsoluteQuality,
  computeDeconfoundedQuality,
} from "../../src/hronir/ranking.ts";
import { isNormalEditorialTierKey } from "../../src/hronir/tier-scope.ts";

const target = resolve(".cache/zola-site");
const manifestPath = join(target, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const ranking = getRanking();
const rankByKey = new Map(
  ranking.map((r, i) => [r.key, { ...r, rank: i + 1 }])
);
// The explicit work scope is crucial: historical version trials are private
// evidence and must never acquire a public route, list entry, or statistic.
const duels = getDuels({ kind: "work" });
const perspectives = getPerspectives();
const perPerspective = getPerPerspectiveRankings();
const stats = getRankingStats();
const snapshot = loadSnapshot();
const PER_PAGE = 20;
const routes = [];
const json = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
const locale = (lang) => (lang === "pt" ? "pt-BR" : "en-US");
const number = (n, lang = "en", digits = 2) =>
  n == null
    ? "—"
    : Number(n).toLocaleString(locale(lang), {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
const date = (iso, lang = "en", month = "short") =>
  iso && Number.isFinite(new Date(iso).valueOf())
    ? new Date(iso).toLocaleDateString(locale(lang), {
        year: "numeric",
        month,
        day: "numeric",
        timeZone: "UTC",
      })
    : "—";
const segment = (value) => {
  if (!value || /[/?#\\]|^\.{1,2}$/.test(String(value)))
    throw new Error(`Unsafe ranking route segment: ${value}`);
  return String(value);
};
const battleHref = (id) => `/ranking/battles/${segment(id)}/`;
const dossierHref = (key) => `/ranking/posts/${segment(key)}/`;
const perspectiveHref = (id) => `/ranking/perspectives/${segment(id)}/`;
const archiveHref = (page) =>
  page === 1 ? "/ranking/battles/" : `/ranking/battles/page/${page}/`;
function write(path, body) {
  const out = join(target, path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, body);
}
function page(path, title, description, body, extra = {}) {
  if (routes.includes(path))
    throw new Error(`Duplicate ranking route: ${path}`);
  routes.push(path);
  // One HTML block avoids Markdown interpreting editorial underscores or
  // blank lines. All interpolated plain text is escaped; Markdown is rendered
  // through the constrained renderer below.
  write(
    `content/pages/${stableName(path)}.md`,
    frontmatter(
      {
        title,
        description,
        path,
        template: "ranking.html",
        in_search_index: false,
      },
      { kind: "ranking", lang: "en", ...extra }
    ) + `<div class="ranking-content">\n${body}\n</div>\n`
  );
}
function postMap(lang = "en") {
  const map = new Map();
  for (const p of manifest.posts) {
    const key = p.data.translationKey;
    if (!key) continue;
    if (!map.has(key) || (p.data.lang ?? "en") === lang)
      map.set(key, {
        title: p.data.title,
        lang: p.data.lang ?? "en",
        href: p.path,
        slug: p.data.slug ?? p.id,
      });
  }
  return map;
}
const byKey = postMap();
const titleFor = (key, map = byKey) => map.get(key)?.title ?? key;
function postLink(key, map = byKey) {
  const post = map.get(key);
  return post
    ? `<a href="${h(post.href)}" lang="${h(post.lang)}">${h(post.title)}</a>`
    : `<code>${h(key)}</code>`;
}
function crumb(items) {
  return `<nav class="rank-breadcrumbs" aria-label="Breadcrumb"><ol>${items.map(([label, href], i) => `<li>${i === items.length - 1 ? `<span aria-current="page">${h(label)}</span>` : `<a href="${h(href)}">${h(label)}</a>`}</li>`).join("")}</ol></nav>`;
}
function breadcrumbs(items) {
  return json({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `https://franklinbaldo.github.io${path}`,
    })),
  });
}
function baseCrumbs(lang = "en") {
  return [
    [lang === "pt" ? "Início" : "Home", lang === "pt" ? "/pt/" : "/"],
    ["Ranking", lang === "pt" ? "/pt/ranking/" : "/ranking/"],
  ];
}
function safeHref(href) {
  const clean = String(href ?? "").trim();
  try {
    // Preserve ordinary relative and fragment links as well as absolute URLs.
    // URL parsing normalizes control characters before checking the scheme.
    const url = new URL(clean, "https://franklinbaldo.github.io/");
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? clean : "";
  } catch {
    return "";
  }
}

const markdown = new Marked({
  renderer: {
    html({ text }) {
      // Preserve harmless editorial emphasis without accepting HTML attributes,
      // scripts, embeds, or event handlers. Quoted comments remain readable.
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
function explainer(lang) {
  const pt = lang === "pt";
  return `<details class="hronir-explainer"><summary>${pt ? "O que é isso?" : "What is this?"}</summary><p>${h(pt ? "Esta página é um artefato do Hrönir: um sistema de duelos par-a-par entre textos deste blog, avaliados por leitores humanos e IA sob diferentes perspectivas e ranqueados com OpenSkill. Um duelo, uma perspectiva ou uma versão isolados não contam a história toda." : "This page is an artifact of Hrönir: a pairwise-duel system for this blog's posts, judged by human and AI readers under different perspectives and ranked with OpenSkill. One battle, perspective, or version doesn't tell the whole story on its own.")}</p><p><a href="${pt ? "/pt" : ""}/ranking/">${pt ? "Ver como funciona e o ranking completo" : "See how it works and the full ranking"} →</a></p></details>`;
}
function statsGrid(entries) {
  return `<dl class="rank-stats">${entries.map(([label, value]) => `<div><dt>${h(label)}</dt><dd>${h(value)}</dd></div>`).join("")}</dl>`;
}
function battleLang(d) {
  return byKey.get(d.winnerKey)?.lang === "pt" &&
    byKey.get(d.loserKey)?.lang === "pt"
    ? "pt"
    : "en";
}
function rates(d) {
  const winnerA = d.winnerSide
    ? d.winnerSide === "a"
    : d.postAKey === d.winnerKey;
  return winnerA ? [d.rateA, d.rateB] : [d.rateB, d.rateA];
}
function tension(d, lang) {
  const [win, lose] = rates(d);
  if (win == null || lose == null || win + lose <= 0)
    return `<p class="muted">${lang === "pt" ? "Dados de tensão indisponíveis" : "Tension data not available"}</p>`;
  const pct = Math.max(
    0,
    Math.min(100, Math.round((win / (win + lose)) * 100))
  );
  return `<meter min="0" max="100" value="${pct}" aria-label="${lang === "pt" ? "Divisão da taxa de vitória" : "Win rate split"}: ${pct}% / ${100 - pct}%">${pct}% / ${100 - pct}%</meter>`;
}
function battleTags(d, detailed = false) {
  const tags = [];
  if (d.season != null) tags.push(`Season ${h(d.season)}`);
  if (d.perspectiveId)
    tags.push(
      detailed
        ? `<a href="${h(perspectiveHref(d.perspectiveId))}">${h(perspectiveLabel(d.perspectiveId))}</a>`
        : h(perspectiveLabel(d.perspectiveId))
    );
  if (d.agentId) tags.push(h(d.agentId));
  if (d.confidence)
    tags.push(`${h(d.confidence)}${detailed ? " confidence" : ""}`);
  if (detailed) {
    const contentLangs = [
      ...new Set(
        [d.postAContentLang, d.postBContentLang]
          .filter(Boolean)
          .map((l) => l.toUpperCase())
      ),
    ].join("/");
    if (contentLangs) tags.push(`content: ${h(contentLangs)}`);
    if (d.reviewLang) tags.push(`critique: ${h(d.reviewLang.toUpperCase())}`);
  }
  return `<div class="battle-tags">${tags.map((text) => `<span class="tag">${text}</span>`).join("")}</div>`;
}
function battleCard(
  d,
  { map = byKey, lang = battleLang(d), recent = false } = {}
) {
  const [win, lose] = rates(d);
  const winner = titleFor(d.winnerKey, map),
    loser = titleFor(d.loserKey, map);
  const search = [
    winner,
    loser,
    d.perspectiveId ?? "",
    d.perspectiveId ? perspectiveLabel(d.perspectiveId) : "",
    d.agentId ?? "",
    d.criterion ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const read = lang === "pt" && recent ? "Ler análise" : "Read analysis";
  return `<article id="${h(d.id)}" class="battle-card" data-confidence="${h(d.confidence ?? "none")}" data-season="${h(d.season ?? "none")}" data-perspective="${h(d.perspectiveId ?? "none")}" data-agent="${h(d.agentId ?? "none")}" data-search="${h(search)}"><a class="battle-link" href="${h(battleHref(d.id))}" aria-label="${h(`${read}: ${winner} vs ${loser}`)}"><time datetime="${h(d.runAt)}">${date(d.runAt, lang)}</time>${battleTags(d)}<div class="battle-versus"><strong lang="${h(map.get(d.winnerKey)?.lang ?? lang)}">🏆 ${h(winner)}</strong>${win != null && lose != null ? `<span>${number(win, lang, 1)} / ${number(lose, lang, 1)}</span>` : ""}<span>${recent ? (lang === "pt" ? "venceu" : "beat") : "VS"}</span><span lang="${h(map.get(d.loserKey)?.lang ?? lang)}">${h(loser)}</span></div><span class="read-cta">${read} →</span></a>${tension(d, lang)}</article>`;
}

const rankingStrings = {
  en: {
    subtitle:
      "Posts ordered by OpenSkill ordinal (μ − 3σ). Higher is better. Updated every build from .routines/hronir/.",
    plainLangHeading: "How this works",
    plainLangBody:
      "Every post competes against another in a one-on-one duel. A reader (sometimes me, sometimes an AI model) reads both and picks the better one — then writes a short defense of that choice. The more duels a post wins, the higher it climbs. Posts with fewer duels have wider uncertainty and therefore rank lower until they've faced more competition.",
    technicalViewLabel: "Technical view",
    standardViewLabel: "Standard view",
    podiumLabel: "Podium",
    statsTotalDuels: "duels run",
    statsTotalRated: "posts ranked",
    statsAvgDuels: "duels per post (avg)",
    statsLastDuel: "last duel",
    tableCaption: "Full ranking, ordered by descending ordinal.",
    thRank: "#",
    thPost: "Post",
    thElo: "Elo",
    thOrdinal: "ordinal",
    thMu: "μ",
    thSigma: "σ",
    thRecord: "W/N",
    thConfidence: "confidence",
    thWinRate: "win%",
    thDelta: "Δ",
    sortByLabel: "Sort by",
    unratedHeading: "Not yet duelled",
    unratedBlurb:
      "Published posts that haven't gone through a Hrönir comparison yet.",
    recentHeading: "Recent Battles",
    recentBlurb:
      "The latest confrontations — click any card to read the full analysis and verdict.",
    recentBeats: "beat",
    emptyState:
      "No rated posts yet — run a Hrönir round to populate the ranking.",
    ordinalTip:
      "Ordinal = μ − 3σ. Combines estimated skill with a penalty for uncertainty.",
    muTip: "μ (mu): OpenSkill's estimate of average skill.",
    sigmaTip:
      "σ (sigma): uncertainty around the estimate. Shrinks as the post accumulates duels.",
    confidenceHigh: "high",
    confidenceMedium: "medium",
    confidenceLow: "low",
    podiumGold: "1st place",
    podiumSilver: "2nd place",
    podiumBronze: "3rd place",
    noDate: "—",
    unratedCTA:
      "These posts haven't been duelled yet. Feel like one of them deserves to be on top?",
    unratedCTALink: "Open an issue to suggest a duel.",
    perspectivesHeading: "Explore by Perspective",
    perspectivesBlurb:
      "Each perspective is a different lens for evaluating posts — curiosity, clarity, memorability, and more.",
    perspectivesLeaderLabel: "Leader:",
    perspectivesViewAllLink: "→ Browse all perspective rankings",
    allBattlesLinkText: "→ See all {count} battles",
    readAnalysisLinkLabel: "Read analysis",
    allPerspectivesLabel: "All",
    tensionUnavailable: "tension not available",
    eloTooltip: "Elo: {elo} ({delta} since 1000 · peak: {peak})",
    dossierTooltip: "Dossier: {title}",
  },
  pt: {
    subtitle:
      "Posts ordenados pelo ordinal do OpenSkill (μ − 3σ). Maior é melhor. Atualizado a cada build a partir de .routines/hronir/.",
    plainLangHeading: "Como isso funciona",
    plainLangBody:
      "Cada post compete contra outro num duelo par-a-par. Um leitor (às vezes eu, às vezes um modelo de IA) lê os dois e escolhe o melhor — depois escreve uma defesa breve dessa escolha. Quanto mais duelos um post vence, mais ele sobe. Posts com menos duelos têm incerteza maior e por isso ficam mais baixos até acumular mais confrontos.",
    technicalViewLabel: "Visão técnica",
    standardViewLabel: "Visão padrão",
    podiumLabel: "Pódio",
    statsTotalDuels: "duelos disputados",
    statsTotalRated: "posts no ranking",
    statsAvgDuels: "duelos por post (média)",
    statsLastDuel: "último duelo",
    tableCaption: "Ranking completo, ordenado por ordinal decrescente.",
    thRank: "#",
    thPost: "Post",
    thElo: "Elo",
    thOrdinal: "ordinal",
    thMu: "μ",
    thSigma: "σ",
    thRecord: "V/N",
    thConfidence: "confiança",
    thWinRate: "vitórias%",
    thDelta: "Δ",
    sortByLabel: "Ordenar por",
    unratedHeading: "Ainda sem duelo",
    unratedBlurb:
      "Posts publicados que ainda não passaram por nenhuma comparação Hrönir.",
    recentHeading: "Batalhas recentes",
    recentBlurb:
      "Os confrontos mais recentes — clique em qualquer card para ler a análise e o veredito completo.",
    recentBeats: "venceu",
    emptyState:
      "Sem posts ranqueados ainda — rode uma rodada Hrönir para popular o ranking.",
    ordinalTip:
      "Ordinal = μ − 3σ. Combina habilidade estimada com penalidade pela incerteza.",
    muTip: "μ (mu): habilidade média estimada pelo OpenSkill.",
    sigmaTip:
      "σ (sigma): incerteza da estimativa. Cai à medida que o post acumula duelos.",
    confidenceHigh: "alta",
    confidenceMedium: "média",
    confidenceLow: "baixa",
    podiumGold: "1º lugar",
    podiumSilver: "2º lugar",
    podiumBronze: "3º lugar",
    noDate: "—",
    unratedCTA:
      "Esses posts ainda não passaram pelo julgamento. Sente que algum deles merecia estar no topo?",
    unratedCTALink: "Abra uma issue sugerindo um duelo.",
    perspectivesHeading: "Explorar por perspectiva",
    perspectivesBlurb:
      "Cada perspectiva é uma lente diferente para avaliar os posts — curiosidade, clareza, memorabilidade e mais.",
    perspectivesLeaderLabel: "Líder:",
    perspectivesViewAllLink: "→ Ver todos os rankings por perspectiva",
    allBattlesLinkText: "→ Ver todas as {count} batalhas",
    readAnalysisLinkLabel: "Ler análise",
    allPerspectivesLabel: "Todas",
    tensionUnavailable: "tensão não disponível",
    eloTooltip: "Elo: {elo} ({delta} desde 1000 · pico: {peak})",
    dossierTooltip: "Dossiê: {title}",
  },
};

const tierStrings = {
  en: {
    heading: "Post tiers",
    description:
      "Letters are canonical OKF editorial decisions; Hrönir rank, stars and perspectives are evidence. Music now has a separate audio-first tier board.",
    qualityLabel: "quality",
    interestLabel: "interest",
    confidenceLabel: "conf.",
    summaryQualityLabel: "quality",
    summaryInterestLabel: "interest / fertility",
    emptyTier: "empty — nobody has earned this place yet",
    emptyBoard: "There are no canonical post tiers yet.",
    detailsLabel: "View editorial card",
    strengthsHeading: "What supports it",
    openProblemsHeading: "What holds it back",
    historyHeading: "Tier history",
    reviewedLabel: "reviewed",
  },
  pt: {
    heading: "Tiers de posts",
    description:
      "A letra é uma decisão editorial canônica em OKF; o ranking Hrönir, estrelas e perspectivas são evidência. Músicas agora têm um tier board separado, baseado no sistema de áudio.",
    qualityLabel: "qualidade",
    interestLabel: "interesse",
    confidenceLabel: "conf.",
    summaryQualityLabel: "qualidade",
    summaryInterestLabel: "interesse / fertilidade",
    emptyTier: "vazio — ninguém ganhou este lugar ainda",
    emptyBoard: "Ainda não há tiers canônicos de posts.",
    detailsLabel: "Ver ficha editorial",
    strengthsHeading: "O que sustenta",
    openProblemsHeading: "O que segura",
    historyHeading: "Histórico do tier",
    reviewedLabel: "revisão",
  },
};

const absolute = computeAbsoluteQuality();
const deconfounded = computeDeconfoundedQuality().quality;
const tierOrder = ["S", "A", "B", "C", "D", "F"];
const tiers = readdirSync("knowledge/blog-post-tiers")
  .filter((file) => file.endsWith(".md"))
  .sort()
  .map((file) => {
    const { data } = matter(
      readFileSync(join("knowledge/blog-post-tiers", file), "utf8")
    );
    return data;
  })
  .filter((card) => isNormalEditorialTierKey(card.translation_key))
  .sort(
    (a, b) =>
      (rankByKey.get(a.translation_key)?.rank ?? Infinity) -
        (rankByKey.get(b.translation_key)?.rank ?? Infinity) ||
      a.translation_key.localeCompare(b.translation_key)
  );
const tierKeys = new Set();
for (const card of tiers) {
  if (tierKeys.has(card.translation_key))
    throw new Error(`Duplicate post tier: ${card.translation_key}`);
  if (
    !tierOrder.includes(card.quality_tier) ||
    !tierOrder.includes(card.interest_tier)
  )
    throw new Error(`Invalid post tier: ${card.translation_key}`);
  tierKeys.add(card.translation_key);
}
function tierBoard(lang, map) {
  const s = tierStrings[lang];
  const list = (heading, values) =>
    values?.length
      ? `<h4>${h(heading)}</h4><ul>${values.map((value) => `<li>${h(value)}</li>`).join("")}</ul>`
      : "";
  const counts = (field, label) =>
    `<div><strong>${h(label)}</strong><p>${tierOrder.map((tier) => `${tier} ${tiers.filter((c) => c[field] === tier).length}`).join(" · ")}</p></div>`;
  return `<section id="post-tiers"><h2>${h(s.heading)}</h2><p>${h(s.description)}</p>${
    tiers.length
      ? `<div class="tier-scoreboard">${counts("quality_tier", s.summaryQualityLabel)}${counts("interest_tier", s.summaryInterestLabel)}</div><div class="tier-board">${tierOrder
          .map(
            (tier) =>
              `<section class="tier-row tier-${tier.toLowerCase()}" aria-label="Tier ${tier}"><h3 class="tier-letter">${tier}</h3><div class="tier-cards">${
                tiers
                  .filter((c) => c.quality_tier === tier)
                  .map((c) => {
                    const rank = rankByKey.get(c.translation_key);
                    const ev = [
                      ["ranking", rank ? `#${rank.rank}` : "—"],
                      ["ordinal", number(rank?.ordinal, lang)],
                      [
                        lang === "pt" ? "estrelas" : "stars",
                        number(absolute.get(c.translation_key)?.stars, lang),
                      ],
                      [
                        lang === "pt" ? "de-conf." : "deconf.",
                        number(
                          deconfounded.get(c.translation_key)?.quality,
                          lang
                        ),
                      ],
                      [
                        lang === "pt" ? "V/N" : "W/N",
                        `${rank?.wins ?? 0}/${rank?.appearances ?? 0}`,
                      ],
                    ];
                    const reviewed =
                      c.reviewed_at instanceof Date
                        ? c.reviewed_at.toISOString().slice(0, 10)
                        : c.reviewed_at;
                    return `<article class="tier-card" id="post-tier-${h(c.translation_key)}"><div class="battle-tags"><span class="tag">${h(s.qualityLabel)} ${h(c.quality_tier)}</span><span class="tag">${h(s.interestLabel)} ${h(c.interest_tier)}</span><span class="tag">${h(s.confidenceLabel)} ${h(c.confidence)}</span></div><h4>${postLink(c.translation_key, map)}</h4><p>${h(c.summary)}</p>${statsGrid(ev)}<details><summary>${h(s.detailsLabel)}</summary>${list(s.strengthsHeading, c.strengths)}${list(s.openProblemsHeading, c.open_problems)}${list(s.historyHeading, c.history)}${c.note ? `<p class="tier-note">${h(c.note)}</p>` : ""}</details><footer><small>${h(s.reviewedLabel)} ${h(reviewed ?? "")}</small><a href="${h(dossierHref(c.translation_key))}">${lang === "pt" ? "dossiê Hrönir" : "Hrönir dossier"} ↗</a></footer></article>`;
                  })
                  .join("") || `<p class="muted">${h(s.emptyTier)}</p>`
              }</div></section>`
          )
          .join("")}</div>`
      : `<p>${h(s.emptyBoard)}</p>`
  }</section>`;
}
function perspectiveCards(map, lang = "en") {
  return `<div class="persp-grid">${perspectives
    .map((p) => {
      const rows = perPerspective.get(p.id) ?? [];
      const leader = rows[0] ? map.get(rows[0].key) : null;
      return `<article class="persp-card"><h3><a href="${h(perspectiveHref(p.id))}">${h(p.name)}</a></h3><p>${h(p.summary)}</p><small>${rows.length} posts · ${rows.reduce((sum, r) => sum + r.appearances, 0) / 2} ${lang === "pt" ? "duelos" : "duels"}</small>${leader ? `<p>${lang === "pt" ? "Líder:" : "Leader:"} <a href="${h(leader.href)}" lang="${h(leader.lang)}">${h(leader.title)}</a></p>` : ""}</article>`;
    })
    .join("")}</div>`;
}
function rankingHome(lang) {
  const s = rankingStrings[lang],
    map = postMap(lang),
    path = lang === "pt" ? "/pt/ranking/" : "/ranking/";
  const formatDelta = (delta) =>
    delta == null ? "—" : delta === 0 ? "·" : `${delta > 0 ? "+" : ""}${delta}`;
  const sortable = (key, label, tech = false) =>
    `<th scope="col"${tech ? ' class="tech-col"' : ""} aria-sort="none"><button type="button" class="sort-button" data-sort="${key}" aria-label="${h(`${s.sortByLabel} ${label}`)}">${h(label)}</button></th>`;
  let body = `<header><h1>Ranking</h1><p>${h(s.subtitle)}</p></header><details class="hronir-explainer"><summary>${h(s.plainLangHeading)}</summary><p>${h(s.plainLangBody)}</p></details>`;
  body += statsGrid([
    [s.statsTotalDuels, stats.totalDuels],
    [s.statsTotalRated, stats.totalRated],
    [
      s.statsAvgDuels,
      number(
        stats.totalRated ? (stats.totalDuels * 2) / stats.totalRated : 0,
        lang,
        1
      ),
    ],
    [s.statsLastDuel, date(stats.lastDuelAt, lang)],
  ]);
  body += `<section class="rank-podium" aria-label="${h(s.podiumLabel)}">${ranking
    .slice(0, 3)
    .map(
      (r, i) =>
        `<article class="podium-card"><span>${h([s.podiumGold, s.podiumSilver, s.podiumBronze][i])}</span><h2>${postLink(r.key, map)}</h2>${statsGrid(
          [
            [s.thOrdinal, number(r.ordinal, lang)],
            [s.thRecord, `${r.wins}/${r.appearances}`],
          ]
        )}</article>`
    )
    .join("")}</section>`;
  body += `<nav class="persp-tabs" aria-label="${h(s.perspectivesHeading)}"><a href="${path}" aria-current="page">${h(s.allPerspectivesLabel)}</a>${perspectives.map((p) => `<a href="${h(perspectiveHref(p.id))}">${h(p.name)}</a>`).join("")}</nav>`;
  if (ranking.length) {
    body += `<div class="rank-table-header"><p>${h(s.tableCaption)}</p><button id="view-toggle" type="button" hidden aria-pressed="false" data-technical-label="${h(s.technicalViewLabel)}" data-standard-label="${h(s.standardViewLabel)}">${h(s.standardViewLabel)}</button></div><div class="overflow-table"><table id="rank-table"><caption>${h(s.tableCaption)}</caption><thead><tr><th scope="col">#</th><th scope="col">${h(s.thPost)}</th>${sortable("winrate", s.thWinRate)}${snapshot ? sortable("delta", s.thDelta) : ""}<th scope="col">${h(s.thConfidence)}</th>${sortable("elo", s.thElo, true)}<th class="tech-col" scope="col"><abbr title="${h(s.muTip)}">μ</abbr></th><th class="tech-col" scope="col"><abbr title="${h(s.sigmaTip)}">σ</abbr></th><th class="tech-col" scope="col"><abbr title="${h(s.ordinalTip)}">ordinal</abbr></th>${sortable("record", s.thRecord, true)}</tr></thead><tbody>`;
    body +=
      ranking
        .map((r, i) => {
          const winRate = r.appearances
            ? Math.round((r.wins / r.appearances) * 100)
            : 0;
          const delta = getSnapshotDelta(r.key),
            elo = snapshot?.keys[r.key]?.elo;
          const eloDelta = elo == null ? null : elo - 1000;
          const eloTip =
            elo == null
              ? ""
              : s.eloTooltip
                  .replace("{elo}", elo)
                  .replace("{delta}", `${eloDelta >= 0 ? "+" : ""}${eloDelta}`)
                  .replace("{peak}", snapshot.keys[r.key].eloPeak ?? elo);
          const confidence =
            r.appearances < 3
              ? s.confidenceLow
              : r.sigma < 6.4
                ? s.confidenceHigh
                : r.sigma < 7
                  ? s.confidenceMedium
                  : s.confidenceLow;
          return `<tr data-sort-winrate="${winRate}" data-sort-delta="${delta ?? 0}" data-sort-elo="${elo ?? 0}" data-sort-record="${r.appearances}"><th scope="row"><a href="${h(dossierHref(r.key))}" title="${h(s.dossierTooltip.replace("{title}", titleFor(r.key, map)))}">${i + 1}</a></th><td>${postLink(r.key, map)}</td><td>${winRate}%</td>${snapshot ? `<td>${formatDelta(delta)}</td>` : ""}<td>${h(confidence)}</td><td class="tech-col">${elo == null ? "—" : `<abbr title="${h(eloTip)}">${elo} (${eloDelta >= 0 ? "+" : ""}${eloDelta})</abbr>`}</td><td class="tech-col">${number(r.mu, lang)}</td><td class="tech-col">${number(r.sigma, lang)}</td><td class="tech-col"><strong>${number(r.ordinal, lang)}</strong></td><td class="tech-col">${r.wins}/${r.appearances}</td></tr>`;
        })
        .join("") + "</tbody></table></div>";
  } else body += `<p>${h(s.emptyState)}</p>`;
  body += `<section><h2>${h(s.recentHeading)}</h2><p>${h(s.recentBlurb)}</p><div class="battle-list">${duels
    .slice(0, 10)
    .map((d) => battleCard(d, { map, lang, recent: true }))
    .join(
      ""
    )}</div><p><a href="/ranking/battles/">${h(s.allBattlesLinkText.replace("{count}", stats.totalDuels))}</a></p></section>`;
  body += `<section><h2>${h(s.perspectivesHeading)}</h2><p>${h(s.perspectivesBlurb)}</p>${perspectiveCards(map, lang)}<p><a href="/ranking/perspectives/">${h(s.perspectivesViewAllLink)}</a></p></section>`;
  const unrated = [...map]
    .filter(([key]) => !rankByKey.has(key))
    .sort((a, b) => a[1].title.localeCompare(b[1].title, locale(lang)));
  if (unrated.length)
    body += `<section><h2>${h(s.unratedHeading)}</h2><p>${h(s.unratedBlurb)}</p><ul>${unrated.map(([key]) => `<li>${postLink(key, map)}</li>`).join("")}</ul><p>${h(s.unratedCTA)} <a href="https://github.com/franklinbaldo/franklinbaldo.github.io/issues/new" target="_blank" rel="noopener noreferrer">${h(s.unratedCTALink)}</a></p></section>`;
  body += tierBoard(lang, map);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Ranking — Franklin Baldo",
    description:
      lang === "pt"
        ? "Posts ranqueados por comparações par-a-par sob o sistema Hrönir."
        : "Posts ranked by pairwise comparisons under the Hrönir system.",
    inLanguage: locale(lang),
    url: `https://franklinbaldo.github.io${path}`,
    numberOfItems: ranking.length,
    itemListElement: ranking
      .map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: titleFor(r.key, map),
        url: map.has(r.key)
          ? `https://franklinbaldo.github.io${map.get(r.key).href}`
          : null,
      }))
      .filter((item) => item.url),
  };
  page(
    path,
    "Ranking",
    lang === "pt"
      ? "Posts ranqueados por comparações par-a-par sob o sistema Hrönir, com OpenSkill."
      : "Posts ranked by pairwise comparisons under the Hrönir system, scored with OpenSkill.",
    body,
    {
      lang,
      translations:
        lang === "pt" ? { en: "/ranking/" } : { pt: "/pt/ranking/" },
      structured_data: json(itemList),
      og_image: lang === "pt" ? "/og/ranking-pt.png" : "/og/ranking.png",
    }
  );
}

function archiveFilters(items, shownCount) {
  const unique = (field) =>
    [
      ...new Set(
        items
          .map((d) => d[field])
          .filter((value) => value != null && value !== "")
      ),
    ].sort((a, b) =>
      typeof a === "number" ? a - b : String(a).localeCompare(String(b))
    );
  const select = (field, label, all, values, display = (value) => value) =>
    `<label>${h(label)}<select id="filter-${field}" data-filter="${field}"><option value="all">${h(all)}</option>${values.map((value) => `<option value="${h(value)}">${h(display(value))}</option>`).join("")}</select></label>`;
  return `<form id="battle-filters" class="battle-filters" role="search"><label class="battle-search-label">Search battles<input type="search" id="battle-search" name="q" placeholder="Search battles (title, perspective, agent…)" autocomplete="off"></label>${select("season", "Season", "All seasons", unique("season"))}${select("agent", "Agent", "All agents", unique("agentId"))}${select("confidence", "Confidence", "All confidence levels", ["high", "medium", "low"])}${select("perspective", "Perspective", "All perspectives", unique("perspectiveId"), perspectiveLabel)}<p id="filter-count-label" role="status" aria-live="polite">Showing ${shownCount} of ${shownCount} on this page</p></form>`;
}
function archivePages() {
  const totalPages = Math.max(1, Math.ceil(duels.length / PER_PAGE));
  for (let n = 1; n <= totalPages; n++) {
    const slice = duels.slice((n - 1) * PER_PAGE, n * PER_PAGE);
    const crumbs = [
      ...baseCrumbs(),
      ["All Battles", "/ranking/battles/"],
      ...(n > 1 ? [[`Page ${n}`, archiveHref(n)]] : []),
    ];
    const body =
      crumb(crumbs) +
      `<header><h1>Battle Archive</h1><p>${duels.length} editorial duels · page ${n} of ${totalPages} · click any battle to read the full analysis and verdict</p></header>${archiveFilters(n === 1 ? duels : slice, slice.length)}<div class="battle-list" id="battle-list">${slice.map((d) => battleCard(d)).join("") || "<p>No battles yet.</p>"}</div><p id="battle-empty" hidden>No battles match the selected filters.</p><nav class="page-nav" aria-label="Archive pages">${n > 1 ? `<a class="archive-page-link" href="${archiveHref(n - 1)}">← Newer</a>` : '<span aria-disabled="true">← Newer</span>'}<span>Page ${n} of ${totalPages}</span>${n < totalPages ? `<a class="archive-page-link" href="${archiveHref(n + 1)}">Older →</a>` : '<span aria-disabled="true">Older →</span>'}</nav>`;
    page(
      archiveHref(n),
      n === 1
        ? "Battle Archive | Ranking"
        : `Battle Archive — Page ${n} | Ranking`,
      "All Hrönir duels — the full battle history with verdicts, analyses, and rates.",
      body,
      { structured_data: breadcrumbs(crumbs) }
    );
  }
}
function battlePages() {
  for (const [index, d] of duels.entries()) {
    const lang = battleLang(d),
      pt = lang === "pt";
    const s = pt
      ? {
          heading: "Relatório do duelo",
          winner: "Vencedor 🏆",
          challenger: "Desafiante",
          verdict: "Veredito",
          analysis: "Análise",
          state: "Estado do avaliador",
          before: "Antes: ",
          after: "Depois: ",
          nav: "Navegação de duelos",
          newer: "← Duelo mais recente",
          older: "Duelo mais antigo →",
          newest: "← Mais recente",
          oldest: "Mais antigo →",
        }
      : {
          heading: "Battle Report",
          winner: "Winner 🏆",
          challenger: "Challenger",
          verdict: "Verdict",
          analysis: "Analysis",
          state: "Evaluator State",
          before: "Before: ",
          after: "After: ",
          nav: "Battle navigation",
          newer: "← Newer battle",
          older: "Older battle →",
          newest: "← Newest",
          oldest: "Oldest →",
        };
    const archive = `${archiveHref(Math.floor(index / PER_PAGE) + 1)}#${d.id}`;
    const title = `${titleFor(d.winnerKey)} vs ${titleFor(d.loserKey)}`;
    const crumbs = [
      ...baseCrumbs(lang),
      ["All battles", archive],
      [title, battleHref(d.id)],
    ];
    const [win, lose] = rates(d);
    const side = (key, label, rate) =>
      `<section class="versus-side"><small>${h(label)}</small><h2>${postLink(key)}</h2>${rate != null && win != null && lose != null ? `<strong class="versus-rate">${number(rate, lang)}</strong>` : ""}${rankByKey.has(key) ? `<p><a href="${h(dossierHref(key))}">#${rankByKey.get(key).rank}/${ranking.length}</a></p>` : ""}</section>`;
    let body = `${crumb(crumbs)}<header><h1>${h(s.heading)}</h1><p><time datetime="${h(d.runAt)}">${date(d.runAt, lang, "long")}</time></p></header>${explainer(lang)}${battleTags(d, true)}<div class="versus-grid">${side(d.winnerKey, s.winner, win)}<span>VS</span>${side(d.loserKey, s.challenger, lose)}</div>${tension(d, lang)}`;
    if (d.criterion || d.margin != null)
      body += statsGrid([
        [pt ? "critério" : "criterion", d.criterion ?? "—"],
        [pt ? "margem" : "margin", d.margin ?? "—"],
      ]);
    const reviewLang = d.reviewLang ? ` lang="${h(d.reviewLang)}"` : "";
    if (d.parsedContent?.verdict)
      body += `<section class="verdict-section"><h2>${h(s.verdict)}</h2><div class="prose"${reviewLang}>${renderMarkdown(d.parsedContent.verdict)}</div></section>`;
    if (d.parsedContent?.postAAnalysis || d.parsedContent?.postBAnalysis) {
      body += '<div class="analyses-grid">';
      for (const [key, review] of [
        [d.postAKey, d.parsedContent.postAAnalysis],
        [d.postBKey, d.parsedContent.postBAnalysis],
      ]) {
        if (review)
          body += `<section><h2>${h(s.analysis)} — <span lang="${h(byKey.get(key)?.lang ?? lang)}">${h(titleFor(key))}</span></h2><div class="prose"${reviewLang}>${renderMarkdown(review)}</div></section>`;
      }
      body += "</div>";
    }
    if (
      d.body &&
      !d.parsedContent?.verdict &&
      !d.parsedContent?.postAAnalysis &&
      !d.parsedContent?.postBAnalysis
    )
      body += `<section class="prose"${reviewLang}>${renderMarkdown(d.body)}</section>`;
    if (d.evaluatorMood || d.evaluatorMoodAfter)
      body += `<section><h2>${h(s.state)}</h2>${d.evaluatorMood ? `<blockquote lang="pt-BR"><small>${h(s.before)}</small>"${h(d.evaluatorMood)}"</blockquote>` : ""}${d.evaluatorMoodAfter ? `<blockquote lang="pt-BR"><small>${h(s.after)}</small>"${h(d.evaluatorMoodAfter)}"</blockquote>` : ""}</section>`;
    body += `<nav class="page-nav" aria-label="${h(s.nav)}">${index > 0 ? `<a href="${h(battleHref(duels[index - 1].id))}">${h(s.newer)}</a>` : `<span>${h(s.newest)}</span>`}<a href="${h(archive)}">Back to archive</a>${index + 1 < duels.length ? `<a href="${h(battleHref(duels[index + 1].id))}">${h(s.older)}</a>` : `<span>${h(s.oldest)}</span>`}</nav>`;
    const description = pt
      ? `Duelo Hrönir: ${titleFor(d.winnerKey)} venceu ${titleFor(d.loserKey)}${d.perspectiveId ? ` sob a perspectiva ${perspectiveLabel(d.perspectiveId)}` : ""}.`
      : `Hrönir duel: ${titleFor(d.winnerKey)} beat ${titleFor(d.loserKey)}${d.perspectiveId ? ` under the ${perspectiveLabel(d.perspectiveId)} perspective` : ""}.`;
    page(
      battleHref(d.id),
      `${title} | ${pt ? "Batalhas do Ranking" : "Ranking Battles"}`,
      description,
      body,
      { lang, noindex: true, structured_data: breadcrumbs(crumbs) }
    );
  }
}
function sparkline(history, key, caption) {
  if (history.length < 2) return "";
  let wins = 0;
  const points = [...history].reverse().map((d, i) => {
    const won = d.winnerKey === key;
    if (won) wins++;
    return {
      x: ((i / (history.length - 1)) * 200).toFixed(1),
      y: (36 - (wins / (i + 1)) * 36).toFixed(1),
      won,
    };
  });
  const path = points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
  return `<figure class="sparkline-wrap"><figcaption>${h(caption)}</figcaption><svg viewBox="0 0 200 36" class="sparkline" role="img" aria-label="${h(caption)}"><line x1="0" y1="18" x2="200" y2="18" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 3"/><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.5"/>${points.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${p.won ? 2.5 : 1.5}" fill="currentColor" opacity="${p.won ? 1 : 0.5}"/>`).join("")}</svg></figure>`;
}
function dossierPages() {
  const historyByKey = new Map();
  for (const d of duels)
    for (const key of [d.postAKey, d.postBKey]) {
      if (!historyByKey.has(key)) historyByKey.set(key, []);
      historyByKey.get(key).push(d);
    }
  for (const [index, row] of ranking.entries()) {
    const key = row.key,
      post = byKey.get(key),
      title = titleFor(key),
      lang = post?.lang === "pt" ? "pt" : "en",
      pt = lang === "pt";
    const s = pt
      ? {
          suffix: "Dossiê",
          read: "Ler post →",
          rank: "posição global",
          change: "variação de posição",
          rate: "taxa de vitória",
          wins: "vitórias / duelos",
          spark:
            "Taxa de vitória ao longo do tempo (cada ponto = um duelo, cronológico)",
          perspectives: "Rankings por perspectiva",
          history: "Histórico de duelos",
          total: "no total",
          empty: "Nenhum duelo registrado ainda.",
          won: "Venceu",
          lost: "Perdeu",
          analysis: "Ler análise completa",
        }
      : {
          suffix: "Dossier",
          read: "Read post →",
          rank: "global rank",
          change: "rank change",
          rate: "win rate",
          wins: "wins / duels",
          spark: "Win rate over time (each point = one duel, chronological)",
          perspectives: "Perspective rankings",
          history: "Duel history",
          total: "total",
          empty: "No duels recorded yet.",
          won: "Won",
          lost: "Lost",
          analysis: "Read full analysis",
        };
    const history = historyByKey.get(key) ?? [],
      wins = history.filter((d) => d.winnerKey === key).length,
      delta = getSnapshotDelta(key);
    const crumbs = [...baseCrumbs(lang), [title, dossierHref(key)]];
    let body = `${crumb(crumbs)}<header><h1>${h(title)}</h1>${post ? `<p><a href="${h(post.href)}">${h(s.read)}</a></p>` : ""}</header>${explainer(lang)}`;
    body += statsGrid([
      [s.rank, `#${index + 1}`],
      ...(delta != null && delta !== 0
        ? [[s.change, `${delta > 0 ? "+" : ""}${delta}`]]
        : []),
      [
        s.rate,
        `${history.length ? Math.round((wins / history.length) * 100) : 0}%`,
      ],
      [s.wins, `${wins}/${history.length}`],
      ["ordinal", number(row.ordinal, lang, 3)],
    ]);
    body += sparkline(history, key, s.spark);
    const prs = perspectives
      .map((p) => {
        const rows = perPerspective.get(p.id) ?? [],
          rank = rows.findIndex((r) => r.key === key);
        return rank < 0
          ? null
          : { ...p, rank: rank + 1, ordinal: rows[rank].ordinal };
      })
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank);
    if (prs.length)
      body += `<section><h2>${h(s.perspectives)}</h2><ul class="persp-ranks">${prs.map((p) => `<li><a href="${h(perspectiveHref(p.id))}">${h(p.name)}</a> #${p.rank} (${number(p.ordinal, lang, 3)})</li>`).join("")}</ul></section>`;
    body += `<section><h2>${h(s.history)} <small>(${history.length} ${h(s.total)})</small></h2>${
      history.length
        ? `<ol class="duel-history">${history
            .map((d) => {
              const won = d.winnerKey === key,
                opponent = won ? d.loserKey : d.winnerKey;
              const mine = d.postAKey === key ? d.rateA : d.rateB,
                theirs = d.postAKey === key ? d.rateB : d.rateA;
              return `<li class="${won ? "duel-won" : "duel-lost"}"><strong aria-label="${h(`${won ? s.won : s.lost} vs ${titleFor(opponent)}`)}">${won ? "W" : "L"}</strong> vs ${postLink(opponent)}<div class="duel-meta"><time datetime="${h(d.runAt)}">${date(d.runAt, lang)}</time>${mine != null && theirs != null ? `<span>${number(mine, lang, 1)} / ${number(theirs, lang, 1)}</span>` : ""}${d.perspectiveId ? `<a href="${h(perspectiveHref(d.perspectiveId))}">${h(perspectiveLabel(d.perspectiveId))}</a>` : ""}<a href="${h(battleHref(d.id))}" aria-label="${h(`${s.analysis} — vs ${titleFor(opponent)}`)}">${pt ? "análise" : "analysis"} →</a></div></li>`;
            })
            .join("")}</ol>`
        : `<p>${h(s.empty)}</p>`
    }</section>`;
    page(
      dossierHref(key),
      `${title} — ${s.suffix}`,
      pt
        ? `Histórico de ranking e registro de duelos de "${title}" no sistema Hrönir.`
        : `Ranking history and duel record for "${title}" in the Hrönir system.`,
      body,
      { lang, noindex: true, structured_data: breadcrumbs(crumbs) }
    );
  }
}
function perspectivePages() {
  const indexCrumbs = [
    ...baseCrumbs(),
    ["Perspectives", "/ranking/perspectives/"],
  ];
  page(
    "/ranking/perspectives/",
    "Perspectives — Ranking",
    "Browse all evaluation perspectives used in the Hrönir ranking system.",
    `${crumb(indexCrumbs)}<header><h1>Ranking perspectives</h1><p>Each perspective is a different lens for judging a post — curiosity, clarity, writing quality, and more. A post can rank differently under each lens.</p></header>${perspectiveCards(byKey)}`,
    { structured_data: breadcrumbs(indexCrumbs) }
  );
  for (const p of perspectives) {
    const rows = perPerspective.get(p.id) ?? [],
      crumbs = [...indexCrumbs, [p.name, perspectiveHref(p.id)]];
    let body = `${crumb(crumbs)}<header><h1>${h(p.name)}</h1><p>${h(p.summary)}</p></header>${explainer("en")}`;
    body += rows.length
      ? `<div class="overflow-table"><table><caption>Posts ranked under the <em>${h(p.name)}</em> perspective, ordered by ordinal (μ − 3σ).</caption><thead><tr><th scope="col">#</th><th scope="col">Post</th><th scope="col">ordinal</th><th scope="col">W/N</th><th scope="col">global #</th></tr></thead><tbody>${rows.map((r, i) => `<tr><th scope="row">${i + 1}</th><td>${postLink(r.key)}</td><td>${number(r.ordinal, "en", 3)}</td><td>${r.wins}/${r.appearances}</td><td>${rankByKey.has(r.key) ? `<a href="${h(dossierHref(r.key))}" title="${h(`Global rank of ${titleFor(r.key)}`)}">#${rankByKey.get(r.key).rank}</a>` : "—"}</td></tr>`).join("")}</tbody></table></div>`
      : "<p>No duels recorded for this perspective yet.</p>";
    body += `<section><h2>Other perspectives</h2><ul>${perspectives
      .filter((other) => other.id !== p.id)
      .map(
        (other) =>
          `<li><a href="${h(perspectiveHref(other.id))}">${h(other.name)}</a><small> — ${h(other.summary)}</small></li>`
      )
      .join("")}</ul></section>`;
    page(
      perspectiveHref(p.id),
      `${p.name} — Perspective Ranking`,
      p.summary,
      body,
      { noindex: true, structured_data: breadcrumbs(crumbs) }
    );
  }
}

rankingHome("en");
rankingHome("pt");
archivePages();
battlePages();
dossierPages();
perspectivePages();
manifest.ranking = {
  routes,
  ranked_posts: ranking.length,
  editorial_duels: duels.length,
  archive_pages: Math.max(1, Math.ceil(duels.length / PER_PAGE)),
  perspectives: perspectives.length,
  tier_cards: tiers.length,
};
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Zola rankings: ${routes.length} native pages, ${duels.length} editorial battles, ${ranking.length} dossiers, ${perspectives.length} perspectives, ${tiers.length} tier cards; version trials excluded`
);
