---
type: malecns-project
project_id: "marketcalls-openfly"
name: "OpenFly"
ownership: "independent"
kind: "whole-connectome market experiment / paper-trading system"
stage: "end-to-end paper mode with frozen walk-forward experiment gate; no demonstrated profitable edge"
primary_url: "https://github.com/marketcalls/openfly"
repository: "marketcalls/openfly"
evidence_url: "https://github.com/marketcalls/openfly/blob/main/README.md"
scientific_tier: "D"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "fd4b06ba0d32fa76965672777e5811da7d9171eb"
summary: >-
  A unusually complete MaleCNS-to-market experimental system with whole-connectome
  simulation, walk-forward evaluation, strong non-neural trading controls and a
  dopamine-plasticity arm. The core scientific question is still unresolved:
  the repository explicitly reports no demonstrated profitable edge and does
  not yet publish the held-out result that would pass its own experimental gate.
strongest_evidence:
  - "The system simulates the 166,700-neuron MaleCNS connectome and maps market observations through 4,146 photoreceptors into the recurrent substrate."
  - "The experiment harness separates train, validation and untouched test windows and requires comparison against fixed-entry, matched random-entry, shuffled-label and flat controls."
  - "The plasticity arm stimulates named dopamine populations and updates 7,835 Kenyon-cell-to-memory-output connections while retaining a frozen-memory twin comparator."
  - "Paper trading, replay, execution safety and experiment infrastructure are implemented end to end, with 328 backend and 13 frontend tests reported."
limitations:
  - "No held-out result demonstrating predictive or trading value has been published; the README explicitly states that no profitable edge is demonstrated."
  - "Trade timing, risk sizing, stops, targets, execution and guardrails are conventional external rules rather than decisions made by MaleCNS."
  - "The statistical readout is trained externally on future market movement targets."
  - "Live trading remains locked behind an explicit opt-in and a passed experiment."
controls:
  - "The planned walk-forward gate includes fixed 09:20 straddle, same-count random-entry, shuffled-label and stay-flat controls."
  - "The plasticity arm is compared against a twin with frozen memory."
  - "Missing: a matched rewired MaleCNS, random recurrent or small conventional representation under the same encoder/readout/trading protocol."
history:
  - "2026-09-26: initial placement -> scientific D / interest S, high confidence; experimental design and implementation credited, scientific tier held down pending the preregistered held-out result."
---