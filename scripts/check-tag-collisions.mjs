import { readFileSync } from "node:fs";
import { relative } from "node:path";
import matter from "gray-matter";
import { BLOG_DIR, listPostFiles } from "./lib/content.mjs";

const KNOWN_COLLISIONS = new Map([
  ["ai", ["AI", "ai"]],
  ["amazonia", ["amazonia", "amazônia"]],
  ["engenharia-de-software", ["engenharia de software", "engenharia-de-software"]],
  ["ia", ["IA", "ia"]],
  ["memoria", ["memoria", "memória"]],
  ["software-engineering", ["software engineering", "software-engineering"]],
]);

export function normalizeTagKey(tag) {
  return tag
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "-");
}

function isPublished(data) {
  if (data.draft === true) return false;
  if (!data.publishDate) return true;
  const publishDate = new Date(data.publishDate);
  return Number.isNaN(publishDate.valueOf()) || publishDate <= new Date();
}

function sameVariants(actual, expected) {
  if (actual.length !== expected.length) return false;
  return actual.every((value, index) => value === expected[index]);
}

function repoRelativePostPath(file) {
  return `src/content/blog/${relative(BLOG_DIR, file).replace(/\\/g, "/")}`;
}

function publicTagUrls(tag, languages) {
  const segment = encodeURIComponent(tag);
  const urls = [];
  if (languages.has("en")) urls.push(`/tags/${segment}/`);
  if (languages.has("pt")) urls.push(`/pt/tags/${segment}/`);
  return urls;
}

const groups = new Map();
const evidence = new Map();
let postsScanned = 0;
let tagsScanned = 0;

for (const file of listPostFiles()) {
  const { data } = matter(readFileSync(file, "utf8"));
  if (!isPublished(data)) continue;
  postsScanned += 1;
  const language = data.lang === "pt" ? "pt" : "en";

  for (const tag of data.tags ?? []) {
    if (typeof tag !== "string") continue;
    tagsScanned += 1;
    const key = normalizeTagKey(tag);
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key).add(tag);

    if (!evidence.has(key)) evidence.set(key, new Map());
    const variants = evidence.get(key);
    if (!variants.has(tag)) {
      variants.set(tag, {
        assignments: 0,
        posts: new Set(),
        languages: new Set(),
      });
    }
    const occurrence = variants.get(tag);
    occurrence.assignments += 1;
    occurrence.posts.add(repoRelativePostPath(file));
    occurrence.languages.add(language);
  }
}

const collisions = [...groups.entries()]
  .map(([key, values]) => [key, [...values].sort()])
  .filter(([, values]) => values.length > 1)
  .sort(([a], [b]) => a.localeCompare(b));

const violations = [];
for (const [key, variants] of collisions) {
  const expected = KNOWN_COLLISIONS.get(key);
  if (!expected) {
    violations.push(`new collision ${key}: ${variants.join(" / ")}`);
    continue;
  }
  if (!sameVariants(variants, [...expected].sort())) {
    violations.push(
      `changed collision ${key}: expected ${[...expected].sort().join(" / ")}; found ${variants.join(" / ")}`,
    );
  }
}

const resolved = [...KNOWN_COLLISIONS.keys()].filter(
  (key) => !collisions.some(([collisionKey]) => collisionKey === key),
);
const showMigrationInventory = process.argv.includes("--report");

console.log(
  `Tag taxonomy: scanned ${postsScanned} published posts and ${tagsScanned} tag assignments.`,
);
for (const [key, variants] of collisions) {
  console.log(`  ${key}: ${variants.join(" / ")}`);
  if (!showMigrationInventory) continue;

  const variantEvidence = evidence.get(key);
  for (const variant of variants) {
    const occurrence = variantEvidence.get(variant);
    const languages = [...occurrence.languages].sort();
    const urls = publicTagUrls(variant, occurrence.languages);
    console.log(
      `    ${JSON.stringify(variant)}: ${occurrence.assignments} assignment(s), ${occurrence.posts.size} post(s), language(s) ${languages.join(", ")}; public URL(s): ${urls.join(", ")}`,
    );
    for (const post of [...occurrence.posts].sort()) {
      console.log(`      - ${post}`);
    }
  }
}
if (resolved.length > 0) {
  console.log(`Known collision groups no longer present: ${resolved.join(", ")}`);
}

if (violations.length > 0) {
  console.error("\nTag taxonomy collision guard failed:");
  for (const violation of violations) console.error(`- ${violation}`);
  console.error(
    "Review the taxonomy deliberately. Do not silently normalize public tag URLs; see #1909.",
  );
  process.exit(1);
}

console.log(
  `Tag taxonomy collision guard passed: ${collisions.length} known collision groups, no new variants.`,
);
if (!showMigrationInventory) {
  console.log(
    "Run `npm run check:tags -- --report` for the source-post and public-URL inventory needed by the migration in #1909.",
  );
}
