// Shared helpers for internal blog-link validation and redirect generation.
//
// Background: blog files used to be named `YYYY-MM-DD-<slug>.md` and served at
// `/blog/YYYY-MM-DD-<slug>/`. A cleanup renamed every file to a plain `<slug>`
// (the URL is now literally the filename — see src/pages/blog/[...slug].astro,
// which maps `params.slug = post.id`), but many inter-post links kept the old
// date-prefixed form and silently 404'd. This module is the single source of
// truth for both the CI link check (scripts/check-links.mjs) and the redirect
// generator (scripts/generate-redirects.mjs).
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
export const BLOG_DIR = join(__dir, "../../src/content/blog");

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { get: () => undefined, body: raw };
  const fmBlock = m[1];
  const body = raw.slice(m[0].length);
  const get = (key) => {
    const mm = fmBlock.match(new RegExp(`^${key}:\\s*([^\r\n]+)$`, "m"));
    if (!mm) return undefined;
    return mm[1].trim().replace(/^['"]|['"]$/g, "");
  };
  return { get, body };
}

/** Load every blog post with the frontmatter fields the checks care about. */
export function loadPosts() {
  const files = readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f));
  return files.map((file) => {
    const raw = readFileSync(join(BLOG_DIR, file), "utf-8");
    const { get, body } = parseFrontmatter(raw);
    const draft = get("draft") === "true";
    let published = !draft;
    const publishDateRaw = get("publishDate");
    if (published && publishDateRaw) {
      const d = new Date(publishDateRaw);
      if (!Number.isNaN(d.valueOf()) && d > new Date()) published = false;
    }
    return {
      file,
      id: file.replace(/\.mdx?$/, ""),
      lang: get("lang") ?? "en",
      draft,
      published,
      translationKey: get("translationKey"),
      body,
    };
  });
}

/** Strip anchor/query and force a single trailing slash. */
function normalizePath(p) {
  let s = p.split("#")[0].split("?")[0];
  if (!s.endsWith("/")) s += "/";
  return s;
}

// Both /blog/<id>/ and /pt/blog/<id>/ resolve for every published post: each
// route's getStaticPaths includes all published posts and cross-redirects by
// lang. So the canonical target set is language-agnostic.
export function validTargets(posts) {
  const set = new Set();
  for (const p of posts) {
    if (!p.published) continue;
    set.add(`/blog/${p.id}/`);
    set.add(`/pt/blog/${p.id}/`);
  }
  return set;
}

// Internal blog links in markdown bodies, as `](/blog/...)` or href="/blog/...".
const MD_LINK_RE = /\]\((\/(?:pt\/)?blog\/[^)\s]+)\)/g;
const HREF_RE = /href="(\/(?:pt\/)?blog\/[^"]+)"/g;

export function extractBlogLinks(body) {
  const out = [];
  for (const re of [MD_LINK_RE, HREF_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(body))) out.push(m[1]);
  }
  return out;
}

const DATE_PREFIX_RE = /^(\/(?:pt\/)?blog\/)\d{4}-\d{2}-\d{2}-/;

/**
 * Scan every post body and classify each internal blog link:
 *   - resolves directly  → fine, ignored
 *   - legacy date-prefixed URL whose de-dated form is a real post → redirect
 *   - anything else → dangling (target gone; needs a manual fix)
 *
 * Returns { redirects: { [oldPath]: canonicalPath }, dangling: [{ file, link }] }.
 */
export function analyzeLinks(posts) {
  const targets = validTargets(posts);
  const redirects = {};
  const dangling = [];
  for (const p of posts) {
    for (const raw of extractBlogLinks(p.body)) {
      const path = normalizePath(raw);
      if (targets.has(path)) continue;
      const deDated = path.replace(DATE_PREFIX_RE, "$1");
      if (deDated !== path && targets.has(deDated)) {
        redirects[path] = deDated;
      } else if (!redirects[path]) {
        dangling.push({ file: p.file, link: raw });
      }
    }
  }
  return { redirects, dangling };
}
