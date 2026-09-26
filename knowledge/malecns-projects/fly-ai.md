---
type: malecns-project
project_id: "alextitonis-fly-ai"
name: "fly.ai / flybrain"
ownership: "independent"
kind: "whole-connectome spiking platform and frozen reservoir"
stage: "public reusable package with controlled pathway and communication experiments"
primary_url: "https://github.com/alextitonis/fly.ai"
repository: "alextitonis/fly.ai"
evidence_url: "https://github.com/alextitonis/fly.ai/blob/main/README.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "40fbeca60e5c16742f20b4c2c067de915b388e66"
summary: >-
  A reusable full-MaleCNS spiking platform with explicit pathway experiments,
  multiple applications and unusually useful negative controls. Side-specific
  looming and steering effects survive repeated noise seeds, while the project's
  own degree-preserving scramble and time-shuffle experiments show that stronger
  claims about special topology or temporal code do not always survive.
strongest_evidence:
  - "The public FlyBrain package retains the 166,700-neuron, roughly 25.6-million-connection MaleCNS graph as a frozen recurrent substrate with task-specific encoders and fixed or trained readouts."
  - "Direct feature-detector injection produces side-correct LC4/LPLC2-to-DNp01 and LC10a-to-DNa02 effects across six noise seeds."
  - "The fly-to-fly communication experiment reports three runs with 50-shuffle permutation nulls and a degree-preserving scrambled-wiring control; at 2 ms the scrambled graph carries at least as much singer-state information as the measured wiring, explicitly falsifying the stronger topology claim in that regime."
limitations:
  - "The core uses simplified point-neuron dynamics, rough transmitter-sign rules and no validated graded-neuron model; the project documents failures at the photoreceptor/lamina boundary."
  - "Several applications bypass the eye by injecting known feature-detector populations or add task-specific readouts, so downstream success is not automatically evidence for autonomous whole-brain competence."
  - "The simulations are not validated against recordings from the imaged fly."
controls:
  - "Noise-seed replication, silence controls, permutation/time shuffles and a degree-preserving scrambled connectome are used in the reported communication experiments."
  - "Negative results are preserved, including settings where vision does not modulate motor output and the 2 ms scrambled topology matches or exceeds the measured graph."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; controlled pathway evidence and adversarial nulls credited, biological-fidelity and topology-superiority claims withheld."
note: "This card scores the reusable flybrain core; materially distinct applications may receive separate cards when they have their own evidence."
---