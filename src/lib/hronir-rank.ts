// Build-time bridge to the OpenSkill aggregator in scripts/hronir/.
// Reads .routines/hronir/*.md, runs OpenSkill, exposes a Map<key, RankRow>
// keyed by translationKey, plus a sorted array.

import { computeRatings } from "../../scripts/hronir/lib/ranking.js";

export interface RankRow {
  key: string;
  mu: number;
  sigma: number;
  ordinal: number;
  appearances: number;
  wins: number;
  path: string;
}

let _cache: RankRow[] | null = null;

export function getRanking(): RankRow[] {
  if (_cache) return _cache;
  _cache = computeRatings() as RankRow[];
  return _cache;
}

export function getRankByKey(): Map<string, { rank: number; row: RankRow; total: number }> {
  const rows = getRanking();
  const map = new Map<string, { rank: number; row: RankRow; total: number }>();
  for (let i = 0; i < rows.length; i++) {
    map.set(rows[i].key, { rank: i + 1, row: rows[i], total: rows.length });
  }
  return map;
}
