---
type: malecns-project
project_id: "denissergeevitch-desktop-fly-male-locomotor"
name: "DesktopFly — Female FlyWire brain and MaleCNS leg-controller upgrade"
ownership: independent
kind: "desktop embodied simulation / anatomically grounded partial-CNS locomotor circuit"
stage: "public macOS and Windows implementations; deterministic locomotor intervention tests; biological gait validation pending"
primary_url: "https://github.com/DenisSergeevitch/desktop-fly"
repository: "DenisSergeevitch/desktop-fly"
evidence_url: "https://github.com/DenisSergeevitch/desktop-fly/blob/32b00011e83c3dc85fa3ea0b3934155b04f1635d/EVALUATION.md"
scientific_tier: A
interest_tier: S
confidence: medium
reviewed_at: "2026-10-14"
reviewed_revision: "32b00011e83c3dc85fa3ea0b3934155b04f1635d"
summary: >-
  A macOS/Windows desktop fly couples a female FlyWire sensory/brain circuit
  through an explicitly modeled cross-specimen adapter to a measured 1,045-neuron,
  17,224-directed-connection MaleCNS v1.0 locomotor extract. Leg torques and
  body translation on the active walking path depend on simulated descending,
  premotor and motor activity and return contact/joint feedback. Public source,
  extraction hashes and deterministic causal checks support a functioning
  model-level closed loop; they do not establish real fly gait or a whole-CNS
  model. This is not a purely MaleCNS brain: the female sensory brain and
  connecting adapter are separate.
strongest_evidence:
  - >-
    The pinned locomotor report describes 1,045 MaleCNS cells, 17,224 directed
    connections representing 708,689 synaptic contacts, and descending-neuron
    reachability to 208 of 220 selected leg motor neurons. Data extraction
    hashes and provenance are published.
  - >-
    Eight-second bilateral DNp09 drive yields reported forward displacement
    10.64 model units, while removing all synapses or silencing all motor
    neurons yields no propulsion. MDN driving yields -12.66 model units of
    backward displacement; left/right DNa01/DNa02 perturbations shift yaw.
  - >-
    Published native and JavaScript tests cover motor/ground-contact feedback,
    60 vs 120 Hz render-rate invariance (12,868 motor spikes, displacement
    10.643657 in both), no-drive no-motion and a full adapter-to-body chain.
limitations:
  - >-
    Native tests are self-reported and deterministic fixtures reuse fixed
    seeds. The report does not establish across-seed robustness, quantitative
    biological gait agreement, or independent reproduction in this review.
  - >-
    The female FlyWire-to-male descending adapter, neural time constants,
    motor gains, muscle forces and contact mechanics are modeled; at most
    20.9-44.8% of incoming motor-channel contacts are retained. The model
    excludes the remaining whole-CNS network.
  - >-
    Escape, grooming, sleep and flight include rule-based state/animation
    components; the evidence for neural control concerns the active walking
    path and should not be generalized to all displayed behavior.
controls:
  - >-
    In-model zero-descending drive, removal of all synapses, motor-neuron
    silencing, bilateral descending perturbations, open/closed sensory
    feedback and identical graph across Swift/JavaScript motor suites.
  - >-
    No topology-matched degree-preserving rewire, nonconnectome controller at
    matched resource budget, multi-seed free-running trials or measured
    animal-leg kinematics for causal attribution beyond the model.
history:
  - "2026-10-14: initial scientific A / interest S / medium confidence; strong model-level intervention controls credited, animal and topology-specific claims withheld."
note: >-
  Compare with nsfm/fly-afterlife (whole-CNS body integration that still lacks
  coordinated autonomous gait) and soup-connectome (runtime correctness, not
  behavior). Native tests, Windows checks and visual walkthrough are author
  reports and were not rerun in this review.
---
