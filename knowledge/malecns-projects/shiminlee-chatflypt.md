---
type: malecns-project
project_id: "shiminlee-chatflypt"
name: "ChatFlyPT — grounded sensory-to-language readout"
ownership: "independent"
kind: "Embodied MaleCNS simulation with physical sensory transduction, masked readout and qualified language labels"
stage: "Public implementation, held-out simulator evaluation; constrained candidate readout, not biological language"
primary_url: "https://github.com/ShiminLee/ChatFlyPT"
repository: "ShiminLee/ChatFlyPT"
evidence_url: "https://github.com/ShiminLee/ChatFlyPT/blob/1f73e6061c14f35cbc9801f1d3c6c664c2073610/reports/unified-readout/README.md"
scientific_tier: "A"
interest_tier: "S"
confidence: "medium"
reviewed_at: "2026-10-16"
reviewed_revision: "1f73e6061c14f35cbc9801f1d3c6c664c2073610"
summary: >-
  Couples one MaleCNS simulated neural system to an engineered environment
  with physical-event sensing and an input-blind neural decoder. Its restricted
  qualified labels are rendered into text without an external language model.
  Author-reported held-out simulator results demonstrate limited stimulus
  readout, not arbitrary semantic understanding or natural fly language.
strongest_evidence:
  - >-
    The current conspecific-v9 evaluation records 19/30 qualified labels on
    266 held-out windows, micro-F1 0.92857 and exact-set accuracy 0.66165;
    the archived training/validation/test splits keep session identities.
    This is the authors' simulator evaluation, not independent physiology.
  - >-
    The authors corrected a recipient-following source bug that made genuine
    spatial side delivery impossible, then resampled the v9 cohort. Physical
    side probes have 8–18 events on the intended side and zero contralateral.
  - >-
    The negative registry explicitly preserves failed and superseded readouts.
    Yeast left/right and warm-right labels remain unqualified; the previous
    yeast-right success was traced to an unbalanced corpus (43:1), not
    biological recovery of odor laterality.
limitations:
  - >-
    Engineered LIF dynamics, environment, sensor mapping, physical controller,
    and deterministic word rendering cannot establish biological language
    or naturally occurring sensorimotor competence.
  - >-
    Held-out windows share sessions and are not independent animals. Historic
    v5 metrics (18/30 labels; micro-F1 0.956 on 98 windows) do not describe
    the current conspecific-v9 model; old direct-stimulation results are distinct.
  - >-
    The movement readout abstains on unqualified yaw/turn intentions; behavior
    partly reflects authored locomotion. No matched rewiring or compute-matched
    artificial network establishes a special benefit of original MaleCNS wiring.
  - >-
    Recalculation of the public v9 test confusion counts finds 793 true
    positives, 15 false positives and 107 false negatives (micro-F1 0.92857).
    Two near-ubiquitous brightness labels account for 516/793 true positives.
    Removing only those two labels from the metric yields micro-F1 0.81953
    (277 TP, 15 FP, 107 FN), a descriptive sensitivity audit rather than
    a new neural ablation. The qualified warm-left label has only 20/27 =
    0.741 precision on the held-out test set, below its validation gate.
controls:
  - >-
    Present: grouped training/validation/test splits, blind exclusion of
    direct-input/sensory cells, genuine contact and side delivery checks,
    zero-input controls and explicit abstention for unqualified words.
  - >-
    Needed: biological stimulus calibration and recordings, topology-preserving
    shuffles, resource-matched architectures and independent full-model reruns.
  - >-
    Neighbor: unlike Fly School's inter-agent chemical signalling, ChatFlyPT
    tests single-agent readouts of engineered sensory experiences.
history:
  - >-
    2026-10-16: initial scientific A / interest S / confidence medium based
    on public v9 evaluation, causal delivery repairs and preserved negatives;
    the whole neural simulation was not independently reproduced.
note: >-
  v9 supersedes prominently displayed historic v5 results; a constrained
  textual report from simulated neurons is not evidence of fly speech.
---

# ChatFlyPT — qualified readouts, not fly language

User messages reach the neural model through simulated environment events, not
an undisclosed pretrained chat model. A previously impressive odor laterality
readout was withdrawn after a physical-side confound was identified.
