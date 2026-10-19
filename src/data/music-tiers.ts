import { computeRatings } from "../suno-rank/ranking.js";
import type { Tier, TierConfidence } from "./tier-types";

export interface MusicTierEvidence {
  rank: number | null;
  ordinal: number | null;
  mu: number | null;
  sigma: number | null;
  wins: number;
  appearances: number;
}

export interface MusicTierRecord {
  slug: string;
  sunoId: string;
  title: string;
  qualityTier: Tier;
  interestTier: Tier;
  confidence: TierConfidence;
  reviewedAt: string;
  reviewedRevision: string;
  summary: string;
  strengths: string[];
  openProblems: string[];
  history: string[];
  note?: string;
  evidence: MusicTierEvidence;
}

type MusicTierModule = {
  frontmatter: {
    type: "music-tier";
    suno_id: string;
    title: string;
    quality_tier: Tier;
    interest_tier: Tier;
    confidence: TierConfidence;
    reviewed_at: string | Date;
    reviewed_revision: string;
    summary: string;
    strengths: string[];
    open_problems: string[];
    history: string[];
    note?: string;
  };
};

const modules = import.meta.glob<MusicTierModule>(
  "../../knowledge/music-tiers/*.md",
  { eager: true },
);

const ratings = computeRatings();
const ratingById = new Map(ratings.map((row, index) => [row.key, { row, rank: index + 1 }]));

function dateString(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
}

function evidenceFor(sunoId: string): MusicTierEvidence {
  const ranked = ratingById.get(sunoId);
  return {
    rank: ranked?.rank ?? null,
    ordinal: ranked?.row.ordinal ?? null,
    mu: ranked?.row.mu ?? null,
    sigma: ranked?.row.sigma ?? null,
    wins: ranked?.row.wins ?? 0,
    appearances: ranked?.row.appearances ?? 0,
  };
}

export const musicTiers: MusicTierRecord[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split("/").at(-1)?.replace(/\.md$/, "") ?? path;
    const card = module.frontmatter;
    return {
      slug,
      sunoId: card.suno_id,
      title: card.title,
      qualityTier: card.quality_tier,
      interestTier: card.interest_tier,
      confidence: card.confidence,
      reviewedAt: dateString(card.reviewed_at),
      reviewedRevision: card.reviewed_revision,
      summary: card.summary,
      strengths: card.strengths,
      openProblems: card.open_problems,
      history: card.history,
      note: card.note,
      evidence: evidenceFor(card.suno_id),
    };
  })
  .sort((a, b) => {
    const aRank = a.evidence.rank ?? Number.MAX_SAFE_INTEGER;
    const bRank = b.evidence.rank ?? Number.MAX_SAFE_INTEGER;
    return aRank - bRank || a.title.localeCompare(b.title);
  });

const ids = new Set<string>();
for (const record of musicTiers) {
  if (ids.has(record.sunoId)) throw new Error(`Duplicate music-tier suno_id: ${record.sunoId}`);
  ids.add(record.sunoId);
}
