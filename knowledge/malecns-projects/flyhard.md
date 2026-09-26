---
type: malecns-project
project_id: "markunthank-flyhard"
name: "Flyhard"
ownership: "independent"
kind: "whole-connectome embodied control experiment"
stage: "single-seed steering skill with connected CARLA demonstration"
primary_url: "https://github.com/MarkUnthank/flyhard"
repository: "MarkUnthank/flyhard"
evidence_url: "https://github.com/MarkUnthank/flyhard/blob/main/docs/pilot-2026-09-09.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "26198488ba288a1ff55cd2299fcc841d5a148c60"
summary: >-
  Full-scale MaleCNS-derived controller coupled to a simulated fly body and a
  passive steering wheel, with a held-out stationary steering skill and a
  causal grip-disconnection intervention in CARLA. The behavioral evidence is
  concrete, but one training seed and the absence of a matched shuffled or
  conventional-policy comparator prevent a topology-specific conclusion.
strongest_evidence:
  - "The retained model uses 165,122 traced MaleCNS neurons and 25,563,197 measured neuron-pair edges."
  - "A single trained steering run passed 100/100 held-out requested-angle trials after 0/100 before training."
  - "In a 24-second CARLA demonstration, disabling the fly-to-wheel grip reduced peak steering by more than 99.98% under the same checkpoint and scripted route."
limitations:
  - "The learned steering result is from one training seed and interpolation within the trained angle range."
  - "Visual autonomous driving, coordinated learned pedal control and three-seed replication remain untested."
  - "The current evidence does not compare the measured graph against a matched rewired graph or ordinary policy under the same training budget."
controls:
  - "Matched before/after model with frozen interfaces and unchanged topology."
  - "Grip-disabled intervention isolates the causal fly-body-to-wheel mechanical path."
  - "A topology-destroying matched graph control and conventional policy comparator remain missing for the learned steering claim."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; strong embodied causal evidence, topology-specific claim withheld."
note: "The tier credits the demonstrated embodied control chain, not a claim that MaleCNS topology is superior."
---