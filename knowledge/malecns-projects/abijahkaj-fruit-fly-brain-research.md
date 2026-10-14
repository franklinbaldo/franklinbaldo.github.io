---
type: malecns-project
project_id: abijahkaj-fruit-fly-brain-research
name: "Fruit fly brain — optic-v2"
ownership: independent
kind: "visual sensorimotor closed-loop simulator / MaleCNS circuit subset"
stage: "Public browser graph and fitted parameters; author-reported scene assays; descending motor relay unresolved"
primary_url: https://github.com/AbijahKaj/fruit-fly-brain-research
repository: AbijahKaj/fruit-fly-brain-research
evidence_url: https://github.com/AbijahKaj/fruit-fly-brain-research/blob/c28066a5b9eff03efdb002f6779980d29f70634c/app/README.md
scientific_tier: B
interest_tier: S
confidence: medium
reviewed_at: '2026-10-13'
reviewed_revision: c28066a5b9eff03efdb002f6779980d29f70634c
summary: >-
  A public Three.js/WebGPU visual-flight prototype that runs a 65.8k-unit,
  1.97M-edge MaleCNS-derived optic/motor subgraph against a rendered 1,771-column
  eye. It reports direction and looming selectivity after parameter fitting,
  with useful negative cases. The steering output currently reads the HS visual
  cells, not a validated descending-neuron-to-wing route; engineered dynamics,
  gains and body are essential. It has not established an advantage attributable
  to MaleCNS topology over a matched rewired graph.
strongest_evidence:
  - >-
    The repository commits extraction code, the optic-v2 binary graph, fitted
    parameters, a WebGPU network backend and CPU worker fallback. The author
    reports 0.86 ms per 4 ms integration substep on Apple GPU, compared with
    2.9–3.5 ms in the worker; these runtimes were not independently measured.
  - >-
    The optic training report preserves a negative transfer result: imported
    flyvis parameters initially gave mean direction-selectivity index (DSI)
    0.00. After fitting, reported mean T4/T5 DSI is around 0.66–0.67 and
    preferred-direction tuning correlation around 0.96 across 16 groups.
  - >-
    In author-reported scene assays, optomotor response changes sign with drum
    rotation and looming-related LC readouts discriminate approaching from
    static/receding/translating stimuli. The report includes collisions for
    centred approaches and failures at higher approach speeds.
  - >-
    An engineering cross-check reports GPU-versus-CPU maximum rate difference
    around 3e-5 after 100 steps; this checks implementation agreement, not
    biological validity or a topology-specific behavioral benefit.
limitations:
  - >-
    The HS-to-posterior-slope-to-DNg02 route is not calibrated; DNg02 remains
    near constant under the current fit. The fly is steered using an engineered
    HS-to-wing readout, not established full brain-to-motor causation.
  - >-
    The rate dynamics, neurotransmitter signs, per-type/pair fit, photoreceptor
    adaptation, output calibration and rigid-body flight mechanics are modeled
    or fitted, not observed biological dynamics. Some motion-detection cells
    and interhemispheric pathways are missing from the extracted graph.
  - >-
    Head-on looming still collides; stripe/background phase changes detection
    onset, and a straight cruise can drift 10–50 degrees in seven seconds.
    Reported response/selectivity figures do not substitute for repeated
    held-out scene evaluations or an independent reproduction.
controls:
  - >-
    Pre-fit flyvis transfer (DSI 0.00) versus fitted model, static gratings,
    receding and translating objects, and gain-off approach distances are
    informative within-project checks, not causal tests of fly-specific wiring.
  - >-
    No same-compute degree/sign-matched rewired graph or non-connectome network
    with the same parameter fitting and inputs is reported for flight success.
  - >-
    GPU versus CPU comparisons test numerical parity, not a neuroscience
    hypothesis. A held-out split across backgrounds, starting states and
    approach angles would strengthen the behavioral claim.
history:
  - >-
    2026-10-13: Initial scientific B / interest S / medium confidence. Credited
    a public runtime and quantitative positive/negative scene assays, while
    retaining the missing DNg02 bridge and topology-matched-control gap.
note: >-
  Compared with FlyDoom, this project exposes a more anatomically focused
  vision-to-steering subgraph and quantitative visual selectivity; neither
  currently proves fly-specific wiring outperforms matched controls.
---
