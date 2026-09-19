export type Tier = "S" | "A" | "B" | "C" | "D" | "F";
export type Confidence = "low" | "medium" | "high";

export interface PaperRelation {
  type: string;
  target: string;
  note?: string;
}

export interface Paper {
  slug: string;
  sourceUrl: string;
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
  relations: PaperRelation[];
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
    relations?: PaperRelation[];
  };
};

const repo = "https://github.com/franklinbaldo/papers/blob/main/";
const modules = import.meta.glob<PaperCardModule>("../../knowledge/papers/*.md", {
  eager: true,
});

export const papers: Paper[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split("/").at(-1)?.replace(/\.md$/, "") ?? path;
    const card = module.frontmatter;

    return {
      slug,
      sourceUrl: card.source_url ?? `${repo}${slug}.md`,
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
      relations: card.relations ?? [],
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

const slugs = new Set(papers.map((paper) => paper.slug));
for (const paper of papers) {
  for (const relation of paper.relations) {
    if (!slugs.has(relation.target)) {
      throw new Error(
        `Paper ${paper.slug} relates to unknown paper slug ${relation.target}`,
      );
    }
  }
}
