---
type: malecns-project
project_id: nsfm-fly-afterlife
name: "fly-afterlife — real-eye and body-loop MaleCNS"
ownership: independent
kind: "whole-CNS sensory transduction, graded optic seam and physical body-loop study"
stage: "public longitudinal experiments; brain-track proxy locomotion; body track stands but has not produced native coordinated walking"
primary_url: https://github.com/nsfm/fly-afterlife
repository: nsfm/fly-afterlife
evidence_url: https://github.com/nsfm/fly-afterlife/blob/21ce86ecfda72a12be6336a579c0b7bf5d323162/docs/CAMPAIGN.md
scientific_tier: A
interest_tier: S
confidence: medium
reviewed_at: '2026-10-13'
reviewed_revision: 21ce86ecfda72a12be6336a579c0b7bf5d323162
summary: >-
  An unusually auditable MaleCNS embodiment attempt separates an engineered
  walking-speed/turning readout in a virtual world from a more stringent
  373-leg-motor-neuron MuJoCo/NeuroMechFly body loop. The brain track reports
  sensory-selective closed-loop responses, but has not established robust
  looming selectivity across the flyvis ensemble. The physical body can
  support weight and lift legs; the connectome at its original weights has
  not generated coordinated stance/swing or forward gait. That negative,
  backed by matched body/Poisson/kinematic controls and a published
  intervention ledger, is stronger evidence than an uncontrolled walking demo.
strongest_evidence:
  - "Author-published eye-seam experiments include a 10-model flyvis ensemble: HS optic-flow side was robust in 8/10, while bidirectional drum-following at a single-neuron steering readout worked in only 2-3/10."
  - "The SEAM status retracts all v2/v3 flyvis-driven looming-selectivity claims after the bright-ball and ensemble controls; ideal T4/T5 drive yields LPLC2 expand 99 versus contract 13, flash 17 and static 0 in the point-neuron core."
  - "The physical-body campaign reports six feet bearing 9.7-10.1 of 10.05 uN with sourced springs, but no native leg alternation or meaningful forward walking; mean-rate-matched Poisson motor trains reproduce apparently rhythmic lift bouts."
  - "The public repository provides parameter provenance, 31-row compromise ledger, motor-neuron/kinematic replay benchmarks, committed result logs, and an oracle script for comparing the core integration against frozen traces."
limitations:
  - "Counts and dynamics are implementation-specific: the roughly 162,517-neuron/6.1M-edge working graph uses a weight threshold and does not comprise all MaleCNS contacts in its main model."
  - "Virtual brain-track locomotion uses a designed motor readout, not physics driven by connected leg-motor output; do not score it as a fly that walks on its own legs."
  - "Flyvis ensemble transfer, hand-set sensory transducers, physiological additions, imported spring/muscle models and tuned solver gains mean behavioral results are not isolated evidence of connectome-topology advantage."
  - "Author-run logs and test descriptions are publicly inspectable, not independently rerun here; full MaleCNS assets and MuJoCo dependencies were unavailable in this review sandbox."
controls:
  - "Eye-seam bright-ball versus looming, receding, flash, static and ideal-T4/T5 stimuli; across-model ensemble checks led to explicit withdrawal of earlier positive claims."
  - "Body-track mean-rate-matched Poisson motor trains, no-senses runs, scripted tripod and biological-kinematics replay separate neural coordination from mechanics and control artifacts."
  - "Oracle frozen traces and same-seed intervention comparisons support implementation repeatability; they are not external biological validation."
  - "Still missing: degree/strength-matched rewired MaleCNS and non-connectomic recurrent motor-controller baselines with equal compute and interface budgets."
history:
  - "2026-10-13: initial scientific A, interest S, medium confidence; explicit negative body-loop findings, oracle traces, ensemble falsification and controls weighted more than visual ambition."
note: "Distinct from fly.ai/flybrain's reusable neural substrate, flyverse's world simulation and other virtual-fly demos: the key independent result is the measured failure to obtain native physics-based gait despite a working body and sensory/biomechanical interventions."
---
