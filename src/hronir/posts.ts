import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import { remark } from "remark";

export const POSTS_DIR = "src/content/blog";
export const OUT_DIR = ".routines/hronir";
export const RATES_DIR = path.join(OUT_DIR, "rates");

const HRONIR_NAMESPACE = "6f8a3c1e-2b94-5d7f-9e10-a4c8f2b6d031";

function uuidv5(name: string, namespace: string): string {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const hash = crypto.createHash("sha1").update(nsBytes).update(name).digest();
  const bytes = Buffer.from(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function listPosts(dir: string = POSTS_DIR): string[] {
  const out: string[] = [];
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

export function readPost(filePath: string): Record<string, unknown> {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = matter(raw);
  return data;
}

export function keyForPath(filePath: string): string {
  const data = readPost(filePath);
  if (data.translationKey) return String(data.translationKey);
  const base = path.basename(filePath).replace(/\.mdx?$/, "");
  if (base === "index") return path.basename(path.dirname(filePath));
  return base;
}

export function isCanonical(filePath: string): boolean {
  return /(^|[/\\])index\.mdx?$/.test(filePath);
}

export function listVersions(anyPathInFolder: string): string[] {
  const dir = path.dirname(anyPathInFolder);
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

export function buildPathIndex(): Map<
  string,
  { path: string; lang: string | null; translationKey: string | null }
> {
  const index = new Map<
    string,
    { path: string; lang: string | null; translationKey: string | null }
  >();
  for (const p of listPosts()) {
    const data = readPost(p);
    const key = data.translationKey ? String(data.translationKey) : null;
    index.set(p, {
      path: p,
      lang: data.lang ? String(data.lang) : null,
      translationKey: key,
    });
  }
  return index;
}

export function listEnglishWithKey(): Array<{
  path: string;
  translationKey: string;
}> {
  const out: Array<{ path: string; translationKey: string }> = [];
  for (const p of listPosts()) {
    if (!isCanonical(p)) continue;
    const data = readPost(p);
    const lang = data.lang ? String(data.lang) : "en";
    if (lang !== "en") continue;
    if (!data.translationKey) continue;
    out.push({ path: p, translationKey: String(data.translationKey) });
  }
  return out;
}

export function findTranslations(
  translationKey: string
): Array<{ path: string; lang: string }> {
  const out: Array<{ path: string; lang: string }> = [];
  for (const p of listPosts()) {
    if (!isCanonical(p)) continue;
    const data = readPost(p);
    if (!data.translationKey) continue;
    if (String(data.translationKey) !== String(translationKey)) continue;
    out.push({ path: p, lang: data.lang ? String(data.lang) : "en" });
  }
  return out;
}

export function getPostUuid(filePath: string): string | null {
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
