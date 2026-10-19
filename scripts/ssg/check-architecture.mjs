// Architectural invariant: the native SSG adapter must not import a prior
// generator. Keep reusable publication rules in generator-neutral modules.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Varying quote style, static/dynamic import and require() are handled.
// Source is checked, not comments or filenames containing the word "zola".
const IMPORTS = /(?:\bfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*)["']([^"']+)["']/g;
const isOtherGenerator = (specifier) =>
  /^(?:astro(?::|\/|$)|@astrojs\/)/.test(specifier) ||
  /(?:^|\/)zola(?:\/|$)|(?:^|\/)src\/pages(?:\/|$)|(?:^|\/)src\/components(?:\/|$)/.test(specifier);

export function violations(filename, source) {
  const bad = [];
  for (const match of source.matchAll(IMPORTS)) {
    if (isOtherGenerator(match[1]))
      bad.push(filename + ": forbidden generator import " + match[1]);
  }
  return bad;
}

export function checkArchitecture(base = process.cwd()) {
  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith(".mjs") && !entry.name.endsWith(".test.mjs"))
        files.push(file);
    }
  }
  walk(join(base, "scripts/ssg"));
  files.push(join(base, "scripts/lib/publication.mjs"));
  return files.flatMap((file) =>
    violations(relative(base, file), readFileSync(file, "utf8")));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkArchitecture();
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else console.log("SSG architecture boundary: no imports from legacy generator");
}
