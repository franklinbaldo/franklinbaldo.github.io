#!/usr/bin/env node
/**
 * Detecta avaliações de baixa qualidade usando múltiplas técnicas além de
 * token-stuffing. Varre o histórico git de commits Jules.
 *
 * Técnicas:
 *   1. TTR  — Type-Token Ratio: unique_words / total_words < 0.35 (vocabulário pobre)
 *   2. GZIP — Razão de compressão < 0.45 (texto altamente repetitivo)
 *   3. NGRAM — 4-grama repetido ≥ 4 vezes no mesmo campo (frases copiadas)
 *   4. DOM  — palavra dominante > 12% de todas as palavras do campo
 *
 * Uso:
 *   node scripts/hronir/detect-low-quality.mjs
 *   node scripts/hronir/detect-low-quality.mjs --verbose  # mostra detalhes
 *   node scripts/hronir/detect-low-quality.mjs --since 2026-06-01  # só commits recentes
 */

import { execSync, execFileSync } from "child_process";
import { gzipSync } from "zlib";
import jsYaml from "js-yaml";

const { load: parseYaml } = jsYaml;

const VERBOSE = process.argv.includes("--verbose");
const sinceArg = process.argv.find((a) => a.startsWith("--since="))?.slice(8) ||
  (process.argv.includes("--since") &&
    process.argv[process.argv.indexOf("--since") + 1]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function tokens(text) {
  if (!text || typeof text !== "string") return [];
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** 1. Type-Token Ratio */
function ttr(text) {
  const words = tokens(text);
  if (words.length < 30) return null; // too short to evaluate
  return new Set(words).size / words.length;
}

/** 2. Gzip compression ratio (lower = more repetitive) */
function gzipRatio(text) {
  if (!text || text.length < 80) return null;
  const buf = Buffer.from(text, "utf8");
  const compressed = gzipSync(buf, { level: 9 });
  return compressed.length / buf.length;
}

/** 3. Most-repeated 4-gram count */
function maxNgramRepeat(text, n = 4) {
  const words = tokens(text);
  if (words.length < n * 3) return 0;
  const counts = new Map();
  for (let i = 0; i + n <= words.length; i++) {
    const gram = words.slice(i, i + n).join(" ");
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  return Math.max(...counts.values());
}

/** 4. Fraction of the single most-common word */
function dominantWordFraction(text) {
  const words = tokens(text);
  if (words.length < 20) return null;
  const counts = new Map();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  const max = Math.max(...counts.values());
  return max / words.length;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function analyseField(text) {
  const flags = [];

  const t = ttr(text);
  if (t !== null && t < 0.35) flags.push(`TTR=${t.toFixed(2)} (<0.35)`);

  const g = gzipRatio(text);
  if (g !== null && g < 0.45) flags.push(`GZIP=${g.toFixed(2)} (<0.45)`);

  const ng = maxNgramRepeat(text, 4);
  if (ng >= 4) flags.push(`4-GRAM_MAX=${ng} (≥4)`);

  const dom = dominantWordFraction(text);
  if (dom !== null && dom > 0.12) flags.push(`DOM=${(dom * 100).toFixed(1)}% (>12%)`);

  return flags;
}

// ── Git scan ──────────────────────────────────────────────────────────────────

const logArgs = ["log", "--all", "--oneline", "--author=jules"];
if (sinceArg) logArgs.push(`--since=${sinceArg}`);
const log = execSync(`git ${logArgs.join(" ")}`, { encoding: "utf8" });
const shas = log
  .trim()
  .split("\n")
  .map((l) => l.split(" ")[0])
  .filter(Boolean);

console.log(`Verificando ${shas.length} commits Jules com 4 técnicas...\n`);

let totalBad = 0;
const FIELDS = ["review_a", "review_b", "clash"];

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
      content = execFileSync("git", ["show", `${sha}:${fpath}`], {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
    } catch {
      continue;
    }

    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;

    let data;
    try {
      data = parseYaml(match[1]);
    } catch {
      continue;
    }

    const fieldFlags = {};
    for (const field of FIELDS) {
      const flags = analyseField(data[field]);
      if (flags.length > 0) fieldFlags[field] = flags;
    }

    if (Object.keys(fieldFlags).length > 0) {
      totalBad++;
      const base = fpath.split("/").pop();
      console.log(`[${sha}] ${base}`);
      for (const [field, flags] of Object.entries(fieldFlags)) {
        console.log(`  ${field}: ${flags.join(" | ")}`);
        if (VERBOSE && data[field]) {
          const preview = String(data[field]).slice(0, 120).replace(/\n/g, "↵");
          console.log(`    preview: "${preview}…"`);
        }
      }
    }
  }
}

console.log(`\nTotal suspeitos: ${totalBad} rate files.`);
