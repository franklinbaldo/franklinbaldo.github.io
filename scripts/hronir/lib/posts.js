import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import { remark } from "remark";

export { POSTS_DIR } from "./constants.js";
export { OUT_DIR } from "./constants.js";
export { RATES_DIR } from "./constants.js";

// Stable namespace for hronir post-version UUIDs. Generated once; do not change.
const HRONIR_NAMESPACE = "6f8a3c1e-2b94-5d7f-9e10-a4c8f2b6d031";

function uuidv5(name, namespace) {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const hash = crypto.createHash("sha1").update(nsBytes).update(name).digest();
  const bytes = Buffer.from(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

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

// Returns every translation file for a given translationKey, regardless of
// how many languages exist. No bilingual assumption.
export function findTranslations(translationKey) {
  const out = [];
  for (const p of listPosts()) {
    const data = readPost(p);
    if (!data.translationKey) continue;
    if (String(data.translationKey) !== String(translationKey)) continue;
    out.push({ path: p, lang: data.lang || "en" });
  }
  return out;
}

// Content-derived UUIDv5: stable identifier for the current body of a post.
// Frontmatter is stripped and the body is normalized through remark so that
// metadata churn and cosmetic formatting drift do not change the UUID.
export function getPostUuid(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { content } = matter(raw);
  const normalized = remark()
    .processSync(content)
    .toString()
    .replace(/\r\n/g, "\n")
    .trim();
  return uuidv5(normalized, HRONIR_NAMESPACE);
}
