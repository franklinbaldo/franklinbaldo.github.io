export type SlopTier = "S" | "A" | "B" | "C" | "D" | "F";
export type InterestTier = "S" | "A" | "B" | "C" | "D" | "F";

export interface AiSlopEntry {
  slug: string;
  name: string;
  artifactType: string;
  creatorHandle?: string;
  slopTier: SlopTier;
  interestTier: InterestTier;
  confidence: "low" | "medium" | "high";
  summary: string;
  slopSignals: string[];
  redeemingFeatures: string[];
  aiMediationEvidence: string[];
  sourceLabel: string;
  sourceUrl: string;
  sourceUrls?: string[];
  observedAt?: string;
  note?: string;
  updated: string;
}

type AiSlopCardModule = {
  frontmatter: {
    type: "awesome-ai-slop";
    name: string;
    artifact_type: string;
    creator_handle?: string;
    slop_tier: SlopTier;
    interest_tier: InterestTier;
    confidence: AiSlopEntry["confidence"];
    summary: string;
    slop_signals: string[];
    redeeming_features: string[];
    ai_mediation_evidence: string[];
    source_label: string;
    source_url: string;
    source_urls?: string[];
    observed_at?: string | Date;
    note?: string;
    updated: string | Date;
  };
};

const modules = import.meta.glob<AiSlopCardModule>(
  "../../knowledge/awesome-ai-slop/*.md",
  { eager: true },
);

const dateString = (value: string | Date | undefined) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value ? String(value) : undefined;

export const awesomeAiSlop: AiSlopEntry[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split("/").at(-1)?.replace(/\.md$/, "") ?? path;
    const card = module.frontmatter;
    return {
      slug,
      name: card.name,
      artifactType: card.artifact_type,
      creatorHandle: card.creator_handle,
      slopTier: card.slop_tier,
      interestTier: card.interest_tier,
      confidence: card.confidence,
      summary: card.summary,
      slopSignals: card.slop_signals,
      redeemingFeatures: card.redeeming_features,
      aiMediationEvidence: card.ai_mediation_evidence,
      sourceLabel: card.source_label,
      sourceUrl: card.source_url,
      sourceUrls: card.source_urls,
      observedAt: dateString(card.observed_at),
      note: card.note,
      updated: dateString(card.updated) ?? "unknown",
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const AWESOME_AI_SLOP_UPDATED =
  awesomeAiSlop.map((entry) => entry.updated).sort().at(-1) ?? "sem casos ainda";
