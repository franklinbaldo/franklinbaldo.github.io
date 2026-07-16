// CI guard: package.json's `version` is the single source of truth for
// releases (changelog/<version>.md convention, started at 0.1.0 — see
// changelog/0.1.0.md). This enforces both directions of that pairing so they
// can't drift apart:
//   1. The current package.json version has a matching changelog/<version>.md
//      (a version bump without its changelog entry).
//   2. No changelog/*.md entry describes a version ahead of package.json's
//      current version (a changelog entry without the matching version bump).
//   3. Every changelog/*.md file's frontmatter `version` matches its
//      filename and carries the required OKF fields (RFC 0014 §7:
//      `type` is the only field OKF itself requires; `version`/`date`/
//      `description` are this convention's own requirements on top of that).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHANGELOG_DIR = join(ROOT, "changelog");
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;
const VERSION_FILE_RE = /^(\d+\.\d+\.\d+)\.md$/;
const REQUIRED_FIELDS = ["type", "version", "date", "description"];

const errors = [];

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
const currentVersion = pkg.version;
const currentMatch = SEMVER_RE.exec(currentVersion);
if (!currentMatch) {
  errors.push(`package.json version "${currentVersion}" is not semver x.y.z`);
}
const currentParts = currentMatch ? currentMatch.slice(1).map(Number) : null;

function compareParts(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

if (!existsSync(CHANGELOG_DIR)) {
  console.error(
    `\n✗ check-changelog: changelog/ directory not found (expected at ${CHANGELOG_DIR})\n`
  );
  process.exit(1);
}

// Every *.md file must match "<major>.<minor>.<patch>.md" exactly. A file
// that doesn't (typo, prerelease-style suffix, ...) is flagged here rather
// than silently skipped — otherwise it would bypass every check below,
// including the ahead-of-version guard.
const entries = [];
for (const file of readdirSync(CHANGELOG_DIR)) {
  if (!file.endsWith(".md")) continue;
  const match = VERSION_FILE_RE.exec(file);
  if (!match) {
    errors.push(
      `changelog/${file}: filename doesn't match the "<major>.<minor>.<patch>.md" convention`
    );
    continue;
  }
  entries.push({
    file,
    versionString: match[1],
    parts: match[1].split(".").map(Number),
  });
}

if (currentParts) {
  const currentEntryFile = `${currentVersion}.md`;
  if (!entries.some((e) => e.file === currentEntryFile)) {
    errors.push(
      `package.json version is "${currentVersion}" but changelog/${currentEntryFile} doesn't exist — ` +
        `add a changelog entry for it (or revert the version bump if this PR isn't a release).`
    );
  }
}

for (const { file, versionString, parts } of entries) {
  const path = join(CHANGELOG_DIR, file);
  const { data } = matter(readFileSync(path, "utf-8"));

  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      errors.push(
        `changelog/${file}: missing required frontmatter field "${field}"`
      );
    }
  }
  if (data.type && data.type !== "Changelog Entry") {
    errors.push(
      `changelog/${file}: type is "${data.type}", expected "Changelog Entry"`
    );
  }
  if (data.version && String(data.version) !== versionString) {
    errors.push(
      `changelog/${file}: frontmatter version "${data.version}" doesn't match filename (expected "${versionString}")`
    );
  }
  // Mirrors the astro:content collection schema's `z.coerce.date()` (see
  // src/content.config.ts) so a bad date fails here, with an actionable
  // message, instead of surfacing later as a generic Zod error from
  // `astro check` for the same file.
  if (data.date) {
    const dateValue =
      data.date instanceof Date ? data.date : new Date(data.date);
    if (Number.isNaN(dateValue.valueOf())) {
      errors.push(
        `changelog/${file}: frontmatter date "${data.date}" isn't a valid date`
      );
    }
  }

  if (currentParts && compareParts(parts, currentParts) > 0) {
    errors.push(
      `changelog/${file} describes version ${versionString}, ahead of package.json's current version "${currentVersion}" — ` +
        `bump package.json's version to match.`
    );
  }
}

if (errors.length > 0) {
  console.error(`\n✗ check-changelog: ${errors.length} issue(s):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}

console.log(
  `✔ check-changelog: package.json version "${currentVersion}" has a matching changelog entry; ${entries.length} entr${entries.length === 1 ? "y" : "ies"} valid.`
);
