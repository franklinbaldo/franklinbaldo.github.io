#!/usr/bin/env node
/**
 * RFC 0014 — adds the OKF `type: "Rate File"` field to every existing rate
 * file in .routines/hronir/rates/.
 *
 * Pure text insertion (no YAML re-serialization): gray-matter's stringify
 * reformats some long plain-scalar fields (verified: ~80/1764 files would
 * get unrelated formatting churn — evaluator_mood_after wrapped into a
 * folded scalar, etc.), which this avoids. The diff is exactly one inserted
 * line per file.
 *
 * Usage: node scripts/migrate-okf-rate-type.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");
const RATES_DIR = ".routines/hronir/rates";

const files = readdirSync(RATES_DIR).filter((f) => f.endsWith(".md"));
let migrated = 0;
let skipped = 0;

for (const f of files) {
  const filePath = join(RATES_DIR, f);
  const raw = readFileSync(filePath, "utf8");

  if (!raw.startsWith("---\n")) {
    console.warn(`Skipping (no frontmatter): ${f}`);
    skipped++;
    continue;
  }
  if (/^type: Rate File$/m.test(raw)) {
    skipped++;
    continue;
  }

  const newContent = `---\ntype: Rate File\n${raw.slice(4)}`;

  if (DRY_RUN) {
    console.log(`[dry] ${f}`);
  } else {
    writeFileSync(filePath, newContent, "utf8");
  }
  migrated++;
}

console.log(
  `Migrated: ${migrated}, Skipped: ${skipped}${DRY_RUN ? " (dry run)" : ""}`
);
