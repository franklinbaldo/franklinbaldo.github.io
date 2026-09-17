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
}

export const TOE_ARENA_UPDATED = "2026-09-17";

export const toeTheories: ToeTheory[] = [
  {
    slug: "string-m-theory",
    name: "String theory / M-theory",
    kind: "contender",
    scientificTier: "A",
    interestTier: "S",
    confidence: "medium",
    summary:
      "A broad quantum-gravity and unification programme in which fundamental excitations are extended objects and apparently different string theories are connected through dualities and M-theory. It has unusually deep mathematical development and can incorporate gravity and gauge interactions, but still lacks a uniquely selected low-energy world and direct empirical confirmation.",
    strengths: [
      "Includes a quantum graviton naturally and has a broad framework for gauge interactions.",
      "Large body of technically mature work, dualities, black-hole microstate calculations, and links to quantum field theory.",
      "Offers one of the broadest existing unification programmes rather than only a quantization of gravity."
    ],
    openProblems: [
      "No direct experimental confirmation of string-specific physics.",
      "Vacuum selection / landscape makes a unique route to the observed Standard Model difficult.",
      "Many characteristic effects are expected near scales that are hard to probe directly."
    ],
    sourceLabel: "Living Reviews / string-theory literature",
    sourceUrl: "https://arxiv.org/abs/hep-th/9810188",
    note: "Opening-season placement: mature benchmark contender, but A rather than S because empirical discrimination remains the central gap."
  },
  {
    slug: "loop-quantum-gravity",
    name: "Loop quantum gravity",
    kind: "contender",
    scientificTier: "A",
    interestTier: "A",
    confidence: "medium",
    summary:
      "A non-perturbative, background-independent quantization programme for general relativity with discrete spectra for geometric observables such as area and volume. It is a mature quantum-gravity research programme, though its scope is narrower than a complete unification of all fundamental interactions.",
    strengths: [
      "Mathematically developed background-independent quantization of geometry.",
      "Concrete results for geometric spectra and extensive work on black holes and cosmology.",
      "Long-running independent research programme with many formulations and applications."
    ],
    openProblems: [
      "Dynamics and the recovery of smooth low-energy spacetime remain central issues.",
      "Standard Model matter and full force unification are not automatically delivered by the core framework.",
      "Distinctive experimentally accessible signatures remain difficult to isolate."
    ],
    sourceLabel: "Carlo Rovelli, Loop Quantum Gravity",
    sourceUrl: "https://arxiv.org/abs/gr-qc/9710008",
    sourceDate: "1997-10-01",
    note: "A as a quantum-gravity programme; the Arena displays the scope limitation explicitly rather than pretending every contender solves the same problem."
  },
  {
    slug: "asymptotic-safety",
    name: "Asymptotic safety",
    kind: "contender",
    scientificTier: "A",
    interestTier: "A",
    confidence: "medium",
    summary:
      "A quantum-gravity programme in which gravity can remain predictive at arbitrarily high energies if the renormalization-group flow approaches a suitable ultraviolet fixed point. Recent work continues to connect the scenario to black-hole phenomenology and matter systems.",
    strengths: [
      "Uses the established language of quantum field theory and renormalization-group flow.",
      "Substantial non-perturbative calculation programme and active phenomenology.",
      "Potentially conservative UV completion without requiring a wholly new microscopic ontology."
    ],
    openProblems: [
      "The existence and properties of the required fixed point must survive truncation/systematic-control questions.",
      "A complete, compelling derivation of observed matter content and parameters remains open.",
      "Phenomenological signals are not yet decisive evidence for the framework."
    ],
    sourceLabel: "Andrea Spina, Black Holes in Asymptotic Safety (review)",
    sourceUrl: "https://arxiv.org/abs/2510.14552",
    sourceDate: "2025-10-16"
  },
  {
    slug: "causal-dynamical-triangulations",
    name: "Causal dynamical triangulations",
    kind: "contender",
    scientificTier: "B",
    interestTier: "A",
    confidence: "medium",
    summary:
      "A non-perturbative, background-independent lattice path-integral approach to Lorentzian quantum gravity. Numerical work has produced quantitative Planck-scale observables and emergent large-scale geometries, but the programme is chiefly a theory of quantum spacetime rather than a complete unification of matter and forces.",
    strengths: [
      "Direct computational access to a non-perturbative Planckian regime.",
      "Emergent de Sitter-like large-scale geometry and scale-dependent spectral dimension are concrete outputs.",
      "Clear numerical programme with increasingly refined observables."
    ],
    openProblems: [
      "Continuum limit and connection to complete low-energy physics remain active research questions.",
      "Matter and Standard Model unification are not part of the core success story.",
      "Current quantitative results do not yet amount to experimentally unique predictions."
    ],
    sourceLabel: "Ambjørn & Loll, Causal Dynamical Triangulations: Gateway to Nonperturbative Quantum Gravity",
    sourceUrl: "https://arxiv.org/abs/2401.09399",
    sourceDate: "2024-01-17"
  },
  {
    slug: "lim-lqg-toe-2026",
    name: "From Loop Quantum Gravity to a Theory of Everything",
    kind: "contender",
    scientificTier: "C",
    interestTier: "A",
    confidence: "low",
    summary:
      "Adrian P. C. Lim's 2026 proposal combines Chern–Simons gauge structures with an Einstein–Hilbert / loop-quantum-gravity construction and proposes Wilson-loop observables carrying both gauge and gravitational representation data. It explicitly aims at unifying fundamental forces with gravity.",
    strengths: [
      "Explicit recent attempt at the exact ToE problem rather than only quantum gravity.",
      "Mathematical construction is concrete enough to expose claims and possible failure modes.",
      "Connects established gauge-theory and loop-quantization machinery."
    ],
    openProblems: [
      "Very recent and not yet a mature independently developed research programme.",
      "No established empirical evidence discriminating it from other approaches.",
      "The route from the construction to the observed detailed Standard Model spectrum and low-energy phenomenology requires much more development."
    ],
    sourceLabel: "Adrian P. C. Lim, From Loop Quantum Gravity to a Theory of Everything",
    sourceUrl: "https://arxiv.org/abs/2601.03292",
    sourceDate: "2026-01-05",
    note: "This is the opening season's 'new challenger': high-interest, conservative scientific placement pending independent scrutiny."
  },
  {
    slug: "informational-time",
    name: "Time as Concatenation / Informational Time",
    kind: "exhibition",
    scientificTier: "NR",
    interestTier: "A",
    confidence: "high",
    summary:
      "Franklin Baldo's position paper defines informational time as accumulated causal distinction between interacting agents and proposes experiments around recursive tokenization, symmetry, and critical recognition time. It is included as a local exhibition entry, not as a Theory of Everything contender.",
    strengths: [
      "Explicit operational quantities and proposed falsifiable experiments.",
      "Carefully separates causal, representational, physical, algorithmic, and semantic claims.",
      "Useful bridge between information, agency, compression, and causal depth."
    ],
    openProblems: [
      "The quantities still require empirical measurement in natural or artificial systems.",
      "It does not claim to unify gravity with the Standard Model or replace physical time.",
      "As a position paper, its central experimental programme is still prospective."
    ],
    sourceLabel: "Franklin Baldo, Time as Concatenation",
    sourceUrl: "https://github.com/franklinbaldo/papers/blob/main/informational_time.md",
    sourceDate: "2026-07-30",
    note: "NR is intentional: the paper itself says its scope is narrower than a general metaphysics or replacement for physical time."
  }
];

export const openingClashes = [
  {
    title: "String theory × Loop quantum gravity",
    battleground: "scope vs. background independence",
    body: "String theory brings a much broader unification programme; loop quantum gravity builds background independence directly into its quantization of geometry. The clash does not produce a winner: it exposes that they optimize for different bottlenecks."
  },
  {
    title: "Asymptotic safety × Causal dynamical triangulations",
    battleground: "continuum RG vs. lattice emergence",
    body: "Asymptotic safety attacks ultraviolet completion through renormalization-group structure; CDT constructs a causal lattice path integral and asks whether continuum spacetime emerges. A decisive bridge would be evidence that both descriptions converge on the same universality class."
  },
  {
    title: "Lim 2026 × established programmes",
    battleground: "new explicit unification claim vs. maturity",
    body: "The 2026 proposal gets credit for tackling force-plus-gravity unification explicitly, but it enters below mature programmes until independent calculations, low-energy recovery, and discriminating predictions accumulate. Novelty raises interest tier, not scientific tier."
  }
];
