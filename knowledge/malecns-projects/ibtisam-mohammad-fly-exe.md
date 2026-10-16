---
type: malecns-project
project_id: "ibtisam-mohammad-fly-exe"
name: "Fly.exe / MaleCNS Virtual Fly"
ownership: "independent"
kind: "whole-MaleCNS GPU simulation and embodied multi-fly engineering demonstration"
stage: "public code, reproducibility contracts and authored control reports; V0 structural, swarm showcase explicitly not evidence-grade"
primary_url: "https://github.com/Ibtisam-Mohammad/Fly.exe"
repository: "Ibtisam-Mohammad/Fly.exe"
evidence_url: "https://github.com/Ibtisam-Mohammad/Fly.exe/blob/cc25411e00f945e7330cb6f400372cce315c0802/docs/STATUS.md"
scientific_tier: "A"
interest_tier: "S"
confidence: "medium"
reviewed_at: "2026-10-14"
reviewed_revision: "cc25411e00f945e7330cb6f400372cce315c0802"
summary: >-
  Full traced-MaleCNS GPU spiking simulation coupled to NeuroMechFly/MuJoCo,
  with engineering tests and carefully bounded negative experiments. A 12-fly
  showcase reports stimulus-dependent locomotor onset against a stimulus-absent
  control, but it is presentation-grade: gait is pre-programmed, cues are
  exact object geometry, the shared connectome is not evidence of individual
  social behaviour, and topology-specific or biological validation is absent.
strongest_evidence:
  - "The public implementation reports 165,122 traced neurons and 25,563,197 directed graph edges per virtual fly; twelve neural-state copies share one connectivity allocation in a 30-second MuJoCo scene (RTX 3060; one recorded seed)."
  - "In the authored 12-fly same-seed showcase, 12/12 stimulus-driven flies enter locomotion and end near an object, versus 0/12 stimulus-absent controls; the project explicitly marks validation_tier_awarded null and evidence_grade false."
  - "The documented Track A preregistered controller/behaviour sequence failed the grooming displacement criterion in 0/30 held-out runs even though 29/30 achieved the nominal sequence; this negative is preserved rather than promoted to biological success."
  - "The authored Stage 1 small-circuit test reports exact balanced accuracy/AUROC 0.8077 versus 0.5 on shuffled connectivity, with zero-weight/timestep controls; this bounded circuit result is not evidence for the full embodied swarm."
limitations:
  - "The legs use a published engineered gait controller; the simulated ventral nerve cord does not directly control leg motion. The visual encoder uses known object positions and angular sizes, not camera pixels, colour, occlusion or taste."
  - "Twelve agents are parameterized copies of one connectome, not different fly specimens; no fly-fly physical contact occurs. The decoder cannot stop walking at a target; objects physically block the body."
  - "One 12-fly arena and one seed, with allowed initial headings selected after observing failed arenas; no multi-seed swarm-specific matched controller-only arm, topology-preserving shuffle, flies-invisible condition or equal-angular-size food-versus-pillar control."
  - "Published engineering examples and full-CNS benchmarks were inspected as author reports and not reproduced independently in this review. Reported CI omits GeNN/CUDA and the full physics system."
controls:
  - "Stimulus-absent, identical-seed 12-fly showcase control: 12/12 object proximity in the driven group versus 0/12 in control; approach-to-food alone is confounded by body drift and bounded headings."
  - "Documented Stage 1 shuffled-connectivity, zero-weights and timing controls apply only to a smaller mapped circuit, not to this swarm claim."
  - "Track A separate held-out runs and causal ablations preserve explicit failure on grooming displacement; authored source notes uncertainty and boundary conditions."
  - "Missing for topology/behavioural attribution: real-vs-rewired complete CNS, matched sensory/motor adapter only, multiple random seeds, fly-invisible and angular-size-matched controls."
history:
  - "2026-10-14: first assessed as scientific A / interest S / medium confidence; high value for explicit control/negative-evidence discipline, with bounded application-level claims and no biological validation implied."
note: "Not the shute2004/virtual-fly project already catalogued. Scientific A rewards falsifiable tests and negative reporting, not an assertion of autonomous or socially intelligent MaleCNS behaviour."
---
