// Bridges the site build to the Hrönir content-UUID so /blog/<slug>/v/<uuid>
// uses the same identity as the ranking and `supersedes` (RFC 0003). RFC 0005
// will fold the Hrönir lib into TS; until then this .mjs avoids a JS↔TS gap.
import { existsSync } from "node:fs";
import { getPostUuid } from "../hronir/posts.js";

const BLOG_DIR = "src/content/blog";

/** Slug of the post a content entry belongs to. A canonical entry id is
 *  "<slug>"; a version entry id is "<slug>/v-<timestamp>". */
export function slugOf(id) {
  return id.split("/")[0];
}

/** Resolve the on-disk file for a content id, trying .md then .mdx. We derive
 *  it from the id (always present) rather than entry.filePath, which Astro
 *  leaves undefined on canonical entries when the sibling versions collection
 *  is empty. Canonical id "<slug>" → <slug>/index.*; version id
 *  "<slug>/v-<ts>" → <slug>/v-<ts>.*. */
export function fileForId(id) {
  const rel = id.includes("/") ? id : `${id}/index`;
  for (const ext of [".md", ".mdx"]) {
    const p = `${BLOG_DIR}/${rel}${ext}`;
    if (existsSync(p)) return p;
  }
  return null;
}

/** Content UUID (UUIDv5 of the normalized body) for a content entry id. */
export function uuidForId(id) {
  const p = fileForId(id);
  return p ? getPostUuid(p) : null;
}

/** Public URL of the live (canonical) post in the given language. */
export function liveHref(slug, lang) {
  return lang === "pt" ? `/pt/blog/${slug}/` : `/blog/${slug}/`;
}

/** Public URL of a specific version (content-addressed, RFC 0003). */
export function versionHref(slug, uuid, lang) {
  return lang === "pt"
    ? `/pt/blog/${slug}/v/${uuid}/`
    : `/blog/${slug}/v/${uuid}/`;
}
