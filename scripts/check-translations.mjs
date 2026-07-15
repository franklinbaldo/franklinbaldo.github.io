// CI guard for the en/pt translation pairing.
// post.file is a path relative to src/content/blog/ (e.g. "666-en.mdx"),
// matching how git diff reports changed files after stripping that prefix.
//
// Two checks:
//   1. Completeness (always): every non-draft post that carries a
//      `translationKey` must have a counterpart in the other language. An
//      orphaned translation (key present in only one language) fails.
//   2. Sync (PR only, when BASE_REF is set): if a PR edits a post body but
//      leaves its counterpart untouched, the check fails — turning the PR
//      check red. Deploy is a separate workflow, so a red check never blocks
//      a merge; it's a visible nudge to mirror the edit. Exempted: a change
//      confined to PRESENTATION_ONLY_FIELDS (title/description) — those are
//      inherently per-language translations, not content to mirror as-is
//      onto the other side (translating a title *is* the mirrored form).
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { loadPosts } from "./lib/blog-links.mjs";

const PRESENTATION_ONLY_FIELDS = new Set(["title", "description"]);

// Returns the set of changed frontmatter keys if the post's body is
// unchanged since baseRef, or null if the body changed (or the file didn't
// exist at baseRef under `baseRefPath`) — in which case the caller should
// treat it as a substantive edit regardless of which keys moved.
function frontmatterKeysChangedOnly(baseRef, file, baseRefPath) {
  const path = `src/content/blog/${file}`;
  let oldRaw;
  try {
    oldRaw = execSync(`git show ${baseRef}:${JSON.stringify(baseRefPath)}`, {
      encoding: "utf-8",
    });
  } catch {
    return null;
  }
  const oldParsed = matter(oldRaw);
  const newParsed = matter(readFileSync(path, "utf-8"));
  if (oldParsed.content.trim() !== newParsed.content.trim()) return null;
  const changedKeys = new Set();
  const allKeys = new Set([
    ...Object.keys(oldParsed.data),
    ...Object.keys(newParsed.data),
  ]);
  for (const k of allKeys) {
    if (
      JSON.stringify(oldParsed.data[k]) !== JSON.stringify(newParsed.data[k])
    ) {
      changedKeys.add(k);
    }
  }
  return changedKeys;
}

const LANGS = ["en", "pt"];
const posts = loadPosts();
const errors = [];

// ── 1. Completeness ────────────────────────────────────────────────────────
// Intentionally uses `draft`, not `published`: a post whose counterpart is a
// draft (but not yet published) still counts as incomplete — we want CI to go
// red even when the translation exists but hasn't shipped yet.
const groups = new Map();
for (const p of posts) {
  if (p.draft || !p.translationKey) continue;
  if (!groups.has(p.translationKey)) groups.set(p.translationKey, []);
  groups.get(p.translationKey).push(p);
}

for (const [key, members] of groups) {
  const langs = new Set(members.map((m) => m.lang));
  const missing = LANGS.filter((l) => !langs.has(l));
  if (missing.length > 0) {
    errors.push(
      `Incomplete pair "${key}": has [${[...langs].join(", ")}], missing [${missing.join(", ")}] ` +
        `(${members.map((m) => m.file).join(", ")})`
    );
  }
}

// Posts with no translationKey at all can never be paired — surface as a warning.
for (const p of posts) {
  if (!p.draft && !p.translationKey) {
    console.warn(`⚠ ${p.file} has no translationKey — cannot be paired.`);
  }
}

// ── 2. Sync (PR only) ──────────────────────────────────────────────────────
const baseRef = process.env.BASE_REF;
if (baseRef) {
  // -M detects renames as "R<similarity>\told\tnew" instead of a delete+add
  // pair — a renamed-but-content-identical file (e.g. a slug fix) would
  // otherwise look indistinguishable from a brand-new file with no baseRef
  // history to diff against, breaking frontmatterKeysChangedOnly() below.
  let statusOut = "";
  try {
    statusOut = execSync(
      `git diff --name-status -M ${baseRef}...HEAD -- src/content/blog`,
      { encoding: "utf-8" }
    );
  } catch (e) {
    // If git diff fails while BASE_REF is explicitly set (i.e. on a real PR),
    // a silent no-op would mean the sync check is disabled — fail loudly instead.
    console.error(
      `✗ git diff --name-status ${baseRef}...HEAD failed: ${e.message}\n` +
        `Hint: ensure the workflow uses fetch-depth: 0.`
    );
    process.exit(1);
  }

  const BLOG_PREFIX = "src/content/blog/";
  const changed = [];
  // newFile → path to diff against at baseRef (itself, unless renamed).
  const baseRefPathFor = new Map();
  for (const line of statusOut
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)) {
    const cols = line.split("\t");
    const status = cols[0];
    if (status.startsWith("R")) {
      const [, oldPath, newPath] = cols;
      changed.push(newPath);
      baseRefPathFor.set(newPath, oldPath);
    } else {
      changed.push(cols[1] ?? cols[0]);
    }
  }

  const changedFiles = new Set(
    changed
      .filter((p) => p.startsWith(BLOG_PREFIX))
      .map((p) => p.slice(BLOG_PREFIX.length))
  );
  const byKey = new Map();
  for (const p of posts) {
    if (!p.translationKey) continue;
    if (!byKey.has(p.translationKey)) byKey.set(p.translationKey, []);
    byKey.get(p.translationKey).push(p);
  }

  for (const post of posts) {
    if (post.draft || !post.translationKey) continue;
    if (!changedFiles.has(post.file)) continue;
    const baseRefPath =
      baseRefPathFor.get(BLOG_PREFIX + post.file) ?? BLOG_PREFIX + post.file;
    const changedKeys = frontmatterKeysChangedOnly(
      baseRef,
      post.file,
      baseRefPath
    );
    if (
      changedKeys &&
      [...changedKeys].every((k) => PRESENTATION_ONLY_FIELDS.has(k))
    ) {
      continue;
    }
    const siblings = (byKey.get(post.translationKey) ?? []).filter(
      (s) => s.file !== post.file
    );
    const untouched = siblings.filter((s) => !changedFiles.has(s.file));
    if (siblings.length > 0 && untouched.length === siblings.length) {
      errors.push(
        `${post.file} (${post.lang}) was edited but its counterpart ` +
          `${untouched.map((s) => `${s.file} (${s.lang})`).join(", ")} was not. ` +
          `Mirror the change in the other language.`
      );
    }
  }
} else {
  console.log(
    "ℹ BASE_REF unset — skipping per-PR sync check (completeness only)."
  );
}

// ── Report ─────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error(`\n✗ check-translations: ${errors.length} issue(s):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}

console.log(`✔ check-translations: ${groups.size} pairs complete.`);
