---
type: malecns-project
project_id: "hldrnwnv-fly-drone"
name: "Fly Drone"
ownership: "independent"
kind: "MaleCNS virtual-flight research demo"
stage: "controlled simulation results; raw-frame vision negative; no physical flight"
primary_url: "https://github.com/hldrnwnv/fly-drone"
repository: "hldrnwnv/fly-drone"
evidence_url: "https://github.com/hldrnwnv/fly-drone/blob/main/runs/vision-benchmark/report.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "b4cfcc58a9abf12650245e2287ebb84041b8fee5"
summary: >-
  In a frozen virtual FPV benchmark, the original MaleCNS graph passes 20/20
  tested courses while three degree-shuffled controls pass 1/20, 0/20 and
  6/20. A conventional geometric baseline also passes 20/20 and is faster,
  and the project's raw-frame neural-vision variant fails all 20 trials.
  The B tier therefore credits a narrow topology result while preserving the
  stronger conventional baseline and the end-to-end vision failure.
strongest_evidence:
  - "MaleCNS passes 20/20 frozen virtual courses versus 1/20, 0/20 and 6/20 for three independently degree-shuffled graph controls."
  - "Exact same-frame replay records 150/164 correct direction choices for MaleCNS versus 80/164, 84/164 and 90/164 for the three shuffled controls."
  - "The conventional geometric baseline also passes 20/20 and is faster, preventing a general superiority claim."
  - "The separate raw-frame condition is negative: the conventional visual baseline passes 20/20 while MaleCNS and all shuffled conditions pass 0/20."
limitations:
  - "The successful condition receives an externally estimated target direction rather than solving raw visual recognition."
  - "The broader simulated vehicle stabilization remains outside the MaleCNS substrate."
  - "The experiment is virtual; no physical flight is demonstrated."
  - "The shuffled controls preserve degree but not every biological or spatial attribute."
controls:
  - "Three degree-shuffled graph controls use matched training and evaluation budgets."
  - "A conventional geometric baseline and exact same-frame replay constrain closed-loop confounds."
  - "The raw-frame negative condition tests whether the result survives removal of the externally estimated target direction; it does not."
  - "Missing: physical replication and stronger topology nulls preserving additional biological structure."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; topology-control result credited, conventional-baseline tie and raw-frame failure preserved."
note: "This is a virtual simulation result; the card makes no claim about physical autonomous flight."
---
