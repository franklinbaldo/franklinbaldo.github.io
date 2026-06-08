// Emits src/generated/blog-redirects.json — a { [oldUrl]: canonicalUrl } map
// for legacy date-prefixed blog URLs (e.g. /blog/2026-05-10-jules-api-harness-backend/
// → /blog/jules-api-harness-backend/). astro.config.mjs spreads this into its
// `redirects` so old links and external bookmarks keep resolving.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPosts, analyzeLinks } from "./lib/blog-links.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, "../src/generated");
const outFile = join(outDir, "blog-redirects.json");

const posts = loadPosts();
const { redirects } = analyzeLinks(posts);

const sorted = Object.fromEntries(
  Object.entries(redirects).sort(([a], [b]) => a.localeCompare(b))
);

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(sorted, null, 2) + "\n");

console.log(
  `✔ blog-redirects.json: ${Object.keys(sorted).length} legacy redirect(s)`
);
