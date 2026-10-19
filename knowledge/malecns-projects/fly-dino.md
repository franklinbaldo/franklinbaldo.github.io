---
type: malecns-project
project_id: "cobanov-flyjump"
name: "Fly Dino"
ownership: "independent"
kind: "MaleCNS visual-to-descending subcircuit controller for Chromium Dino"
stage: "results-bearing reproducible game controller with held-out benchmark and replicas"
primary_url: "https://github.com/cobanov/flyjump"
repository: "cobanov/flyjump"
evidence_url: "https://github.com/cobanov/flyjump/blob/main/docs/experiment.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "c08c86bc18efd8125964b1d2ca4fc1df59700f30"
summary: >-
  An 80-cell MaleCNS visual-to-descending circuit drives the original Chromium
  Dino through a trained 243-parameter readout. The project has a clean
  train/validation/test split, three independent training seeds, reproducible
  artifacts and multiple behavioral controls. The published model completes
  99/100 held-out 180-second courses and the replicas span 85-100/100. The tier
  stops at B because the compact circuit, engineered state encoder and trained
  readout are strong inductive biases, and no equally budgeted rewired or
  artificial recurrent control tests whether the measured MaleCNS topology is
  specifically responsible for the advantage.
strongest_evidence:
  - "The published checkpoint completes 99/100 held-out 180-second Chromium Dino courses with mean survival 179.372 s; the same readout with the circuit silenced and the initial untrained readout both complete 0/100."
  - "Three independently trained seeds complete 99/100, 85/100 and 100/100 on the same frozen held-out set, while validation and test are kept separate and the first declared training seed remains the published checkpoint regardless of later test scores."
  - "The circuit is selected from measured MaleCNS anatomy before training: 80 cells, 1,296 directed measured edges and 26,029 synaptic contacts, with only the small action readout trained."
  - "The repository publishes per-course benchmarks, checkpoints, training histories, deterministic environment pins and tests that reproduce benchmark, input sensitivity, silencing, graph reachability and rendered/headless parity."
limitations:
  - "The eight game-state observations are engineered structured features rather than pixels or biological retinal transduction, and their assignment to visual cell types is arbitrary."
  - "The modeled recurrence uses simplified signed tanh dynamics rather than measured membrane physiology."
  - "Only an 80-cell selected subgraph participates in control; the remaining atlas is anatomical context rather than whole-CNS computation."
  - "The handwritten rule comparator is intentionally simple and untuned, so the result does not establish superiority over strong conventional controllers."
  - "No matched degree-preserving rewire, random recurrent network or artificial graph is trained with the same budget."
controls:
  - "Same trained readout with the connectome circuit silenced, initial untrained readout, handwritten rule baseline, uniform-random actions and idle are evaluated on the frozen held-out courses."
  - "Three independent training seeds reproduce high completion rates without test-based checkpoint selection."
  - "Pinned original Chromium physics and sprites, deterministic seeds and rendered/headless parity reduce environment drift."
  - "A topology-specific null remains missing, so circuit dependence is not interpreted as biological-topology superiority."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; reproducible held-out control and independent training replicas credited, topology-specific advantage withheld."
note: "The B tier credits reproducible causal dependence on the modeled circuit and disciplined evaluation, not evidence that this MaleCNS topology is better than a matched artificial network."
---
