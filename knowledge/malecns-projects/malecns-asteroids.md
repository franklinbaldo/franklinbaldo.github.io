---
type: malecns-project
project_id: "dohun1214-malecns-asteroids"
name: "malecns-asteroids"
ownership: "independent"
kind: "whole-MaleCNS real-time Atari controller with causal circuit interventions"
stage: "working whole-brain real-time demo with paired interventions, circuit rewires and preserved negative controls"
primary_url: "https://github.com/dohun1214/malecns-asteroids"
repository: "dohun1214/malecns-asteroids"
evidence_url: "https://github.com/dohun1214/malecns-asteroids/blob/main/README.en.md"
scientific_tier: "A"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "5abb2f1ca68662dd4bfcca8e34222a612bfc81f6"
summary: >-
  Whole-MaleCNS v1.0 is run as a 166,700-neuron LIF system inside Atari
  Asteroids, with escape and pursuit readouts tied to named circuits. The
  strongest evidence is causal rather than score-based: paired replay, targeted
  circuit interventions, degree/sign/weight-preserving rewires, off-circuit and
  size-matched controls, dose responses and a cross-mode dissociation localize
  behavior to specific modeled wiring. The project also preserves
  counterevidence: a supervised MLP beats the fly on a held-out direction task,
  rule-based gameplay is statistically competitive, and a previously plausible
  movement metric was withdrawn after a random-motion falsification.
strongest_evidence:
  - "Under identical taped stimuli, targeted DNp11 intervention changes action agreement to 56.9% and eliminates thrust, while two random cells leave actions exactly unchanged and 200 random cells produce a much smaller effect."
  - "Degree-, sign- and weight-multiset-preserving rewires of LC4 projections push escape-bearing error from 60.7 degrees to 99.2 degrees, while same-size off-circuit and synapse-matched controls remain near the intact result."
  - "LC10a-to-AOTU rewiring shows a monotonic dose response; at 100% rewiring the modeled directional information loss is 60.1% across 10 seeds while roughly half the signal amplitude remains, and matched other-output, escape-circuit and random-excitatory controls stay near zero loss."
  - "A cross-mode dissociation preserves circuit specificity: LC10a intervention leaves flee-mode behavior unchanged at the reported resolution but collapses pursuit aiming, whereas DNp11 intervention strongly damages the flee readout."
  - "The repository includes byte-identical branch replay, committed result artifacts, deterministic sanity checks and a 30-minute real-time soak rather than relying only on a live-demo narrative."
limitations:
  - "The connectome is embedded in an engineered LIF model with engineered visual transduction and motor readouts; causal claims apply to this modeled controller, not directly to biological flies."
  - "LC10a pursuit assumes arousal and repurposes a courtship circuit for Asteroids; the project explicitly marks that analogy as a strong modeling assumption."
  - "A supervised MLP reaches lower held-out direction error than the fly readout, and whole-brain gameplay score is within one standard deviation of the rule-based controller, so the evidence does not establish general controller superiority."
  - "Some closed-loop effect sizes are sensitive to Atari wraparound and observation details; the project documents multiple corrected measurement failures and large seed spread in the 100% pursuit rewire."
  - "There is no independent external replication of the full intervention suite."
controls:
  - "Paired stimulus replay and byte-identical state restoration separate intervention effects from ordinary trajectory divergence."
  - "Random-cell interventions, off-circuit rewires, size/synapse-matched rewires and random-excitatory rewires test whether generic damage explains the observed circuit effects."
  - "Random and supervised MLPs, a rule-based controller, random behavior and stillness provide conventional and behavioral comparators; importantly, the supervised MLP and rule controller prevent a claim of general MaleCNS superiority."
  - "The repository withdraws a movement-direction metric after a random-motion control reproduced it, and retains uncertain or negative survival and absolute-rate findings."
history:
  - "2026-09-26: initial placement -> scientific A / interest S, high confidence; unusually strong within-model causal localization and topology-preserving controls credited, while biological validity and controller-superiority claims remain bounded."
note: "The A tier is for intervention and falsification evidence inside the declared MaleCNS LIF model, not a claim that the simulation is a faithful biological fly or the best Asteroids controller."
---
