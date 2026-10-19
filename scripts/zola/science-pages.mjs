// Native, read-only Zola projections of the public OKF curation collections.
// Papers are deliberately opt-in: only knowledge/papers is read, never the
// external papers repository. Editorial letters are never derived from scores.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";
import ts from "typescript";
import {
  computeAbsoluteQuality,
  computeDeconfoundedQuality,
  computePerPerspectiveRatings,
  computeRatings,
} from "../../src/hronir/ranking.ts";
import { isNormalEditorialPost } from "../../src/hronir/tier-scope.ts";
import { repoDescriptionLang } from "../../src/lib/repoDescriptionLang.ts";
import { escapeHtml as h, frontmatter, stableName } from "./content.mjs";

const target = resolve(process.env.ZOLA_SITE_DIR ?? ".cache/zola-site");
const manifestPath = join(target, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const routes = [];
const tierOrder = ["S", "A", "B", "C", "D", "F"];
const repo =
  "https://github.com/franklinbaldo/franklinbaldo.github.io/blob/main/";
const paperRepo = "https://github.com/franklinbaldo/papers/blob/main/";
const date = (value) =>
  value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value ?? "");
const json = (value) => JSON.stringify(value, null, 2) + "\n";
const text = (value) =>
  h(value instanceof Date ? value.toISOString() : String(value ?? ""));
const unique = (values) => [...new Set(values)];
const latest = (records, key = "updated") =>
  records
    .map((card) => date(card.data[key]))
    .toSorted()
    .at(-1) ?? "—";
function write(path, body) {
  const file = join(target, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
}
function safeUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw, "https://franklinbaldo.github.io/");
    return ["http:", "https:"].includes(parsed.protocol) ? raw : "";
  } catch {
    return "";
  }
}
const link = (url, label) =>
  safeUrl(url) ? `<a href="${h(safeUrl(url))}">${h(label)}</a>` : h(label);
const markdown = new Marked({
  renderer: {
    heading({ depth, tokens }) {
      // Canonical notes are nested evidence, not additional page titles.
      const level = Math.min(6, depth + 3);
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
    },
    html({ text: value }) {
      return /^<\/?(?:em|strong|b|i|code|sub|sup|br)\s*\/?>$/i.test(
        value.trim()
      )
        ? value
        : h(value);
    },
    link({ href, title, tokens }) {
      const label = this.parser.parseInline(tokens);
      const url = safeUrl(href);
      return url
        ? `<a href="${h(url)}"${title ? ` title="${h(title)}"` : ""}>${label}</a>`
        : label;
    },
    image({ href, text: alt }) {
      return link(href, alt || href);
    },
  },
});
function cards(folder, type, identity) {
  const files = readdirSync(`knowledge/${folder}`)
    .filter((file) => file.endsWith(".md"))
    .toSorted();
  const result = files.map((file) => {
    const source = `knowledge/${folder}/${file}`;
    const { data, content } = matter(readFileSync(source, "utf8"));
    if (data.type !== type)
      throw new Error(`${source}: expected ${type}, found ${data.type}`);
    for (const key of [
      "quality_tier",
      "scientific_tier",
      "evidence_tier",
      "interest_tier",
    ]) {
      if (
        data[key] !== undefined &&
        ![...tierOrder, ...(key === "interest_tier" ? [] : ["NR"])].includes(
          data[key]
        )
      )
        throw new Error(`${source}: invalid ${key}: ${data[key]}`);
    }
    return { slug: file.slice(0, -3), source, data, content };
  });
  const seen = new Set();
  for (const card of result) {
    const id = identity ? card.data[identity] : card.slug;
    if (!id || seen.has(id))
      throw new Error(`${folder}: duplicate/missing ${id}`);
    seen.add(id);
  }
  return result.toSorted((a, b) =>
    String(a.data.name ?? a.data.title ?? a.slug).localeCompare(
      String(b.data.name ?? b.data.title ?? b.slug),
      "pt-BR"
    )
  );
}
const papers = cards("papers", "paper");
const malecns = cards("malecns-projects", "malecns-project", "project_id");
const theories = cards("toe", "toe");
const worlds = cards("ai-epistemic-worlds", "ai-epistemic-world");
const convergences = cards(
  "ai-epistemic-convergences",
  "ai-epistemic-convergence"
);
const interventions = cards(
  "ai-epistemic-interventions",
  "ai-epistemic-intervention"
).toSorted((a, b) => date(b.data.updated).localeCompare(date(a.data.updated)));
const slop = cards("awesome-ai-slop", "awesome-ai-slop");
const projects = cards("project-tiers", "project-tier", "repository");
const postsByKey = new Map();
for (const post of manifest.posts) {
  const key = post.data.translationKey;
  if (!key) continue;
  if (!postsByKey.has(key) || post.data.lang === "pt")
    postsByKey.set(key, post);
}
const postTiers = cards(
  "blog-post-tiers",
  "blog-post-tier",
  "translation_key"
).filter((card) =>
  isNormalEditorialPost(
    postsByKey.get(card.data.translation_key)?.data ?? {},
    card.data.translation_key
  )
);

// Opening clashes are the one editorial dataset defined directly in TS. Read
// its literal initializer with the TS parser, without importing the Astro glob
// adapter or executing arbitrary source code.
function readLiteral(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(readLiteral);
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties.map((property) => {
        if (!ts.isPropertyAssignment(property))
          throw new Error("Nonliteral clash");
        return [property.name.text, readLiteral(property.initializer)];
      })
    );
  throw new Error("Opening clashes must remain a literal editorial dataset");
}
const source = ts.createSourceFile(
  "toe-arena.ts",
  readFileSync("src/data/toe-arena.ts", "utf8"),
  ts.ScriptTarget.Latest,
  true
);
const clashDeclaration = source.statements
  .filter(ts.isVariableStatement)
  .flatMap((statement) => [...statement.declarationList.declarations])
  .find((declaration) => declaration.name.getText(source) === "openingClashes");
