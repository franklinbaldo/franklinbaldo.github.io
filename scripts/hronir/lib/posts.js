import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const POSTS_DIR = "src/content/blog";
export const OUT_DIR = ".routines/hronir";

export function listPosts(dir = POSTS_DIR) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listPosts(full));
    } else if (/\.mdx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

export function readPost(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = matter(raw);
  return data;
}

export function keyForPath(filePath) {
  const data = readPost(filePath);
  if (data.translationKey) return String(data.translationKey);
  return path.basename(filePath).replace(/\.mdx?$/, "");
}

export function buildPathIndex() {
  const index = new Map();
  for (const p of listPosts()) {
    const data = readPost(p);
    const key = data.translationKey ? String(data.translationKey) : null;
    index.set(p, { path: p, lang: data.lang || null, translationKey: key });
  }
  return index;
}

export function listEnglishWithKey() {
  const out = [];
  for (const p of listPosts()) {
    const data = readPost(p);
    const lang = data.lang || "en";
    if (lang !== "en") continue;
    if (!data.translationKey) continue;
    out.push({ path: p, translationKey: String(data.translationKey) });
  }
  return out;
}
