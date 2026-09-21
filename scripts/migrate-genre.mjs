#!/usr/bin/env node
/**
 * RFC 0011 Fase 1 — migração mecânica de genre → sunoStyle
 *
 * Para cada post com postType: music:
 *   1. Concatena os valores de genre[] em uma string e salva em sunoStyle
 *   2. Remove o campo genre (ou deixa vazio para preenchimento semântico)
 *
 * Usage: node scripts/migrate-genre.mjs [--dry-run]
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

/**
 * Parse raw YAML frontmatter for the fields we care about.
 * Returns { sunoStyle, genreLines } where genreLines is the raw
 * multi-line YAML block for `genre:` (or null if absent).
 */
function extractGenreBlock(fm) {
  // Match the genre: block (list items, possibly multiline scalars)
  const match = fm.match(/^(genre:\n(?:(?:  [^\n]*)\n)*)/m);
  if (!match) return null;

  const block = match[1];
  // Extract each list item value (handles quoted and plain scalars)
  const items = [];
  let current = null;
  for (const line of block.split("\n")) {
    const itemMatch = line.match(/^  - (.+)$/);
    const contMatch = line.match(/^    (.+)$/);
    if (itemMatch) {
      if (current !== null) items.push(current);
      current = itemMatch[1].replace(/^["']|["']$/g, "").trim();
    } else if (contMatch && current !== null) {
      current += " " + contMatch[1].trim();
    }
  }
  if (current !== null) items.push(current);

  return { block, items };
}

const files = walkDir("src/content/blog");
let migrated = 0;
let skipped = 0;

for (const file of files) {
  const raw = readFileSync(file, "utf-8");

  // Only music posts
  if (!raw.includes("postType") || !raw.includes("music")) {
    skipped++;
    continue;
  }

  // Split into frontmatter + body
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---(\n[\s\S]*)?$/);
  if (!fmMatch) {
    skipped++;
    continue;
  }

  let fm = fmMatch[1];
  const body = fmMatch[2] ?? "";

  // Skip if genre already cleared
  if (!fm.includes("genre:")) {
    skipped++;
    continue;
  }

  // Skip if sunoStyle already set (already migrated)
  if (fm.includes("sunoStyle:")) {
    skipped++;
    continue;
  }

  const extracted = extractGenreBlock(fm);
  if (!extracted) {
    skipped++;
    continue;
  }

  const { block, items } = extracted;
  const sunoStyle = items.join("\n");

  // Build new frontmatter:
  // 1. Replace genre block with empty genre: []
  // 2. Add sunoStyle before the genre line
  let newFm = fm.replace(block, "");
  // Insert sunoStyle + empty genre before the first blank-line group or at end
  const sunoYaml = `sunoStyle: |-\n${sunoStyle
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n")}\ngenre: []\n`;

  // Append at end of frontmatter (before closing ---)
  newFm = newFm.trimEnd() + "\n" + sunoYaml;

  const newContent = `---\n${newFm}\n---${body}`;

  if (DRY_RUN) {
    console.log(`[dry] ${file}: ${items.length} genre items → sunoStyle`);
  } else {
    writeFileSync(file, newContent, "utf-8");
  }
  migrated++;
}

console.log(
  `Migrated: ${migrated}, Skipped: ${skipped}${DRY_RUN ? " (dry run)" : ""}`
);
