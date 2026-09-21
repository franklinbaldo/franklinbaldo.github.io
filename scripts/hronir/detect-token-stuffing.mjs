#!/usr/bin/env node
/**
 * Varre o histórico git e detecta rate files com token-stuffing nos campos
 * review_a, review_b ou clash.
 *
 * Uso:
 *   node scripts/hronir/detect-token-stuffing.mjs
 *   node scripts/hronir/detect-token-stuffing.mjs --delete   # deleta os arquivos ruins
 *
 * Padrão detectado: palavras no formato PREFIX_DIGITS3+_ALPHANUM4+_DIGITS
 * aparecendo ≥5 vezes num mesmo campo (ex.: revA_1873_abc123_0).
 */

import { execSync } from "child_process";
import { existsSync, unlinkSync } from "fs";
import jsYaml from "js-yaml";
const { load: parseYaml } = jsYaml;

const TOKEN_RE = /\b[A-Za-z]+_\d{3,}_[A-Za-z0-9]{4,}_\d+\b/g;
const MIN_TOKENS = 5;

function hasTokenStuffing(text) {
  if (!text || typeof text !== "string") return false;
  const matches = text.match(TOKEN_RE);
  return (matches?.length ?? 0) >= MIN_TOKENS;
}

function checkFields(data) {
  const bad = [];
  for (const field of ["review_a", "review_b", "clash"]) {
    if (hasTokenStuffing(data[field])) bad.push(field);
  }
  return bad;
}

const shouldDelete = process.argv.includes("--delete");

// Get all Jules commits
const log = execSync("git log --all --oneline --author=jules", {
  encoding: "utf8",
});
const shas = log
  .trim()
  .split("\n")
  .map((l) => l.split(" ")[0])
  .filter(Boolean);

console.log(`Verificando ${shas.length} commits Jules...\n`);

const badFiles = new Map(); // sha -> [filepath, ...]
let totalBad = 0;

for (const sha of shas) {
  const files = execSync(`git diff-tree --no-commit-id -r --name-only ${sha}`, {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter((f) => f.match(/^\.routines\/hronir\/rates\/.*\.md$/));

  for (const fpath of files) {
    let content;
    try {
      content = execSync(`git show ${sha}:${fpath}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
    } catch {
      continue;
    }

    // Extract YAML frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;

    let data;
    try {
      data = parseYaml(match[1]);
    } catch {
      continue;
    }

    const badFields = checkFields(data);
    if (badFields.length > 0) {
      if (!badFiles.has(sha)) badFiles.set(sha, []);
      badFiles.get(sha).push({ fpath, badFields });
      totalBad++;

      const onDisk = existsSync(fpath);
      const status = onDisk ? "EXISTE" : "já removido";
      console.log(`[${sha}] ${fpath}`);
      console.log(`  campos ruins: ${badFields.join(", ")} | disco: ${status}`);
    }
  }
}

console.log(`\nTotal: ${totalBad} rate files com token-stuffing.`);

if (shouldDelete) {
  let deleted = 0;
  for (const [, entries] of badFiles) {
    for (const { fpath } of entries) {
      if (existsSync(fpath)) {
        unlinkSync(fpath);
        deleted++;
        console.log(`  Deletado: ${fpath}`);
      }
    }
  }
  console.log(`\nDeletados ${deleted} arquivos do disco.`);
  if (deleted > 0) {
    console.log(
      "\nPróximo passo: git add .routines/hronir/rates/ && git commit"
    );
  }
}
