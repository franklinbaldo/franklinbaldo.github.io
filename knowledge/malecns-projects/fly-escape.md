---
type: malecns-project
project_id: "dzhng-fly-escape"
name: "Help the Fly Escape"
ownership: "independent"
kind: "MaleCNS-derived browser game with controlled visual-circuit experiments"
stage: "playable game; neural visual propagation supported, useful navigation not established"
primary_url: "https://github.com/dzhng/fly-escape"
repository: "dzhng/fly-escape"
evidence_url: "https://github.com/dzhng/fly-escape/blob/main/specs/done/neural-vision/README.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "bff49a376f0844c918eb7f2be83e95f2699b0d14"
summary: >-
  A browser game backed by a selected MaleCNS subgraph and careful
  visual-circuit experiments. Preregistered, multiplicity-corrected neural
  contrasts and silencing and occlusion checks support downstream propagation
  of modeled visual input, while motor pilots and paired gameplay results do not
  support useful attraction, avoidance or better navigation.
strongest_evidence:
  - "All seven prespecified neural-vision contrasts pass simultaneous Bonferroni intervals across 847 comparisons, with 26 optical, graded-current, trajectory-equality and sham checks also passing."
  - "Input silencing reproduces the dark-input neural trajectory; wall and furniture blocking reproduce dark, and reopening the optical path restores the response."
  - "The retinal programme preserves failed primary endpoints: v2 spatial/brightness/occlusion fails while color passes, and a frozen v3 reserved-seed run still fails 2 of 9 spatial contrasts without post-result retuning."
  - "Paired seeded gameplay runs show retinal input changes outcomes but reduces escapes in both reviewed rooms, which the project correctly reports as changed behavior rather than improved navigation."
limitations:
  - "The runtime uses a selected seed-touching MaleCNS subgraph rather than whole MaleCNS, and omits retinal R1-R8 cells."
  - "Retinal registration, receptive-field geometry, current scaling, neuron dynamics and body decoding are engineered model assumptions."
  - "Controlled neural propagation has not been converted into a reliable player-controllable attraction or avoidance effect."
  - "No matched degree-preserving rewire, random recurrent network or compact conventional circuit tests whether the biological topology is necessary."
controls:
  - "Bonferroni-corrected preregistered contrasts, fixed held-out seed sets, input silencing, optical blocking, sham checks and trajectory-equality controls are preserved with raw evidence."
  - "Failed motor and readout pilots, failed spatial endpoints and worse escape counts are retained rather than relabeled as success."
  - "Missing: a topology-destroying same-interface control and a matched conventional controller for the navigation claim."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; controlled visual-circuit evidence credited, useful navigation and topology-specific claims withheld."
note: "The scientific tier is driven by the controlled neural experiments, not the game's star score."
---
