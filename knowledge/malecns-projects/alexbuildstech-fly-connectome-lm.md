---
type: malecns-project
project_id: alexbuildstech-fly-connectome-lm
name: "FlyLM — MaleCNS language-model benchmark"
ownership: independent
kind: "whole-connectome text prediction / controlled recurrent benchmark"
stage: "Public frozen and plastic training results; GPU multiseed replicate kernel committed but not yet evidenced by results"
primary_url: https://github.com/alexbuildstech/fly-connectome-lm
repository: alexbuildstech/fly-connectome-lm
evidence_url: https://github.com/alexbuildstech/fly-connectome-lm/blob/184d3a6be57a0843165595bc398c3920e1fe311e/experiment.md
scientific_tier: A
interest_tier: S
confidence: medium
reviewed_at: '2026-10-13'
reviewed_revision: 184d3a6be57a0843165595bc398c3920e1fe311e
summary: >-
  A full-scale MaleCNS-based character language-model experiment with public
  scripts, numerical result files, matched frozen-wiring baselines and an
  illuminating negative result. On its original frozen protocol the real graph
  does not outperform rewired or shuffled competitors. The subsequent plastic
  model reports a better score than its random control, but it trains 100% of
  real-graph synapses versus 20% of random-graph synapses and also changes signs;
  that comparison cannot isolate the contribution of connectome topology.
strongest_evidence:
  - >-
    In the frozen full-network tinyshakespeare assay, the committed report
    gives real MaleCNS 3.644 bits/character, weight-shuffled 3.629,
    degree-matched random 3.546, bigram 3.572 and Transformer-L 2.266. This
    within-protocol negative topology result is valuable even though the
    transformer remains substantially better at text prediction.
  - >-
    Public GPU frozen signed-battery results preserve the negative finding:
    signed real wiring reports 3.3315 bits/character versus shuffled signed
    3.2468 and random signed 3.1756 (lower is better). Signed edges improve
    the real arm, yet do not give it the leading frozen score.
  - >-
    The public plastic-battery JSONs report signed real 3.0571 versus random
    3.3831 bits/character at seed 0, each with 3,000 steps, 800,000 training
    characters and 24,000 validation characters. Their metadata also exposes
    the mismatched training fractions: 26,028,386 versus 5,200,238 trainable
    synapses, respectively.
  - >-
    Source, data-preparation scripts, committed metric artifacts and an
    explicit incident report support auditability. A two-seed replication
    kernel was committed on 2026-09-14, but matching executed multiseed
    numerical outputs were not found in the reviewed results directory.
limitations:
  - >-
    The 0.326 bits/character plastic gap is not proof of a topology advantage:
    the real/signed arm trains all synapses; the random/unsigned arm trains
    only 20%. Equal trainable fractions, synapse signs, initialization,
    optimization budget and readout capacity are needed for a causal contrast.
  - >-
    The plastic JSON metadata specify 800k training and 24k validation
    characters, whereas the frozen/Transformer headline uses a different
    1.05M/64k protocol. Cross-protocol numbers should not be presented as
    an identical-split controlled comparison.
  - >-
    Headline full-scale results are single-seed and not independently
    reproduced here. The repository's replication script is preparation, not
    evidence that GPU seed 1/2 executions have succeeded.
  - >-
    Characters are artificially encoded into sensory drives, neurons use
    engineered rate dynamics, and text prediction is not a biological task.
    Strong score improvements do not demonstrate biological language ability.
controls:
  - >-
    Strong frozen-family comparisons: real, weight-shuffled, degree-constrained
    random graph, n-gram counting and a conventional Transformer on a common
    held-out split, plus memory probes and transparent negative results.
  - >-
    Signed frozen controls remain better than signed real; this is a useful
    counterexample to any unconditional claim that MaleCNS wiring is superior.
  - >-
    Missing decisive plastic control: same dataset/split, E/I convention,
    fraction and count of trainable synapses, initialization scale,
    hyperparameter search, compute and multiple seeds for both topologies.
history:
  - >-
    2026-10-13: Initial scientific A / interest S / medium confidence, based
    primarily on the reproducible negative frozen comparison and open artifact
    trail. Plastic gains are recorded but NOT credited as a causal MaleCNS
    wiring advantage because the trainable-synapse/control budgets differ.
note: >-
  The stronger scientific score rewards controlled null evidence rather
  than a positive story. The plastic-comparison control mismatch is an
  unresolved scientific limitation, not a reason to discard the frozen null.
---
