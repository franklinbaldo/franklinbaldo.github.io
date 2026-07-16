// One-off migration: give EN posts a real English `slug` override instead of
// the untranslated PT slug + "-en" suffix. Does NOT rename files or touch
// `title` — only adds/sets the `slug:` frontmatter field added in
// src/content.config.ts. Idempotent: re-running just re-applies the same map.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const DIR = "src/content/blog";

// enId -> new slug. Only entries with high-confidence translations are
// included. Deliberately skipped (left as-is): untitled posts, numerals,
// proper names shared across languages, and invented/untranslatable words —
// those need a human call, not a mechanical one.
const SLUG_MAP = {
  // Already has a real translated title — mechanical slugify.
  "151474c5-1420-4cc1-9ab5-80721f4459ed-en": "the-amanuensis",
  "a-primeira-mudanca-en": "the-first-change",
  "bibliotecario-do-infinito-en": "librarian-of-the-infinite",
  "f85fb538-6f59-4751-8629-da76665fc91e-en": "the-flute",
  "leite-no-salao-bar-en": "milk-at-the-bar",
  "o-magico-e-o-fogo-en": "the-magician-and-the-fire",
  "o-preco-da-saudade-en": "the-price-of-saudade",
  "o-prologo-en": "the-prologue",
  "sentido-e-referencia-en": "sense-and-reference",
  "sobre-o-rigor-na-ciencia-en": "on-rigor-in-science",
  "stopping-by-woods-on-a-snowy-evening-by-robert-frost-en":
    "stopping-by-woods-on-a-snowy-evening-by-robert-frost",
  "uma-so-cancao-en": "a-single-song",
  "veu-do-infinito-en": "veil-of-infinity",
  "vos-en": "you-plural",
  // Title says "O  Tempo" (double-space typo) vs EN "O Tempo" — genuinely
  // untranslated despite differing whitespace. "the-time" is taken by
  // another post, so "time" instead.
  "o-tempo-en": "time",

  // Title is already fully English (song titles kept in English on both
  // sides) — slug is just the id with "-en" dropped.
  "belief-engine-labyrinth-song-moving-window-viii-en":
    "belief-engine-labyrinth-song-moving-window-viii",
  "borges-and-the-hyperobject-at-the-end-of-time-en":
    "borges-and-the-hyperobject-at-the-end-of-time",
  "crystallizing-from-the-nothing-en": "crystallizing-from-the-nothing",
  "escherian-sunrise-with-godel-en": "escherian-sunrise-with-godel",
  "fourteen-words-en": "fourteen-words",
  "john-gospel-chapter-i-by-max-headroom-en":
    "john-gospel-chapter-i-by-max-headroom",
  "mindfulness-en": "mindfulness",
  "observer-error-moving-window-iv-en": "observer-error-moving-window-iv",
  "paperclip-rhapsody-en": "paperclip-rhapsody",
  "particles-en": "particles",
  "pattern-over-stuff-en": "pattern-over-stuff",
  "prayer-to-the-unfinished-moving-window-v-en":
    "prayer-to-the-unfinished-moving-window-v",
  "reality-maintenance-moving-window-xii-en":
    "reality-maintenance-moving-window-xii",
  "spring-loading-en": "spring-loading",
  "the-ruliad-is-laughing-en": "the-ruliad-is-laughing",
  "the-third-song-moving-window-iii-en": "the-third-song-moving-window-iii",
  "the-time-en": "the-time",
  "two-cursors-en": "two-cursors",
  "universal-threshold-en": "universal-threshold",

  // Title is untranslated Portuguese — direct (not literary) translation,
  // good enough for a URL slug even though the visible `title` field is
  // left untouched (a separate, bigger editorial decision).
  "caminho-en": "path",
  "chegue-irmao-chegue-irma-en": "come-brother-come-sister",
  "clipes-en": "clips",
  "entre-rascunho-e-apagar-en": "between-draft-and-erase",
  "espelhos-en": "mirrors",
  "eu-ia-escrever-sobre-o-infinito-de-novo-en":
    "i-was-going-to-write-about-infinity-again",
  "meditacao-guiada-no-sertao-en": "guided-meditation-in-the-sertao",
  "menino-que-voce-foi-en": "the-boy-you-were",
  "o-aleph-en": "the-aleph",
  "o-medo-do-louco-en": "the-madmans-fear",
  "o-ritual-de-abril-anos-de-saudade-en": "the-april-ritual-years-of-saudade",
  "o-sonhador-e-o-fogo-en": "the-dreamer-and-the-fire",
  "o-telefone-da-agonia-en": "the-telephone-of-agony",
  "o-verso-branquiceleste-en": "the-sky-blue-and-white-verse",
  "primavera-carregando-en": "spring-carrying",
  "quando-vier-a-primavera-en": "when-spring-comes",
  "riobaldo-e-o-aleph-en": "riobaldo-and-the-aleph",
  "sinal-que-se-cumpre-moving-window-ix-en":
    "sign-that-is-fulfilled-moving-window-ix",
  "sussurros-binarios-en": "binary-whispers",
  "trinta-de-abril-en": "april-thirtieth",
  "xadrez-en": "chess",
};

