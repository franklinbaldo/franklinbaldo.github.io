// Scans src/content/blog/*.{md,mdx} frontmatter and emits
// src/generated/blog-translation-pairs.json — a bidirectional map
// { "/blog/slug/": { en: "/blog/en-slug/", pt: "/blog/pt-slug/" } }
// Used by astro.config.mjs to inject hreflang links into the sitemap.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_LANG, LANG_META } from "../src/lib/languages.mjs";
import { loadPosts } from "./lib/blog-links.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, "../src/generated");
const outFile = join(outDir, "blog-translation-pairs.json");

const eligible = loadPosts().filter((p) => p.published && p.translationKey);

// Group by translationKey → { [lang]: url }
const grouped = {};
for (const p of eligible) {
  if (!grouped[p.translationKey]) grouped[p.translationKey] = {};
  grouped[p.translationKey][p.lang] =
    p.lang === "pt" ? `/pt/blog/${p.id}/` : `/blog/${p.id}/`;
}

// Build bidirectional lookup: each URL maps to the full { [lang]: url } pair.
// Emit only groups where at least two languages are present.
const pairs = {};
for (const langUrls of Object.values(grouped)) {
  const langs = Object.keys(langUrls);
  if (langs.length < 2) continue;
  for (const lang of langs) {
    pairs[langUrls[lang]] = langUrls;
  }
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(pairs, null, 2) + "\n");

const count = new Set(Object.values(pairs)).size;
console.log(
  `✔ blog-translation-pairs.json: ${count} pairs across ${Object.keys(LANG_META).join(", ")}`
);
