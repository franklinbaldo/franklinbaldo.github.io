/**
 * Derive a plain-text excerpt from raw post markdown.
 *
 * Strips fenced code blocks, headings, blockquotes, images, HTML, and
 * collapses common inline markdown (links, bold, italic, code) to text.
 * Returns the first few paragraphs, truncated at a word boundary.
 */
export function excerpt(body: string, maxChars = 320): string {
  let text = body
    // remove fenced code blocks (```...```)
    .replace(/```[\s\S]*?```/g, "")
    // remove indented code blocks (4+ spaces at line start, simple heuristic)
    .replace(/^( {4,}|\t).*$/gm, "")
    // remove HTML comments and tags
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    // remove headings, blockquotes, hr lines, image lines
    .replace(/^\s{0,3}#{1,6}\s.*$/gm, "")
    .replace(/^\s{0,3}>\s?.*$/gm, "")
    .replace(/^\s{0,3}([-*_]\s*){3,}\s*$/gm, "")
    .replace(/^\s*!\[[^\]]*\]\([^)]+\).*$/gm, "");

  // collapse inline markdown
  text = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → label
    .replace(/`([^`]+)`/g, "$1")              // inline code
    .replace(/\*\*([^*]+)\*\*/g, "$1")        // bold
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")            // italic
    .replace(/_([^_]+)_/g, "$1")
    // strip footnote refs like [^foo]
    .replace(/\[\^[^\]]+\]/g, "");

  // trim and split into paragraphs
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  let out = "";
  for (const p of paragraphs) {
    if (out.length === 0) {
      out = p;
    } else {
      out += " " + p;
    }
    if (out.length >= maxChars) break;
  }

  if (out.length <= maxChars) return out;

  // word-boundary truncate
  const truncated = out.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "…";
}
