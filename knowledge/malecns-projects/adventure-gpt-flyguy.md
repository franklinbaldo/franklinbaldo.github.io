---
type: malecns-project
project_id: adventure-gpt-flyguy
name: "flyguy — MaleCNS Rocket League bot"
ownership: independent
kind: "game-playing policy / supervised imitation and reinforcement learning"
stage: "Public RLBot v5 playable checkpoint, graph, trainer components and replay; stronger training harness and weights withheld"
primary_url: https://github.com/adventure-gpt/flyguy
repository: adventure-gpt/flyguy
evidence_url: https://github.com/adventure-gpt/flyguy/blob/09523ea004aa2de621ea4f42bce14e6049d290e9/docs/HOW_IT_WAS_MADE.md
scientific_tier: B
interest_tier: S
confidence: medium
reviewed_at: '2026-10-13'
reviewed_revision: 09523ea004aa2de621ea4f42bce14e6049d290e9
summary: >-
  A playable Rocket League bot whose three-hop artificial policy uses real
  MaleCNS connection topology as a sparse wiring constraint. Published games,
  code, weights and a replay demonstrate an engineered controller can play,
  but without matched rewired/random-graph controls they do not demonstrate
  that the fly's particular wiring is responsible for performance.
strongest_evidence:
  - >-
    The public builder uses 166,700 MaleCNS neurons and 15,283,167 directed
    neuron pairs after a two-synapse threshold; the causal three-hop decision
    slice uses 70,636 neurons and 2,992,734 connections, linking 517 engineered
    game observations to 90 actions through sensory and descending populations.
  - >-
    Public RLBot v5 source, playable early weights, graph export and unit
    tests include a small-graph equivalence check between the optimized
    reachability-trimmed sparse computation and the full forward calculation.
    A native C++ inference path is reported at roughly 2.5 ms per decision.
  - >-
    The author reports a released-weight goal share of 0.59 against a simulated
    delayed Nexto over 768 1v1 matches, and provides a single real-game replay
    for a stronger, non-released model winning 42-14. These are not equivalent
    checkpoints or independently reproduced results.
  - >-
    Negative training outcome preserved: on the author's simulator benchmark,
    569 million reinforcement-learning moments ultimately returned to the
    imitation-trained model's earlier goal share (about 0.71), rather than
    improving it; additional runs did not surpass their start checkpoint.
limitations:
  - >-
    Neurons are artificial rectified units; input assignments, readout, weights
    and learning rule are engineered. No biological timing, spikes, learning
    or demonstration of fly behavior follows from the game performance.
  - >-
    The published checkpoint is weaker than the 42-14 replay checkpoint;
    teacher, full simulator, end-to-end PPO harness and stronger trained
    weights are not public. The training trajectory cannot be reproduced
    end-to-end from this checkout alone.
  - >-
    Strong 1v1 simulated scores do not generalize to 2v2 or 3v3 (reported
    goal shares 0.18 and 0.13, respectively). The reported 2.5 ms inference
    and match results were not independently benchmarked in this review.
controls:
  - >-
    Small synthetic-graph checks test numerical agreement between optimized
    and unpruned computation, but they are implementation checks, not controls
    for the value of biological topology.
  - >-
    No degree/sign-matched rewired graph, matched-density random graph, or
    matched-parameter conventional network trained with the same data and
    compute was evaluated; the project explicitly acknowledges this gap.
  - >-
    The higher-strength replay is a single match rather than a repeated,
    held-out real-game performance interval, and comparisons to teacher
    stages exist only in the author's simulator.
history:
  - >-
    2026-10-13: Initial scientific B / interest S / medium confidence.
    Playable code and replay credited; missing topology controls and withheld
    final training artifacts limit causal confidence. Reinforcement-learning
    plateau and weaker public checkpoint preserved.
note: >-
  Compare to fly-craftax and Gomoku: a strong task score cannot establish a
  topology-specific advantage without retraining a properly matched null.
---
