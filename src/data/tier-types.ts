export const TIER_ORDER = ["S", "A", "B", "C", "D", "F"] as const;

export type Tier = (typeof TIER_ORDER)[number];
export type TierConfidence = "low" | "medium" | "high";

export interface TierEvidenceCell {
  label: string;
  value: string | number;
}

export interface TierLink {
  href: string;
  label: string;
}

export interface TierBoardItem {
  id: string;
  title: string;
  qualityTier: Tier;
  interestTier: Tier;
  confidence: TierConfidence;
  summary: string;
  reviewedAt?: string;
  note?: string;
  href?: string;
  evidence?: TierEvidenceCell[];
  strengths?: string[];
  openProblems?: string[];
  history?: string[];
  links?: TierLink[];
}
