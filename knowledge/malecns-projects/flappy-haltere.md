---
type: malecns-project
project_id: "jamesbiederbeck-flappy-haltere"
name: "flappy-haltere"
ownership: "independent"
kind: "MaleCNS haltere-to-wing circuit experiments and Flappy Bird harness"
stage: "results-bearing circuit experiments; gameplay remains non-avoidant"
primary_url: "https://github.com/jamesbiederbeck/flappy-haltere"
repository: "jamesbiederbeck/flappy-haltere"
evidence_url: "https://github.com/jamesbiederbeck/flappy-haltere/blob/main/docs/haltere-inverse-dynamics-experiment.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "0195761509fa890db8007c5735bde14b0ffad5e4"
summary: >-
  A MaleCNS-derived haltere-to-wing experimental programme with a full-network
  forward simulator, explicit circuit sweeps, an inverse model validated by
  round-tripping through the simulator, and a Flappy Bird harness. The strongest
  evidence is mechanistic rather than behavioral: independent sweeps reproduce
  surprising indirect haltere effects, while the current game agent still holds
  altitude rather than avoiding pipes.
strongest_evidence:
  - "Full-network cluster sweeps show SNpp12 and SNpp23 driving the wing-motor pool despite no direct measured synapses, while directly connected SNpp14 remains ineffective; an independent native-backend paired-cluster sweep reproduces the same ordering."
  - "The inverse 67-motor-to-205-haltere MLP is checked against the real forward simulation, not only its labels; after targeted dataset repair it reaches IoU 0.75-1.0 across the named-cluster sweep and fixes a documented silent-target failure mode."
  - "The Flappy harness records long multi-seed runs and corrected a prior scoring bug; the best reported T=560 runs clear 49 and 42 pipes over 6,000 ticks, while the project explicitly documents that this is fixed-altitude chance alignment rather than obstacle avoidance."
limitations:
  - "Haltere stimulation is engineered host-side current injection, not measured haltere transduction physics."
  - "The inverse model solves a simulator-defined inverse problem and does not establish biological uniqueness or real-fly causality."
  - "The Flappy agent receives no pipe-gap information, so cleared pipes are not evidence of useful visual avoidance."
  - "No matched rewired-connectome, random recurrent or compact conventional circuit is reported for the central haltere-to-motor findings."
controls:
  - "Static one-hop wiring analysis is explicitly contrasted with full-network dynamics, exposing a direct-wiring explanation that fails."
  - "Independent native and GPU sweeps cross-check the SNpp12/SNpp23/SNpp14 result."
  - "The inverse-model workflow preserves marginal-frequency baselines, held-out validation, round-trip oracle tests and negative/failure cases."
  - "A topology-destroying same-interface control remains missing."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; mechanistic replication and round-trip validation credited, behavioral avoidance and topology-specific advantage withheld."
note: "The tier credits the controlled circuit evidence; the game's pipe count is not interpreted as learned avoidance."
---