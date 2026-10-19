import {
  computeAbsoluteQuality,
  computeDeconfoundedQuality,
  computePerPerspectiveRatings,
  computeRatings,
} from "../hronir/ranking.js";
import { isNormalEditorialTierKey } from "../hronir/tier-scope.js";

import type { Tier, TierConfidence } from "./tier-types";

export type BlogPostTier = Tier;
export type BlogPostTierConfidence = TierConfidence;

export interface BlogPostTierEvidence {
  rank: number | null;
  ordinal: number | null;
  mu: number | null;
  sigma: number | null;
  wins: number;
  appearances: number;
  absoluteStars: number | null;
  absoluteN: number;
  deconfoundedQuality: number | null;
  deconfoundedN: number;
  perspectiveCount: number;
  perspectiveTop10Count: number;
}

export interface BlogPostTierRecord {
  slug: string;
  translationKey: string;
  qualityTier: BlogPostTier;
  interestTier: BlogPostTier;
  confidence: BlogPostTierConfidence;
  reviewedAt: string;
  reviewedRevision: string;
  summary: string;
  strengths: string[];
  openProblems: string[];
  history: string[];
  note?: string;
  evidence: BlogPostTierEvidence;
}

type BlogPostTierModule = {
  frontmatter: {
    type: "blog-post-tier";
    translation_key: string;
    quality_tier: BlogPostTier;
    interest_tier: BlogPostTier;
    confidence: BlogPostTierConfidence;
    reviewed_at: string | Date;
    reviewed_revision: string;
    summary: string;
    strengths: string[];
    open_problems: string[];
    history: string[];
    note?: string;
  };
};

const modules = import.meta.glob<BlogPostTierModule>(
  "../../knowledge/blog-post-tiers/*.md",
  { eager: true },
);

const ratings = computeRatings();
const absolute = computeAbsoluteQuality();
const deconfounded = computeDeconfoundedQuality().quality;
const perPerspective = computePerPerspectiveRatings();

const ratingByKey = new Map(ratings.map((row, index) => [row.key, { row, rank: index + 1 }]));

function evidenceFor(translationKey: string): BlogPostTierEvidence {
  const ranked = ratingByKey.get(translationKey);
  const abs = absolute.get(translationKey);
  const deconf = deconfounded.get(translationKey);

  let perspectiveCount = 0;
  let perspectiveTop10Count = 0;
  for (const rows of perPerspective.values()) {
    const index = rows.findIndex((row) => row.key === translationKey);
    if (index < 0) continue;
    perspectiveCount += 1;
    if (index < 10) perspectiveTop10Count += 1;
  }

  return {
    rank: ranked?.rank ?? null,
    ordinal: ranked?.row.ordinal ?? null,
    mu: ranked?.row.mu ?? null,
    sigma: ranked?.row.sigma ?? null,
    wins: ranked?.row.wins ?? 0,
    appearances: ranked?.row.appearances ?? 0,
    absoluteStars: abs?.stars ?? null,
    absoluteN: abs?.n ?? 0,
    deconfoundedQuality: deconf?.quality ?? null,
    deconfoundedN: deconf?.n ?? 0,
    perspectiveCount,
    perspectiveTop10Count,
  };
}

function dateString(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
}

export const blogPostTiers: BlogPostTierRecord[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split("/").at(-1)?.replace(/\.md$/, "") ?? path;
    const card = module.frontmatter;
    return {
      slug,
      translationKey: card.translation_key,
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
      evidence: evidenceFor(card.translation_key),
    };
  })
  // Music now has its own audio-first tier domain. Keep legacy music-* cards
  // in the repository for provenance, but do not project them as normal posts.
  .filter((record) => isNormalEditorialTierKey(record.translationKey))
  .sort((a, b) => {
    const aRank = a.evidence.rank ?? Number.MAX_SAFE_INTEGER;
    const bRank = b.evidence.rank ?? Number.MAX_SAFE_INTEGER;
    return aRank - bRank || a.translationKey.localeCompare(b.translationKey);
  });

const keys = new Set<string>();
for (const record of blogPostTiers) {
  if (keys.has(record.translationKey)) {
    throw new Error(`Duplicate blog-post-tier translation_key: ${record.translationKey}`);
  }
  keys.add(record.translationKey);
}

export const BLOG_POST_TIERS_UPDATED =
  blogPostTiers.map((record) => record.reviewedAt).sort().at(-1) ?? "unknown";
