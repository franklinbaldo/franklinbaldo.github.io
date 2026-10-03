# ToE Arena scan — 2026-09-24 — Causal Fermion Systems gauge-group update

This incremental scan applies `franklinbaldo/skills/toe-arena-tiering`. The scientific tier tracks coherence, recovery, empirical contact, technical maturity and independent scrutiny; the interest tier separately tracks generativity and value as a target for calculations or experiments. Neither tier is a probability that a theory is true.

## Existing contender: Causal Fermion Systems — remains A scientific / S interest, medium confidence

**New primary source/date.** Felix Finster & Niels G. Gresnigt, *Constraints for Physical Gauge Groups Coming from the Causal Action Principle*, arXiv:2609.24888v1, submitted **2026-09-21**: <https://arxiv.org/abs/2609.24888>.

**What changed.** The new paper systematizes a load-bearing part of the CFS continuum-limit programme. Earlier CFS work reports that, starting from a Standard-Model fermionic vacuum, the causal action determines the post-symmetry-breaking interaction structure, including the effective `U(1) × SU(2) × SU(3)` gauge group and the electroweak/strong coupling pattern. Finster & Gresnigt ask how much of that selection mechanism survives for more general vacuum configurations. Starting from general chiral `U(N)_L × U(N)_R` potentials, they isolate a quadratic constraint from the bilinear logarithmic terms, recast it as compatibility between Lie-algebra and Clifford-algebra structure, and prove a classification theorem for the admissible Lie algebras.

This is a **material strengthening of the derivational architecture**: it turns a model-specific degeneracy analysis into a more general algebraic selection problem. It is not merely another phenomenological application of a fixed gauge group.

### Evidence for / strengths added by the 2026-09-21 paper

- The paper gives a mathematically explicit criterion rather than a verbal selection principle: differences of left/right chiral generators must square to multiples of the identity, yielding a Clifford subspace and restrictions on admissible Lie algebras.
- It proves a general classification theorem and works examples, so the result is more than a single Standard-Model fit.
- The authors explicitly connect the theorem to the earlier CFS continuum-limit derivation in which `U(1) × SU(2) × SU(3)` is obtained and the corresponding potentials couple as electroweak and strong fields.
- The result sharpens explanatory compression inside the CFS programme: effective gauge structure is constrained by the same causal-action continuum analysis rather than being introduced as a separate symmetry-breaking chain.

### Evidence against / unresolved

**1. The new theorem does not yet include flavour mixing.** The calculation assumes an invertible mass matrix commuting with all chiral potentials. The authors explicitly state that this simplification disregards generation mixing and leave CKM/PMNS matrices to future work. This matters because realistic chiral Standard-Model recovery is more than identifying the gauge-group names.

**2. The fermionic vacuum architecture remains substantial input.** The continuum analysis prescribes sectors, Dirac seas, masses and chiral asymmetries before the interaction is determined. The September result constrains the interaction allowed by such a vacuum; it does not yet derive the entire observed matter content from a smaller input set.

**3. The microscopic regularization problem is unchanged.** Important couplings, gauge-boson masses and mixing data in the broader CFS programme still depend on the unknown microscopic regularization. The gauge-classification theorem does not resolve that predictive bottleneck.

**4. This is not independent replication.** Gresnigt broadens the author base, but the result remains coauthored with Finster and sits inside the CFS research programme. It should count as technical development, not as an independent external reconstruction of the full Standard-Model-plus-gravity chain.

**5. No new discriminating empirical success is supplied.** The paper improves internal/general mathematical control. It does not introduce a frozen quantitative prediction that has newly survived experiment.

### Placement

**No movement: A scientific / S interest, medium confidence.** Under the Arena skill, a new paper should move a tier only when it materially changes empirical support, closes a blocking derivation, establishes independent replication, demonstrates a contradiction, or substantially changes scope. This paper is important, but it closes only part of the gauge-structure generalization and explicitly leaves flavour mixing open. CFS was already A because it is a mature, technically developed programme with unusually broad Standard-Model-plus-gravity contact. The September theorem makes that A placement better supported; it does not supply the empirical/predictive closure required for S scientific.

