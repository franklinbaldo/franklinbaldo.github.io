// Scans src/content/blog/*.md frontmatter and emits
// src/generated/blog-translation-pairs.json — a bidirectional map
// { "/blog/en-slug/": { en: "/blog/en-slug/", pt: "/blog/pt-slug/" }, ... }
// Used by astro.config.mjs to inject hreflang links into the sitemap.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const blogDir = join(__dir, '../src/content/blog');
const outDir = join(__dir, '../src/generated');
const outFile = join(outDir, 'blog-translation-pairs.json');

const files = readdirSync(blogDir).filter((f) => f.endsWith('.md'));

const posts = [];
for (const file of files) {
  const raw = readFileSync(join(blogDir, file), 'utf-8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;
  const fm = match[1];

  const get = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*([^\r\n]+)$`, 'm'));
    return m ? m[1].trim() : undefined;
  };

  if (get('draft') === 'true') continue;

  const key = get('translationKey');
  if (!key) continue;

  const lang = get('lang') ?? 'en';
  const id = file.replace(/\.md$/, '');
  posts.push({ id, lang, key });
}

// Group by translationKey
const grouped = {};
for (const p of posts) {
  if (!grouped[p.key]) grouped[p.key] = {};
  grouped[p.key][p.lang] = `/blog/${p.id}/`;
}

// Build bidirectional lookup: each URL maps to { en, pt } pair
const pairs = {};
for (const langs of Object.values(grouped)) {
  const en = langs['en'];
  const pt = langs['pt'];
  if (en && pt) {
    pairs[en] = { en, pt };
    pairs[pt] = { en, pt };
  }
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(pairs, null, 2) + '\n');

const count = Object.keys(pairs).length / 2;
console.log(`✔ blog-translation-pairs.json: ${count} pairs`);
