// Compatibility facade for the existing Zola exporter.
// Keep generator-independent editorial transforms in scripts/lib/publication.mjs;
// keep only the TOML/Zola-specific frontmatter serializer here.
import { quote } from "../lib/publication.mjs";
export { quote, escapeHtml, published, postPath, convertBody, stableName, rewriteImages } from "../lib/publication.mjs";

export function frontmatter(data, extra = {}) {
  const rows = Object.entries(data).map(
    ([k, v]) =>
      `${k} = ${Array.isArray(v) ? JSON.stringify(v) : typeof v === "boolean" || typeof v === "number" ? v : quote(v)}`
  );
  rows.push("[extra]");
  for (const [k, v] of Object.entries(extra)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      rows.push(
        `${k} = { ${Object.entries(v)
          .map(([key, value]) => `${quote(key)} = ${quote(value)}`)
          .join(", ")} }`
      );
    } else
      rows.push(
        `${k} = ${Array.isArray(v) ? JSON.stringify(v) : typeof v === "boolean" ? v : quote(v)}`
      );
  }
  return `+++\n${rows.join("\n")}\n+++\n\n`;
}
