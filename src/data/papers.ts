export type Tier = "S" | "A" | "B" | "C" | "D" | "F";
export type Confidence = "low" | "medium" | "high";

export interface Paper {
  slug: string;
  file: string;
  sourceUrl?: string;
  title: string;
  family: string;
  kind: string;
  scientificTier: Tier;
  interestTier: Tier;
  confidence: Confidence;
  idea: string;
  status: string;
  limit: string;
  relatedFile?: string;
  relatedLabel?: string;
  updated: string;
}

type PaperCardModule = {
  frontmatter: {
    type: "paper";
    file: string;
    source_url?: string;
    title: string;
    family: string;
    kind: string;
    scientific_tier: Tier;
    interest_tier: Tier;
    confidence: Confidence;
    idea: string;
    status: string;
    limit: string;
    related_file?: string;
    related_label?: string;
    updated: string | Date;
  };
};

const modules = import.meta.glob<PaperCardModule>("../../knowledge/papers/*.md", {
  eager: true,
});

export const papers: Paper[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split("/").at(-1)?.replace(/\.md$/, "") ?? path;
    const card = module.frontmatter;
    const updated =
      card.updated instanceof Date
        ? card.updated.toISOString().slice(0, 10)
        : String(card.updated);

    return {
      slug,
      file: card.file,
      sourceUrl: card.source_url,
      title: card.title,
      family: card.family,
      kind: card.kind,
      scientificTier: card.scientific_tier,
      interestTier: card.interest_tier,
      confidence: card.confidence,
      idea: card.idea,
      status: card.status,
      limit: card.limit,
      relatedFile: card.related_file,
      relatedLabel: card.related_label,
      updated,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export const PAPERS_UPDATED =
  papers.map((paper) => paper.updated).sort().at(-1) ?? "unknown";
