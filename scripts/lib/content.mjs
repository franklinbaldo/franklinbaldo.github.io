// Single source of truth for discovering blog posts on the filesystem.
// All scripts that scan src/content/blog/ should use this module instead
// of rolling their own readdirSync/glob logic. This is the one place the
// RFC 0003 migration will update (postIdFromPath) when the layout changes
// from flat files to per-post directories.
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
export const BLOG_DIR = join(__dir, "../../src/content/blog");

/** Recursively list every .md/.mdx file under dir. Returns absolute paths. */
export function listPostFiles(dir = BLOG_DIR) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listPostFiles(full));
    } else if (/\.mdx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Derive the Astro post id (= URL slug) from an absolute file path.
 * Today: relative path from BLOG_DIR, extension stripped.
 * RFC 0003 Fase 0 will change this to strip the trailing /index segment
 * so that <slug>/index.md produces the id <slug>.
 */
export function postIdFromPath(absPath) {
  return relative(BLOG_DIR, absPath).replace(/\.mdx?$/, "");
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
 * `file`  — path relative to BLOG_DIR (e.g. "musicas/666-en.mdx")
 * `id`    — Astro post id / URL slug   (e.g. "musicas/666-en")
 * `lang`  — "en" | "pt" (default "en")
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
    file: relative(BLOG_DIR, absPath),
    id: postIdFromPath(absPath),
    lang: get("lang") ?? "en",
    draft,
    published,
    translationKey: get("translationKey"),
    body,
  };
}
