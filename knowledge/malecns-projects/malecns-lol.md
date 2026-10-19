---
type: malecns-project
project_id: "tsungyumr-malecns-lol"
name: "FlyLoL V3B-MuMu"
ownership: "independent"
kind: "closed-loop game-control / plasticity experiment"
stage: "working practice-mode integration with reward-modulated plasticity and steering scaffolds"
primary_url: "https://github.com/tsungyumr/malecns_LoL"
repository: "tsungyumr/malecns_LoL"
evidence_url: "https://github.com/tsungyumr/malecns_LoL/blob/main/README.md"
scientific_tier: "D"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "84daac3b66a50ccb897192512a51c096184134b0"
summary: >-
  A materially implemented MaleCNS-to-game loop with virtual vision,
  reward-modulated internal plasticity and detailed action observability.
  The current executed policy is still substantially shaped by deterministic
  steering and tactical scaffolds, so the project has not yet demonstrated that
  MaleCNS dynamics or plasticity are responsible for competent game behavior.
strongest_evidence:
  - "The runtime loads a cached MaleCNS graph, keeps the biological graph as a fixed prior and adds checkpointed reward-modulated plastic components on selected internal edges."
  - "The project separates dry-run observation from optional practice-mode actuation and records both brain-requested and actually executed movement."
  - "Plasticity can be disabled and checkpoints can be ignored for fresh runs, providing useful infrastructure for future controlled comparisons."
limitations:
  - "The current graph weights are unsigned, the 128-sector visual adapter is not official MaleCNS retinotopy and the motor projection is fixed and synthetic."
  - "A deterministic enemy-steering layer and a separate tactical value learner can determine or override executed behavior while MaleCNS motor mappings remain unstable."
  - "No reported held-out comparison yet establishes a behavioral advantage for MaleCNS plasticity over frozen, rewired, random-recurrent or conventional policies."
controls:
  - "The runtime exposes plasticity-off, fresh-checkpoint and brain-move-versus-executed-move observability."
  - "A matched frozen/null/controller evaluation is still required before promoting the central learning claim."
history:
  - "2026-09-26: initial placement -> scientific D / interest S, high confidence; real closed-loop integration credited, MaleCNS-specific gameplay claim remains prospective."
note: "The project explicitly scopes actuation to private/practice/custom research use; the tier reflects the public research artifact."
---