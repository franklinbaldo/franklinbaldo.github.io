---
type: toe
name: "One-Wave Universe"
kind: "contender"
scientific_tier: "F"
interest_tier: "S"
confidence: "high"
summary: "Superfluid-lattice unification programme that attempts to derive particle masses, interactions and cross-scale dynamics from a common wave/topological substrate; the latest publication-ready validator chain remains contradicted by its own executable test construction and reported residuals."
strengths: ["The public repository exposes validators and implementation details closely enough that claimed successes and failures can be audited rather than inferred from prose alone.", "The project explicitly records a roughly 1000x galaxy-rotation scaling discrepancy and separates that problem from the satellite-scale cascade fit instead of silently deleting it.", "The latest constants validator reports its own fine-structure mismatch and the code for the exoplanet test makes the synthetic data-generation assumptions visible."]
open_problems: ["The claimed exoplanet validation is not an observational Kepler test: the published script generates 200 synthetic systems and deliberately makes 60% of them harmonic before reporting an extreme chi-square significance for harmonic clustering.", "The fundamental-constants validator itself reports alpha_em = 1/183 versus the observed approximately 1/137, a 33% error, while later summaries call the coupling constants derived and the framework proven.", "The corrected galaxy-rotation solver reports a roughly 1000x mismatch for the simple cascade model and introduces a cluster-wake amplitude explicitly marked as something to calibrate on the rotation curves, so this is not yet a held-out prediction.", "A contemporaneous mechanism note says the cascade model is always correct and assigns discrepancies to EM-coherence modulation; without an independently fixed modulation rule this risks making the central claim non-discriminating.", "Earlier cross-scale problems remain: the quark repair used flavor-dependent post-hoc radius exponents and did not transfer to hadrons under a common parameterization.", "A realistic, independently validated derivation of the Standard Model and gravitational sector remains absent."]
source_label: "One-Wave Science, October 6 validator/publication packet"
source_url: "https://github.com/One-Wave-Universe/One-Wave-Science/commit/38bdc3973534f753d0a14ddc30d8ad5d543ee78e"
source_date: "2026-10-06"
note: "r260: remains F/S; confidence rises from medium to high. The new five-validator narrative is a material claim expansion, but the strongest new headline evidence does not survive claim-level inspection: the exoplanet p-value is produced from a synthetic sample whose generator preloads harmonic structure; the constants packet reports a 33% alpha_em miss while later summaries describe the constants as derived; and the galaxy-rotation branch records a 1000x scaling miss before introducing a calibratable wake amplitude. These are concrete internal evidence/claim mismatches, not merely absence of independent replication. Clash: Grid Universe C/S also develops alternative cosmology in public, but its recent workflow pre-registers discriminating tests and preserves expectation misses; One-Wave currently changes or reinterprets the validation domain after the observed mismatch."
updated: "2026-10-06"
---

# One-Wave Universe

F/S, high confidence. The fresh publication-ready claim is materially weaker than advertised by the executable record: one headline significance test is synthetic by construction, a claimed fundamental constant misses by 33%, and the galaxy-rotation branch requires a new calibrated component after a three-order-of-magnitude scaling miss.
