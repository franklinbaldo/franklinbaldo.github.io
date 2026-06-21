// Shared type definitions for the Hrönir ranking system.
// Consumed by both the CLI (scripts/hronir/) and the site (src/).

// ── Rate file (stars-v1 schema) ────────────────────────────────────────────

export interface PostSide {
  key: string;
  path: string;
  display_lang?: "en" | "pt";
  version?: string;
  /** RFC 0012 §4.2: language of this side's text. Written in stars-v3;
   *  derived from the post frontmatter / `display_lang` for older files. */
  content_lang?: "en" | "pt";
}

export interface RateFile {
  // RFC 0012 §4.2: stars-v1/v2 stay valid and are classified `legacy`; new
  // sessions write stars-v3. `schema` is historically only ever "stars-v1";
  // the active marker is `prompt_version`.
  schema?: "stars-v1";
  prompt_version?: string;
  /** RFC 0012 §4.1: redundant with `aKey === bKey`, validated against it,
   *  never trusted in isolation. Written for human inspection in stars-v3. */
  match_kind?: MatchKind;
  /** RFC 0012 §6: language the review/clash was written in. Supersedes the
   *  ambiguous `eval_lang` for stars-v3 files. */
  review_lang?: "en" | "pt";
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

// ── Normalized match (RFC 0012) ─────────────────────────────────────────────

// RFC 0012 §4.1: a match is `version` when both sides judge versions of the
// same post (post_a.key === post_b.key) and `work` otherwise. The distinction
// is structural — derivable from the rate file alone — not a regime of
// evaluation (those live in RFC 0013). The classification is computed at load
// time so every consumer (ranking, UI, snapshot, doctor) shares one source of
// truth instead of re-deriving `aKey === bKey` ad hoc.
export type MatchKind = "work" | "version";

export interface NormalizedMatchSide {
  key: string;
  /** slug@uuid — the exact version judged. Null when no version is recorded. */
  ref: string | null;
  /** Cached file path; convenience for the UI, never an identity. */
  path: string | null;
  version: string | null;
  contentLang: string | null;
}

// RFC 0012 §4.1. The single normalized shape the Fase 1 normalizer will emit;
// declared here in Fase 0 so types land before any consumer migrates. It does
// NOT carry an evaluation `mode` — regimes of evaluation are RFC 0013 and are
// asserted (not derived), so they must not ride on this structural record.
export interface NormalizedMatch {
  id: string;
  kind: MatchKind;
  winnerSide: "a" | "b";
  runAt: Date | null;
  postA: NormalizedMatchSide;
  postB: NormalizedMatchSide;
  /** Language the review/clash was written in (RFC 0012 §6). */
  reviewLang: string | null;
  agentId: string | null;
  perspectiveId: string | null;
  rateA: number | null;
  rateB: number | null;
  evaluatorMood: string | null;
  evaluatorMoodAfter: string | null;
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
  /** Which side won, after override resolution. In version duels both sides
   *  share the same key, so winnerKey alone cannot identify the side. */
  winnerSide?: "a" | "b";
  /** True when both sides are versions of the same post (post_a.key ===
   *  post_b.key). Excluded from essay rankings but kept in the archive. */
  isVersionDuel?: boolean;
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
  /** RFC 0012 §6.2: slug@uuid of each side — the exact version judged. Equal
   *  keys on both sides (a version duel) still resolve to two distinct refs. */
  postARef?: string | null;
  postBRef?: string | null;
  postAVersion?: string | null;
  postBVersion?: string | null;
  /** Source file path of each side's version — used to build permalinks to the
   *  exact content judged in a version trial. */
  postAPath?: string | null;
  postBPath?: string | null;
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
    schema?: string;
    basis: "build" | "season";
    totalDuels: number;
  };
  keys: Record<
    string,
    { rank: number; ordinal: number; elo?: number; eloPeak?: number }
  >;
}
