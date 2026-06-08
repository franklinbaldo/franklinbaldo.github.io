// CI guard for the en/pt translation pairing.
//
// Two checks:
//   1. Completeness (always): every non-draft post that carries a
//      `translationKey` must have a counterpart in the other language. An
//      orphaned translation (key present in only one language) fails.
//   2. Sync (PR only, when BASE_REF is set): if a PR edits a post body but
//      leaves its counterpart untouched, the check fails — turning the PR
//      check red. Deploy is a separate workflow, so a red check never blocks
//      a merge; it's a visible nudge to mirror the edit.
import { execSync } from "node:child_process";
import { loadPosts } from "./lib/blog-links.mjs";

const LANGS = ["en", "pt"];
const posts = loadPosts();
const errors = [];

// ── 1. Completeness ────────────────────────────────────────────────────────
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
  let changed = [];
  try {
    const out = execSync(
      `git diff --name-only ${baseRef}...HEAD -- src/content/blog`,
      { encoding: "utf-8" }
    );
    changed = out
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  } catch (e) {
    console.warn(
      `⚠ Could not compute git diff against ${baseRef}: ${e.message}`
    );
  }

  const changedFiles = new Set(changed.map((p) => p.split("/").pop()));
  const byKey = new Map();
  for (const p of posts) {
    if (!p.translationKey) continue;
    if (!byKey.has(p.translationKey)) byKey.set(p.translationKey, []);
    byKey.get(p.translationKey).push(p);
  }

  for (const post of posts) {
    if (post.draft || !post.translationKey) continue;
    if (!changedFiles.has(post.file)) continue;
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