// Deliberately not migrated — reported at the end, not silently skipped.
const SKIPPED = {
  "46336b97-4306-41bc-8a7b-48f0ebebbd29-en":
    "untitled post, no title to translate",
  "dd332f75-6052-4f9e-bccd-fb0303731d6e-en":
    "untitled post, no title to translate",
  "f73c60f0-49af-45fd-a483-1d35a676dccc-en":
    "untitled post, no title to translate",
  "666-en": "numeral title, already language-neutral",
  "beatriz-en": "proper name, same in both languages",
  "nonada-en": "untranslatable Guimarães Rosa term, kept as-is deliberately",
  "o-regral-en":
    "'Regral' isn't a standard PT word (possibly invented/proper) — needs a human call, not a guess",
};

const dryRun = process.argv.includes("--dry-run");

const files = fs
  .readdirSync(DIR)
  .filter((f) => /\.mdx?$/.test(f) && fs.statSync(path.join(DIR, f)).isFile());

const allIds = new Set(files.map((f) => f.replace(/\.mdx?$/, "")));
const usedSlugs = new Set();
let applied = 0;
const errors = [];

for (const [enId, slug] of Object.entries(SLUG_MAP)) {
  const file = files.find((f) => f.replace(/\.mdx?$/, "") === enId);
  if (!file) {
    errors.push(`${enId}: no matching file found`);
    continue;
  }
  if (usedSlugs.has(slug)) {
    errors.push(
      `${enId}: slug "${slug}" already used by another entry in this migration`
    );
    continue;
  }
  if (allIds.has(slug) && slug !== enId.replace(/-en$/, "")) {
    // Colliding with some OTHER post's own id (not this pair's own PT
    // sibling, which sharing the base string is fine — different lang
    // namespace) is a real problem.
    errors.push(`${enId}: slug "${slug}" collides with an existing post id`);
    continue;
  }
  usedSlugs.add(slug);

  const p = path.join(DIR, file);
  const raw = fs.readFileSync(p, "utf8");
  const parsed = matter(raw);
  if (parsed.data.slug === slug) continue; // already applied
  if (parsed.data.slug) {
    errors.push(
      `${enId}: already has a different slug (${parsed.data.slug}) — not overwriting`
    );
    continue;
  }
  // Surgical insertion — add one `slug:` line right after `lang:`, leaving
  // every other line byte-for-byte untouched (matter.stringify reformats
  // the whole frontmatter block, which is a far bigger diff than intended).
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) {
    errors.push(`${enId}: could not locate frontmatter block`);
    continue;
  }
  const fm = fmMatch[1];
  if (!/^lang: en\s*$/m.test(fm)) {
    errors.push(
      `${enId}: no bare "lang: en" line to anchor the insertion after`
    );
    continue;
  }
  const newFm = fm.replace(/^(lang: en)\s*$/m, `$1\nslug: ${slug}`);
  const out = raw.replace(fm, newFm);
  if (!dryRun) fs.writeFileSync(p, out);
  applied++;
  console.log(`${dryRun ? "[dry-run] " : ""}${enId} -> slug: ${slug}`);
}

console.log(`\n${applied} slug(s) ${dryRun ? "would be " : ""}applied.`);
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  errors.forEach((e) => console.log(`  ✗ ${e}`));
  process.exitCode = 1;
}
console.log(`\n${Object.keys(SKIPPED).length} post(s) deliberately skipped:`);
for (const [id, reason] of Object.entries(SKIPPED)) {
  console.log(`  - ${id}: ${reason}`);
}
