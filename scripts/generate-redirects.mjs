// Emits src/generated/blog-redirects.json — a { [oldUrl]: canonicalUrl } map
// for legacy public URLs. Four sources:
//   1. date-prefixed URLs (e.g. /blog/2026-05-10-jules-api-harness-backend/
//      → /blog/jules-api-harness-backend/), derived from links in post bodies;
//   2. pre-RFC-0006 music URLs (/blog/musicas/<id>/ → /blog/<id>/), derived
//      from postType: music in the frontmatter of current posts;
//   3. posts with a `slug` frontmatter override (src/content.config.ts) —
//      the id-based URL the post used to live at before the override was
//      added redirects to the new slug-based URL;
//   4. explicit tag aliases retired by deliberate taxonomy migrations.
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

// Taxonomy migrations are intentionally explicit: never derive aliases from
// normalization heuristics, because two labels may be intentionally distinct.
// Keep the legacy public URL as a redirect and point at the encoded canonical
// tag URL used by the page/link helpers.
const TAG_REDIRECTS = {
  "/pt/tags/ia/": "/pt/tags/IA/",
  "/pt/tags/memoria/": "/pt/tags/mem%C3%B3ria/",
};
Object.assign(redirects, TAG_REDIRECTS);

// Music posts lived under src/content/blog/musicas/ (URLs /blog/musicas/<id>/
// and /pt/blog/musicas/<id>/) until RFC 0006 flattened the folder. Music posts
// published after the flatten never had a musicas/ URL, hence the date guard.
const MUSICAS_FLATTEN_DATE = new Date("2026-06-10");
for (const p of posts) {
  if (p.postType !== "music") continue;
  if (!p.date || new Date(p.date) >= MUSICAS_FLATTEN_DATE) continue;
  const bareId = p.id.replace(/^musicas\//, "");
  const finalId = p.slug ?? p.id;
  redirects[`/blog/musicas/${bareId}/`] = `/blog/${finalId}/`;
  redirects[`/pt/blog/musicas/${bareId}/`] = `/pt/blog/${finalId}/`;
}

// Any post with a `slug` override redirects from its old id-based URL to
// the new slug-based one — covers both this migration and any future post
// that gets a slug override without a file rename.
for (const p of posts) {
  if (!p.slug || p.slug === p.id) continue;
  const prefix = p.lang === "pt" ? "/pt/blog/" : "/blog/";
  redirects[`${prefix}${p.id}/`] = `${prefix}${p.slug}/`;
}

const sorted = Object.fromEntries(
  Object.entries(redirects).sort(([a], [b]) => a.localeCompare(b))
);

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(sorted, null, 2) + "\n");

console.log(
  `✔ blog-redirects.json: ${Object.keys(sorted).length} legacy redirect(s)`
);
