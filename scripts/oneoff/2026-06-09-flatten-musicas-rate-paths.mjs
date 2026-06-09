// One-shot migration (RFC 0006): rewrite post_a.path / post_b.path in
// Hrönir rate files after the musicas/ folder flatten.
//   src/content/blog/musicas/<file>.mdx  →  src/content/blog/<file>.mdx
// Keys (translationKey) and version UUIDs are path-independent and untouched.
// Preserved per the persisted-data convention (CLAUDE.md): schema unchanged,
// migration script kept in scripts/oneoff/.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const RATES_DIR = join(__dir, "../../.routines/hronir/rates");

// Inline form:        path: src/content/blog/musicas/<file>.mdx
// Block-scalar form:   path: >-
//                        src/content/blog/musicas/<file>.mdx
const PATH_INLINE_RE = /^(\s*path:\s*src\/content\/blog\/)musicas\//gm;
const PATH_BLOCK_RE =
  /^(\s*path:\s*>-?\r?\n\s*src\/content\/blog\/)musicas\//gm;

let changed = 0;
for (const name of readdirSync(RATES_DIR)) {
  if (!name.endsWith(".md")) continue;
  const file = join(RATES_DIR, name);
  const raw = readFileSync(file, "utf8");
  const updated = raw
    .replace(PATH_INLINE_RE, "$1")
    .replace(PATH_BLOCK_RE, "$1");
  if (updated !== raw) {
    writeFileSync(file, updated, "utf8");
    changed++;
  }
}

console.log(`✔ flatten-musicas rate paths: ${changed} rate file(s) updated`);
