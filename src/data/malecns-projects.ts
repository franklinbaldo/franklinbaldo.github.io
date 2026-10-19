import type { Tier, TierConfidence, TierLink } from "./tier-types";

export interface MaleCnsProjectRecord {
  slug: string;
  projectId: string;
  name: string;
  ownership: string;
  kind: string;
  stage: string;
  primaryUrl: string;
  repository?: string;
  evidenceUrl?: string;
  scientificTier: Tier;
  interestTier: Tier;
  confidence: TierConfidence;
  reviewedAt: string;
  reviewedRevision: string;
  summary: string;
  strongestEvidence: string[];
  limitations: string[];
  controls: string[];
  history: string[];
  note?: string;
  links: TierLink[];
}

type MaleCnsProjectModule = {
  frontmatter: {
    type: "malecns-project";
    project_id: string;
    name: string;
    ownership: string;
    kind: string;
    stage: string;
    primary_url: string;
    repository?: string;
    evidence_url?: string;
    scientific_tier: Tier;
    interest_tier: Tier;
    confidence: TierConfidence;
    reviewed_at: string | Date;
    reviewed_revision: string;
    summary: string;
    strongest_evidence: string[];
    limitations: string[];
    controls: string[];
    history: string[];
    note?: string;
  };
};

const modules = import.meta.glob<MaleCnsProjectModule>(
  "../../knowledge/malecns-projects/*.md",
  { eager: true },
);

function dateString(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
}

export const maleCnsProjects: MaleCnsProjectRecord[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split("/").at(-1)?.replace(/\.md$/, "") ?? path;
    const card = module.frontmatter;
    const links: TierLink[] = [];
    if (card.repository) {
      links.push({ label: "GitHub", href: `https://github.com/${card.repository}` });
    }
    if (card.evidence_url && card.evidence_url !== card.primary_url) {
      links.push({ label: "evidence", href: card.evidence_url });
    }
    return {
      slug,
      projectId: card.project_id,
      name: card.name,
      ownership: card.ownership,
      kind: card.kind,
      stage: card.stage,
      primaryUrl: card.primary_url,
      repository: card.repository,
      evidenceUrl: card.evidence_url,
      scientificTier: card.scientific_tier,
      interestTier: card.interest_tier,
      confidence: card.confidence,
      reviewedAt: dateString(card.reviewed_at),
      reviewedRevision: card.reviewed_revision,
      summary: card.summary,
      strongestEvidence: card.strongest_evidence,
      limitations: card.limitations,
      controls: card.controls,
      history: card.history,
      note: card.note,
      links,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const ids = new Set<string>();
for (const record of maleCnsProjects) {
  if (ids.has(record.projectId)) {
    throw new Error(`Duplicate MaleCNS project_id: ${record.projectId}`);
  }
  ids.add(record.projectId);
}
