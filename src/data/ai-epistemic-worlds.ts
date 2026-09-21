export type EvidenceTier = "S" | "A" | "B" | "C" | "D" | "F" | "NR";
export type InterestTier = "S" | "A" | "B" | "C" | "D" | "F";

export interface AiEpistemicWorld {
  slug: string;
  name: string;
  publicHandle: string;
  evidenceTier: EvidenceTier;
  interestTier: InterestTier;
  confidence: "low" | "medium" | "high";
  summary: string;
  worldType: string[];
  strengths: string[];
  openProblems: string[];
  sourceLabel: string;
  sourceUrl: string;
  sourceUrls?: string[];
  trajectory?: string[];
  aiRole?: string[];
  literalness?: string;
  note?: string;
  updated: string;
}

type WorldCardModule = {
  frontmatter: {
    type: "ai-epistemic-world";
    name: string;
    public_handle: string;
    evidence_tier: EvidenceTier;
    interest_tier: InterestTier;
    confidence: AiEpistemicWorld["confidence"];
    summary: string;
    world_type: string[];
    strengths: string[];
    open_problems: string[];
    source_label: string;
    source_url: string;
    source_urls?: string[];
    trajectory?: string[];
    ai_role?: string[];
    literalness?: string;
    note?: string;
    updated: string | Date;
  };
};

const modules = import.meta.glob<WorldCardModule>(
  "../../knowledge/ai-epistemic-worlds/*.md",
  { eager: true },
);

export const aiEpistemicWorlds: AiEpistemicWorld[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split("/").at(-1)?.replace(/\.md$/, "") ?? path;
    const card = module.frontmatter;
    const updated =
      card.updated instanceof Date
        ? card.updated.toISOString().slice(0, 10)
        : String(card.updated);

    return {
      slug,
      name: card.name,
      publicHandle: card.public_handle,
      evidenceTier: card.evidence_tier,
      interestTier: card.interest_tier,
      confidence: card.confidence,
      summary: card.summary,
      worldType: card.world_type,
      strengths: card.strengths,
      openProblems: card.open_problems,
      sourceLabel: card.source_label,
      sourceUrl: card.source_url,
      sourceUrls: card.source_urls,
      trajectory: card.trajectory,
      aiRole: card.ai_role,
      literalness: card.literalness,
      note: card.note,
      updated,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const AI_EPISTEMIC_WORLDS_UPDATED =
  aiEpistemicWorlds.map((world) => world.updated).sort().at(-1) ?? "unknown";
