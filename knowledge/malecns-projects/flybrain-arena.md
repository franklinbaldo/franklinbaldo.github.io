---
type: malecns-project
project_id: "codeman1729-flybrain-arena"
name: "FlyBrain Arena"
ownership: "independent"
kind: "whole-MaleCNS combat game / escape-pathway controller"
stage: "combat prototype with full-graph escape pathway, real game smoke tests and pathway ablations"
primary_url: "https://github.com/CodeMan1729/flybrain-arena"
repository: "CodeMan1729/flybrain-arena"
evidence_url: "https://github.com/CodeMan1729/flybrain-arena/blob/main/docs/ARCHITECTURE_NOTES.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "538a23cacd93c40fa1864bd6e55edf7a2591932a"
summary: >-
  A real 166,700-neuron MaleCNS computation is embedded in a playable Godot
  combat loop, with threat injected into annotated LC4/LPLC2 populations and
  DNp01/DNp03 activity used as an engineered dodge readout. Its strongest
  evidence is causal within the implemented model: edge ablation sharply reduces
  the escape signal and left/right input reversal flips the lateral response.
  The tier stops at B because the input encoding, dynamics and body controller
  remain engineered and no whole-topology matched null has been run.
strongest_evidence:
  - "The runtime propagates through the full 166,700-neuron, 25,582,938-edge MaleCNS graph and reads annotated LC4/LPLC2 to DNp01/DNp03 pathways."
  - "Direct-data checks report substantial real LC4-to-DNp01/DNp03 and LPLC2-to-DNp01 connectivity rather than assuming an escape pathway from labels alone."
  - "A controlled local edge ablation drops reported escape strength from 1.0 to 0.088, providing causal evidence that the selected anatomical pathway materially drives the implemented readout."
  - "Left/right input reversal, no-input cases, reset/lifecycle checks, real service/client tests and full game smoke tests are described as passed."
limitations:
  - "Threat is injected directly at LC4/LPLC2 because the project does not model the full retinal-to-looming pathway; this is an explicit engineering intervention."
  - "The signed activity-deviation dynamics are an engineering model, not a calibrated biological reproduction of fly neural dynamics."
  - "Chase kinematics and the mapping from descending-neuron activity to dodge vector are engineered controllers."
  - "The project does not establish that whole MaleCNS topology outperforms a matched rewire, random recurrent controller or a simple scripted dodge policy."
controls:
  - "Pathway-edge ablation and left/right-input reversal directly test whether the selected model pathway contributes to the implemented dodge signal."
  - "Occlusion, stale-response rejection and no-input tests constrain software/protocol alternatives but do not test topology specificity."
  - "Missing: whole-network topology nulls and a matched simple controller under the same threat sensor and body dynamics."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; causal pathway ablation credited, whole-connectome superiority claim withheld."
---