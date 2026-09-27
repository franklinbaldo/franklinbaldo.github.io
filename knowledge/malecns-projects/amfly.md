---
type: malecns-project
project_id: "aravpanwar-amfly"
name: "amfly"
ownership: "independent"
kind: "whole-MaleCNS multi-instance closed-loop stimulation art/experiment"
stage: "reproducible whole-CNS closed loop with preserved negative mechanistic results"
primary_url: "https://github.com/aravpanwar/amfly"
repository: "aravpanwar/amfly"
evidence_url: "https://github.com/aravpanwar/amfly/blob/main/docs/negative-results.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "d068cac0dbbaa22a5079455e1824c983cce80868"
summary: >-
  Six synchronized copies of the full 166,700-neuron MaleCNS are coupled in a
  feedback installation in which one operator network selects stimulation
  targets and chamber state feeds current back to the operator. The strongest
  evidence is causal and within-model: pinned-data reproduction, isolation,
  perturbation propagation and several negative mechanism tests are explicit.
  The project does not establish that MaleCNS topology is uniquely responsible
  for the effects, and the visible convulsion is an authored direct motor drive.
strongest_evidence:
  - "The published reproduction contract loads the full 166,700-neuron / 25,582,938-connection MaleCNS and reports 31 real-data tests passing, including exact counts, determinism, isolation, divergence, stimulus and analysis gates."
  - "With phasic sensory drive, the stimulated instance diverges around step 18 and accumulates large spike-identity differences, while the four unstimulated chambers and operator remain bit-identical controls."
  - "The project preserves failures that changed the interpretation: tonic drive synchronized away perturbations, raw DN argmax only reached two chambers, a moving reference produced a false operator divergence, and delayed stimulation of a settled network often changed only one neuron."
  - "Driving the modeled escape pathway does not yield the desired motor response; the shipped visible convulsion instead injects current directly into 708 motor neurons and is explicitly labeled as authored rather than emergent."
limitations:
  - "\"Dopamine\", punishment and electrode effects are modeled current injection, not demonstrated biological reinforcement, pain or tissue damage."
  - "The operator mapping, dwell/hysteresis, chamber thresholds and body-motion amplification are engineered interfaces outside the frozen connectome."
  - "The visible convulsion bypasses the escape circuit by directly driving motor neurons."
  - "No degree-preserving rewire, random recurrent network or compact conventional controller is evaluated under the same closed-loop task."
controls:
  - "Unstimulated whole-CNS instances and the operator provide exact within-run isolation controls; bit-identity is a stated invariant."
  - "Phasic versus tonic stimulation, stable-reference repair and direct-motor-drive comparisons preserve negative and failure cases rather than tuning them away."
  - "Missing: matched topology-destroying and non-connectome baselines capable of testing whether the specific MaleCNS wiring matters."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; whole-CNS causal/reproducible evidence credited, topology-specific and biological reinforcement claims withheld."
note: "The tier credits controlled whole-network mechanism evidence, not the installation's reward/punishment metaphor or direct motor convulsion."
---
