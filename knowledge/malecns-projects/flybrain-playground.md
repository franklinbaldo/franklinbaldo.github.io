---
type: malecns-project
project_id: "mingdianliu-flybrain-playground"
name: "Flybrain Playground"
ownership: "independent"
kind: "full-connectome browser simulation / embodied room"
stage: "reproducible full-network browser model with engineered hybrid controller"
primary_url: "https://github.com/mingdianliu/flybrain-playground"
repository: "mingdianliu/flybrain-playground"
evidence_url: "https://github.com/mingdianliu/flybrain-playground/blob/main/docs/MODEL.md"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "f18721cf0e5f47081aed279a7e009d717235a069"
summary: >-
  Browser-accessible full-network MaleCNS simulation with pinned source data,
  live sensory perturbations, anatomy telemetry and an embodied 3D room. Its
  reproducibility and model boundaries are strong, while the flight behavior is
  explicitly an engineered hybrid rather than evidence for an emergent
  MaleCNS motor controller.
strongest_evidence:
  - "The model allocates state for essentially the full retained MaleCNS graph and exposes computed spikes, population rates and selected-neuron traces in the browser."
  - "Pinned source hashes, graph-load fail-closed behavior and full-network tests make the numerical artifact independently rebuildable from official public data."
  - "The room experiment reports deterministic synthetic task outcomes and full-network sensory-response checks under movable light, obstacles, odor and sound inputs."
limitations:
  - "Visual retinotopy, sensory transfer functions, proximity encoding, stabilization and several steering assists are engineered rather than experimentally calibrated."
  - "The documentation explicitly states that the downstream network is not a validated motor controller and that synthetic room outcomes are not predictions of real-fly behavior."
  - "No matched rewired-connectome, random recurrent or compact conventional-controller result is reported for the embodied room task."
controls:
  - "Deterministic reset, full-network sensory tests and stimulus-removal/occlusion checks constrain implementation artifacts."
  - "A topology-destroying same-information control remains necessary before attributing embodied behavior to MaleCNS topology."
history:
  - "2026-09-26: initial placement -> scientific C / interest S, high confidence; reproducible full-network simulation credited, behavioral attribution narrowed to an engineered hybrid."
---