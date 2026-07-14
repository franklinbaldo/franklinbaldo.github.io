// Single source of truth for discovering blog posts on the filesystem.
// All scripts that scan src/content/blog/ should use this module instead
// of rolling their own readdirSync/glob logic. This is the one place the
// RFC 0003 migration will update (postIdFromPath) when the layout changes
// from flat files to per-post directories.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
export const BLOG_DIR = join(__dir, "../../src/content/blog");
const SELECTION_PATH = join(
  __dir,
  "../../src/generated/versions-selected.json"
);

/**
 * Flat slugs (RFC 0015): a single `<slug>.md(x)` directly at BLOG_DIR root,
 * with no peer directory of the same name. A slug can't be in both layouts
 * at once — `flatten` always rmdir's the legacy folder when it flattens a
 * slug — except for two pre-existing orphans (RFC 0015 §1) that carry a
 * loose root file *alongside* their still-versioned directory; the
 * directory always wins for those (mirrors flatCanonicalPath's tie-break in
 * src/hronir/selection.ts), so this never double-counts with the
 * versions-selected.json branch below.
 */
function listFlatSlugFiles() {
  const out = [];
  for (const entry of readdirSync(BLOG_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() || !/\.mdx?$/.test(entry.name)) continue;
    const slug = entry.name.replace(/\.mdx?$/, "");
    if (existsSync(join(BLOG_DIR, slug))) continue; // orphan — dir wins
    out.push(join(BLOG_DIR, entry.name));
  }
  return out;
}

/**
 * List the published file of every blog post. Returns absolute paths.
 * RFC 0010: a legacy-layout slug is a folder <slug>/ of peer version
 * files; the published one is whatever versions-selected.json points at —
 * mirroring the Astro loader. RFC 0015: a flattened slug never appears in
 * versions-selected.json (select() skips it), so its flat file is added
 * separately via listFlatSlugFiles(). Falls back to the RFC 0003
 * <slug>/index.* layout when the selection file itself is absent
 * (pre-migration tree).
 */
export function listPostFiles() {
  if (existsSync(SELECTION_PATH)) {
    const out = [];
    const parsed = JSON.parse(readFileSync(SELECTION_PATH, "utf-8"));
    for (const [slug, entry] of Object.entries(parsed)) {
      if (slug === "_meta" || !entry?.file) continue;
      const abs = join(BLOG_DIR, entry.file);
      if (existsSync(abs)) out.push(abs);
    }
    out.push(...listFlatSlugFiles());
    return out.sort();
  }
  const walk = (dir) => {
    const out = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...walk(full));
      } else if (/^index\.mdx?$/.test(entry.name)) {
        out.push(full);
      }
    }
    return out;
  };
  return walk(BLOG_DIR);
}

/**
 * Derive the Astro post id (= URL slug) from an absolute file path.
 * RFC 0010: a legacy post is <slug>/v-<timestamp>.md(x) (or
 * <slug>/index.md(x)) — the id is the folder path, stripping the trailing
 * filename. RFC 0015: a flat post is `<slug>.md(x)` directly — no
 * directory to strip, just the extension. Mirrors generateBlogId in
 * src/lib/blog-id.ts (kept as a plain-JS duplicate here since this file
 * runs under bare `node`, not tsx, and can't import that TS module): the
 * optional group only matches the legacy case (it requires a leading
 * "/"), so a flat id like "666.mdx" still loses its extension via the
 * unconditional tail instead of staying "666.mdx" — which would have
 * built/linked the wrong URL.
 */
export function postIdFromPath(absPath) {
  const rel = relative(BLOG_DIR, absPath).replace(/\\/g, "/");
  return rel.replace(/(\/(v-[^/]+|index))?\.mdx?$/, "");
}

/** Parse YAML frontmatter from a raw markdown string (no dependencies). */
export function parseFrontmatter(raw) {
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

/**
 * Read a post file and return the frontmatter fields most scripts need.
 * `file`     — path relative to BLOG_DIR (e.g. "666-en.mdx")
 * `id`       — Astro post id / URL slug   (e.g. "666-en")
 * `lang`     — "en" | "pt" (default "en")
 * `postType` — e.g. "music" (undefined for regular posts)
 * `date`     — raw frontmatter date string (consumers parse as needed)
 * `draft`, `published`, `translationKey`, `body`
 */
export function readPostMeta(absPath) {
  const raw = readFileSync(absPath, "utf-8");
  const { get, body } = parseFrontmatter(raw);
  const draft = get("draft") === "true";
  let published = !draft;
  const publishDateRaw = get("publishDate");
  if (published && publishDateRaw) {
    const d = new Date(publishDateRaw);
    if (!Number.isNaN(d.valueOf()) && d > new Date()) published = false;
  }
  return {
    file: relative(BLOG_DIR, absPath).replace(/\\/g, "/"),
    id: postIdFromPath(absPath),
    lang: get("lang") ?? "en",
    postType: get("postType"),
    date: get("date"),
    draft,
    published,
    translationKey: get("translationKey"),
    body,
  };
}
