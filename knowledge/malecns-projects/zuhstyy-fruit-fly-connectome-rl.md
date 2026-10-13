---
type: malecns-project
project_id: zuhstyy-fruit-fly-connectome-rl
name: "FlyBrain Celeste — MaleCNS PPO/imitation controller"
ownership: independent
kind: "game-playing policy / recurrent RL and imitation controller"
stage: "Public 4.1.0 software, graph, bridge and offline validation; native Windows campaign clear not demonstrated"
primary_url: https://github.com/zuhstyy/fruit-fly-connectome-rl
repository: zuhstyy/fruit-fly-connectome-rl
evidence_url: https://github.com/zuhstyy/fruit-fly-connectome-rl/blob/8c6274e4076d218dfa23ffc3e5ce25826f111dcc/docs/VALIDATION.md
scientific_tier: B
interest_tier: S
confidence: medium
reviewed_at: '2026-10-13'
reviewed_revision: 8c6274e4076d218dfa23ffc3e5ce25826f111dcc
summary: >-
  A Celeste controller built around a fixed 256-neuron, 3,326-edge MaleCNS
  subgraph whose edge gains and actor/value readouts are trained with PPO and
  imitation. Public evidence establishes computational influence, learning and
  checkpoint persistence, but not a native full-game clear or a
  topology-specific advantage over alternative recurrent wiring.
strongest_evidence:
  - >-
    The public architecture maps 156 engineered game observations through a
    256-neuron/3,326-edge MCNS v1.0 subgraph and learns both button direction
    and variable input duration while preserving topology and edge signs.
  - >-
    A synthetic conditional-learning experiment (seed 17, 70 accelerated
    updates) raises the probability of two opposite context-dependent actions
    from about 0.34/0.33 to 0.95/0.95 and learns different hold durations;
    1,077 edge gains change. The artifact explicitly states that Celeste was
    not played in this experiment.
  - >-
    Release validation reports a fresh-model recurrent-edge ablation changing
    action probabilities by up to 0.01068530, and a disposable PPO update
    changes all 3,326 edge strengths plus actor/value arrays while exact
    save/reload preserves parameters, optimizer moments, RNG and counters.
  - >-
    Version 4.1 validation records 107 discovered Python tests with 106 passes
    and one CUDA skip in the retained release record, plus C# bridge, route,
    transport and practice checks. Later documentation reports 111 discovered,
    107 passes and four optional tensor/CUDA skips after packaging cleanup.
limitations:
  - >-
    The public evidence does not establish an unattended native Celeste clear,
    a Prologue-to-Summit completion, 64 simultaneous native games, long-run
    stability, Windows performance or CUDA throughput; those are explicitly
    listed as unverified.
  - >-
    The strongest learning artifact is a synthetic conditional task using an
    accelerated rate, not normal-rate progress in Celeste. Teacher-assisted
    practice, route memory, geometric objectives and bounded search are
    engineered components separate from the fly graph.
  - >-
    The 256-neuron graph is a selected MaleCNS subgraph, not a full whole-CNS
    simulation, and its recurrent dynamics/PPO objectives are engineered rather
    than validated fly physiology.
  - >-
    This review did not execute native Celeste/Windows. It inspected the public
    source, graph provenance and validation artifacts.
controls:
  - >-
    The project separates frozen-policy evaluation from teacher/practice modes,
    preserves model hashes and includes recurrent-edge ablation plus synthetic
    conditional-learning checks, which establish computational dependence and
    trainability but not biological-topology specificity.
  - >-
    No published degree/sign-preserving rewired graph, matched random recurrent
    network or parameter-matched conventional controller has been trained with
    equal real-game experience. The project's own research notes call this out
    as an important next comparison.
  - >-
    Stronger evidence would compare multiple training seeds and alternative
    recurrent wiring under the same native-game frames, while keeping teacher,
    search, reset and imitation budgets identical.
history:
  - >-
    2026-10-13: Initial scientific B / interest S / medium confidence. Public
    graph provenance, learning/persistence checks and explicit negative limits
    justify B; absence of native campaign success and topology-matched controls
    prevents a stronger placement.
note: >-
  This project is a useful example of careful engineering evidence: it proves
  the recurrent graph can influence and learn a controller without claiming
  that those facts alone establish a MaleCNS-specific advantage in Celeste.
---