if (!clashDeclaration?.initializer) throw new Error("Missing opening clashes");
const clashes = readLiteral(clashDeclaration.initializer);

function page(path, title, description, body, lang = "pt", extra = {}) {
  if (routes.includes(path))
    throw new Error(`Duplicate science route: ${path}`);
  routes.push(path);
  write(
    `content/pages/${stableName(path)}.md`,
    frontmatter(
      {
        title,
        description,
        path,
        template: "science.html",
        in_search_index: false,
      },
      { kind: "science", lang, ...extra }
    ) +
      `<div class="science-content">\n${body.replace(/\n\s*\n/g, "\n")}\n</div>\n`
  );
}
function hero(title, subtitle, description) {
  return `<header class="science-hero"><p class="eyebrow">${h(subtitle)}</p><h1>${h(title)}</h1>${description}</header>`;
}
function list(title, values, ordered = false) {
  if (!values?.length) return "";
  const tag = ordered ? "ol" : "ul";
  return `<section class="evidence-list"><h4>${h(title)}</h4><${tag}>${values.map((item) => `<li>${text(item)}</li>`).join("")}</${tag}></section>`;
}
function cells(entries) {
  const visible = entries.filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );
  return visible.length
    ? `<dl class="science-facts">${visible.map(([label, value]) => `<div><dt>${h(label)}</dt><dd>${text(value)}</dd></div>`).join("")}</dl>`
    : "";
}
const badges = (values) =>
  `<div class="science-badges">${values
    .filter(Boolean)
    .map((value) => `<span>${h(value)}</span>`)
    .join("")}</div>`;
function counts(items, field, title) {
  const order = items.some((card) => card.data[field] === "NR")
    ? [...tierOrder, "NR"]
    : tierOrder;
  return `<div><h3>${h(title)}</h3><div class="science-counts">${order.map((tier) => `<span><b>${tier}</b> ${items.filter((card) => card.data[field] === tier).length}</span>`).join("")}</div></div>`;
}
function scoreboard(items, field, title, lang = "pt") {
  return `<section class="science-scoreboard" aria-label="${lang === "pt" ? "Resumo dos tiers" : "Tier summary"}">${counts(items, field, title)}${counts(items, "interest_tier", lang === "pt" ? "Interesse / fertilidade" : "Interest / fertility")}</section>`;
}
function controls(id, lang) {
  const pt = lang === "pt";
  return `<div class="science-controls" hidden><label for="${id}-search">${pt ? "Buscar nas fichas" : "Search cards"}<input type="search" id="${id}-search" data-card-search></label><label for="${id}-tier">${pt ? "Tier principal" : "Primary tier"}<select id="${id}-tier" data-tier-filter><option value="">${pt ? "Todos" : "All"}</option>${[...tierOrder, "NR"].map((tier) => `<option>${tier}</option>`).join("")}</select></label><label for="${id}-interest">${pt ? "Interesse" : "Interest"}<select id="${id}-interest" data-interest-filter><option value="">${pt ? "Todos" : "All"}</option>${tierOrder.map((tier) => `<option>${tier}</option>`).join("")}</select></label><button type="button" data-expand-cards>${pt ? "Abrir fichas" : "Expand cards"}</button><button type="button" data-reset-cards>${pt ? "Limpar filtros" : "Reset filters"}</button><p role="status" aria-live="polite" data-card-count></p></div>`;
}
function board(id, title, items, field, render, lang = "pt", description = "") {
  const pt = lang === "pt";
  const order = items.some((card) => card.data[field] === "NR")
    ? [...tierOrder, "NR"]
    : tierOrder;
  return `<section id="${h(id)}" class="science-board" data-science-board data-lang="${lang}"><h2>${h(title)}</h2>${description ? `<p>${h(description)}</p>` : ""}${scoreboard(items, field, pt ? "Tier principal" : "Primary tier", lang)}${controls(id, lang)}<div class="science-tiers">${order
    .map((tier) => {
      const entries = items.filter((card) => card.data[field] === tier);
      return `<section class="science-tier-row tier-${tier.toLowerCase()}" data-tier-row="${tier}" aria-label="Tier ${tier}"><h3 class="science-tier-letter">${tier}</h3><div class="science-grid">${entries.length ? entries.map((card) => render(card)).join("") : `<p class="science-empty">${pt ? "Vazio — nenhum registro classificado neste tier" : "Empty — no record classified in this tier"}</p>`}</div></section>`;
    })
    .join("")}</div></section>`;
}
function sourceLinks(data, lang = "pt") {
  const urls = unique(
    [data.source_url, ...(data.source_urls ?? [])].filter(Boolean)
  );
  return urls.length
    ? `<nav class="science-sources" aria-label="${lang === "pt" ? "Fontes" : "Sources"}">${urls.map((url, index) => link(url, index === 0 ? (data.source_label ?? (lang === "pt" ? "Fonte principal" : "Primary source")) : `${lang === "pt" ? "Fonte" : "Source"} ${index + 1}`)).join(" · ")}</nav>`
    : "";
}
function valueHtml(value) {
  if (Array.isArray(value))
    return `<ul>${value.map((item) => `<li>${valueHtml(item)}</li>`).join("")}</ul>`;
  if (value && typeof value === "object" && !(value instanceof Date))
    return `<dl>${Object.entries(value)
      .map(
        ([key, item]) =>
          `<dt>${h(key.replaceAll("_", " "))}</dt><dd>${valueHtml(item)}</dd>`
      )
      .join("")}</dl>`;
  return /^https?:\/\//.test(String(value))
    ? link(value, String(value))
    : text(value);
}
function remainingFields(card, consumed, lang = "pt") {
  const remaining = Object.entries(card.data).filter(
    ([key]) => !consumed.includes(key)
  );
  return remaining.length
    ? `<details class="science-record"><summary>${lang === "pt" ? "Campos adicionais do registro" : "Additional record fields"}</summary><dl>${remaining.map(([key, value]) => `<dt>${h(key.replaceAll("_", " "))}</dt><dd>${valueHtml(value)}</dd>`).join("")}</dl></details>`
    : "";
}
function provenance(card, consumed, lang = "pt") {
  return `${remainingFields(card, consumed, lang)}${card.content.trim() ? `<details class="science-record"><summary>${lang === "pt" ? "Notas canônicas completas" : "Full canonical notes"}</summary>${markdown.parse(card.content)}</details>` : ""}<p class="science-provenance">${link(repo + card.source, lang === "pt" ? "Registro OKF canônico ↗" : "Canonical OKF record ↗")}</p>`;
}
function article(
  card,
  field,
  title,
  body,
  {
    id = card.slug,
    href = "",
    lang = "pt",
    label = "qualidade",
    meta = "",
    evidence = "",
    details = "",
    consumed = [],
  } = {}
) {
  const d = card.data;
  return `<article class="science-card" id="${h(id)}" data-science-card data-tier="${h(d[field] ?? "NR")}" data-interest="${h(d.interest_tier ?? "")}">${badges([`${label} ${d[field] ?? "NR"}`, `${lang === "pt" ? "interesse" : "interest"} ${d.interest_tier}`, `conf. ${d.confidence}`])}<h3>${href ? link(href, title) : h(title)}</h3>${meta}<p>${h(body)}</p>${evidence}<details class="science-evidence"><summary>${lang === "pt" ? "Ver evidência e limites" : "View evidence and limits"}</summary>${details}${d.note ? `<p class="science-note">${h(d.note)}</p>` : ""}</details>${cells(
    [
      [lang === "pt" ? "Revisão" : "Reviewed", d.reviewed_at ?? d.updated],
      [
        lang === "pt" ? "Revisão de origem" : "Source revision",
        d.reviewed_revision,
      ],
    ]
  )}${provenance(card, ["type", field, "interest_tier", "confidence", "name", "title", "summary", "note", "reviewed_at", "reviewed_revision", "updated", ...consumed], lang)}</article>`;
}

