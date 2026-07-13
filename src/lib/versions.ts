// Bridges the site build to the Hrönir content-UUID so /blog/<slug>/v/<uuid>
// uses the same identity as the ranking and `supersedes` (RFC 0003/0010).
import { existsSync, readFileSync } from "node:fs";
import {
  getPostUuid,
  getPostUuidLegacy,
  getPostUuidPreOkfType,
} from "../hronir/posts.js";
import { flatCanonicalPath } from "../hronir/selection.js";

const BLOG_DIR = "src/content/blog";
const SELECTION_PATH = "src/generated/versions-selected.json";

export const GITHUB_REPO = "franklinbaldo/franklinbaldo.github.io";
export const GITHUB_BRANCH = "main";

type SelectionEntry = { file: string };
let _selection: Record<string, SelectionEntry> | null = null;
function selection(): Record<string, SelectionEntry> {
  if (_selection) return _selection;
  _selection = {};
  // Absent file = pre-migration tree (fileForId falls back to
  // <slug>/index.*). A present-but-unparseable file must fail the build —
  // silently ignoring it would drop every version permalink.
  if (existsSync(SELECTION_PATH)) {
    const parsed = JSON.parse(readFileSync(SELECTION_PATH, "utf-8"));
    for (const [slug, entry] of Object.entries(parsed) as [
      string,
      SelectionEntry,
    ][]) {
      if (slug === "_meta" || !entry?.file) continue;
      _selection[slug] = entry;
    }
  }
  return _selection;
}

/** Slug of the post a content entry belongs to. A selected entry id is
 *  "<slug>"; a version entry id is "<slug>/v-<timestamp>". */
export function slugOf(id: string): string {
  return id.split("/")[0];
}

/** Resolve the on-disk file for a content id. RFC 0010: a bare "<slug>" id
 *  resolves through versions-selected.json (the selected version); a version
 *  id "<slug>/v-<ts>" resolves to that file directly. RFC 0015: a flat
 *  slug (single `<slug>.mdx`, no selection entry) resolves directly via
 *  flatCanonicalPath — checked first since it's cheap and, unlike the
 *  legacy branches below, unambiguous by construction (flatCanonicalPath
 *  itself refuses to return a path when a real legacy directory exists for
 *  the same slug, so this can never race the selection.json branch). */
export function fileForId(id: string): string | null {
  if (!id.includes("/")) {
    const flat = flatCanonicalPath(id);
    if (flat) return flat;
    const entry = selection()[id];
    if (entry) {
      const p = `${BLOG_DIR}/${entry.file}`;
      if (existsSync(p)) return p;
    }
    // Pre-migration fallback: <slug>/index.*
    for (const ext of [".md", ".mdx"]) {
      const p = `${BLOG_DIR}/${id}/index${ext}`;
      if (existsSync(p)) return p;
    }
    return null;
  }
  for (const ext of [".md", ".mdx"]) {
    const p = `${BLOG_DIR}/${id}${ext}`;
    if (existsSync(p)) return p;
  }
  return null;
}

/** Content UUID (RFC 0010 §4.3 definition) for a content entry id. */
export function uuidForId(id: string): string | null {
  const p = fileForId(id);
  return p ? getPostUuid(p) : null;
}

/** Pre-RFC-0010 body-only UUID — old /v/<uuid> permalinks used this value,
 *  so version routes emit a redirect for it when it differs. */
export function legacyUuidForId(id: string): string | null {
  const p = fileForId(id);
  return p ? getPostUuidLegacy(p) : null;
}

/** Pre-RFC-0014 UUID (before the OKF type/docType migration) — old /v/<uuid>
 *  permalinks for posts that carried the renamed document-taxonomy field
 *  used this value, so version routes emit a redirect for it when it
 *  differs from the current UUID. */
export function preOkfUuidForId(id: string): string | null {
  const p = fileForId(id);
  return p ? getPostUuidPreOkfType(p) : null;
}

/** Public URL of the live (selected) post in the given language. */
export function liveHref(slug: string, lang?: string): string {
  return lang === "pt" ? `/pt/blog/${slug}/` : `/blog/${slug}/`;
}

/** Public URL of a specific version (content-addressed, RFC 0003). */
export function versionHref(slug: string, uuid: string, lang?: string): string {
  return lang === "pt"
    ? `/pt/blog/${slug}/v/${uuid}/`
    : `/blog/${slug}/v/${uuid}/`;
}

/** Raw + human-facing GitHub URLs for a repo-relative path at a given ref.
 * Defaults to the live branch; pass a commit sha to pin an archived path
 * (RFC 0015: the file no longer exists on main, only at the commit that
 * removed it). */
export function contentUrlsForPath(
  p: string,
  commitSha?: string | null
): { rawUrl: string; githubUrl: string } {
  const ref = commitSha ?? GITHUB_BRANCH;
  return {
    rawUrl: `https://raw.githubusercontent.com/${GITHUB_REPO}/${ref}/${p}`,
    githubUrl: `https://github.com/${GITHUB_REPO}/blob/${ref}/${p}`,
  };
}

/** Raw GitHub + human-facing blob URLs for a content entry's on-disk file,
 * resolving the path once. Archived version pages fetch their body from the
 * raw URL client-side instead of paying the MDX/remark/rehype/Shiki render
 * pipeline at build time for every superseded draft; the blob URL is the
 * fallback link when that fetch fails. An optional commitSha pins the URLs
 * to that commit (archived case); the default stays the live branch. */
export function archivedContentUrls(
  id: string,
  commitSha?: string | null
): {
  rawUrl: string | null;
  githubUrl: string | null;
} {
  const p = fileForId(id);
  if (!p) return { rawUrl: null, githubUrl: null };
  return contentUrlsForPath(p, commitSha);
}
