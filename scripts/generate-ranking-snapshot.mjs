#!/usr/bin/env node
// Saves the current ranking to src/generated/ranking-snapshot.json.
// Run after each build so the next build can show movement (Δ) in the table.
// This file is committed to git; the diff between builds IS the Δ.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { computeRatings } from "../src/hronir/ranking.js";
import { listMatchFiles, readMatch } from "../src/hronir/matches.js";

const rows = computeRatings();
const duels = listMatchFiles()
  .map((f) => readMatch(f))
  .filter((m) => {
    const w = m.data?.winner;
    const ov = m.data?.override;
    return w && w !== "TODO" && (!ov || ov === "null");
  });

const keys = {};
rows.forEach((r, i) => {
  keys[r.key] = { rank: i + 1, ordinal: Number(r.ordinal.toFixed(4)) };
});

const snapshot = {
  _meta: {
    generatedAt: new Date().toISOString(),
    basis: "build",
    totalDuels: duels.length,
  },
  keys,
};

const out = join(process.cwd(), "src/generated/ranking-snapshot.json");
writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`ranking-snapshot: ${rows.length} keys saved to ${out}`);
