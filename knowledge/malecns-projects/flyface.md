---
type: malecns-project
project_id: "8s8642-flyface"
name: "FlyFace"
ownership: "independent"
kind: "whole-MaleCNS image-response comparison"
stage: "results-bearing controlled pilot with negative calibration"
primary_url: "https://github.com/8S8642/FlyFace"
repository: "8S8642/FlyFace"
evidence_url: "https://github.com/8S8642/FlyFace/blob/main/README.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "f514a3b86c65e9eb86a14f5561affe0df58dbf70"
summary: >-
  A frozen MaleCNS simulation is driven by controlled face-image stimuli and
  compared with a published human-rating dataset. The strongest result is a
  bounded negative: the configured network does not show a matching global
  ranking, and the proposed DNa02 orientation readout fails synthetic controls.
strongest_evidence:
  - "At 900 ms, DNa02 chose the higher-rated image in 36/65 informative duels (55.4%, two-sided binomial p=0.457), with 35 silent duels."
  - "Per-image DNa02 preference was essentially uncorrelated with the reference ratings (Spearman rho=-0.038; within-group permutation p=0.820)."
  - "Static/moving controls failed to validate DNa02 as an orientation-toward-image readout; no alternative among 473 bilateral descending types passed all four controls."
limitations:
  - "The simulator inherits simplified MaleCNS dynamics from its pinned neural dependency and is not a recording of living neural responses."
  - "The 900 ms exposure was selected after a 300/900 ms pilot, so it is not an untouched confirmatory endpoint."
  - "No matched degree-preserving rewire, random recurrent network or no-connectome control isolates topology-specific effects."
controls:
  - "Counterbalanced left/right presentation, mirrored/grayscale/shifted variants, within-group permutation tests and multiple-testing correction are reported."
  - "Synthetic static and moving orientation controls directly challenge the assumed DNa02 readout and preserve the failed calibration."
  - "A matched topology-destroying null remains missing for any MaleCNS-specific representation claim."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; controlled nulls and failed readout calibration credited, topology-specific claims withheld."
note: "The scientific tier rewards the quality of the negative result and calibration discipline, not a ranking-prediction claim."
---
