---
type: malecns-project
project_id: nulllabtests-flybrain-flyboard
name: "FLYBOARD — current-injection MaleCNS arcade (NullLabTests)"
ownership: independent
kind: "whole-CNS current-injection visualization and simplified spiking simulator"
stage: "Public runnable Python UI and headless tests; full-network throughput author-reported; baseline-score defect identified in source"
primary_url: https://github.com/NullLabTests/flybrain
repository: NullLabTests/flybrain
evidence_url: https://github.com/NullLabTests/flybrain/blob/9b922ae3e4bee3122e6c8fb996e054719fe71c05/flyboard/sim.py
scientific_tier: C
interest_tier: A
confidence: medium
reviewed_at: '2026-10-14'
reviewed_revision: 9b922ae3e4bee3122e6c8fb996e054719fe71c05
summary: >-
  An interactive MaleCNS v1.0 electrical-input visualizer with a published
  graph builder, named stimulus populations, simplified leaky-integrator
  dynamics and headless UI tests. The authors report 166,700 neurons,
  25.58 million directed connections and roughly 4x real-time CPU execution;
  this review did not independently rerun the full dataset or performance.
  The actual dynamics are a toy, and the interface is not an assay of fly
  desire, pain or behavior. A source-level rolling-baseline bookkeeping defect
  means its burst-minus-baseline leaderboard does not currently establish
  excess firing over the intended moving baseline.
strongest_evidence:
  - >-
    The public graph compiler, current injector, neuronal type-resolution
    presets and executable headless tests provide an inspectable engineering
    path from MaleCNS v1.0 tables to rendered voltages/spikes.
  - >-
    The authors document a numerically bounded reward-current injection
    (at most 1% of cells) and label biological claims as simulations, not
    experiences or behavior. The 4x full-net and 113x lite throughput figures
    are author-reported, not independently measured here.
  - >-
    Code audit and minimal NumPy reproduction: in Sim.step(), `old =
    self.ring[self.ring_pos]` aliases the ring row; assignment to that row
    happens before subtracting `old`. The running count `window_sum` thus
    receives zero net change instead of tracking recent spikes.
limitations:
  - >-
    The spike dynamics, gain, background current, reward model and control
    mappings are engineered rather than validated neural physiology.
  - >-
    The rolling-baseline defect makes the displayed excess-spike leaderboard
    effectively a raw measurement when baseline counts remain zero; the
    repository tests do not catch this aliasing bug.
  - >-
    The lite mode can use synthetic fallback data. Full MaleCNS fetch/build,
    responsiveness and throughput were not reproduced independently.
controls:
  - >-
    Headless synthetic-fixture tests check button stimulation, capped reward
    drive, UI clicks, no camera module and disclaimer wording; these are
    functional/regression checks, not topology-specific causal controls.
  - >-
    Missing spike-baseline invariant regression, before/after moving-baseline
    test and input-matched degree-preserving rewired/no-connectome controls.
history:
  - >-
    2026-10-14: initial scientific C / interest A / medium confidence;
    independently reproduced minimal NumPy aliasing failure limits
    interpretation of the author-provided leaderboard, pending correction.
note: >-
  This is distinct from sukoji/flyboard (an authored music ranking experiment);
  closest catalog neighbors are soup-connectome (runtime), fly-ai (interface)
  and the independent sukoji FLYBOARD card in pending PR #2363.
---
