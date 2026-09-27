---
type: malecns-project
project_id: "ikaankeskin-malecns-simulation"
name: "MaleCNS Simulation / DNg13"
ownership: "independent"
kind: "MaleCNS subcircuit controller embedded in an artificial-life world"
stage: "results-bearing subcircuit experiments plus exploratory ecosystem"
primary_url: "https://github.com/ikaankeskin/malecns-simulation"
repository: "ikaankeskin/malecns-simulation"
evidence_url: "https://github.com/ikaankeskin/malecns-simulation/blob/main/docs/DNG13_EXPERIMENT.md"
scientific_tier: "C"
interest_tier: "A"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "19f12a86d2fc063922673459490429c623667d33"
summary: >-
  An inspectable 2D artificial-life environment includes a verified 11-neuron,
  32-edge MaleCNS DNg13 subgraph and explicit held-out controller comparisons.
  The project correctly treats motor-decoder reversal as an interface choice,
  while the larger ecology and social-learning layers remain engineered
  exploratory systems rather than MaleCNS mechanism claims.
strongest_evidence:
  - "The committed DNg13 extract contains 11 verified MaleCNS v1.0 neurons and 32 connections and can be replayed deterministically."
  - "A development-seed mapping sweep is followed by held-out comparisons against disconnected, input-silenced and shuffled-source controls."
  - "On held-out seeds 10-19, the all-positive controller averages 4.0 collected items while the transmitter-filtered variant averages 4.1; the repository explicitly treats this as an interface result rather than evidence for food coding or inhibition."
limitations:
  - "The neural substrate is a tiny selected subgraph, not whole-MaleCNS, and the decoder sign can dominate whether the agent approaches or avoids the pellet."
  - "Most ecosystem, reproduction, communication, personality and lifetime-learning mechanics are external engineered rules with fixed MaleCNS topology."
  - "Five-seed ecology/social comparisons are explicitly exploratory and do not establish general survival or cooperation benefits."
controls:
  - "Disconnected, input-silenced and shuffled-source controller controls are evaluated on held-out seeds."
  - "A transmitter-sign comparison preserves the null/near-null outcome instead of treating transmitter annotations as validated dynamics."
  - "Whole-network rewires or capacity-matched conventional controllers are not reported for the larger artificial-life claims."
history:
  - "2026-09-26: initial placement -> scientific C / interest A, high confidence; real subcircuit and held-out controls credited, larger artificial-life behavior kept outside the MaleCNS evidence claim."
note: "The card scores the DNg13/MaleCNS evidence; the broader world is an experimental scaffold, not a biological validation."
---
