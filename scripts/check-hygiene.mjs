// CI guard: enforce repo hygiene conventions.
//   1. Root-level tracked files must be in an explicit allowlist.
//   2. Exactly one lockfile: package-lock.json.
//   3. No nested package.json outside the root.
//   4. No banned scratch-file patterns.
//   5. Journal files in .routines/ (top-level only) must follow the
//      YYYY-MM-DDTHH-MM-SS-slug.md naming convention.
//   6. No files under src/content/blog/musicas/ — RFC 0006 flattened the
//      folder; an outdated music generator must not resurrect it.
import { execSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf-8" })
  .split("\n")
  .filter(Boolean);

const errors = [];

// ── 1. Root-level allowlist ────────────────────────────────────────────────
const ROOT_ALLOWLIST = new Set([
  "MANAGER-INTEL.md",
  ".git-blame-ignore-revs",
  ".gitattributes",
  ".gitignore",
  ".lighthouserc.cjs",
  ".nvmrc",
  ".prettierignore",
  ".prettierrc.json",
  "CLAUDE.md",
  "README.md",
  "astro.config.mjs",
  "package-lock.json",
  "package.json",
  "tsconfig.json",
]);

for (const f of tracked.filter((f) => !f.includes("/"))) {
  if (!ROOT_ALLOWLIST.has(f)) {
    errors.push(
      `Root file not in allowlist: "${f}" — move to a subdirectory, delete, or add to ROOT_ALLOWLIST in this script`
    );
  }
}

// ── 2. Exactly one lockfile ────────────────────────────────────────────────
const BANNED_LOCKFILES = ["bun.lock", "yarn.lock", "pnpm-lock.yaml"];
for (const f of tracked) {
  if (BANNED_LOCKFILES.includes(f.split("/").pop())) {
    errors.push(
      `Non-npm lockfile: "${f}" — CI uses npm ci; delete it (or update CI and remove package-lock.json)`
    );
  }
}

// ── 3. No nested package.json ──────────────────────────────────────────────
for (const f of tracked) {
  if (f !== "package.json" && f.endsWith("/package.json")) {
    errors.push(
      `Nested package.json: "${f}" — merge its deps into the root package.json`
    );
  }
}

// ── 4. Banned scratch patterns ─────────────────────────────────────────────
const BANNED = [/^decide_args(\d+)?\.json$/, /^rewrite_(en|pt)\.mjs$/];
for (const f of tracked) {
  const base = f.split("/").pop();
  for (const pat of BANNED) {
    if (pat.test(base)) {
      errors.push(`Banned scratch file: "${f}" — delete before committing`);
    }
  }
}

// ── 5. Journal names in .routines/ (top-level only) ───────────────────────
// Required format: YYYY-MM-DDTHH-MM-SS-slug.md
// Both the old YYYY-MM-DD-slug and the new YYYY-MM-DDTHH-MM-SS-slug are
// accepted for existing files; new files should use the timestamp form.
const JOURNAL_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}-\d{2}-\d{2})?-.+\.md$/;
for (const f of tracked) {
  if (!f.startsWith(".routines/")) continue;
  const parts = f.split("/");
  // Only check direct children of .routines/ (not hronir/ or takeout/ subdirs)
  if (parts.length !== 2) continue;
  const base = parts[1];
  if (!JOURNAL_RE.test(base)) {
    errors.push(
      `Journal name doesn't match YYYY-MM-DDTHH-MM-SS-slug.md: "${f}"`
    );
  }
}

// ── 6. musicas/ stays flattened (RFC 0006) ────────────────────────────────
for (const f of tracked) {
  if (f.startsWith("src/content/blog/musicas/")) {
    errors.push(
      `Resurrected musicas/ folder: "${f}" — music posts live in src/content/blog/ with postType: music (RFC 0006)`
    );
  }
}

// ── Report ─────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error(`\n✗ check-hygiene: ${errors.length} issue(s):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}

const rootCount = tracked.filter((f) => !f.includes("/")).length;
console.log(
  `✔ check-hygiene: ${rootCount} root files, lockfiles, packages, and journals all clean.`
);
