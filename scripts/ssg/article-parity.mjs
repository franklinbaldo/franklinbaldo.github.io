// Semantic blog parity — compare a canonical post's actual body and metadata,
// not just the existence of a same-named output file from two generators.
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";

function nodes(node, predicate, output = []) {
  if (predicate(node)) output.push(node);
  for (const child of node.childNodes ?? []) nodes(child, predicate, output);
  return output;
}
function attr(node, name) {
  return node.attrs?.find((x) => x.name === name)?.value;
}
function isClass(node, cls) {
  return (attr(node, "class") ?? "").split(/\s+/).includes(cls);
}
const IGNORED = new Set(["script", "style", "svg", "noscript", "template", "annotation"]);
function visible(node) {
  if (IGNORED.has(node.nodeName) || attr(node, "aria-hidden") === "true") return "";
  if (node.nodeName === "#text") return node.value ?? "";
  return (node.childNodes ?? []).map(visible).join(" ");
}
function normalized(text) {
  return text.normalize("NFKC").replace(/\s+/gu, " ").trim();
}
function words(text) {
  return normalized(text).toLocaleLowerCase("en")
    .match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?/gu) ?? [];
}
function similarity(a, b) {
  if (!a.length && !b.length) return 1;
  const freq = new Map();
  for (const token of a) freq.set(token, (freq.get(token) ?? 0) + 1);
  let matched = 0;
  for (const token of b) {
    const count = freq.get(token) ?? 0;
    if (count > 0) {
      matched++;
      freq.set(token, count - 1);
    }
  }
  return 2 * matched / (a.length + b.length);
}
export function readArticleHtml(html, generator) {
  const doc = parse(html);
  const lang = attr(nodes(doc, (n) => n.nodeName === "html")[0], "lang") ?? "";
  const article = nodes(doc, (n) => n.nodeName === "article" && isClass(n, "reading-page"))[0];
  if (!article) throw new Error("Missing rendered reading-page article");
  const h1 = nodes(article, (n) => n.nodeName === "h1")[0];
  if (!h1) throw new Error("Missing article H1");
  const title = normalized(visible(h1));
  const body = generator === "zola"
    ? nodes(article, (n) => (n.attrs ?? []).some((a) => a.name === "data-zola-content"))[0]
    : generator === "ssg"
      ? nodes(article, (n) => isClass(n, "prose"))[0]
      : null;
  if (!body) throw new Error("Missing " + generator + " article body wrapper");
  const text = normalized(visible(body));
  if (!title || !text) throw new Error("Empty rendered article title/body");
  return { title, language: lang.toLowerCase().split("-")[0], words: words(text) };
}

export function compareArticle(reference, candidate, expectedLanguage) {
  const z = readArticleHtml(reference, "zola");
  const s = readArticleHtml(candidate, "ssg");
  const matchLanguage = z.language === expectedLanguage && s.language === expectedLanguage;
  const matchTitle = z.title === s.title;
  const dice = similarity(z.words, s.words);
  const ratio = z.words.length ? s.words.length / z.words.length : 0;
  return {
    title_match: matchTitle,
    language_match: matchLanguage,
    baseline_language: z.language,
    candidate_language: s.language,
    baseline_words: z.words.length,
    candidate_words: s.words.length,
    word_count_ratio: Math.round(ratio * 10000) / 10000,
    token_overlap: Math.round(dice * 10000) / 10000,
    baseline_title: z.title,
    candidate_title: s.title,
  };
}

export function compareCorpus(manifest, baseline, candidate) {
  if (!manifest || !Array.isArray(manifest.entries) || manifest.entries.length < 1)
    throw new Error("Missing canonical projected article manifest");
  const seen = new Set();
  const posts = [];
  for (const entry of manifest.entries) {
    const route = entry.route;
    if (typeof route !== "string" ||
        !/^\/(?:pt\/)?blog\/[A-Za-z0-9][A-Za-z0-9._%-]*\/$/.test(route) ||
        route.includes("..") || seen.has(route)) throw new Error("Duplicate/unsafe canonical route");
    seen.add(route);
    const path = join(route.slice(1), "index.html");
    const b = join(baseline, path);
    const c = join(candidate, path);
    if (!existsSync(b) || !existsSync(c)) {
      posts.push({ route, status: "missing_html", baseline_exists: existsSync(b), candidate_exists: existsSync(c) });
      continue;
    }
    try {
      const summary = compareArticle(
        readFileSync(b, "utf8"),
        readFileSync(c, "utf8"),
        entry.lang ?? "en"
      );
      posts.push({ route, status: "rendered", ...summary });
    } catch (error) {
      posts.push({ route, status: "invalid_html", reason: error.message });
    }
  }

  const valid = posts.filter((p) => p.status === "rendered");
  const semanticMatches = valid.filter((p) => p.title_match && p.language_match);
  const rankedDifferences = valid.toSorted((a, b) =>
    a.token_overlap - b.token_overlap || a.route.localeCompare(b.route));
  const scored = valid.filter((p) => Number.isFinite(p.token_overlap));
  const report = {
    schema: "ssg-article-semantic-parity-v1",
    source_posts: manifest.entries.length,
    valid_articles_in_both_generators: valid.length,
    missing_html: posts.filter((p) => p.status === "missing_html").map((p) => p.route),
    invalid_html: posts.filter((p) => p.status === "invalid_html"),
    matching_title_and_language: semanticMatches.length,
    title_mismatches: valid.filter((p) => !p.title_match).map((p) => p.route),
    language_mismatches: valid.filter((p) => !p.language_match).map((p) => p.route),
    average_token_overlap: scored.length
      ? Math.round(10000 * scored.reduce((sum, p) => sum + p.token_overlap, 0) / scored.length) / 10000
      : null,
    weakest_content_matches: rankedDifferences.slice(0, 20),
    all_posts: posts,
    note: "Token bag overlap is diagnostic, not exact or behavioral parity. It can miss reordered content, missing interactions and visual differences.",
    public_cutover_allowed: false,
  };
  return report;
}
function main() {
  const baseline = resolve(process.argv[2] ?? "dist-zola");
  const candidate = resolve(process.argv[3] ?? "dist-ssg");
  const manifest = JSON.parse(readFileSync(".cache/ssg-native/manifest.json", "utf8"));
  const report = compareCorpus(manifest, baseline, candidate);
  const out = resolve(".cache/ssg-native/article-parity.json");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  const summary = {
    source_posts: report.source_posts,
    valid_articles_in_both_generators: report.valid_articles_in_both_generators,
    missing_html: report.missing_html.length,
    invalid_html: report.invalid_html.length,
    matching_title_and_language: report.matching_title_and_language,
    title_mismatches: report.title_mismatches.length,
    language_mismatches: report.language_mismatches.length,
    average_token_overlap: report.average_token_overlap,
    weakest_content_matches: report.weakest_content_matches.slice(0, 5).map((p) => ({
      route: p.route,
      overlap: p.token_overlap,
      words_zola: p.baseline_words,
      words_ssg: p.candidate_words,
    })),
  };
  console.log(JSON.stringify(summary, null, 2));
  if (report.missing_html.length || report.invalid_html.length ||
      report.title_mismatches.length || report.language_mismatches.length)
    process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error); process.exitCode = 1; }
}