function papersPage() {
  const bySlug = new Map(papers.map((card) => [card.slug, card]));
  const relations = papers.flatMap((card) =>
    (card.data.relations ?? []).map((relation) => {
      if (!bySlug.has(relation.target))
        throw new Error(
          `Paper ${card.slug}: unknown relation ${relation.target}`
        );
      return `<article class="science-card"><p class="eyebrow">${h(relation.type.replaceAll("_", " "))}</p><h3>${link(`#${card.slug}`, card.data.title)} → ${link(`#${relation.target}`, bySlug.get(relation.target).data.title)}</h3>${relation.note ? `<p>${h(relation.note)}</p>` : ""}</article>`;
    })
  );
  const families = unique(papers.map((card) => card.data.family)).toSorted(
    (a, b) => a.localeCompare(b, "pt-BR")
  );
  page(
    "/papers/",
    "Papers",
    "Mapa público curado dos papers: ideias, maturidade científica, interesse e conexões entre linhas de pesquisa.",
    hero(
      "Papers",
      `Mapa vivo · ${papers.length} papers`,
      `<p>Um mapa <strong>curado e não exaustivo</strong> das ideias de ${link("https://github.com/franklinbaldo/papers", "franklinbaldo/papers")} cuja publicação no blog foi explicitamente autorizada. Qual é a ideia? Quão madura ela está? Como conversa com as outras?</p><p>Publicação aqui é <strong>opt-in</strong>: a ausência de um paper não indica inexistência, abandono ou avaliação negativa. Tier científico mede maturidade, formalização e contato com evidência dentro do domínio. Interesse mede fertilidade para experimentos, conexões e perguntas. Os tiers são uma fotografia comparativa, não um selo de verdade. Quase tudo é trabalho próprio, em grande parte não revisado por pares.</p>`
    ) +
      scoreboard(papers, "scientific_tier", "Maturidade científica") +
      (relations.length
        ? `<section id="map-heading"><h2>Como os papers conversam</h2><p>Cada conexão vem do card OKF do paper de origem.</p><div class="science-grid">${relations.join("")}</div></section>`
        : "") +
      `<section class="science-board" data-science-board data-lang="pt">${controls("papers", "pt")}${families
        .map(
          (family) =>
            `<section class="science-family" data-card-group><h2>${h(family)}</h2><div class="science-grid">${papers
              .filter((card) => card.data.family === family)
              .map((card) =>
                article(
                  card,
                  "scientific_tier",
                  card.data.title,
                  card.data.idea,
                  {
                    label: "ciência",
                    href: card.data.source_url ?? `${paperRepo}${card.slug}.md`,
                    meta: cells([
                      ["Tipo", card.data.kind],
                      ["Linha de pesquisa", card.data.family],
                    ]),
                    evidence: cells([
                      ["Agora", card.data.status],
                      ["O que segura", card.data.limit],
                    ]),
                    details: `${link(card.data.source_url ?? `${paperRepo}${card.slug}.md`, "Abrir paper ↗")}${card.data.related_file ? ` · ${link(`${paperRepo}${card.data.related_file}`, "Material relacionado ↗")}` : ""}${(card.data.relations ?? []).length ? `<h4>Relações</h4><ul>${card.data.relations.map((relation) => `<li>${h(relation.type)}: ${link(`#${relation.target}`, bySlug.get(relation.target).data.title)}${relation.note ? ` — ${h(relation.note)}` : ""}</li>`).join("")}</ul>` : ""}`,
                    consumed: [
                      "idea",
                      "kind",
                      "family",
                      "status",
                      "limit",
                      "source_url",
                      "related_file",
                      "relations",
                    ],
                  }
                )
              )
              .join("")}</div></section>`
        )
        .join("")}</section>` +
      `<section class="science-method"><h2>Não é uma olimpíada de letras</h2><p>Ciência D / interesse S pode significar uma ideia precoce e fértil. Ciência B / interesse B pode indicar maior maturidade e menos novas linhas. Promoções e rebaixamentos exigem mudanças materiais: resultados, formalização, críticas, reproduções e contradições.</p><p>Critério inspirado na ${link("https://github.com/franklinbaldo/skills/blob/main/toe-arena-tiering/SKILL.md", "metodologia pública de tiering")}, adaptado ao domínio: nem todo paper é uma Theory of Everything.</p></section>`
  );
}

function maleCnsPage(lang) {
  const pt = lang === "pt";
  const title = pt
    ? "MaleCNS — projetos, demos e experimentos"
    : "MaleCNS — projects, demos and experiments";
  const render = (card) => {
    const d = card.data;
    return article(card, "scientific_tier", d.name, d.summary, {
      id: `malecns-project-${card.slug}`,
      href: d.primary_url,
      lang,
      label: pt ? "científico" : "scientific",
      meta: cells([
        [pt ? "Tipo" : "Kind", d.kind],
        [pt ? "Estágio" : "Stage", d.stage],
        [pt ? "Origem" : "Origin", d.ownership],
        ["Project ID", d.project_id],
        [pt ? "Repositório" : "Repository", d.repository],
      ]),
      details:
        list(
          pt ? "Evidência mais forte" : "Strongest evidence",
          d.strongest_evidence
        ) +
        list(pt ? "Limitações" : "Limitations", d.limitations) +
        list(pt ? "Controles" : "Controls", d.controls) +
        list(pt ? "Histórico do tier" : "Tier history", d.history) +
        `<nav class="science-sources">${link(d.primary_url, pt ? "Projeto" : "Project")}${d.repository ? ` · ${link(`https://github.com/${d.repository}`, "GitHub")}` : ""}${d.evidence_url ? ` · ${link(d.evidence_url, pt ? "Evidência" : "Evidence")}` : ""}</nav>`,
      consumed: [
        "kind",
        "stage",
        "ownership",
        "project_id",
        "repository",
        "strongest_evidence",
        "limitations",
        "controls",
        "history",
        "primary_url",
        "evidence_url",
      ],
    });
  };
  const description = pt
    ? "Curadoria viva do ecossistema MaleCNS, com a mesma régua para projetos próprios e independentes. O eixo científico avalia a força da evidência pública sobre o que cada projeto demonstra. Um null reproduzível pode ficar acima de uma demo chamativa sem controles. Interesse mede originalidade, ambição e fertilidade."
    : "A living curation of the MaleCNS ecosystem, applying the same standard to own and independent projects. Scientific tier measures public evidence strength for what a project demonstrates. A reproducible null can rank above an exciting uncontrolled demo. Interest measures originality, ambition and research fertility.";
  page(
    `${pt ? "/pt" : ""}/malecns/`,
    title,
    description,
    hero(
      title,
      `${malecns.length} ${pt ? "projetos" : "projects"} · ${latest(malecns, "reviewed_at")}`,
      `<p>${h(description)}</p>`
    ) +
      board(
        "malecns-project-tiers",
        pt ? "Tier list de projetos MaleCNS" : "MaleCNS project tier list",
        malecns,
        "scientific_tier",
        render,
        lang
      ) +
      `<p class="science-note">${pt ? "Fonte canônica: cartões OKF em knowledge/malecns-projects/. Mudança de tier exige evidência material. Resultado negativo não é punição: um controle que derruba a hipótese melhora o registro." : "Canonical source: OKF cards in knowledge/malecns-projects/. Tier movement requires material evidence. Negative results are not penalized: a control that refutes the hypothesis improves the record."}</p>`,
    lang,
    { translations: pt ? { en: "/malecns/" } : { pt: "/pt/malecns/" } }
  );
}

function theoryCard(card) {
  const d = card.data;
  return article(card, "scientific_tier", d.name, d.summary, {
    label: "científico",
    href: d.source_url,
    meta: cells([
      ["Categoria", d.kind],
      ["Data da fonte", d.source_date],
    ]),
    details:
      list("O que sustenta", d.strengths) +
      list("O que segura", d.open_problems) +
      sourceLinks(d),
    consumed: [
      "kind",
      "strengths",
      "open_problems",
      "source_url",
      "source_label",
      "source_date",
    ],
  });
}
function toePage() {
  const contenders = theories.filter((card) => card.data.kind === "contender");
  const exhibitions = theories.filter((card) => card.data.kind !== "contender");
  page(
    "/pt/toe-arena/",
    "ToE Arena",
    "Uma arena viva para teorias de tudo: tiers com evidência, confrontos explícitos e histórico de promoção e rebaixamento.",
    hero(
      "ToE Arena",
      `Temporada 01 · atualizada ${latest(theories)}`,
      `<p>Teorias de tudo entram aqui para brigar, mas a brincadeira termina onde começa a evidência. Tier científico mede maturidade e contato com física estabelecida. Interesse mede quão fértil, estranha ou generativa é a ideia. <strong>S não significa verdade.</strong></p><p>Confrontos por critério · promoções só com mudança material · fontes em cada ficha</p>`
    ) +
      board(
        "ranking-heading",
        "A liga — ranking científico",
        contenders,
        "scientific_tier",
        theoryCard,
        "pt",
        "Primeira temporada propositalmente sem campeão S."
      ) +
      `<section id="clashes-heading"><h2>Onde elas realmente discordam</h2><p>Sem vencedor geral: cada confronto escolhe um gargalo concreto.</p><div class="science-grid">${clashes.map((clash, i) => `<article class="science-card"><p class="eyebrow">Round ${String(i + 1).padStart(2, "0")}</p><h3>${h(clash.title)}</h3><p><strong>${h(clash.battleground)}</strong></p><p>${h(clash.body)}</p></article>`).join("")}</div></section>` +
      `<section id="exhibition-heading"><h2>Exhibition / triagem — fora do ranking principal</h2><p>Ideias adjacentes e candidatas podem entrar na conversa sem fingir que cumprem o contrato de uma ToE auditável. A categoria e o tier canônico permanecem explícitos nas fichas.</p><div class="science-grid">${exhibitions.map(theoryCard).join("")}</div></section>` +
      `<section id="rules-heading" class="science-method"><h2>Como alguém sobe de tier?</h2><ol><li>Nova evidência empírica ou nova restrição observacional</li><li>Um problema central resolvido de forma verificável</li><li>Cálculo ou reprodução independente relevante</li><li>Uma contradição demonstrada também pode rebaixar</li></ol><p>Popularidade, branding e elegância não movem tier científico. Uma teoria nova pode ter interesse S e ciência C sem contradição.</p></section>`
  );
}

function worldCard(card) {
  const d = card.data;
  return article(card, "evidence_tier", d.name, d.summary, {
    label: "evidência",
    href: d.source_url,
    meta: `<p class="science-handle">@${h(d.public_handle)}</p>${badges(d.world_type ?? [])}`,
    details:
      list("Trajetória", d.trajectory, true) +
      list("O que sustenta o tier", d.strengths) +
      list("O que impede subir", d.open_problems) +
      list("Papel da IA", d.ai_role) +
      cells([["Enquadramento", d.literalness]]) +
      sourceLinks(d),
    consumed: [
      "public_handle",
      "world_type",
      "trajectory",
      "strengths",
      "open_problems",
      "ai_role",
      "literalness",
      "source_url",
      "source_urls",
      "source_label",
    ],
  });
}
function caseLinks(slugs) {
  const bySlug = new Map(worlds.map((card) => [card.slug, card.data.name]));
  return (slugs ?? [])
    .map((slug) => {
      // Some canonical research records refer to discovery-stage cases that
      // do not yet have a public world card. Preserve the identifier without
      // inventing a card or generating a broken fragment link.
      return bySlug.has(slug) ? link(`#${slug}`, bySlug.get(slug)) : h(slug);
    })
    .join(" · ");
}
function worldsPage() {
  const ranked = worlds.filter((card) => card.data.evidence_tier !== "NR");
  const nr = worlds.filter((card) => card.data.evidence_tier === "NR");
  page(
    "/pt/ai-epistemic-worlds/",
    "Mundos epistêmicos mediados por IA",
    "Observatório de mundos epistêmicos mediados por IA, com tiers separados de documentação e interesse.",
    hero(
      "Mundos epistêmicos mediados por IA",
      `Observatório · atualizado ${latest(worlds)}`,
      `<p>Pessoas usam IAs para construir sistemas de significado, identidade, ciência, espiritualidade e agência. O observatório acompanha artefatos públicos diretamente no GitHub. <strong>Tier de evidência mede a documentação do mundo, não a verdade das crenças e nunca um diagnóstico clínico.</strong></p><p>${worlds.length} casos · ${interventions.length} intervenções registradas · ${convergences.length} convergências em teste</p>`
    ) +
      board(
        "ranking-heading",
        "A liga — tier de evidência",
        ranked,
        "evidence_tier",
        worldCard,
        "pt",
        "S exige uma transição quase completa preservada no Git; volume de atividade não basta."
      ) +
      `<section id="interest-heading"><h2>Interesse é independente de evidência</h2>${counts(worlds, "interest_tier", "Interesse / fertilidade")}<p>Um caso pode ser evidência B / interesse S: documentação parcial e grande interesse conceitual. As letras respondem a perguntas diferentes.</p></section>` +
      `<section id="convergence-heading"><h2>Convergências — ideias que reaparecem</h2><p>Similaridade não prova a tese. Rastrear mecanismos recorrentes exige distinguir independência, contaminação e testes possíveis.</p><div class="science-grid">${convergences
        .map((card) => {
          const d = card.data;
          return `<article class="science-card" id="convergence-${h(card.slug)}">${badges([`evidência ${d.evidence_quality}`, `independência ${d.independence_status}`])}<h3>${h(d.name)}</h3><p>${h(d.summary)}</p><p><strong>Casos:</strong> ${caseLinks(d.case_slugs)}</p>${cells(
            [
              ["Hipótese", d.hypothesis_key],
              ["Casos independentes", d.independent_case_count],
              ["Atualizado", d.updated],
            ]
          )}${list("Dimensões de sobreposição", d.overlap_dimensions)}${list("Influências conhecidas", d.known_influences)}${list("Como testar", d.testable_predictions)}${list("Pontes possíveis", d.cross_pollination_candidates)}${list("Notas de contaminação", d.contamination_notes)}${sourceLinks(d)}${provenance(card, ["type", "name", "summary", "evidence_quality", "independence_status", "case_slugs", "hypothesis_key", "independent_case_count", "updated", "overlap_dimensions", "known_influences", "testable_predictions", "cross_pollination_candidates", "contamination_notes", "source_urls"])}</article>`;
        })
        .join("")}</div></section>` +
      `<section id="intervention-heading"><h2>Intervenções — observar sem floodar; desafiar com método</h2><p>Uma intervenção inicial por owner/repo. Sem avanço material, paramos; com avanço verificável, o gate pode abrir para colaboração continuada.</p><div class="science-grid">${interventions
        .map((card) => {
          const d = card.data;
          return `<article class="science-card" id="intervention-${h(card.slug)}">${badges([d.status, d.intervention_kind, d.followup_allowed ? "follow-up liberado" : "follow-up bloqueado"])}<h3>${h(d.target_repository)}</h3><p>${h(d.hypothesis)}</p><p><strong>Caso:</strong> ${caseLinks([d.case_slug])}</p>${d.related_case_slugs?.length ? `<p><strong>Ponte com:</strong> ${caseLinks(d.related_case_slugs)}</p>` : ""}${cells(
            [
              ["Gate", d.followup_gate],
              ["Disclosure", d.disclosure],
              ["Baseline", d.baseline_snapshot],
              ["Sinal de uptake", d.response_signal],
              ["Motivo do próximo contato", d.next_touch_reason],
              ["Resultado", d.result],
              ["Criado", d.created],
              ["Atualizado", d.updated],
              ["Último contato", d.last_touch_at],
            ]
          )}${list("Notas", d.notes)}<nav class="science-sources">${d.issue_or_pr_url ? link(d.issue_or_pr_url, "Ver intervenção pública") : ""}${d.target_url ? ` ${link(d.target_url, "Repositório-alvo")}` : ""}</nav>${provenance(card, ["type", "status", "intervention_kind", "followup_allowed", "target_repository", "hypothesis", "case_slug", "related_case_slugs", "followup_gate", "disclosure", "baseline_snapshot", "response_signal", "next_touch_reason", "result", "created", "updated", "last_touch_at", "notes", "issue_or_pr_url", "target_url"])}</article>`;
        })
        .join(
          ""
        )}</div><p class="science-note">O observatório transfere controles, métodos e artefatos, não crenças. Cada owner/repo recebe no máximo um toque inicial sem engajamento. Adoção posterior é possível influência causal do observatório e deixa de contar automaticamente como convergência independente. Estes registros documentam intervenções; a página não executa contatos.</p></section>` +
      (nr.length
        ? `<section id="nr-heading"><h2>NR / triagem — fora do ranking</h2><div class="science-grid">${nr.map(worldCard).join("")}</div></section>`
        : "") +
      `<section id="rules-heading" class="science-method"><h2>Contrato dos tiers</h2><dl><dt>S</dt><dd>Baseline/transição + artefatos + mediação + recursão: filme quase completo</dd><dt>A</dt><dd>Mundo claro e longitudinal, com múltiplas evidências diretas; falta uma peça grande</dd><dt>B</dt><dd>Caso claro, mas parcial, curto ou ainda ambíguo</dd><dt>C–F</dt><dd>De candidato plausível até falso positivo investigado</dd></dl><p>Volume de commits, linguagem incomum, espiritualidade, claims grandiosos ou uso intenso de IA são sinais de descoberta. O observatório registra artefatos públicos, mudanças verificáveis e explicações alternativas, sem inferir condição de saúde mental.</p></section>`
  );
}

function slopPage() {
  const render = (card) => {
    const d = card.data;
    return article(card, "quality_tier", d.name, d.summary, {
      href: d.source_url,
      meta: cells([
        ["Artefato", d.artifact_type],
        ["Criador", d.creator_handle],
        ["Observado em", d.observed_at],
      ]),
      details:
        list("O que funciona", d.quality_signals) +
        list("O que segura", d.limitations) +
        list("Evidência de mediação por IA", d.ai_mediation_evidence) +
        sourceLinks(d),
      consumed: [
        "artifact_type",
        "creator_handle",
        "observed_at",
        "quality_signals",
        "limitations",
        "ai_mediation_evidence",
        "source_url",
        "source_label",
        "source_urls",
      ],
    });
  };
  page(
    "/pt/awesome-ai-slop/",
    "Awesome AI Slop",
    "Curadoria de artefatos culturais públicos mediados por IA, com qualidade e interesse separados.",
    hero(
      "Awesome AI Slop",
      `${slop.length} artefatos · atualizado ${latest(slop)}`,
      `<p>Uma curadoria de cultura feita com IA. “Slop” aqui é afetuoso e descritivo, não uma condenação: é o apelido para o meio de produção. O ranking pergunta se a obra é boa, memorável, inventiva e culturalmente interessante.</p><p><strong>S = melhor slop</strong> · IA é critério de entrada e precisa de evidência direta · interesse é um tier separado</p>`
    ) +
      board(
        "board-heading",
        "A liga — qualidade cultural",
        slop,
        "quality_tier",
        render,
        "pt",
        "Quanto mais alto, melhor o artefato. A quantidade de IA não dá bônus por si só."
      ) +
      `<section id="rules-heading" class="science-method"><h2>O que entra?</h2><ol><li>Artefato cultural público e avaliável por si mesmo</li><li>Evidência direta de participação material de IA</li><li>Qualidade julgada pelo resultado, não pela quantidade de automação</li><li>Curadoria humana, edição e pós-produção contam a favor quando melhoram a obra</li></ol><p>Pode ser música, imagem, filme, meme, jogo, site, livro ou vídeo. Qualidade cultural é o eixo principal; interesse mede estranheza, novidade, importância e capacidade de gerar conversa.</p></section>`
  );
}

const ratings = computeRatings();
const rankByKey = new Map(
  ratings.map((row, index) => [row.key, { ...row, rank: index + 1 }])
);
const absolute = computeAbsoluteQuality();
const deconfounded = computeDeconfoundedQuality().quality;
const perspectives = computePerPerspectiveRatings();
const number = (value) =>
  value == null
    ? "—"
    : Number(value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
function postEvidence(key) {
  const row = rankByKey.get(key);
  const abs = absolute.get(key);
  const deconf = deconfounded.get(key);
  const positions = [...perspectives.values()].map((rows) =>
    rows.findIndex((item) => item.key === key)
  );
  return {
    rank: row?.rank ?? null,
    ordinal: row?.ordinal ?? null,
    mu: row?.mu ?? null,
    sigma: row?.sigma ?? null,
    wins: row?.wins ?? 0,
    appearances: row?.appearances ?? 0,
    absoluteStars: abs?.stars ?? null,
    absoluteN: abs?.n ?? 0,
    deconfoundedQuality: deconf?.quality ?? null,
    deconfoundedN: deconf?.n ?? 0,
    perspectiveCount: positions.filter((position) => position >= 0).length,
    perspectiveTop10Count: positions.filter(
      (position) => position >= 0 && position < 10
    ).length,
  };
}
for (const card of postTiers)
  card.evidence = postEvidence(card.data.translation_key);
postTiers.sort(
  (a, b) =>
    (a.evidence.rank ?? Infinity) - (b.evidence.rank ?? Infinity) ||
    a.data.translation_key.localeCompare(b.data.translation_key)
);
function postTiersPage() {
  const render = (card) => {
    const d = card.data,
      ev = card.evidence;
    const post = postsByKey.get(d.translation_key);
    return article(
      card,
      "quality_tier",
      post?.data.title ?? d.translation_key,
      d.summary,
      {
        id: `post-tier-${d.translation_key}`,
        href: post?.path,
        evidence: cells([
          ["Ranking", ev.rank ? `#${ev.rank}` : "—"],
          ["Ordinal", number(ev.ordinal)],
          ["Estrelas", number(ev.absoluteStars)],
          ["De-conf.", number(ev.deconfoundedQuality)],
          ["V/N", `${ev.wins}/${ev.appearances}`],
        ]),
        details:
          list("O que sustenta", d.strengths) +
          list("O que segura", d.open_problems) +
          list("Histórico do tier", d.history) +
          cells([
            ["μ", number(ev.mu)],
            ["σ", number(ev.sigma)],
            ["Amostra de estrelas", ev.absoluteN],
            ["Amostra de-conf.", ev.deconfoundedN],
            ["Perspectivas", ev.perspectiveCount],
            ["Top 10 por perspectiva", ev.perspectiveTop10Count],
            ["Translation key", d.translation_key],
          ]) +
          `<p>${link(`/ranking/posts/${encodeURIComponent(d.translation_key)}/`, "Dossiê Hrönir ↗")}</p>`,
        consumed: ["translation_key", "strengths", "open_problems", "history"],
      }
    );
  };
  page(
    "/pt/blog-tiers/",
    "Tiers dos posts",
    "Avaliação editorial dos posts do blog, ancorada no Hrönir e mantida em registros OKF por obra conceitual.",
    hero(
      "Tiers dos posts",
      `Atualizado ${latest(postTiers, "reviewed_at")}`,
      `<p>A letra é uma decisão editorial canônica em OKF. OpenSkill, estrelas, qualidade de-confundida e perspectivas são evidência, não conversores automáticos de percentil. Música tem um domínio próprio e não entra nos tiers de posts.</p><p>O mesmo board canônico aparece em ${link("/pt/ranking/#post-tiers", "Ranking → Tiers de posts")}.</p>`
    ) + board("post-tiers", "Tiers de posts", postTiers, "quality_tier", render)
  );
}

async function projectCatalog() {
  const snapshotFile = "src/generated/repo-factory.json";
  let error = "";
  if (process.env.ZOLA_PROJECTS_SOURCE !== "snapshot") {
    try {
      // This is a public read. Never transmit build credentials to render it.
      const response = await fetch(
        "https://api.github.com/users/franklinbaldo/repos?per_page=100&sort=updated",
        {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data))
        throw new Error("GitHub returned a non-list response");
      return {
        mode: "live",
        fetched_at: new Date().toISOString(),
        repositories: data.filter(
          (item) => !item.fork && !item.archived && !item.private
        ),
      };
    } catch (cause) {
      error = cause.message;
    }
  }
  if (existsSync(snapshotFile)) {
    const snapshot = JSON.parse(readFileSync(snapshotFile, "utf8"));
    if (snapshot.privacy !== "public repositories only")
      throw new Error("Project snapshot is not explicitly public");
    return {
      mode: "snapshot",
      fetched_at: snapshot.generatedAt,
      source: snapshotFile,
      error,
      repositories: snapshot.repositories.map((item) => ({
        name: item.name,
        full_name: item.fullName,
        description: item.description,
        html_url: item.url,
        homepage: item.homepage,
        language: item.language,
        stargazers_count: item.stars,
        forks_count: item.forks,
        pushed_at: item.pushedAt,
        topics: item.topics ?? [],
      })),
    };
  }
  return { mode: "unavailable", fetched_at: null, error, repositories: [] };
}
function projectsPage(lang, catalog) {
  const pt = lang === "pt",
    title = pt ? "Tiers de projetos" : "Project tiers";
  const repos = catalog.repositories.toSorted(
    (a, b) =>
      b.stargazers_count - a.stargazers_count ||
      new Date(b.pushed_at) - new Date(a.pushed_at)
  );
  const formatDate = (value) =>
    Number.isFinite(new Date(value).valueOf())
      ? new Intl.DateTimeFormat(pt ? "pt-BR" : "en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          timeZone: "UTC",
        }).format(new Date(value))
      : "—";
  const freshness =
    catalog.mode === "live"
      ? pt
        ? `Catálogo público consultado no build em ${catalog.fetched_at}. Ordenado por estrelas e atualização.`
        : `Public catalog fetched at build on ${catalog.fetched_at}. Sorted by stars and update time.`
      : catalog.mode === "snapshot"
        ? pt
          ? `Catálogo em snapshot de ${catalog.fetched_at}; pode não refletir o estado atual. As métricas abaixo pertencem a essa coleta, não a uma consulta ao vivo.`
          : `Catalog snapshot from ${catalog.fetched_at}; it may not reflect the current state. Metrics below belong to that collection, not a live fetch.`
        : pt
          ? "Não foi possível carregar o catálogo público."
          : "The public catalog could not be loaded.";
  const render = (card) => {
    const d = card.data,
      live = repos.find((item) => item.full_name === d.repository);
    return article(card, "quality_tier", d.name, d.summary, {
      id: `project-tier-${card.slug}`,
      href: live?.html_url ?? `https://github.com/${d.repository}`,
      lang,
      label: pt ? "qualidade" : "quality",
      evidence: live
        ? cells([
            [pt ? "Estrelas" : "Stars", live.stargazers_count],
            ["Forks", live.forks_count],
            [pt ? "Linguagem" : "Language", live.language ?? "—"],
            [pt ? "Atualizado" : "Updated", formatDate(live.pushed_at)],
          ])
        : "",
      details:
        list(pt ? "O que sustenta" : "What supports it", d.strengths) +
        list(pt ? "O que segura" : "What holds it back", d.open_problems) +
        list(pt ? "Histórico do tier" : "Tier history", d.history) +
        cells([[pt ? "Repositório" : "Repository", d.repository]]),
      consumed: ["repository", "strengths", "open_problems", "history"],
    });
  };
  const description = pt
    ? "Qualidade mede execução do projeto; interesse mede originalidade, alavancagem e fertilidade. Estrelas e atividade são evidência, não a definição da letra."
    : "Quality measures project execution; interest measures originality, leverage and fertility. Stars and activity are evidence, not the letter definition.";
  page(
    `${pt ? "/pt" : ""}/projects/`,
    title,
    description,
    hero(
      title,
      "franklinbaldo · GitHub",
      `<p>${h(description)}</p><p class="science-note" data-project-freshness>${h(freshness)}</p>`
    ) +
      board("project-tiers", title, projects, "quality_tier", render, lang) +
      `<section id="project-catalog"><h2>${pt ? "Catálogo de projetos" : "Project catalog"}</h2><p>${link("https://github.com/franklinbaldo?tab=repositories", pt ? "Consultar o GitHub atual ↗" : "View current GitHub repositories ↗")}${catalog.mode === "snapshot" ? ` · ${link(repo + catalog.source, pt ? "Fonte do snapshot" : "Snapshot source")}` : ""}</p>${catalog.error ? `<p class="science-muted">${pt ? "Consulta ao vivo indisponível" : "Live fetch unavailable"}: ${h(catalog.error)}</p>` : ""}<div class="science-grid">${repos
        .map(
          (item) =>
            `<article class="science-card" data-project-repository="${h(item.full_name)}"><h3>${link(item.html_url, item.name)}${item.stargazers_count ? ` <span>★ ${item.stargazers_count}</span>` : ""}</h3>${item.description ? `<p lang="${repoDescriptionLang(item.name)}">${h(item.description)}</p>` : ""}${cells(
              [
                [pt ? "Linguagem" : "Language", item.language],
                ["Forks", item.forks_count],
                [pt ? "Atualizado" : "Updated", formatDate(item.pushed_at)],
              ]
            )}${item.homepage ? `<p>${link(item.homepage, "↗ site")}</p>` : ""}</article>`
        )
        .join("")}</div></section>`,
    lang,
    {
      translations: pt ? { en: "/projects/" } : { pt: "/pt/projects/" },
      og_image: pt ? "/og/projects-pt.png" : "/og/projects.png",
    }
  );
}

papersPage();
maleCnsPage("en");
maleCnsPage("pt");
toePage();
worldsPage();
slopPage();
postTiersPage();
const catalog = await projectCatalog();
projectsPage("en", catalog);
projectsPage("pt", catalog);
const collections = {
  papers,
  malecns,
  theories,
  worlds,
  convergences,
  interventions,
  slop,
  postTiers,
  projects,
};
// Preserve complete public records and computed evidence as a verifiable native
// payload as well as readable cards. Legacy music tier cards are not exported.
write(
  "static/data/science-pages.json",
  json({ collections, clashes, projectCatalog: catalog })
);
manifest.science = {
  routes,
  counts: Object.fromEntries(
    Object.entries(collections).map(([name, items]) => [name, items.length])
  ),
  opening_clashes: clashes.length,
  project_catalog: {
    mode: catalog.mode,
    fetched_at: catalog.fetched_at,
    count: catalog.repositories.length,
  },
};
writeFileSync(manifestPath, json(manifest));
console.log(
  `Zola science: ${routes.length} native routes; ${Object.entries(
    manifest.science.counts
  )
    .map(([name, count]) => `${count} ${name}`)
    .join(
      ", "
    )}; project catalog ${catalog.mode} (${catalog.fetched_at ?? "unavailable"})`
);
