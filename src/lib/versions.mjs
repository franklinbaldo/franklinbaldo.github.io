// Bridges the site build to the Hrönir content-UUID so /blog/<slug>/v/<uuid>
// uses the same identity as the ranking and `supersedes` (RFC 0003/0010).
import { existsSync, readFileSync } from "node:fs";
import { getPostUuid, getPostUuidLegacy } from "../hronir/posts.js";

const BLOG_DIR = "src/content/blog";
const SELECTION_PATH = "src/generated/versions-selected.json";

let _selection = null;
function selection() {
  if (_selection) return _selection;
  _selection = {};
  try {
    const parsed = JSON.parse(readFileSync(SELECTION_PATH, "utf-8"));
    for (const [slug, entry] of Object.entries(parsed)) {
      if (slug === "_meta" || !entry?.file) continue;
      _selection[slug] = entry;
    }
  } catch {
    // Pre-migration tree — fileForId falls back to <slug>/index.*.
  }
  return _selection;
}

/** Slug of the post a content entry belongs to. A selected entry id is
 *  "<slug>"; a version entry id is "<slug>/v-<timestamp>". */
export function slugOf(id) {
  return id.split("/")[0];
}

/** Resolve the on-disk file for a content id. RFC 0010: a bare "<slug>" id
 *  resolves through versions-selected.json (the selected version); a version
 *  id "<slug>/v-<ts>" resolves to that file directly. */
export function fileForId(id) {
  if (!id.includes("/")) {
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
export function uuidForId(id) {
  const p = fileForId(id);
  return p ? getPostUuid(p) : null;
}

/** Pre-RFC-0010 body-only UUID — old /v/<uuid> permalinks used this value,
 *  so version routes emit a redirect for it when it differs. */
export function legacyUuidForId(id) {
  const p = fileForId(id);
  return p ? getPostUuidLegacy(p) : null;
}

/** Public URL of the live (selected) post in the given language. */
export function liveHref(slug, lang) {
  return lang === "pt" ? `/pt/blog/${slug}/` : `/blog/${slug}/`;
}

/** Public URL of a specific version (content-addressed, RFC 0003). */
export function versionHref(slug, uuid, lang) {
  return lang === "pt"
    ? `/pt/blog/${slug}/v/${uuid}/`
    : `/blog/${slug}/v/${uuid}/`;
}
