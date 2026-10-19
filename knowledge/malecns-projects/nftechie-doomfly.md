---
type: malecns-project
project_id: nftechie-doomfly
name: DOOMFLY (nftechie)
ownership: independent
kind: full-MaleCNS recurrent Doom controller and experimental KC-to-MBON memory
stage: public source and author-run full-graph Doom/conditioning audits; live host not independently verified; survival-learning gates failed
primary_url: https://github.com/nftechie/doomfly
repository: nftechie/doomfly
evidence_url: https://github.com/nftechie/doomfly/blob/71ecf53d78eaffaf1a57ed7b0ccf5d458abc9f33/docs/doom-learning-iteration-log.md
scientific_tier: B
interest_tier: S
confidence: medium
reviewed_at: '2026-10-09'
reviewed_revision: 71ecf53d78eaffaf1a57ed7b0ccf5d458abc9f33
summary: >-
  An independent, full-retained MaleCNS spiking approximation drives an actual
  ViZDoom arena using engineered retina and descending-neuron-to-button readouts.
  An experimental dopamine-gated KC-to-MBON11 memory rule changes weights, but
  the author's preregistered visual, conditioning and survival-learning gates
  failed. Well-documented adverse controls are evidence about model failure,
  not evidence that the biological connectome learns Doom or is superior to
  a matched conventional policy.
strongest_evidence:
  - 'Author documents a 166,700-neuron, 25,582,938-edge retained connectome, game-frame-driven inputs, fixed decoder and a 4,184-edge KC-to-MBON11 plasticity candidate; no independent full-graph rerun here.'
  - 'Controlled visual probes found silent T4/T5 and KC targets in an early candidate; later v6 physiological recovery and cue-specific conditioning gates also failed despite implementation-level numerical tests passing.'
  - 'Exploratory v6 survival pilot (one training start, two held-out starts): on seed 61041 learned and timing-shuffled arms died at 3.657 s while frozen survived to the 8 s cap; all arms died at 3.657 s on seed 61042. Memory erasure exactly restored frozen behavior on the first start, showing a harmful modeled effect, not successful learned survival.'
  - 'Published audit describes 68 passing technical tests and 80.2282 brain seconds in 490.74 wall seconds (0.163x real-time); performance and test results are author-reported, not independently reproduced.'
limitations:
  - 'R1-R6/R8 retinal mapping, graded-to-spiking neural conversion, dopaminergic reinforcement timing, KC adaptation and motor buttons are engineered and not biologically calibrated.'
  - 'Pilot has one training replica, two test starts, a capped horizon and no independently replicated benefit or generalization; apparent weight changes are not successful conditioning.'
  - 'No matched simple-policy/rewired-whole-graph control on the final Doom survival task isolates the contribution of measured MaleCNS topology.'
  - 'The documentation mentions a historical live host and a placeholder public URL; public live operation was not verified in this review.'
controls:
  - 'Frozen versus learning-on versus dose-matched timing-shuffled reward; black-vision, rest and memory-erasure ablations, held-out seeds and exact-pulse/checkpoint audits.'
  - 'Author records a full original visual-to-memory failure, endogenous dopamine confound and harmful learned-weight effect instead of retroactively relaxing the preregistered gates.'
  - 'Disconnecting wiring abolished actions in an early BCI check; black vision still induced some actions. Missing topology-matched graph rewires and equally budgeted conventional game controllers.'
history:
  - '2026-10-09: initial B/S/medium classification rewards controls and reproducible negative reporting, not successful neural game learning.'
note: 'Distinct from Franklin FlyDoom (compact sensorimotor demo, C/A) and Aur1ety DOOM-x-Fly (trained head with positive held-out E1M1 navigation, B/S/high); DOOMFLY attempts plasticity in the retained full-graph recurrent simulator and reports a failed learning gate.'
---
