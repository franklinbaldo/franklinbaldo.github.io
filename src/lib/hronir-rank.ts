// Build-time bridge to the OpenSkill aggregator in scripts/hronir/.
// Reads .routines/hronir/*.md, runs OpenSkill, exposes a Map<key, RankRow>
// keyed by translationKey, plus a sorted array.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  computeRatings,
  computePerPerspectiveRatings,
} from "../hronir/ranking.js";
import { listMatchFiles, readMatch, postKey } from "../hronir/matches.js";
import { listPerspectives } from "../hronir/perspectives.js";
import type {
  RankRow,
  DuelContent,
  DuelEntry,
  RankingStats,
  PerspectiveMeta,
  PerspectiveRankRow,
  PerspectiveGridItem,
  RankingSnapshot,
} from "../hronir/types.js";

export type {
  RankRow,
  DuelContent,
  DuelEntry,
  RankingStats,
  PerspectiveMeta,
  PerspectiveRankRow,
  PerspectiveGridItem,
  RankingSnapshot,
};

export function duelId(
  d: Pick<DuelEntry, "postAKey" | "postBKey" | "runAt">
): string {
  const canonical = [d.postAKey ?? "", d.postBKey ?? "", d.runAt].join("|");
  return crypto
    .createHash("sha256")
    .update(canonical)
    .digest("hex")
    .slice(0, 8);
}

export function parseDuelContent(
  body?: string,
  data?: Record<string, unknown>
): DuelContent {
  const result: DuelContent = {
    postAAnalysis: "",
    postBAnalysis: "",
    verdict: "",
  };

  // Try markdown body first (original format with ## section headers)
  if (body) {
    const parts = body.split(/(?:^|\n)##\s+/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const lines = trimmed.split("\n");
      const header = lines[0].trim().toLowerCase();
      const content = lines.slice(1).join("\n").trim();
      if (header.startsWith("post a")) result.postAAnalysis = content;
      else if (header.startsWith("post b")) result.postBAnalysis = content;
      else if (header.startsWith("veredito") || header.startsWith("verdict"))
        result.verdict = content;
    }
    if (result.postAAnalysis || result.postBAnalysis || result.verdict)
      return result;
  }

  // Fall back to frontmatter fields (stars-v1 / migrated passion-v1)
  if (data) {
    if (data.clash) result.verdict = String(data.clash);
    if (data.review_a) result.postAAnalysis = String(data.review_a);
    if (data.review_b) result.postBAnalysis = String(data.review_b);
  }

  return result;
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
    if (aKey === bKey) continue;

    const rawRunAt = (data as any).run_at ?? (data as any).run_id ?? "";
    const runAt =
      rawRunAt instanceof Date ? rawRunAt.toISOString() : String(rawRunAt);
    // Skip matches without a parseable timestamp: an empty runAt would
    // sort ahead of every real duel in the "Latest duels" list and
    // render with a placeholder date, which is worse than not showing it.
    if (!runAt) continue;

    const winnerKey = winner === "a" ? aKey : bKey;
    const loserKey = winner === "a" ? bKey : aKey;

    const agentId = (data as any).agent_id
      ? String((data as any).agent_id)
      : undefined;

    const entry: DuelEntry = {
      id: "",
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
      model: agentId,
      agentId,
      season:
        typeof (data as any).season === "number"
          ? (data as any).season
          : undefined,
      postAKey: aKey,
      postBKey: bKey,
      perspectiveId: (data as any).perspective_id
        ? String((data as any).perspective_id)
        : undefined,
      rateA:
        typeof (data as any).rate_a === "number"
          ? (data as any).rate_a
          : undefined,
      rateB:
        typeof (data as any).rate_b === "number"
          ? (data as any).rate_b
          : undefined,
      evaluatorMood: (data as any).evaluator_mood
        ? String((data as any).evaluator_mood)
        : undefined,
      evaluatorMoodAfter: (data as any).evaluator_mood_after
        ? String((data as any).evaluator_mood_after)
        : undefined,
      parsedContent: parseDuelContent(
        content ? String(content).trim() : undefined,
        data as Record<string, unknown>
      ),
    };
    entry.id = duelId(entry);
    duels.push(entry);
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

export function getPerspectives(): PerspectiveMeta[] {
  // listPerspectives() returns {id,name,summary,body,path}[] from JS — we
  // strip the extra fields here so callers only receive the typed subset.
  const all = listPerspectives() as unknown as Array<{
    id: string;
    name: string;
    summary: string;
  }>;
  return all.map((p) => ({ id: p.id, name: p.name, summary: p.summary }));
}

export function getPerPerspectiveRankings(): Map<string, PerspectiveRankRow[]> {
  // computePerPerspectiveRatings() returns Map<string, {key,ordinal,appearances,wins}[]>
  // which matches PerspectiveRankRow[] exactly.
  return computePerPerspectiveRatings() as unknown as Map<
    string,
    PerspectiveRankRow[]
  >;
}

export function getDuelById(id: string): DuelEntry | undefined {
  return getAllDuels().find((d) => d.id === id);
}

export function getPostDuelHistory(key: string): DuelEntry[] {
  return getAllDuels().filter((d) => d.postAKey === key || d.postBKey === key);
}

const SNAPSHOT_PATH = path.join(
  process.cwd(),
  "src/generated/ranking-snapshot.json"
);

let _snapshotCache: RankingSnapshot | null | undefined = undefined;

export function loadSnapshot(): RankingSnapshot | null {
  if (_snapshotCache !== undefined) return _snapshotCache;
  try {
    const raw = fs.readFileSync(SNAPSHOT_PATH, "utf8");
    _snapshotCache = JSON.parse(raw) as RankingSnapshot;
  } catch {
    _snapshotCache = null;
  }
  return _snapshotCache;
}

export function getSnapshotDelta(key: string): number | null {
  const snapshot = loadSnapshot();
  if (!snapshot) return null;
  const prev = snapshot.keys[key];
  if (!prev) return null;
  const current = getRankByKey().get(key);
  if (!current) return null;
  return prev.rank - current.rank;
}

function perspectiveHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) & 0xffff;
  }
  return Math.abs(h) % 360;
}

export function buildPerspectivesGrid(
  postByKey: Map<string, { title: string; slug: string; lang: string }>
): PerspectiveGridItem[] {
  const perspectives = getPerspectives();
  const perPerspective = getPerPerspectiveRankings();
  return perspectives.map((p) => {
    const rows = perPerspective.get(p.id) ?? [];
    const leaderKey = rows[0]?.key;
    const leaderPost = leaderKey ? postByKey.get(leaderKey) : undefined;
    const leaderHref = leaderPost
      ? leaderPost.lang === "pt"
        ? `/pt/blog/${leaderPost.slug}/`
        : `/blog/${leaderPost.slug}/`
      : null;
    return {
      id: p.id,
      name: p.name,
      summary: p.summary,
      leaderTitle: leaderPost?.title ?? null,
      leaderHref,
      hue: perspectiveHue(p.id),
    };
  });
}
