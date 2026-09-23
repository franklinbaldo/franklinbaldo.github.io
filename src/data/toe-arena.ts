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

// Clashes are editorial relations between cards; ToE semantics remain canonical
// in knowledge/toe/*.md.
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
  {
    title: "Geometric Action Principle × Holomorphic UFT",
    battleground: "single-action economy vs. explicit Standard Model recovery",
    body: "The Clifford action programme gets credit for deriving gravity, gauge and fermionic structures from one invariant and intersecting known healthy linearized gravity sectors. Holomorphic UFT currently goes further toward explicit Standard Model masses and mixings. The former needs realistic SM representations and full stability; the latter needs stronger independent reproduction. Neither clash warrants an A-tier promotion yet.",
  },
  {
    title: "Lucron Network × Loop quantum gravity / CDT",
    battleground: "discrete pregeometry and continuum recovery",
    body: "Lucron supplies explicit relational units, network dynamics and concrete falsifiers, but its exact Lorentz, Yang–Mills and particle-spectrum recovery remains unfinished. LQG and CDT have much deeper mathematical or numerical development but do not package the same broad Standard-Model ambition. A derivation of Lorentz symmetry and gauge structure from Lucron dynamics would materially change this comparison.",
  },
  {
    title: "Unified Emergence × Lucron Network",
    battleground: "continuum-first vs. discrete-first ontology",
    body: "Unified Emergence avoids fundamental discreteness and therefore the immediate burden of recovering continuum Lorentz symmetry, but its foundational coarse-graining operator is not yet specified well enough to carry the physics. Lucron is more calculationally explicit and falsifiable, but must show that its discrete substrate really reproduces continuum symmetries. For now this is a D-vs-C maturity gap, not a verdict on ontology.",
  },
  {
    title: "CronNet-Holo 600-cell × Holomorphic UFT",
    battleground: "sharp geometric predictions vs. independently validated recovery",
    body: "Both programmes claim explicit geometry-first routes to Standard-Model-plus-gravity structure. CronNet-Holo is unusually sharp about laboratory and parameter-level predictions, including the 12.8 THz target, but its current physical bridge is conditional on five hypotheses and lacks independent reproduction. Holomorphic UFT has the stronger peer-reviewed technical lineage but also needs broader external replication. A prospective CronNet-Holo prediction surviving independent testing would materially change this comparison; today it does not move either tier.",
  },
  {
    title: "AME(4,6) × Observer Patch Holography",
    battleground: "information-theoretic reconstruction of physical law",
    body: "AME(4,6) builds from a real perfect-tensor/quantum-code object and reaches aggressively into particle parameters and gravity, but the physical identification is unproved and several headline claims were later softened or partially retracted. Observer Patch Holography has stronger formal reconstruction and machine-checkable components, while still carrying an explicit physical-realization gap. Independent recovery of Einstein and chiral Standard-Model structure from either information substrate would be the relevant discriminator; no tier movement follows yet.",
  },
  {
    title: "Computational Finitism × Lucron Network",
    battleground: "finite discrete substrate vs. recovered continuum physics",
    body: "Both programmes try to recover matter, gravity and continuum behavior from a discrete microscopic substrate. Computational Finitism has a broad runnable simulation corpus and aggressive numerical claims, but its current bridge to precision Lorentz, chiral Standard-Model structure and running couplings is not independently established, and its decision-bearing paper introduces a new transfer mechanism after an explicit mobility failure. Lucron also has major unfinished Lorentz/Yang–Mills work but currently states those gaps more narrowly. Independent frozen-rule reproductions are the relevant discriminator; no Lucron tier move follows.",
  },
];
