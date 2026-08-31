// Require every pull request that changes the repository to add at least one
// independent changelog change card. Card structure is validated separately by
// okf-parser; this script owns only the merge-relative policy question:
// "did this PR record its change?"
import { execFileSync } from "node:child_process";

const CHANGES_DIR = "changelog/changes/";
const baseRef = process.env.BASE_REF?.trim();

if (!baseRef) {
  console.log(
    "✔ check-change-card: no BASE_REF; merge-relative card requirement skipped."
  );
  process.exit(0);
}

function gitDiff(args) {
  try {
    return execFileSync("git", ["diff", ...args], { encoding: "utf8" })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    console.error(`✗ check-change-card: could not compare against ${baseRef}.`);
    if (error?.stderr) console.error(String(error.stderr));
    process.exit(1);
  }
}

const changed = gitDiff(["--name-only", `${baseRef}...HEAD`]);

if (changed.length === 0) {
  console.log("✔ check-change-card: PR has no changed files.");
  process.exit(0);
}

// A PR that only edits existing change cards is bookkeeping, not a new product
// change. Everything else — source, content, CI, docs, data, workflows — must
// leave a card. This intentionally has no broad `skip-changelog` escape hatch.
const substantive = changed.filter((path) => !path.startsWith(CHANGES_DIR));
if (substantive.length === 0) {
  console.log("✔ check-change-card: PR only changes changelog cards.");
  process.exit(0);
}

const addedCards = gitDiff([
  "--name-only",
  "--diff-filter=A",
  `${baseRef}...HEAD`,
  "--",
  "changelog/changes",
]).filter((path) => path.endsWith(".md"));

if (addedCards.length === 0) {
  console.error(
    "\n✗ check-change-card: this PR changes the repository but adds no change card.\n"
  );
  console.error("Add at least one Markdown card under changelog/changes/.\n");
  console.error("Required OKF frontmatter:");
  console.error("  ---");
  console.error("  type: changelog");
  console.error("  date: YYYY-MM-DD");
  console.error("  description: Short reader-facing summary");
  console.error("  ---\n");
  console.error("Changed files that require a card:");
  for (const path of substantive) console.error(`  • ${path}`);
  process.exit(1);
}

console.log(
  `✔ check-change-card: ${addedCards.length} new card(s) record this PR: ${addedCards.join(", ")}`
);
