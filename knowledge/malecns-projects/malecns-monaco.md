---
type: malecns-project
project_id: "hotocoo-malecns-monaco"
name: "MaleCNS Monaco"
ownership: "independent"
kind: "whole-connectome spiking vehicle controller"
stage: "full-scale Monaco driving system with audited training loop"
primary_url: "https://github.com/hotocoo/malecns"
repository: "hotocoo/malecns"
evidence_url: "https://github.com/hotocoo/malecns/blob/main/docs/AUDIT.md"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "5cd6954e7d6858aa5faee4ddae9fe344ea538b79"
summary: >-
  Full-scale MaleCNS v1.0 spiking controller connected to a Monaco racing
  environment with anatomically named visual and descending/motor populations,
  deterministic evaluation tooling and a detailed training-loop audit. The
  engineering evidence is substantial, but no matched topology-destroying or
  simpler-policy control is yet reported for the central driving result.
strongest_evidence:
  - "The runtime steps all 166,700 annotated neurons and a 6.24-million-edge thresholded graph with neurotransmitter-derived connection signs."
  - "The public implementation includes deterministic multi-start evaluation, long-horizon and stress-track tools, and more than one hundred tests."
  - "The reported calibrated/DAgger driver laps full-scale Monaco from all configured starts without a crash before ES refinement."
limitations:
  - "The sensory transduction, readout projection, vehicle physics and optimization procedure are engineered around the task."
  - "The project does not yet report an ensemble of matched rewired graphs or a comparably trained small conventional controller for the same evaluation suite."
  - "Repository audit quality and internal deterministic tests are not equivalent to independent replication."
controls:
  - "Deterministic evaluation, stress tracks and a documented training-loop audit constrain implementation artifacts."
  - "A topology-destroying matched graph control remains necessary before assigning a MaleCNS-specific advantage."
history:
  - "2026-09-26: initial placement -> scientific C / interest S, high confidence; full-scale system and audit credited, topology attribution withheld."
---