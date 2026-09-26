---
type: malecns-project
project_id: "franklinbaldo-whole-cns-speed-hold"
name: "Whole-MaleCNS Closed-Loop Speed Hold"
ownership: "own"
kind: "controlled closed-loop experiment"
stage: "results-bearing; current topology claim unsupported"
primary_url: "https://github.com/franklinbaldo/franklinbaldo.github.io/blob/main/knowledge/papers/malecns_whole_cns_speed_hold.md"
repository: "franklinbaldo/franklinbaldo.github.io"
evidence_url: "https://github.com/franklinbaldo/franklinbaldo.github.io/blob/main/knowledge/papers/malecns_whole_cns_speed_hold.md"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "b152fbe5b59ba0d5913b4c86b3b46802180b8328"
summary: >-
  Results-bearing whole-connectome closed-loop programme. Its strongest current
  conclusion is negative and informative: the public evidence has not shown a
  topology advantage over rewired, adaptor-only or conventional baselines.
strongest_evidence:
  - "The public paper reports an executed whole-MaleCNS closed loop over 166,700 neurons and 25,582,938 connections."
  - "Negative results are preserved across rewired, adaptor-only and conventional-controller comparisons."
  - "Mechanistic follow-ups keep internal responsiveness separate from control success."
limitations:
  - "No robust topology-specific control advantage has survived the reported comparisons."
  - "The next decisive readout test still depends on a verified execution environment and pinned runtime assets."
  - "Stronger claims require symmetric readout selection, null ensembles and resource-matched alternatives."
controls:
  - "Degree-preserving rewired graph."
  - "Adaptor-only no-graph control."
  - "Conventional PI controller and causal history baselines."
history:
  - "2026-09-26: initial placement -> scientific C / interest S, high confidence, matching the current public paper assessment."
note: "The null result counts as evidence; scientific C reflects the current claim boundary, not failure to obtain a positive result."
---