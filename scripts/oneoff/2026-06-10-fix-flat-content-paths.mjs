// One-shot migration: rewrite flat post paths in rate files to directory-based paths.
//   src/content/blog/<slug>.md   → src/content/blog/<slug>/index.md
//   src/content/blog/<slug>.mdx  → src/content/blog/<slug>/index.mdx
// This fixes rate files generated when posts were still flat files but now live in dirs.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const RATES_DIR = join(__dir, "../../.routines/hronir/rates");

let filesChanged = 0;
let pathsFixed = 0;

for (const name of readdirSync(RATES_DIR)) {
  if (!name.endsWith(".md")) continue;
  const file = join(RATES_DIR, name);
  let raw = readFileSync(file, "utf8");
  let updated = raw;

  updated = updated.replace(
    /^(\s*path:\s*)(src\/content\/blog\/[^\n]+)$/gm,
    (match, prefix, pathVal) => {
      pathVal = pathVal.trim();
      if (existsSync(pathVal)) return match;
      const m = pathVal.match(/^(src\/content\/blog\/)([^/]+)\.(md|mdx)$/);
      if (m) {
        const candidate = `${m[1]}${m[2]}/index.${m[3]}`;
        if (existsSync(candidate)) {
          pathsFixed++;
          return `${prefix}${candidate}`;
        }
      }
      return match;
    }
  );

  if (updated !== raw) {
    writeFileSync(file, updated, "utf8");
    filesChanged++;
  }
}

console.log(
  `✔ fix-flat-content-paths: ${pathsFixed} path(s) fixed in ${filesChanged} file(s)`
);
