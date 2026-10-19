export interface AiEpistemicConvergence {
  slug: string;
  name: string;
  hypothesisKey: string;
  summary: string;
  caseSlugs: string[];
  overlapDimensions: string[];
  independenceStatus: "established" | "partial" | "not-established" | "contaminated";
  evidenceQuality: "low" | "medium" | "high";
  independentCaseCount?: number;
  knownInfluences?: string[];
  testablePredictions?: string[];
  crossPollinationCandidates?: string[];
  contaminationNotes?: string[];
  sourceUrls?: string[];
  updated: string;
}

type ConvergenceModule = {
  frontmatter: {
    type: "ai-epistemic-convergence";
    name: string;
    hypothesis_key: string;
    summary: string;
    case_slugs: string[];
    overlap_dimensions: string[];
    independence_status: AiEpistemicConvergence["independenceStatus"];
    evidence_quality: AiEpistemicConvergence["evidenceQuality"];
    independent_case_count?: number;
    known_influences?: string[];
    testable_predictions?: string[];
    cross_pollination_candidates?: string[];
    contamination_notes?: string[];
    source_urls?: string[];
    updated: string | Date;
  };
};

const modules = import.meta.glob<ConvergenceModule>(
  "../../knowledge/ai-epistemic-convergences/*.md",
  { eager: true },
);

export const aiEpistemicConvergences: AiEpistemicConvergence[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split("/").at(-1)?.replace(/\.md$/, "") ?? path;
    const card = module.frontmatter;
    const updated =
      card.updated instanceof Date ? card.updated.toISOString().slice(0, 10) : String(card.updated);
    return {
      slug,
      name: card.name,
      hypothesisKey: card.hypothesis_key,
      summary: card.summary,
      caseSlugs: card.case_slugs,
      overlapDimensions: card.overlap_dimensions,
      independenceStatus: card.independence_status,
      evidenceQuality: card.evidence_quality,
      independentCaseCount: card.independent_case_count,
      knownInfluences: card.known_influences,
      testablePredictions: card.testable_predictions,
      crossPollinationCandidates: card.cross_pollination_candidates,
      contaminationNotes: card.contamination_notes,
      sourceUrls: card.source_urls,
      updated,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
