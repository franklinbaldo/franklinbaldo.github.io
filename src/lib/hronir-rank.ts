// Build-time bridge to the OpenSkill aggregator in scripts/hronir/.
// Reads .routines/hronir/*.md, runs OpenSkill, exposes a Map<key, RankRow>
// keyed by translationKey, plus a sorted array.

import fs from "node:fs";
import path from "node:path";
import {
  computeRatings,
  computePerPerspectiveRatings,
} from "../hronir/ranking.js";
import { loadMatches, matchId } from "../hronir/matches.js";
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
  // RFC 0012: id generation lives in matches.matchId so the duel list and the
  // normalizer agree on the value byte-for-byte.
  return matchId(d.postAKey ?? "", d.postBKey ?? "", d.runAt);
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
  // RFC 0012 §4.1: built from the single normalizer. Structural decisions
  // (winner side, keys, work/version kind, id, runAt) come from the normalized
  // record; passthrough display fields are still read straight off the raw
  // frontmatter so the rendered duel is byte-for-byte what it was before.
  for (const lm of loadMatches()) {
    const n = lm.norm;
    const runAt = lm.runAtRaw;
    // Skip matches without a parseable timestamp: an empty runAt would
    // sort ahead of every real duel in the "Latest duels" list and
    // render with a placeholder date, which is worse than not showing it.
    if (!runAt) continue;

    const data = lm.data as any;
    const content = lm.content;
    const aKey = n.postA.key;
    const bKey = n.postB.key;
    const winnerKey = n.winnerSide === "a" ? aKey : bKey;
    const loserKey = n.winnerSide === "a" ? bKey : aKey;
    const agentId = data.agent_id ? String(data.agent_id) : undefined;

    duels.push({
      id: n.id,
      runAt,
      winnerKey,
      loserKey,
      winnerSide: n.winnerSide,
      isVersionDuel: n.kind === "version",
      margin: typeof data.margin === "number" ? data.margin : undefined,
      confidence: data.confidence ? String(data.confidence) : undefined,
      criterion: data.criterion ? String(data.criterion) : undefined,
      body: content ? String(content).trim() : undefined,
      model: agentId,
      agentId,
      season: typeof data.season === "number" ? data.season : undefined,
      postAKey: aKey,
      postBKey: bKey,
      postARef: n.postA.ref,
      postBRef: n.postB.ref,
      postAVersion: n.postA.version,
      postBVersion: n.postB.version,
      postAPath: n.postA.path,
      postBPath: n.postB.path,
      reviewLang: n.reviewLang,
      postAContentLang: n.postA.contentLang,
      postBContentLang: n.postB.contentLang,
      perspectiveId: data.perspective_id
        ? String(data.perspective_id)
        : undefined,
      rateA: typeof data.rate_a === "number" ? data.rate_a : undefined,
      rateB: typeof data.rate_b === "number" ? data.rate_b : undefined,
      evaluatorMood: data.evaluator_mood
        ? String(data.evaluator_mood)
        : undefined,
      evaluatorMoodAfter: data.evaluator_mood_after
        ? String(data.evaluator_mood_after)
        : undefined,
      parsedContent: parseDuelContent(
        content ? String(content).trim() : undefined,
        data as Record<string, unknown>
      ),
    });
  }

  duels.sort((a, b) => b.runAt.localeCompare(a.runAt));

  // RFC 0012 §6.1: editorial stats count only work duels. Version trials have
  // their own surface and must not inflate "duels run".
  const work = duels.filter((d) => !d.isVersionDuel);
  const rated = getRanking();
  const stats: RankingStats = {
    totalDuels: work.length,
    totalRated: rated.length,
    lastDuelAt: work.length > 0 ? work[0].runAt : null,
    firstDuelAt: work.length > 0 ? work[work.length - 1].runAt : null,
  };

  _statsCache = { stats, recent: duels };
  return _statsCache;
}

export function getRankingStats(): RankingStats {
  return loadDuelData().stats;
}

// RFC 0012 §6.1: "recent battles" on the ranking home are editorial only.
export function getRecentDuels(limit = 8): DuelEntry[] {
  return getDuels({ kind: "work" }).slice(0, limit);
}

// The raw archive (every duel, both kinds). Used by id resolution; public
// listings should call getDuels({ kind }) with an explicit kind instead.
export function getAllDuels(): DuelEntry[] {
  return loadDuelData().recent;
}

// RFC 0012 §6.2: all version trials, newest first.
export function getVersionTrials(): DuelEntry[] {
  return getDuels({ kind: "version" });
}

// Version trials for one post key (both sides share the key).
export function getPostVersionTrials(key: string): DuelEntry[] {
  return getDuels({ kind: "version" }).filter((d) => d.postAKey === key);
}

// RFC 0012 §6.4: the canonical duel accessor. `kind` is required — there is no
// ambiguous default. "work" = editorial battles between distinct posts;
// "version" = revision trials of one post; "all" = the raw archive. Fase 2
// migrates the public surfaces (battles, dossiers, stats) onto this so they
// stop mixing the two universes.
export function getDuels(opts: {
  kind: "work" | "version" | "all";
}): DuelEntry[] {
  const all = loadDuelData().recent;
  if (opts.kind === "all") return all;
  return all.filter(
    (d) => (d.isVersionDuel ? "version" : "work") === opts.kind
  );
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

// RFC 0012 §6.3: a post's editorial record is work duels only. Version trials
// live in the dossier's "Edit history" section via getPostVersionTrials.
export function getPostDuelHistory(key: string): DuelEntry[] {
  return getDuels({ kind: "work" }).filter(
    (d) => d.postAKey === key || d.postBKey === key
  );
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
