---
type: toe
name: "One-Wave Universe"
kind: "contender"
scientific_tier: "F"
interest_tier: "S"
confidence: "medium"
summary: "Superfluid-lattice unification programme that attempts to derive particle masses and interactions from a common wave/topological substrate."
strengths: ["Public code and internal hypothesis tests make failures unusually easy to audit.", "The 2026-10-05 combined Phase 5 implementation materially reduces some heavy-quark errors while preserving a stable light-sector calibration.", "A hadron extension reuses the Phase 5 radius and tension scaling and, after nucleon calibration, reports proton and neutron errors of 2.6% and 5.4%."]
open_problems: ["The original load-bearing octave-scaling test still fails: E_total/sqrt(m_scale) varies by about 24x.", "Even after the combined repair the reported heavy-quark error remains about 84.1% and the top-quark error about 126.5%, so the central mass-spectrum problem is not solved.", "The hadron numbers are calibration results, not held-out predictions: sigma_T and kappa_T are tuned against nucleon masses, while flavor-dependent corrections and meson binding remain pending.", "A realistic derivation of strong, weak and gravitational sectors remains unfinished."]
source_label: "One-Wave Science, coherence-inversion hadron repair"
source_url: "https://github.com/One-Wave-Universe/One-Wave-Science/commit/ec0b0689105d403e3eda4bcab8adc1cde78f7018"
source_date: "2026-10-05"
note: "r248: remains F/S. The coherence-inversion repair reports much smaller proton, neutron and Lambda residuals, but it was introduced after residual analysis, changes the calibrated coupling, and adds a new coherence-dependent rule. The core heavy-spectrum failure and lack of independent held-out prediction remain. The commit message also reverses experimental and calculated labels, although the code table itself uses the standard particle masses."
updated: "2026-10-05"
---
# One-Wave Universe

F/S, medium confidence.
