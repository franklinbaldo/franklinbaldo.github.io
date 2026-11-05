---
type: malecns-project
project_id: "yebali-fly-connectome-simulator"
name: "Fly Connectome Simulator — three flies on a desk"
ownership: "independent"
kind: "MaleCNS-derived optic-flow/looming circuit driving a three-fly browser simulation"
stage: "public runnable browser demo and source with self-tests; no independent full-browser reproduction in this review"
primary_url: "https://github.com/yebali/fly-connectome-simulator"
repository: "yebali/fly-connectome-simulator"
evidence_url: "https://github.com/yebali/fly-connectome-simulator/blob/e481323397fb7d3b195d1516836edfc71cec4521/README.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "medium"
reviewed_at: "2026-10-16"
reviewed_revision: "e481323397fb7d3b195d1516836edfc71cec4521"
summary: >-
  A public three-fly browser demonstration embeds a 397-neuron,
  13,331-connection MaleCNS-derived visual/descending circuit (42 LPTC,
  311 looming LC4/LPLC2, 44 descending cells), with anatomical weights,
  visual receptive fields, transmitter signs and laterality. A modeled
  sensorimotor decoder steers yaw and avoidance. Forward cruise, wandering,
  boundary return, vertical flight and perching are partly engineered, so
  visible flight alone is not a validated biological autonomous policy.
strongest_evidence:
  - >-
    Public demo at https://yebali.github.io/fly-connectome-simulator/
    reads a separate connectome file and displays independently simulated
    neuronal responses for three flies; source clearly distinguishes
    connectome-derived properties and manually modeled dynamics.
  - >-
    Code supplies deterministic interventions including half-eye mirroring,
    receptive-field shuffling and descending-input rewiring. The ?selftest
    browser path includes optomotor sign, looming locality, perturbation
    separation, barrier and perching checks; not independently run here.
  - >-
    Audited movement source includes a neural yaw/avoidance path alongside
    a separately authored forward-cruise term.
limitations:
  - >-
    In the normal airborne movement branch, nominal cruise is 320 mm/s
    and neural braking cannot reduce speed below 30 percent, or 96 mm/s.
    The explicitly programmed landing state can reduce speed to zero.
  - >-
    Wandering, boundary return, periodic perching, retina model, time
    constants and motor gains are engineered. Whole-flight behavior
    therefore cannot be solely attributed to MaleCNS.
  - >-
    The authored browser self-test results were not independently reproduced,
    nor were whole-circuit behavioral outcomes compared to biological
    measurements in the source material examined.
controls:
  - >-
    Half-eye mirror, receptive-field shuffle and descending rewire alter
    different features; they are not all degree-preserving whole-graph nulls.
  - >-
    The authored same-trajectory perturbation assay requires a separation
    reduction of at least half in two of three variants.
  - >-
    Missing: repeated seeded intact-versus-perturbed behavioral outcomes,
    topology-matched random baselines and biological timing controls.
history:
  - "2026-10-16: initial placement -> scientific B / interest S, medium confidence; experimental connectome contribution recorded with programmed movement limitations."
---
