---
type: malecns-project
project_id: merolaagi-malecns-lab
name: "MaleCNS Lab — anatomical circuit experiments and falsification"
ownership: independent
kind: "Measured MaleCNS circuit subsets, LIF body proxy, visual/olfactory memory, spectral and reservoir controls"
stage: "public multi-experiment research lab with committed anatomical subsets and benchmark results; physiological fidelity unvalidated"
primary_url: https://github.com/merolaagi/malecns-lab
repository: merolaagi/malecns-lab
evidence_url: https://github.com/merolaagi/malecns-lab/blob/367399034abace56ae57f0b1f576e8e840e41029/README.md
scientific_tier: A
interest_tier: S
confidence: medium
reviewed_at: '2026-10-10'
reviewed_revision: 367399034abace56ae57f0b1f576e8e840e41029
summary: >-
  An unusually transparent MaleCNS laboratory that separates measured anatomy
  from assumed dynamics and engineered outputs. Its locomotion subset has 807
  neurons, 21,161 directed anatomical connections and 329,230 counted synapses;
  separate traced mushroom-body and visual datasets support memory, sensory,
  spectral and reservoir experiments. Several apparent biological advantages
  collapse under stronger controls, and the project keeps those nulls and repairs
  visible. The scientific A credits falsifiable investigations and strong
  controls, not biological gait, vision, learning or topology-specific superiority.
strongest_evidence:
  - >-
    data/circuit.json pins MaleCNS source hashes. The public sparse LIF model
    runs the measured locomotion subset, while its six leg oscillators, target
    bearing injection, sensory feedback, transmitter signs and body mapping are
    declared assumptions, not recovered Drosophila physiology.
  - >-
    After a measured-upstream visual-input correction and two Kenyon-cell code
    repairs, data/objects-benchmark.json reports familiar-object AUC 0.901 for
    the measured condition, 0.725 for shuffled wiring, 0.793 random and 0.904
    with assumed upstream features, over five seeds. Side-light AUC falls to
    0.559 for measured wiring, below its shuffled control (0.689). These are
    synthetic rendered objects and not measured fly responses; no general
    topology advantage follows from this small, task-dependent comparison.
  - >-
    A near-unit spectral radius (0.976) for the row-normalized locomotion graph
    appeared topology-specific, but disappeared under global singular-value
    scaling (0.184 measured versus 0.157–0.230 randomizations). The author
    traced the original near-unit result to self-contained strongly connected
    blocks and row normalization induced by subset selection; the strong claim
    was explicitly withdrawn.
  - >-
    With an observability-filtered graph, measured inhibition placement improves
    linear-readout memory over random placement by 0.206 +/- 0.175 across 15
    paired seeds, but ties high-throughput placement (+0.020 +/- 0.101) and
    becomes equivalent after spectral-radius equalization. The lab preserves
    this mechanistic negative instead of claiming biological uniqueness.
limitations:
  - >-
    No physiological recordings calibrate or validate the LIF, sign assignments,
    biomechanics, object-rendering pipeline or compartment learning rule. The
    toy body uses hand-engineered oscillators; targeted movement commands use
    exact world coordinates, not biological vision or odor sensing.
  - >-
    Some historical README tables used a now-fixed Kenyon-cell normalization
    bug and invented visual features. The latest saved object benchmark must be
    distinguished from those superseded results and still does not establish
    out-of-domain visual generalization or statistically robust topology gains.
  - >-
    The memory model reproduces extinction via a chosen signed-loop rule but
    underweights the gamma-1 compartment required in flies (about 4-5%); its
    downstream biological readout is incomplete. The vision graph's measured
    RMSE 0.0172 trails a dense recurrent comparator at 0.0157 on a synthetic
    motion task, despite its utility as a learning substrate.
controls:
  - >-
    Public benchmark files include paired seeds, no adaptation, shuffled and
    random wiring, assumed-feature input, moved-Kenyon outputs, component
    ablations and missing/no-learning controls. These separate engineered
    sensory preprocessing from anatomical effects.
  - >-
    Spectral checks vary weight and edge shuffles, reciprocal controls,
    normalization and coverage-selected subsets. The inhibition experiment
    compares identical counts of inhibitory cells at matched gain and common
    gain, including a high-throughput placement control.
  - >-
    More decisive tests need physiology-calibrated held-out interventions,
    true external sensory signals, matched graph/representation budgets and
    independent recomputation of published numerical benchmarks.
history:
  - >-
    2026-10-10: initial scientific A / interest S / medium confidence; rigorous
    negative controls and corrections credited, with no claim of fly-like
    natural behavior or unique biological-topology benefit.
note: >-
  Compare with aliozen0's synthetic-by-default Virtual Brain Lab (this lab
  publicly includes measured anatomical subsets), and with benchmark-first
  flybench. Signed-loop and visual-ablation results are model-specific.
---
