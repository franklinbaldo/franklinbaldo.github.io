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

export const TOE_ARENA_UPDATED = "2026-09-18";

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
      "Offers one of the broadest existing unification programmes rather than only a quantization of gravity.",
    ],
    openProblems: [
      "No direct experimental confirmation of string-specific physics.",
      "Vacuum selection / landscape makes a unique route to the observed Standard Model difficult.",
      "Many characteristic effects are expected near scales that are hard to probe directly.",
    ],
    sourceLabel: "Living Reviews / string-theory literature",
    sourceUrl: "https://arxiv.org/abs/hep-th/9810188",
    note: "Opening-season placement: mature benchmark contender, but A rather than S because empirical discrimination remains the central gap.",
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
      "Long-running independent research programme with many formulations and applications.",
    ],
    openProblems: [
      "Dynamics and the recovery of smooth low-energy spacetime remain central issues.",
      "Standard Model matter and full force unification are not automatically delivered by the core framework.",
      "Distinctive experimentally accessible signatures remain difficult to isolate.",
    ],
    sourceLabel: "Carlo Rovelli, Loop Quantum Gravity",
    sourceUrl: "https://arxiv.org/abs/gr-qc/9710008",
    sourceDate: "1997-10-01",
    note: "A as a quantum-gravity programme; the Arena displays the scope limitation explicitly rather than pretending every contender solves the same problem.",
  },
  {
    slug: "asymptotic-safety",
    name: "Asymptotic safety",
    kind: "contender",
    scientificTier: "A",
    interestTier: "A",
    confidence: "medium",
    summary:
      "A quantum-gravity programme in which gravity can remain predictive at arbitrarily high energies if the renormalization-group flow approaches a suitable ultraviolet fixed point. A 2026 scaling-solution result now pushes the programme further into Standard-Model phenomenology by asking whether quantum gravity can predict the Fermi-to-Planck scale hierarchy.",
    strengths: [
      "Uses the established language of quantum field theory and renormalization-group flow.",
      "Substantial non-perturbative calculation programme and active phenomenology.",
      "Potentially conservative UV completion without requiring a wholly new microscopic ontology.",
      "A paper accepted in Physical Review D on 2026-09-14 derives a scaling solution in which an ultraviolet fixed point can make the cosmon-Higgs coupling predictive and yield a very small Fermi-to-Planck scale ratio.",
    ],
    openProblems: [
      "The existence and properties of the required fixed point must survive truncation/systematic-control questions.",
      "A complete, compelling derivation of observed matter content and parameters remains open.",
      "The Fermi-scale result depends on assumptions about the ultraviolet fixed point and is not yet decisive empirical evidence for the framework.",
    ],
    sourceLabel: "Christof Wetterich, Fermi scale from quantum gravity scaling solution (Phys. Rev. D, accepted)",
    sourceUrl: "https://journals.aps.org/prd/accepted/10.1103/3d3b-txny",
    sourceDate: "2026-09-14",
    note: "2026-09-18 review: held at A/A. The new accepted result materially strengthens contact with the gauge-hierarchy problem, but does not by itself resolve fixed-point control or deliver a discriminating observation.",
  },
  {
    slug: "holomorphic-unified-field-theory",
    name: "Holomorphic Unified Field Theory",
    kind: "contender",
    scientificTier: "B",
    interestTier: "A",
    confidence: "medium",
    summary:
      "John W. Moffat and Ethan J. Thompson formulate gravity, gauge fields and matter on a complexified four-dimensional spacetime with a Hermitian geometric structure. Follow-up work adds nonlocal entire-function regulators and claims a finite quantum framework with explicit Standard-Model masses, mixings and gauge-coupling unification.",
    strengths: [
      "Targets gravity plus the full Standard Model in one geometric construction rather than quantizing gravity alone.",
      "Has a multi-paper technical programme, including peer-reviewed 2025-2026 publications on the invariant structure and Standard-Model mass spectrum.",
      "Makes concrete low-energy claims about chiral matter, symmetry breaking, masses, mixing angles and ultraviolet finiteness that can be checked calculation by calculation.",
    ],
    openProblems: [
      "There is still no direct empirical evidence that selects the holomorphic framework over established low-energy physics plus other ultraviolet completions.",
      "Independent scrutiny remains small compared with mature programmes; a 2026 critique disputes whether the construction is genuinely holomorphic or a single unified gauge structure.",
      "The nonlocal regulator sector, topology and claimed mass-spectrum predictivity require broader independent reproduction before the framework can be treated as mature.",
    ],
    sourceLabel: "Moffat & Thompson, Holomorphic Unified Field Theory of Gravity and the Standard Model",
    sourceUrl: "https://arxiv.org/abs/2506.19161",
    sourceDate: "2025-06-23",
    note: "2026-09-18: entered at B/A. Multiple peer-reviewed papers and explicit Standard-Model calculations put it above a one-off proposal, but limited independent reproduction and unresolved structural criticism keep it below the A programmes.",
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
      "Clear numerical programme with increasingly refined observables.",
    ],
    openProblems: [
      "Continuum limit and connection to complete low-energy physics remain active research questions.",
      "Matter and Standard Model unification are not part of the core success story.",
      "Current quantitative results do not yet amount to experimentally unique predictions.",
    ],
    sourceLabel:
      "Ambjørn & Loll, Causal Dynamical Triangulations: Gateway to Nonperturbative Quantum Gravity",
    sourceUrl: "https://arxiv.org/abs/2401.09399",
    sourceDate: "2024-01-17",
  },
  {
    slug: "usmeg-eft",
    name: "USMEG-EFT",
    kind: "contender",
    scientificTier: "C",
    interestTier: "A",
    confidence: "medium",
    summary:
      "The Unified Standard Model with Emergent Gravity–Effective Field Theory keeps the Standard Model and a quantum spin-2 graviton in four dimensions, while a Lagrange-multiplier constraint is claimed to terminate the gravitational loop expansion at one loop. A September 2026 Physics Letters B paper interprets the classical metric as a condensate that is controlled only below a gravitational breakdown scale near 10^18 GeV.",
    strengths: [
      "Uses explicit path-integral, renormalization-group and BRST machinery rather than only a qualitative emergent-gravity picture.",
      "The September 2026 condensate result is peer-reviewed and states clearly where the effective description is and is not controlled.",
      "It exposes concrete observables, including the two tensor graviton modes and momentum-dependent quantum corrections, even though the polarization count itself is shared with general relativity.",
    ],
    openProblems: [
      "The framework explicitly loses a controlled geometric description near 10^18 GeV, so it is not yet an ultraviolet-complete Theory of Everything.",
      "Exactly two tensor polarizations are a consistency requirement shared by general relativity and many viable frameworks, not unique evidence for USMEG-EFT.",
      "The disordered/pre-geometric phase and strict condensate dissolution are acknowledged as hypotheses requiring a fuller construction beyond the current second-order formalism.",
    ],
    sourceLabel: "Farrukh A. Chishtie, Classical spacetime as a gravitational condensate (Physics Letters B)",
    sourceUrl: "https://doi.org/10.1016/j.physletb.2026.140803",
    sourceDate: "2026-09",
    note: "2026-09-18: entered at C/A. The new peer-reviewed condensate calculation earns structured-speculation status, but the explicit ultraviolet breakdown blocks a higher scientific tier until the high-energy completion or uniquely discriminating evidence exists.",
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
      "Connects established gauge-theory and loop-quantization machinery.",
    ],
    openProblems: [
      "Very recent and not yet a mature independently developed research programme.",
      "No established empirical evidence discriminating it from other approaches.",
      "The route from the construction to the observed detailed Standard Model spectrum and low-energy phenomenology requires much more development.",
    ],
    sourceLabel:
      "Adrian P. C. Lim, From Loop Quantum Gravity to a Theory of Everything",
    sourceUrl: "https://arxiv.org/abs/2601.03292",
    sourceDate: "2026-01-05",
    note: "This is the opening season's 'new challenger': high-interest, conservative scientific placement pending independent scrutiny.",
  },
  {
    slug: "zebts-chi-reality",
    name: "ZEBTS / χ-Reality",
    kind: "contender",
    scientificTier: "D",
    interestTier: "A",
    confidence: "high",
    summary:
      "Anatolii Mukha's September 2026 working monograph proposes a zero-entropy noncommutative χ-vacuum and a universal operator whose spectral projections are claimed to generate spacetime, matter, gauge interactions, gravity, time, dark sectors and additional cognitive phenomena. Version 3 expands the framework into an explicitly advertised Theory of Everything.",
    strengths: [
      "The proposal is unusually explicit about a central operator, broad scope, claimed falsifiability criteria and candidate experimental signatures.",
      "The public version history is clear and the September 9 revision materially expands the mathematical and phenomenological claims.",
      "Its operator-spectral language makes at least some claims concrete enough to compare with spectral and noncommutative approaches rather than remaining purely verbal.",
    ],
    openProblems: [
      "It is an unreviewed working paper with no cited independent validation in the current record.",
      "The framework makes an exceptionally broad set of claims, including baryon structure, zeta-zero dynamics, wormholes and consciousness, without a comparably broad body of reproduced calculations.",
      "Recovery of the detailed Standard Model and established low-energy precision tests is not independently demonstrated at the level required for a mature unification programme.",
    ],
    sourceLabel: "Anatolii Mukha, ZEBTS — χ-Reality SUPER 12, version 3",
    sourceUrl: "https://www.cambridge.org/engage/coe/article-details/6a9b05254770e67d926790a8",
    sourceDate: "2026-09-09",
    note: "2026-09-18: entered at D/A. High generative interest is separated from scientific strength; the placement should move only after independent derivations, low-energy recovery or empirical contact appear.",
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
      "Useful bridge between information, agency, compression, and causal depth.",
    ],
    openProblems: [
      "The quantities still require empirical measurement in natural or artificial systems.",
      "It does not claim to unify gravity with the Standard Model or replace physical time.",
      "A 2026-09-18 repository audit found substantial prior art for generic causal-depth, recognition-latency, active-recognition and predictive-agent-model ingredients, narrowing novelty to the more specific combined criterion.",
    ],
    sourceLabel: "Franklin Baldo, Time as Concatenation",
    sourceUrl:
      "https://github.com/franklinbaldo/papers/blob/main/informational_time.md",
    sourceDate: "2026-07-30",
    note: "NR remains intentional. 2026-09-18: no tier change; the new prior-art audit narrows novelty claims but does not change the paper's already-limited scope or its exhibition status.",
  },
];

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
