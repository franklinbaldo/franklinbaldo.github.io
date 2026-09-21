#!/usr/bin/env node
// RFC 0013 §2 — read-only corpus diagnosis. Prints the editorial state of the
// Hrönir archive so the editorial decisions (regimes, evidence states,
// sampling) can be grounded in real numbers. Touches no data.
//
//   node --import tsx/esm scripts/hronir/diagnose-corpus.mjs

import { loadNormalizedMatches } from "../../src/hronir/matches.ts";
import { computeRatings } from "../../src/hronir/ranking.ts";

const matches = loadNormalizedMatches();
const work = matches.filter((m) => m.kind === "work");
const version = matches.filter((m) => m.kind === "version");

// 1. works & duels
const works = new Set();
for (const m of work) {
  works.add(m.postA.key);
  works.add(m.postB.key);
}

// 3. appearances + 4. distinct opponents (work only)
const appearances = new Map();
const opponents = new Map();
const bump = (k, opp) => {
  appearances.set(k, (appearances.get(k) || 0) + 1);
  if (!opponents.has(k)) opponents.set(k, new Set());
  opponents.get(k).add(opp);
};
for (const m of work) {
  bump(m.postA.key, m.postB.key);
  bump(m.postB.key, m.postA.key);
}

// 5. duels per perspective / agent (work only)
const byPerspective = new Map();
const byAgent = new Map();
const perspectivesPerWork = new Map();
for (const m of work) {
  const p = m.perspectiveId || "(none)";
  byPerspective.set(p, (byPerspective.get(p) || 0) + 1);
  const a = m.agentId || "(none)";
  byAgent.set(a, (byAgent.get(a) || 0) + 1);
  for (const key of [m.postA.key, m.postB.key]) {
    if (!perspectivesPerWork.has(key)) perspectivesPerWork.set(key, new Set());
    if (m.perspectiveId) perspectivesPerWork.get(key).add(m.perspectiveId);
  }
}

// 6. sigma per work (OpenSkill)
const ratings = computeRatings();
const sigmas = ratings.map((r) => r.sigma).sort((a, b) => a - b);
const quantile = (arr, q) =>
  arr.length ? arr[Math.min(arr.length - 1, Math.floor(q * arr.length))] : NaN;

// version trials per key
const versionByKey = new Map();
for (const m of version)
  versionByKey.set(m.postA.key, (versionByKey.get(m.postA.key) || 0) + 1);

// 7. how many works clear candidate "calibration" coverage thresholds
const coverageAt = (minApp, minOpp, minPersp) =>
  [...works].filter(
    (k) =>
      (appearances.get(k) || 0) >= minApp &&
      (opponents.get(k)?.size || 0) >= minOpp &&
      (perspectivesPerWork.get(k)?.size || 0) >= minPersp
  ).length;

const appVals = [...appearances.values()].sort((a, b) => a - b);
const oppVals = [...works]
  .map((k) => opponents.get(k)?.size || 0)
  .sort((a, b) => a - b);

const out = {
  works: works.size,
  ratedWorks: ratings.length,
  workDuels: work.length,
  versionDuels: version.length,
  versionTrialsByKey: versionByKey.size,
  appearances: {
    min: appVals[0],
    median: quantile(appVals, 0.5),
    p90: quantile(appVals, 0.9),
    max: appVals[appVals.length - 1],
  },
  distinctOpponents: {
    min: oppVals[0],
    median: quantile(oppVals, 0.5),
    max: oppVals[oppVals.length - 1],
  },
  perspectives: byPerspective.size,
  duelsPerPerspective: Object.fromEntries(
    [...byPerspective.entries()].sort((a, b) => b[1] - a[1])
  ),
  agents: byAgent.size,
  duelsPerAgent: Object.fromEntries(
    [...byAgent.entries()].sort((a, b) => b[1] - a[1])
  ),
  sigma: {
    min: sigmas[0],
    median: quantile(sigmas, 0.5),
    p90: quantile(sigmas, 0.9),
    max: sigmas[sigmas.length - 1],
  },
  coverage: {
    "app>=4,opp>=3,persp>=1": coverageAt(4, 3, 1),
    "app>=6,opp>=4,persp>=2": coverageAt(6, 4, 2),
    "app>=8,opp>=5,persp>=3": coverageAt(8, 5, 3),
  },
};

console.log(JSON.stringify(out, null, 2));
