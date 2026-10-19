---
type: malecns-project
project_id: "kvnloo-fly-brain-spectacles"
name: "CyberFly"
ownership: "independent"
kind: "whole-MaleCNS embodied augmented-reality installation"
stage: "working Snap Spectacles + Mac whole-connectome embodiment with public device demo and verification path"
primary_url: "https://github.com/kvnloo/fly-brain-spectacles"
repository: "kvnloo/fly-brain-spectacles"
evidence_url: "https://github.com/kvnloo/fly-brain-spectacles/blob/main/docs/DECISIONS.md"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "20413b4bb888f7ced63d42451250539a55d9e625"
summary: >-
  An unusually complete physical embodiment of one full MaleCNS simulation per
  holographic fly, with room geometry, hands and objects translated into sensory
  drives and measured descending/motor activity returned to an AR body. The
  system is real and well disclosed, but substantial sensing, state, landing,
  gait and low-level control remain engineered and there is no matched topology
  control showing that MaleCNS wiring is necessary for the observed behavior.
strongest_evidence:
  - "The repository states that all 166,700 neurons are simulated every step; the 16,000-neuron cloud is only a visualization sample."
  - "A public Spectacles demo and an end-to-end verify_brain path exercise food turning, looming escape and bitter-stop behavior against the whole-brain server."
  - "The Metal GPU kernel is documented as an ordered-delivery exact port, with the CPU path producing the same spikes more slowly."
  - "The decision log explicitly separates measured neural quantities from engineered body state, controllers, landing rules, hunger gain, gait and perception helpers."
limitations:
  - "The AR world is translated into hand-designed sensory channels; Gemini labels objects but does not itself choose actions."
  - "Flight, wing rhythm, landing, walking gait, hunger and several body behaviors use engineered low-level rules around decoded neural commands."
  - "The project intentionally injects at deeper feature detectors when pixel-level paths do not produce usable behavior in this model."
  - "No matched rewired/random recurrent/simple controller is reported for the same AR tasks."
controls:
  - "The project has explicit end-to-end scenario and brain-verification checks and documents cases where channels such as hearing produce no useful response."
  - "CPU-versus-Metal equality is an implementation control, not a scientific topology control."
  - "Missing: same sensors/body/controller with MaleCNS replaced by degree-matched rewire, random recurrent network or compact conventional controller."
history:
  - "2026-09-26: initial placement -> scientific C / interest S, high confidence; whole-brain physical embodiment credited, connectome-specific behavioral attribution withheld."
---