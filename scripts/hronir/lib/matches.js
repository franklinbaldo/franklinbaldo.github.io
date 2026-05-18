import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { OUT_DIR } from "./posts.js";

export function listMatchFiles() {
  if (!fs.existsSync(OUT_DIR)) return [];
  return fs
    .readdirSync(OUT_DIR)
    .filter((f) => /_x_.*\.md$/.test(f))
    .map((f) => path.join(OUT_DIR, f));
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
