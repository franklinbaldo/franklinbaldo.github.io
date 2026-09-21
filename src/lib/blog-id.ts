// Pure id-generation for the `blog` content collection's glob loader
// (src/content.config.ts). Extracted so it's unit-testable without pulling
// in the astro:content virtual module.
//
// A legacy slug lives in its own folder <slug>/ holding peer version files
// (v-<timestamp>.md) or an index.md; the collection loads exactly the file
// versions-selected.json points at, and this strips the folder's trailing
// `/v-<ts>` or `/index` segment down to the slug. A flat slug (RFC 0015) is
// a single `<slug>.mdx` at the content root — already the right id, just
// missing its extension. The optional group only matches the legacy case
// (it requires a leading "/"); the extension itself is always stripped
// regardless, so a flat entry like "666.mdx" (no leading directory to match
// the optional group) still loses its extension and becomes id "666" — not
// "666.mdx", which would build the page at the wrong URL (/blog/666.mdx/
// instead of /blog/666/).
export function generateBlogId(entry: string): string {
  return entry.replace(/(\/(v-[^/]+|index))?\.mdx?$/, "");
}
