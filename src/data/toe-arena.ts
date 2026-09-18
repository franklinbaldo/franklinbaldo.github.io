export type ScientificTier = "S" | "A" | "B" | "C" | "D" | "F" | "NR";
export type InterestTier = "S" | "A" | "B" | "C" | "D" | "F";

export interface ToeTheory {
  slug: string;
  name: string;
  kind: "contender" | "adjacent" | "exhibition";
  scientificTier: ScientificTier;
  interestTier: InterestTier;
  confidence: "low" | "medium" | "high";
  summary: string;
  strengths: string[];
  openProblems: string[];
  sourceLabel: string;
  sourceUrl: string;
  sourceDate?: string;
  note?: string;
  updated: string;
}

type ToeCardModule = {
  frontmatter: {
    type: "toe";
    name: string;
    kind: ToeTheory["kind"];
    scientific_tier: ScientificTier;
    interest_tier: InterestTier;
    confidence: ToeTheory["confidence"];
    summary: string;
    strengths: string[];
    open_problems: string[];
    source_label: string;
    source_url: string;
    source_date?: string;
    note?: string;
    updated: string | Date;
  };
};

const modules = import.meta.glob<ToeCardModule>("../../knowledge/toe/*.md", {
  eager: true,
});

export const toeTheories: ToeTheory[] = Object.entries(modules)
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
      kind: card.kind,
      scientificTier: card.scientific_tier,
      interestTier: card.interest_tier,
      confidence: card.confidence,
      summary: card.summary,
      strengths: card.strengths,
      openProblems: card.open_problems,
      sourceLabel: card.source_label,
      sourceUrl: card.source_url,
      sourceDate: card.source_date,
      note: card.note,
      updated,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const TOE_ARENA_UPDATED =
  toeTheories.map((theory) => theory.updated).sort().at(-1) ?? "unknown";

// Clashes are editorial relationships between cards. Individual ToE semantics
// remain canonical in knowledge/toe/*.md.
export const openingClashes = [
  {
    title: "String theory × Loop quantum gravity",
    battleground: "scope vs. background independence",
    body: "String theory brings a much broader unification programme; loop quantum gravity builds background independence directly into its quantization of geometry. The clash does not produce a winner: it exposes that they optimize for different bottlenecks.",
  },
  {
    title: "Asymptotic safety × Causal dynamical triangulations",
    battleground: "continuum RG vs. lattice emergence",
    body: "Asymptotic safety attacks ultraviolet completion through renormalization-group structure; CDT constructs a causal lattice path integral and asks whether continuum spacetime emerges. A decisive bridge would be evidence that both descriptions converge on the same universality class.",
  },
  {
    title: "Lim 2026 × established programmes",
    battleground: "new explicit unification claim vs. maturity",
    body: "The 2026 proposal gets credit for tackling force-plus-gravity unification explicitly, but it enters below mature programmes until independent calculations, low-energy recovery, and discriminating predictions accumulate. Novelty raises interest tier, not scientific tier.",
  },
  {
    title: "Holomorphic UFT × String theory",
    battleground: "four-dimensional specificity vs. ultraviolet maturity",
    body: "Holomorphic UFT offers a direct four-dimensional gravity-plus-Standard-Model construction with concrete mass-spectrum claims; string theory has vastly deeper ultraviolet and mathematical development. A decisive gain for the holomorphic programme would be independent reproduction of its finite quantum construction and a prediction that outperforms fitted low-energy inputs.",
  },
  {
    title: "USMEG-EFT × Asymptotic safety",
    battleground: "finite-domain EFT vs. ultraviolet completion",
    body: "USMEG-EFT treats the loss of controlled geometry near 10^18 GeV as a real boundary of its effective description; asymptotic safety instead seeks an interacting fixed point that remains predictive arbitrarily far into the ultraviolet. Evidence for a robust fixed point pushes toward asymptotic safety; a verified sharp breakdown plus the predicted one-loop structure would favor the USMEG picture. No tier move follows yet.",
  },
  {
    title: "ZEBTS × mature unification programmes",
    battleground: "breadth of claims vs. independent recovery",
    body: "ZEBTS is broader in advertised scope than almost every Arena entry, but breadth earns interest rather than scientific rank. To climb, the operator-spectral construction must independently recover established low-energy physics and survive external calculation; until then its enormous scope is a liability as much as an attraction.",
  },
];
