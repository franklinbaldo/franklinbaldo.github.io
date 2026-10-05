---
type: toe
name: "One-Wave Universe"
kind: "contender"
scientific_tier: "F"
interest_tier: "S"
confidence: "medium"
summary: "Superfluid-lattice unification programme that attempts to derive particle masses and interactions from a common wave/topological substrate."
strengths: ["Public code and internal hypothesis tests make failures unusually easy to audit.", "The 2026-10-05 flavor-dependent radius scan reduces the programme's in-sample quark-mass mean error from 85.6% to 21.9%, with bottom and top residuals reported at 6.2% and 26.8%.", "The project explicitly cross-checked the quark-scale repair on hadrons and recorded that direct transfer makes the hadron fit worse."]
open_problems: ["The improved quark fit uses flavor-specific radius exponents selected after inspecting residuals: u/d use 0, s/c/b use +0.05 and top uses -0.15; this is not yet a held-out prediction or a derivation of those values.", "Direct transfer to hadrons fails: the programme reports 75.3% average error under the quark-optimized rule versus 56.8% for its separately calibrated hadron baseline, and the hadron solver still uses PDG constituent masses rather than the new quark outputs.", "The resulting two-tier architecture requires separately optimized quark- and hadron-scale parameters, weakening rather than improving explanatory compression until a common derivation is supplied.", "A realistic, independently validated derivation of the strong, weak and gravitational sectors remains unfinished."]
source_label: "One-Wave Science, Phase 5 scale-dependent architecture"
source_url: "https://github.com/One-Wave-Universe/One-Wave-Science/commit/007832743369f83b6f4e60e141e6e5e2f8f57952"
source_date: "2026-10-05"
note: "r250: remains F/S, medium confidence. The flavor-dependent radius scan materially improves the fitted quark spectrum, but it introduces several post-hoc flavor choices and does not transfer to composite hadrons. The project's own cross-validation says the quark-optimized rule degrades hadron performance and motivates a separate hadron-scale parameterization. That is useful negative evidence and good audit practice, but it does not repair the load-bearing unification problem. Clash: Hodge Complex Standard Model C/S currently has broader algebraic unification claims with fewer openly demonstrated cross-scale failures, while One-Wave has a more executable failure ledger."
updated: "2026-10-05"
---
# One-Wave Universe

F/S, medium confidence. The latest fit improvement is material but remains in-sample and scale-specific; the hadron cross-check is a negative result for universality.
