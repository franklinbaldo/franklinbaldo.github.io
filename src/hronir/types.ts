// Shared type definitions for the Hrönir ranking system.
// Consumed by both the CLI (scripts/hronir/) and the site (src/).

// ── Rate file (stars-v1 schema) ────────────────────────────────────────────

export interface PostSide {
  key: string;
  path: string;
  display_lang?: "en" | "pt";
  version?: string;
}

export interface RateFile {
  schema?: "stars-v1";
  prompt_version?: string;
  agent_id?: string;
  run_at?: string | Date;
  season?: number;
  post_a: PostSide;
  post_b: PostSide;
  winner?: "a" | "b" | "TODO";
  override?: "a" | "b" | "null" | null;
  winner_reason?: string;
  rate_a?: number;
  rate_b?: number;
  review_a?: string;
  review_b?: string;
  clash?: string;
  eval_lang?: "en" | "pt";
  perspective_id?: string;
  evaluator_mood?: string | null;
  evaluator_mood_after?: string | null;
  mood_glyph?: string | null;
  margin?: number;
  confidence?: string;
  criterion?: string;
}

// ── Ranking ────────────────────────────────────────────────────────────────

export interface RankRow {
  key: string;
  mu: number;
  sigma: number;
  ordinal: number;
  appearances: number;
  wins: number;
  path: string;
}

// ── Duel (as consumed by the site) ─────────────────────────────────────────

export interface DuelContent {
  postAAnalysis: string;
  postBAnalysis: string;
  verdict: string;
}

export interface DuelEntry {
  /** 8-char SHA-256 hash of postAKey|postBKey|runAt — stable URL identifier. */
  id: string;
  runAt: string;
  winnerKey: string;
  loserKey: string;
  margin?: number;
  confidence?: string;
  criterion?: string;
  body?: string;
  /** @deprecated use agentId */
  model?: string;
  agentId?: string;
  season?: number;
  postAKey?: string;
  postBKey?: string;
  perspectiveId?: string;
  rateA?: number;
  rateB?: number;
  evaluatorMood?: string;
  evaluatorMoodAfter?: string;
  parsedContent?: DuelContent;
}

export interface RankingStats {
  totalDuels: number;
  totalRated: number;
  lastDuelAt: string | null;
  firstDuelAt: string | null;
}

// ── Perspectives ───────────────────────────────────────────────────────────

export interface PerspectiveMeta {
  id: string;
  name: string;
  summary: string;
}

export interface PerspectiveRankRow {
  key: string;
  ordinal: number;
  appearances: number;
  wins: number;
}

export interface PerspectiveGridItem {
  id: string;
  name: string;
  summary: string;
  leaderTitle: string | null;
  leaderHref: string | null;
  hue: number;
}

export interface RankingSnapshot {
  _meta: {
    generatedAt: string | null;
    basis: "build" | "season";
    totalDuels: number;
  };
  keys: Record<string, { rank: number; ordinal: number }>;
}
