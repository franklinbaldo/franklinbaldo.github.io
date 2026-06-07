/**
 * Migrates passion-v1 rate files to the stars-v1 field structure.
 *
 * passion-v1 stores content as winner_defense + loser_critique (win/loss perspective).
 * stars-v1  stores content as review_a + review_b (Post A / Post B perspective).
 *
 * The mapping depends on who won:
 *   winner=a → review_a = winner_defense, review_b = loser_critique
 *   winner=b → review_a = loser_critique,  review_b = winner_defense
 *
 * Run from repo root: node scripts/hronir/migrate-passion-to-stars.js
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const REPO_ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const RATES_DIR = path.join(REPO_ROOT, ".routines/hronir/rates");

const files = fs
  .readdirSync(RATES_DIR)
  .filter((f) => /_x_.*\.md$/.test(f))
  .map((f) => path.join(RATES_DIR, f));

let migrated = 0;
let skipped = 0;

for (const filePath of files) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  if (data.prompt_version !== "passion-v1") {
    skipped++;
    continue;
  }

  // Already migrated
  if (data.review_a !== undefined || data.review_b !== undefined) {
    console.log(`Already migrated: ${path.basename(filePath)}`);
    skipped++;
    continue;
  }

  const winner = data.winner;
  if (winner !== "a" && winner !== "b") {
    console.warn(
      `Skipping ${path.basename(filePath)}: winner="${winner}" — cannot map`
    );
    skipped++;
    continue;
  }

  const winnerDef = data.winner_defense ? String(data.winner_defense) : "";
  const loserCrit = data.loser_critique ? String(data.loser_critique) : "";

  const newData = { ...data };
  delete newData.winner_defense;
  delete newData.loser_critique;

  // winner=a → Post A won → winner_defense is about Post A → review_a
  // winner=b → Post B won → winner_defense is about Post B → review_b
  if (winner === "a") {
    newData.review_a = winnerDef;
    newData.review_b = loserCrit;
  } else {
    newData.review_a = loserCrit;
    newData.review_b = winnerDef;
  }

  const out = matter.stringify(content || "", newData);
  fs.writeFileSync(filePath, out);
  console.log(`Migrated: ${path.basename(filePath)}`);
  migrated++;
}

console.log(`\nMigration complete: ${migrated} migrated, ${skipped} skipped.`);