Interest remains **S** because the programme now offers an even sharper bridge between causal variational dynamics, Clifford structure and admissible gauge algebras, alongside the existing spacetime/gravity and quantum-field programme.

### Clash — Hypercomplex Steering–Spinor Unification (C/S)

**Battleground: deriving/selecting observed gauge structure from deeper algebraic constraints.**

CFS's advantage is maturity and attachment to known physics: it has a continuum-limit Standard-Model construction and now a general Lie/Clifford admissibility theorem tied to the causal action. Its liability is that the vacuum sectors, masses and chiral data are substantial inputs, the new theorem suppresses flavour mixing, and regularization-dependent low-energy parameters remain.

Hypercomplex Steering–Spinor's advantage is stronger algebraic compression in ambition: sedenion/E6 structure is proposed to account for gauge curvature, generations and gravity inside one algebraic language. Its liability is much weaker end-to-end recovery: a realistic chiral Standard Model, controlled Einstein limit, quantization/RG closure and independent reconstruction remain open.

**What would change the comparison?** For CFS, extending the theorem through realistic CKM/PMNS mixing, reducing vacuum input, deriving regularization-sensitive parameters and obtaining distinctive empirical success would strengthen the case. For Hypercomplex Steering–Spinor, an independent reconstruction of the full chiral Standard Model plus a controlled gravity limit would narrow the maturity gap. The present update moves **neither** tier.

### Movement history

- **2026-09-22:** CFS entered the Arena at **A/S**, medium confidence, as a backlog correction driven by its mature continuum-limit programme and 2026 gravity work.
- **2026-09-24:** **A/S retained**, medium confidence. Finster & Gresnigt materially strengthen the gauge-selection architecture with a general Lie/Clifford classification theorem, but flavour mixing, microscopic regularization, parameter prediction and empirical discrimination remain open.

## Fresh/current screening

- **Mark A. Shinn, *Comment on “Ultraviolet Completion of the Big Bang in Quadratic Gravity”*, arXiv:2609.26827, submitted 2026-09-20:** identifies a type-A trace-anomaly obstruction to the proposed round Euclidean starting saddle under the assumptions of the commented quadratic-gravity cosmology. This is a potentially important correction to that cosmological construction, but the target is not currently a gravity-plus-realistic-Standard-Model contender in the Arena, so no new ToE card or tier movement is created: <https://arxiv.org/abs/2609.26827>.
- **Tianhao Wu & Gabriele La Nave, *Spectral Fractional Bosonic Strings: Exact Polyakov Measure and the Critical Dimension*, arXiv:2609.27873:** develops a fractional/spectral bosonic-worldsheet construction with critical dimension `D*=26/s`. It is a technically interesting extension of string worldsheet structure, not independent evidence sufficient to move the existing String/M-theory Arena tier and not a separate full ToE entry in this scan: <https://arxiv.org/abs/2609.27873>.
- The current hep-th/gr-qc listings otherwise yielded sector-specific quantum gravity, black-hole, amplitudes and phenomenology work rather than a second uncatalogued gravity-plus-realistic-matter framework that crossed the Arena entry gate.

## `franklinbaldo/papers` scan

The newest local commit in this pass is **`783c1eea` — “experiment: measure flashcard retention under vocabulary churn” (2026-09-24)**. It reports that own flashcards lower BPB across the tested candidates, that 52–72% of the gain survives vocabulary churn in one regime, and that stale cards can become harmful after churn in another. The immediately preceding work adds research-front DAG hygiene. These are substantive Pontifex/representation and methodology results, not a physical gravity-plus-Standard-Model unification, so no local ToE card is created.

## Net movement

- **Updated, no tier move:** Causal Fermion Systems remains **A scientific / S interest**, medium confidence; the 2026-09-21 gauge-group classification is now part of its evidence/history.
- **Existing contenders moved:** none.
- **Fresh work rejected from canonical ToE entry in this pass:** Shinn's quadratic-gravity Big-Bang comment (scope: a correction to a cosmological construction) and spectral fractional bosonic strings (interesting string extension, not a distinct full ToE contender here).
- **Local `franklinbaldo/papers`:** no new physical ToE candidate in the latest commits.
