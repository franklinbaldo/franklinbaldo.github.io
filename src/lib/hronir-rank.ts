// Build-time bridge to the OpenSkill aggregator in scripts/hronir/.
// Reads .routines/hronir/*.md, runs OpenSkill, exposes a Map<key, RankRow>
// keyed by translationKey, plus a sorted array.

import { computeRatings } from "../../scripts/hronir/lib/ranking.js";
import {
  listMatchFiles,
  readMatch,
  postKey,
} from "../../scripts/hronir/lib/matches.js";

export interface RankRow {
  key: string;
  mu: number;
  sigma: number;
  ordinal: number;
  appearances: number;
  wins: number;
  path: string;
}

export interface DuelContent {
  postAAnalysis: string;
  postBAnalysis: string;
  verdict: string;
}

export interface DuelEntry {
  runAt: string;
  winnerKey: string;
  loserKey: string;
  margin?: number;
  confidence?: string;
  criterion?: string;
  body?: string;
  model?: string;
  season?: number;
  postAKey?: string;
  postBKey?: string;
  parsedContent?: DuelContent;
}

export function parseDuelContent(body?: string): DuelContent {
  const result: DuelContent = { postAAnalysis: "", postBAnalysis: "", verdict: "" };
  if (!body) return result;

  const parts = body.split(/(?:^|\n)##\s+/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");
    const header = lines[0].trim().toLowerCase();
    const content = lines.slice(1).join("\n").trim();

    if (header.startsWith("post a")) {
      result.postAAnalysis = content;
    } else if (header.startsWith("post b")) {
      result.postBAnalysis = content;
    } else if (header.startsWith("veredito") || header.startsWith("verdict")) {
      result.verdict = content;
    }
  }
  return result;
}

export interface RankingStats {
  totalDuels: number;
  totalRated: number;
  lastDuelAt: string | null;
  firstDuelAt: string | null;
}

let _cache: RankRow[] | null = null;
let _statsCache: { stats: RankingStats; recent: DuelEntry[] } | null = null;

export function getRanking(): RankRow[] {
  if (_cache) return _cache;
  _cache = computeRatings() as RankRow[];
  return _cache;
}

export function getRankByKey(): Map<
  string,
  { rank: number; row: RankRow; total: number }
> {
  const rows = getRanking();
  const map = new Map<string, { rank: number; row: RankRow; total: number }>();
  for (let i = 0; i < rows.length; i++) {
    map.set(rows[i].key, { rank: i + 1, row: rows[i], total: rows.length });
  }
  return map;
}

function loadDuelData(): { stats: RankingStats; recent: DuelEntry[] } {
  if (_statsCache) return _statsCache;

  const duels: DuelEntry[] = [];
  for (const f of listMatchFiles()) {
    const { data, content } = readMatch(f);
    let winner = (data as any).winner;
    if ((data as any).override && (data as any).override !== "null") {
      winner = (data as any).override;
    }
    if (winner === "TODO" || !winner) continue;
    const aKey = postKey((data as any).post_a);
    const bKey = postKey((data as any).post_b);
    if (!aKey || !bKey) continue;
    if (winner !== "a" && winner !== "b") continue;

    const rawRunAt = (data as any).run_at ?? (data as any).run_id ?? "";
    const runAt =
      rawRunAt instanceof Date ? rawRunAt.toISOString() : String(rawRunAt);
    // Skip matches without a parseable timestamp: an empty runAt would
    // sort ahead of every real duel in the "Latest duels" list and
    // render with a placeholder date, which is worse than not showing it.
    if (!runAt) continue;

    const winnerKey = winner === "a" ? aKey : bKey;
    const loserKey = winner === "a" ? bKey : aKey;

    duels.push({
      runAt,
      winnerKey,
      loserKey,
      margin:
        typeof (data as any).margin === "number"
          ? (data as any).margin
          : undefined,
      confidence: (data as any).confidence
        ? String((data as any).confidence)
        : undefined,
      criterion: (data as any).criterion
        ? String((data as any).criterion)
        : undefined,
      body: content ? String(content).trim() : undefined,
      model: (data as any).model ? String((data as any).model) : undefined,
      season: typeof (data as any).season === "number" ? (data as any).season : undefined,
      postAKey: aKey,
      postBKey: bKey,
      parsedContent: content ? parseDuelContent(String(content)) : undefined,
    });
  }

  duels.sort((a, b) => b.runAt.localeCompare(a.runAt));

  const rated = getRanking();
  const stats: RankingStats = {
    totalDuels: duels.length,
    totalRated: rated.length,
    lastDuelAt: duels.length > 0 ? duels[0].runAt : null,
    firstDuelAt: duels.length > 0 ? duels[duels.length - 1].runAt : null,
  };

  _statsCache = { stats, recent: duels };
  return _statsCache;
}

export function getRankingStats(): RankingStats {
  return loadDuelData().stats;
}

export function getRecentDuels(limit = 8): DuelEntry[] {
  return loadDuelData().recent.slice(0, limit);
}

export function getAllDuels(): DuelEntry[] {
  return loadDuelData().recent;
}
