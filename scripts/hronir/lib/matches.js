import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { OUT_DIR, RATES_DIR } from "./constants.js";

export function listMatchFiles() {
  const out = [];
  const seen = new Set();
  for (const dir of [OUT_DIR, RATES_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!/_x_.*\.md$/.test(f)) continue;
      if (seen.has(f)) continue;
      seen.add(f);
      out.push(path.join(dir, f));
    }
  }
  return out;
}

export function readMatch(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  return { ...parsed, filePath };
}

export function writeMatch(filePath, frontmatter, body) {
  const out = matter.stringify(body, frontmatter);
  fs.writeFileSync(filePath, out);
}

export function postKey(side) {
  if (!side) return null;
  return side.key || side.slug || null;
}
