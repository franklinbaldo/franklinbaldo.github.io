// RFC 0010 §6 — one-off migration: versions as peers.
//
// 1. Renames every src/content/blog/<slug>/index.{md,mdx} to
//    v-<last-commit-timestamp>.<ext> via `git mv` (history preserved) and
//    stamps a shared `draftCreatedAt` (the migration timestamp) so the §4.4
//    coupled-selection algorithm can pair the migrated revisions of a
//    translation group.
// 2. Collapses exact duplicates (same RFC 0010 UUID) inside a directory,
//    keeping the migrated ex-canonical (or the oldest file).
// 3. Generates the initial src/generated/versions-selected.json pointing each
//    slug at its migrated file — the initial selection is today's published
//    state, zero visible change on the site.
//
// Run with: node --import tsx/esm scripts/oneoff/2026-06-12-rfc-0010-versions-as-peers.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { getPostUuid } from "../../src/hronir/posts.js";

const BLOG_DIR = "src/content/blog";
const SELECTION_PATH = "src/generated/versions-selected.json";
const MIGRATION_STAMP = new Date().toISOString();

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function lastCommitIso(file) {
  const out = git(["log", "-1", "--format=%cI", "--", file]);
  return out || MIGRATION_STAMP;
}

function versionNameFromIso(iso) {
  // Same shape as draft-worst names: v-YYYY-MM-DDTHH-MM-SS (UTC, no ms).
  return (
    "v-" +
    new Date(iso)
      .toISOString()
      .replace(/\.\d+Z$/, "")
      .replace(/:/g, "-")
  );
}

function insertFrontmatterField(file, key, value) {
  const raw = fs.readFileSync(file, "utf8");
  if (new RegExp(`^${key}:`, "m").test(raw.split(/\r?\n---/)[0])) return; // already present
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---/);
  if (!m) throw new Error(`${file}: sem frontmatter`);
  const updated =
    m[0].replace(/\r?\n---$/, `\n${key}: "${value}"\n---`) +
    raw.slice(m[0].length);
  fs.writeFileSync(file, updated);
}

// ── 1. rename every index.* ────────────────────────────────────────────────
const renames = [];
for (const dirent of fs.readdirSync(BLOG_DIR, { withFileTypes: true })) {
  if (!dirent.isDirectory()) continue;
  const slug = dirent.name;
  const dir = path.join(BLOG_DIR, slug);
  for (const f of fs.readdirSync(dir)) {
    if (!/^index\.mdx?$/.test(f)) continue;
    const src = path.join(dir, f);
    const ext = path.extname(f);
    let base = versionNameFromIso(lastCommitIso(src));
    let dest = path.join(dir, base + ext);
    // Avoid clobbering an existing version file with the same timestamp.
    for (let i = 0; fs.existsSync(dest); i++) {
      dest = path.join(dir, `${base}-${i}${ext}`);
    }
    git(["mv", src, dest]);
    insertFrontmatterField(dest, "draftCreatedAt", MIGRATION_STAMP);
    renames.push({ slug, file: path.relative(BLOG_DIR, dest), abs: dest });
  }
}
console.log(`renomeados: ${renames.length} index.* → v-*`);

// ── 2. collapse exact duplicates per directory ─────────────────────────────
let collapsed = 0;
for (const { abs } of renames) {
  const dir = path.dirname(abs);
  const byUuid = new Map();
  for (const f of fs.readdirSync(dir).sort()) {
    if (!/\.mdx?$/.test(f)) continue;
    const p = path.join(dir, f);
    const uuid = getPostUuid(p);
    if (!byUuid.has(uuid)) byUuid.set(uuid, []);
    byUuid.get(uuid).push(p);
  }
  for (const [uuid, files] of byUuid) {
    if (files.length < 2) continue;
    // Keep the migrated ex-canonical when it's in the group, else the oldest.
    const keep = files.includes(abs) ? abs : files[0];
    for (const f of files) {
      if (f === keep) continue;
      git(["rm", "-q", f]);
      collapsed++;
      console.log(
        `duplicata exata removida: ${f} (uuid ${uuid}, mantido ${keep})`
      );
    }
  }
}
console.log(`duplicatas colapsadas: ${collapsed}`);

// ── 3. initial versions-selected.json ──────────────────────────────────────
const selection = {
  _meta: { schema: "selection-v1", generatedAt: MIGRATION_STAMP },
};
for (const { slug, file, abs } of renames.sort((a, b) =>
  a.slug.localeCompare(b.slug)
)) {
  selection[slug] = { file, uuid: getPostUuid(abs) };
}
fs.mkdirSync(path.dirname(SELECTION_PATH), { recursive: true });
fs.writeFileSync(SELECTION_PATH, JSON.stringify(selection, null, 2) + "\n");
console.log(
  `seleção inicial: ${renames.length} slugs em ${SELECTION_PATH} (stamp ${MIGRATION_STAMP})`
);
