---
type: malecns-project
project_id: "noir-infini-pianist-fly"
name: "Pianist Fly"
ownership: "independent"
kind: "whole-connectome embodied piano-control demo"
stage: "public full-connectome MuJoCo closed-loop demo with sensory A/B gates"
primary_url: "https://github.com/Noir-infini/pianist-fly"
repository: "Noir-infini/pianist-fly"
evidence_url: "https://github.com/Noir-infini/pianist-fly/blob/main/README.md"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "6aebb8aced550f7bc0c98a7779b591c684666f0d"
summary: >-
  Full-MaleCNS LIF simulation coupled to a MuJoCo fly and piano task, with
  olfactory input, lateral neural readout and physically verified key contact.
  The implementation makes its engineered IK and gating boundary unusually
  explicit, but it does not yet isolate a connectome-specific advantage against
  topology-destroying or simpler-controller controls.
strongest_evidence:
  - "The public implementation runs a 166,700-neuron / roughly 25.58-million-synapse MaleCNS graph with static connectome weights and no backpropagation through the recurrent network."
  - "Sugar-plume inputs stimulate annotated antennal sensory neurons; connectome activity gates left/right leg choice, while MuJoCo IK executes and verifies physical key contact."
  - "The repository documents a five-gate scent A/B suite, including wrong-aim refusal and a symmetric centerline case, plus a reproducible setup path with pinned source downloads."
limitations:
  - "The spatial sugar plume, hunger model, lateral readout gate, piano layout and inverse-kinematics trajectory are engineered interfaces rather than biological measurements."
  - "The connectome selects a coarse lateral orientation while a conventional IK controller performs the detailed reaching and contact."
  - "No matched degree-preserving rewire, random recurrent network or small conventional controller is reported for the same piano task."
controls:
  - "Scent A/B and wrong-aim gates constrain accidental presses and test the sensory-to-side pathway."
  - "A topology-destroying or same-budget conventional-controller comparison remains necessary for a MaleCNS-specific behavioral claim."
history:
  - "2026-09-26: initial placement -> scientific C / interest S, high confidence; whole-connectome embodiment credited, topology-specific attribution withheld."
---