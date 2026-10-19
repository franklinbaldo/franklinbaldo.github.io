---
type: malecns-project
project_id: "artem-x-meta-fly-arena"
name: "Fly Arena"
ownership: "independent"
kind: "whole-MaleCNS plus NeuroMechFly/MuJoCo embodied fly simulator"
stage: "runnable whole-graph hybrid simulator with engineered ethology and separate circuit experiments"
primary_url: "https://github.com/artem-x-meta/fly-arena"
repository: "artem-x-meta/fly-arena"
evidence_url: "https://github.com/artem-x-meta/fly-arena/blob/main/README.md"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-27"
reviewed_revision: "12f48c702ed170b5bdc4643afa7ce65e952b353d"
summary: >-
  A substantial embodied simulator that can prepare and run all 166,700
  annotated MaleCNS entries and 25,582,938 connection rows alongside a
  NeuroMechFly/MuJoCo body, approximate retinal cameras and descending-neuron
  readout. The project is unusually explicit about its hybrid boundary:
  FlyGym supplies walking, while food search, arbitration, escape and several
  ethology demonstrations use engineered controllers; the public showcase GIFs
  are explicitly recorded with the connectome disabled. Scientific tier C
  credits the real whole-graph integration and inspectable experimental
  packages, but withholds stronger causal attribution until matched no-graph,
  rewire or conventional-controller comparisons show what the MaleCNS topology
  contributes to behavior.
strongest_evidence:
  - "The preparation pipeline downloads and verifies MaleCNS v1.0, retaining 166,700 annotated non-glial entries and all 25,582,938 connection rows in the runnable sparse graph."
  - "A connectome run exposes LIF activity through descending-neuron gait commands inside the same MuJoCo/NeuroMechFly environment, with checkpoints fingerprinting physics, neural and controller state."
  - "The repository includes separate visual-pathway, graded-response, motion-selectivity and semantic-readout research packages and preserves negative boundaries such as the failure to replace the external visual controller with a validated neural alternative."
  - "The README explicitly states that the showcase feeding, grooming, search and sleep clips use engineered controllers with the connectome disabled, preventing those demonstrations from being misattributed to MaleCNS."
limitations:
  - "The walking layer uses FlyGym's engineered walking controller; motor neurons are not individually mapped to muscles."
  - "Food search, behavioral arbitration and escape detection contain engineered logic, and the two-fly social demonstrations run without a neural graph."
  - "The retinal interface uses approximate 96 x 96 cameras and project-defined LIF/background inputs rather than validated MaleCNS physiology."
  - "The repository itself states that running the full graph does not demonstrate that natural behavior emerges from connectivity alone."
  - "No matched degree-preserving rewire, random recurrent network or equally capable conventional controller establishes a topology-specific behavioral contribution."
controls:
  - "Body-only and controller-driven modes are kept distinct from connectome modes, making the engineering/neural boundary inspectable rather than silently blended."
  - "Checkpoint compatibility records code, dependency, graph and model fingerprints for reproducibility."
  - "Separate diagnostic/ablation controls exist in the experimental packages, but the public main-behavior evidence is not a matched topology-causal benchmark."
history:
  - "2026-09-27: initial placement -> scientific C / interest S, high confidence; whole-graph embodied integration credited while controller-heavy public behaviors and missing matched topology nulls cap the scientific tier."
note: "This is a strong platform and unusually broad systems integration; the C tier is about causal evidence for MaleCNS-specific behavior, not about software ambition."
---
