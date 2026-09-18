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
}

type PaperCardModule = {
  frontmatter: {
    type: "paper";
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
  };
};

const modules = import.meta.glob<PaperCardModule>("../../knowledge/papers/*.md", {
  eager: true,
});

export const papers: Paper[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split("/").at(-1)?.replace(/\.md$/, "") ?? path;
    const card = module.frontmatter;

    return {
      slug,
      file: `${slug}.md`,
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
    };
  })
  .sort((a, b) => a.family.localeCompare(b.family) || a.title.localeCompare(b.title));
