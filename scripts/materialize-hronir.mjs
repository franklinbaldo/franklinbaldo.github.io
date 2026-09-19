import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadMatches } from "../src/hronir/matches.js";

const OUT_DIR = path.join(process.cwd(), "public", "data");
const JSON_PATH = path.join(OUT_DIR, "hronir.json");
const MANIFEST_PATH = path.join(OUT_DIR, "hronir-manifest.json");

function text(value) {
  return value == null ? null : String(value);
}

function number(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const rows = loadMatches()
  .map((loaded) => {
    const { norm, data, runAtRaw } = loaded;
    return {
      id: text(data.id) ?? `hronir:${norm.id}`,
      type: "Hronir Evaluation",
      schema: "hronir-public-row-v1",
      source_type: text(data.type) ?? "Rate File",
      source_schema: text(data.schema) ?? "legacy-rate-file",
      prompt_version: text(data.prompt_version),
      run_id: text(data.run_id),
      run_at: runAtRaw || null,
      match_id: norm.id,
      match_kind: norm.kind,
      post_a_key: norm.postA.key,
      post_a_ref: norm.postA.ref,
      post_a_version: norm.postA.version,
      post_a_path: norm.postA.path,
      post_a_content_lang: norm.postA.contentLang,
      post_b_key: norm.postB.key,
      post_b_ref: norm.postB.ref,
      post_b_version: norm.postB.version,
      post_b_path: norm.postB.path,
      post_b_content_lang: norm.postB.contentLang,
      winner_side: norm.winnerSide,
      winner_key:
        norm.winnerSide === "a" ? norm.postA.key : norm.postB.key,
      loser_key:
        norm.winnerSide === "a" ? norm.postB.key : norm.postA.key,
      agent_id: norm.agentId,
      perspective_id: norm.perspectiveId,
      review_lang: norm.reviewLang,
      rate_a: norm.rateA,
      rate_b: norm.rateB,
      objective: text(data.objective),
      season: number(data.season),
      evaluator_mood: norm.evaluatorMood,
      evaluator_mood_after: norm.evaluatorMoodAfter,
      review_a: text(data.review_a),
      review_b: text(data.review_b),
      clash: text(data.clash),
      source_path: path.relative(process.cwd(), loaded.filename).replaceAll("\\", "/"),
    };
  })
  .sort((a, b) => String(a.run_at).localeCompare(String(b.run_at)));

fs.mkdirSync(OUT_DIR, { recursive: true });
const json = JSON.stringify(rows);
fs.writeFileSync(JSON_PATH, json + "\n");

const digest = crypto.createHash("sha256").update(json).digest("hex");
const manifest = {
  schema: "hronir-public-dataset-v1",
  generated_at: new Date().toISOString(),
  rows: rows.length,
  sha256: digest,
  formats: {
    json: "/data/hronir.json",
    parquet: "/data/hronir.parquet",
  },
  canonical_source: ".routines/hronir/rates/",
  note: "JSON/Parquet are derived public projections; OKF Markdown remains canonical.",
};
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

console.log(
  `[hronir-data] ${rows.length} evaluations -> ${path.relative(process.cwd(), JSON_PATH)}`
);
