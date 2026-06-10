import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import type { PerspectiveMeta } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// perspectives/ lives in scripts/hronir/ — two dirs up from src/hronir/
const ROOT = path.resolve(__dirname, "../..");
const PERSPECTIVES_DIR = path.join(ROOT, "scripts/hronir/perspectives");

export interface Perspective extends PerspectiveMeta {
  body: string;
  path: string;
}

export function perspectivesDir(): string {
  return PERSPECTIVES_DIR;
}

export function listPerspectives(): Perspective[] {
  if (!fs.existsSync(PERSPECTIVES_DIR)) return [];
  const out: Perspective[] = [];
  for (const f of fs.readdirSync(PERSPECTIVES_DIR)) {
    if (!f.endsWith(".md")) continue;
    const filePath = path.join(PERSPECTIVES_DIR, f);
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const id = parsed.data?.id;
    const name = parsed.data?.name;
    const summary = parsed.data?.summary;
    if (!id || !name || !summary) {
      throw new Error(
        `Perspective ${filePath} missing required frontmatter (id, name, summary).`
      );
    }
    out.push({
      id: String(id),
      name: String(name),
      summary: String(summary),
      body: parsed.content.trim(),
      path: filePath,
    });
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

export function pickRandomPerspective(): Perspective {
  const all = listPerspectives();
  if (all.length === 0) {
    throw new Error(
      `No perspectives found in ${PERSPECTIVES_DIR}. Add at least one .md with frontmatter (id, name, summary).`
    );
  }
  const idx = Math.floor(Math.random() * all.length);
  return all[idx];
}

export function loadPerspective(id: string): Perspective {
  const all = listPerspectives();
  const found = all.find((p) => p.id === id);
  if (!found) {
    const known = all.map((p) => p.id).join(", ");
    throw new Error(
      `Unknown perspective id "${id}". Known: ${known || "(none)"}.`
    );
  }
  return found;
}
