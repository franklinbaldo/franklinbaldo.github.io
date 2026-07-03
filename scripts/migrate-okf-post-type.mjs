#!/usr/bin/env node
/**
 * RFC 0014 — adds the OKF `type` field (Blog Post | Music Post) to every
 * post file and renames the pre-existing document-taxonomy `type` field to
 * `docType`, freeing up `type` for OKF semantics.
 *
 * Pure text edit on the frontmatter block (no YAML re-serialization) so the
 * diff is exactly: one renamed key line (if present) + one inserted line.
 * Re-serializing via gray-matter reformats quote/block-scalar style across
 * the corpus (verified: 84/101 sampled files would differ beyond the actual
 * change), which this avoids.
 *
 * Usage: node scripts/migrate-okf-post-type.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");

function walkDir(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...walkDir(full));
    else if (full.endsWith(".md") || full.endsWith(".mdx")) results.push(full);
  }
  return results;
}

const files = walkDir("src/content/blog");
let migrated = 0;
let skipped = 0;

for (const file of files) {
  const raw = readFileSync(file, "utf-8");
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---(\n[\s\S]*)?$/);
  if (!fmMatch) {
    console.warn(`Skipping (no frontmatter): ${file}`);
    skipped++;
    continue;
  }

  let fm = fmMatch[1];
  const rest = fmMatch[2] ?? "";

  if (/^type: (Blog Post|Music Post)$/m.test(fm)) {
    // Already migrated.
    skipped++;
    continue;
  }

  const isMusic = /^postType: music$/m.test(fm);
  const okfType = isMusic ? "Music Post" : "Blog Post";

  fm = fm.replace(/^type: /m, "docType: ");
  const newFm = `type: ${okfType}\n${fm}`;
  const newContent = `---\n${newFm}\n---${rest}`;

  if (DRY_RUN) {
    console.log(`[dry] ${file}: type: ${okfType}`);
  } else {
    writeFileSync(file, newContent, "utf-8");
  }
  migrated++;
}

console.log(
  `Migrated: ${migrated}, Skipped: ${skipped}${DRY_RUN ? " (dry run)" : ""}`
);
