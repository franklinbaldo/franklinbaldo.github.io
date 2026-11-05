---
type: malecns-project
project_id: guillaume-ds-kill-the-flies
name: "Kill the Flies — evolving connectome-based survival colony"
ownership: independent
kind: "Toy MaleCNS subcircuits, evolutionary synaptic gains and adversarial ecosystem"
stage: "Open Python implementation and integration tests; partial game loop and unvalidated biological/causal transfer"
primary_url: "https://github.com/Guillaume-ds/kill-the-flies"
repository: "Guillaume-ds/kill-the-flies"
evidence_url: "https://github.com/Guillaume-ds/kill-the-flies/blob/8c279e13e66385ff069063a33e571472934f218e/fly_brain/circuit.py"
scientific_tier: C
interest_tier: A
confidence: medium
reviewed_at: "2026-10-14"
reviewed_revision: "8c279e13e66385ff069063a33e571472934f218e"
summary: >-
  A real-connectome-fed, small-circuit LIF simulator coupled to an evolving
  fly-colony game. The public code loads MaleCNS v1.0 flat files, extracts
  DNp01-centred circuits, learns per-edge synaptic gains by evolutionary
  search and uses additional reward-modulated plasticity in a survival world.
  Implementation and tests go beyond a mockup, but the topology is truncated
  and behavior depends on engineered percept encoders, fixed escape geometry,
  rule-based world mechanics and fallback movement. It does not demonstrate
  that full-MaleCNS wiring produces autonomous general-purpose behavior or
  beats equivalently budgeted topology-null baselines.
strongest_evidence:
  - >-
    fly_brain/data.py downloads published MaleCNS flat-connectome Feather
    annotations, transmitter predictions and significant-only pair weights;
    circuit.py expands a specified seed type (default DNp01), caps the graph
    at tens of neurons and evolves per-edge gains while preserving edge
    endpoints and predicted transmitter sign.
  - >-
    fly_brain/simulate.py implements a toy LIF stepper and spike-raster
    generation; fly_brain/agent.py applies a learned motor-neuron spike
    threshold to escape decisions, while flee_direction() computes the
    direction geometrically from a percept's dx/dy.
  - >-
    training/run.py implements evolutionary strategy training with a
    ten-episode starting-fitness baseline and checkpoints. Tests include
    topology/index consistency, state serialisation, perception, survival
    and game contracts, but were not independently executed in this review.
  - >-
    wiki/state.md explicitly limits the current end-to-end loop to one
    instruction source and one kind of item. wiki/colony.md acknowledges
    missing active foraging and a reward rule that does not penalise gradual
    starvation, limiting meaningful survival-learning claims.
limitations:
  - >-
    The demo uses a tiny seed-centred subgraph, not whole-CNS dynamics;
    counts and timestamps in documentation do not substitute for pinned
    actual input-data checksum or an independent model-level reproduction.
  - >-
    Predicted neurotransmitter sign, normalized synapse counts, thresholds,
    perception embeddings and action geometry are modelling choices.
    Learnt escape activation does not imply learned directional navigation.
  - >-
    The baseline in training/run.py is starting-genome fitness, not a
    controlled comparison against shuffled topology, matched random RNN,
    non-connectome policy, or matched-compute conventional controller.
controls:
  - >-
    Existing in-program baseline compares starting versus trained genome,
    with seeded evaluation and checkpoints; it is an optimization diagnostic
    rather than a causal connectome test.
  - >-
    Missing: matched-degree topology rewiring, fixed-sign random subgraph,
    learned non-connectome policy and no-neuron geometry-only controller,
    holding percept encoder, reward, population, seeds and compute fixed.
  - >-
    Suggested ablations: silence DNp01/TTMn, remove geometric direction
    selection, vary synapse gains versus connectivity itself, and report
    survival/foraging generalisation on withheld worlds and seeds.
history:
  - >-
    2026-10-14: initial scientific C, interest A, confidence medium.
    Running architecture is evidenced by inspectable modules and tests,
    but training and biological conclusions are author-reported and no
    independent topological null was reviewed.
note: >-
  Compare with FLYT3 and flybrain-snake: all separate neural wiring from
  learned or rule-based outputs, but the survival-colony and reward-design
  problems create a materially distinct research target.
---
