import type { Tier, TierConfidence } from "./tier-types";

export interface ProjectTierRecord {
  slug: string;
  repository: string;
  name: string;
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
}

type ProjectTierModule = {
  frontmatter: {
    type: "project-tier";
    repository: string;
    name: string;
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

const modules = import.meta.glob<ProjectTierModule>(
  "../../knowledge/project-tiers/*.md",
  { eager: true },
);

function dateString(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
}

export const projectTiers: ProjectTierRecord[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split("/").at(-1)?.replace(/\.md$/, "") ?? path;
    const card = module.frontmatter;
    return {
      slug,
      repository: card.repository,
      name: card.name,
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
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const repositories = new Set<string>();
for (const record of projectTiers) {
  if (repositories.has(record.repository)) {
    throw new Error(`Duplicate project-tier repository: ${record.repository}`);
  }
  repositories.add(record.repository);
}
