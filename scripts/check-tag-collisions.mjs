import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { listPostFiles } from "./lib/content.mjs";

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

const groups = new Map();
let postsScanned = 0;
let tagsScanned = 0;

for (const file of listPostFiles()) {
  const { data } = matter(readFileSync(file, "utf8"));
  if (!isPublished(data)) continue;
  postsScanned += 1;

  for (const tag of data.tags ?? []) {
    if (typeof tag !== "string") continue;
    tagsScanned += 1;
    const key = normalizeTagKey(tag);
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key).add(tag);
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

console.log(
  `Tag taxonomy: scanned ${postsScanned} published posts and ${tagsScanned} tag assignments.`,
);
for (const [key, variants] of collisions) {
  console.log(`  ${key}: ${variants.join(" / ")}`);
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
