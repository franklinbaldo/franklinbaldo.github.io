// Emits src/generated/blog-redirects.json — a { [oldUrl]: canonicalUrl } map
// for legacy blog URLs. Two sources:
//   1. date-prefixed URLs (e.g. /blog/2026-05-10-jules-api-harness-backend/
//      → /blog/jules-api-harness-backend/), derived from links in post bodies;
//   2. pre-RFC-0006 music URLs (/blog/musicas/<id>/ → /blog/<id>/), derived
//      from postType: music in the frontmatter of current posts.
// astro.config.mjs spreads this into its `redirects` so old links and
// external bookmarks keep resolving.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPosts, analyzeLinks } from "./lib/blog-links.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, "../src/generated");
const outFile = join(outDir, "blog-redirects.json");

const posts = loadPosts();
const { redirects } = analyzeLinks(posts);

// Music posts lived under src/content/blog/musicas/ (URLs /blog/musicas/<id>/
// and /pt/blog/musicas/<id>/) until RFC 0006 flattened the folder. Music posts
// published after the flatten never had a musicas/ URL, hence the date guard.
const MUSICAS_FLATTEN_DATE = new Date("2026-06-10");
for (const p of posts) {
  if (p.postType !== "music") continue;
  if (!p.date || new Date(p.date) >= MUSICAS_FLATTEN_DATE) continue;
  const bareId = p.id.replace(/^musicas\//, "");
  redirects[`/blog/musicas/${bareId}/`] = `/blog/${bareId}/`;
  redirects[`/pt/blog/musicas/${bareId}/`] = `/pt/blog/${bareId}/`;
}

const sorted = Object.fromEntries(
  Object.entries(redirects).sort(([a], [b]) => a.localeCompare(b))
);

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(sorted, null, 2) + "\n");

console.log(
  `✔ blog-redirects.json: ${Object.keys(sorted).length} legacy redirect(s)`
);
