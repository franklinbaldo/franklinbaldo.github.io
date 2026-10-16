---
type: malecns-project
project_id: anzal1-samesmell
name: "Same Smell — paired male/female connectome installation"
ownership: independent
kind: "Browser cVA circuit visualization with sampled MaleCNS and FlyWire graphs"
stage: "Public interactive LAB, VERSUS and SWIPE demo; no topology-specific causal test or biological behavior validation"
primary_url: "https://github.com/anzal1/samesmell"
repository: "anzal1/samesmell"
evidence_url: "https://github.com/anzal1/samesmell/blob/f5891d9206802e172c619e2bcede9d25e2cb79f1/scripts/fetchReal.py"
scientific_tier: C
interest_tier: A
confidence: medium
reviewed_at: "2026-10-14"
reviewed_revision: "f5891d9206802e172c619e2bcede9d25e2cb79f1"
summary: >-
  Interactive two-sex brain installation contrasting pheromone-triggered responses
  in sampled graphs derived by public code from MaleCNS v1.0 (male) and FlyWire
  v783 (female). The repository ships real-data JSON and a provenance-oriented
  extractor as well as procedural fallback assets. It demonstrates an accessible
  visualization and toy dynamics, not that observed male/female behavior, aggression,
  receptivity, or Pong performance emerges from the biological wiring.
strongest_evidence:
  - >-
    Shipped data/real/male.json and data/real/female.json are loaded preferentially
    by src/main.js and labeled REAL DATA when validated; scripts/fetchReal.py
    specifies neuPrint male-cns:v1.0 and FlyWire FAFB v783 inputs, sampled
    skeleton geometry, cell classes, edge counts and their public origins.
    Independent regeneration and checksums against original data were not run.
  - >-
    Public LAB, VERSUS and SWIPE modes share a simplified LIF-like simulator
    and animated visualization; cVA current is delivered to ORN populations,
    and the simulator emits a descending-neuron event when a modeled descending
    neuron fires. The displayed body is a scripted animation triggered by that
    event, not a simulated musculoskeletal system.
  - >-
    The inspected LAB source fixes the male/female verdict strings in
    src/modes.js (LUNGE versus PAUSE); its onVerdict callback receives only a
    side identifier after the first descending-neuron firing event. Therefore
    the headline opposite behavioral labels are not decoded from a matched
    behavioral output model that could reverse when graphs are swapped.
  - >-
    The simulator assigns engineered spine/feedforward/lateral weights using
    pathway/rank classes and normalizes coupling; edges from shipped JSON are
    not used as a fully biophysical synapse-calibrated network. Pong likewise
    uses a fixed sensor-to-paddle mapping and game dynamics.
limitations:
  - >-
    Male and female graphs originate from different connectome datasets and
    selected cell samples. Cross-dataset coverage, annotation and sampling
    differences remain confounded with sex; this is not a controlled
    sex-specific causal analysis.
  - >-
    The public SPEC.md explicitly documents the stand-in POC graph and
    procedural morphology. The app attempts real data first, falls back to
    synthetic data, and displays a conditional badge; documentation and visual
    storytelling alone must not be treated as anatomical validation.
  - >-
    The behavioral labels are side-constant, simplified firing rates are
    illustrative, spikes are time-stretched, and the body is not physical.
    No living-animal behavioral reproduction, topology null, matched-swap
    experiment, or held-out performance benchmark was identified.
controls:
  - >-
    Matched input is applied to both model instances, and loading badges
    distinguish real-derived input from procedural fallback. This supports
    an interpretive demo, not a counterfactual attribution of behavior.
  - >-
    Needed: swap male/female graphs while holding labels, input, model
    parameters and downstream readouts fixed; replace either graph with
    degree-matched rewiring; report quantitative paired circuit outputs.
  - >-
    Needed: validate downloaded skeleton IDs and edges against pinned MaleCNS
    v1.0 and FlyWire references, separate anatomical differences from dataset
    mismatch, and repeat with multiple selected-cell samples.
  - >-
    Compare with Fruitless (explicit within-model perturbation/controls),
    Fly Brain Atlas (anatomical provenance without dynamics), and
    fly-afterlife (simulated actuation with negative locomotion result).
history:
  - >-
    2026-10-14: initial scientific C, interest A, confidence medium. Credits
    creative dual-connectome public demonstration and inspectable code while
    withholding sex-causal or behavioral claims based on fixed output labels.
note: >-
  Reviewed public revision f5891d9. The presence of real-derived geometry and
  edges does not make authored LIF parameters, sex-labelled verdicts, puppetry
  or game control biologically emergent; no independent browser run was made.
---
