#!/usr/bin/env node
// Saves the current ranking to src/generated/ranking-snapshot.json.
// Run after each build so the next build can show movement (Δ) in the table.
// This file is committed to git; the diff between builds IS the Δ.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { computeRatings } from "../src/hronir/ranking.js";
import { listMatchFiles, readMatch } from "../src/hronir/matches.js";

const ELO_START = 1000;
const ELO_K = 32;

function computeElo(duels) {
  const elo = new Map();
  const peak = new Map();

  function getElo(key) {
    if (!elo.has(key)) elo.set(key, ELO_START);
    return elo.get(key);
  }

  for (const { winnerKey, loserKey } of duels) {
    const eA = getElo(winnerKey);
    const eB = getElo(loserKey);
    const expected = 1 / (1 + Math.pow(10, (eB - eA) / 400));
    const newA = eA + ELO_K * (1 - expected);
    const newB = eB + ELO_K * (0 - (1 - expected));
    elo.set(winnerKey, newA);
    elo.set(loserKey, newB);
    peak.set(winnerKey, Math.max(peak.get(winnerKey) ?? ELO_START, newA));
    peak.set(loserKey, Math.max(peak.get(loserKey) ?? ELO_START, newB));
  }

  return { elo, peak };
}

const rows = computeRatings();
const matchFiles = listMatchFiles();

const allDuels = matchFiles
  .map((f) => readMatch(f))
  .filter((m) => {
    const w = m.data?.winner;
    const ov = m.data?.override;
    const resolvedWinner = ov && ov !== "null" ? ov : w;
    return resolvedWinner && resolvedWinner !== "TODO";
  })
  .map((m) => {
    const w = m.data?.winner;
    const ov = m.data?.override;
    const resolvedWinner = ov && ov !== "null" ? ov : w;
    const aKey = m.data?.post_a?.key ?? m.data?.post_a?.slug ?? null;
    const bKey = m.data?.post_b?.key ?? m.data?.post_b?.slug ?? null;
    const runAt = m.data?.run_at ? new Date(m.data.run_at) : new Date(0);
    return {
      runAt,
      winnerKey: resolvedWinner === "a" ? aKey : bKey,
      loserKey: resolvedWinner === "a" ? bKey : aKey,
    };
  })
  .filter((d) => d.winnerKey && d.loserKey && d.winnerKey !== d.loserKey)
  .sort((a, b) => a.runAt - b.runAt);

const { elo, peak } = computeElo(allDuels);

const keys = {};
rows.forEach((r, i) => {
  const eloVal = elo.has(r.key) ? Math.round(elo.get(r.key)) : ELO_START;
  const peakVal = peak.has(r.key) ? Math.round(peak.get(r.key)) : eloVal;
  keys[r.key] = {
    rank: i + 1,
    ordinal: Number(r.ordinal.toFixed(4)),
    elo: eloVal,
    eloPeak: peakVal,
  };
});

const snapshot = {
  _meta: {
    schema: "snapshot-v2",
    generatedAt: new Date().toISOString(),
    basis: "build",
    totalDuels: allDuels.length,
  },
  keys,
};

const out = join(process.cwd(), "src/generated/ranking-snapshot.json");
writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`ranking-snapshot: ${rows.length} keys saved to ${out}`);
