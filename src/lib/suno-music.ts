// Pure transforms shared between the build-time music content loader
// (src/content.config.ts) and its unit tests. Kept dependency-free so it's
// testable without pulling in astro:content.

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

// Every clip gets a short id suffix, always — not just on collision.
// Duplicate titles are common in this catalog (multiple takes of the same
// song: several "Xadrez", several "Beatriz"), and a conditional suffix
// (only when a collision is detected) is order-dependent and silently
// drops whichever clip is processed second under the plain-title slug. A
// fixed suffix makes every clip's slug unique and stable regardless of
// iteration order.
export function slugFor(clip: { id: string; title: string }): string {
  const base = slugify(clip.title || "") || "sem-titulo";
  return `${base}-${clip.id.slice(0, 8)}`;
}

// RFC 0011 / content.config.ts: genre labels max 40 chars each, max 5 per
// post. Some style prompts use newlines as the real clause separator
// (e.g. "Genre: X\nTempo: Y\nInstruments: Z"), not just commas — splitting
// on comma alone leaves multi-line fragments that blow past the 40-char
// limit.
export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;\n]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => t.length <= 40)
    .slice(0, 5);
}
