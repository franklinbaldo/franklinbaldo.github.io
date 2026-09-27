---
type: malecns-project
project_id: "makazhanalpamys-soup-connectome"
name: "soup-connectome"
ownership: "independent"
kind: "portable connectome runtime"
stage: "v0.1.0 runtime with measured full-scale execution"
primary_url: "https://github.com/MakazhanAlpamys/soup-connectome"
repository: "MakazhanAlpamys/soup-connectome"
scientific_tier: "C"
interest_tier: "A"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "40aa07f87995a7061f75f92f8ddd0465ede89577"
summary: >-
  Portable MaleCNS runtime with measured cross-backend execution and deliberately
  narrow scientific claims. Engineering evidence is strong; biological
  validation is explicitly outside the demonstrated result.
strongest_evidence:
  - "Full-scale MaleCNS-derived execution is reported on CPU and WebGPU with parity for the tested configurations."
  - "A deterministic fixed-point runtime contract and reproducible validation commands are public."
  - "Measured, estimated and not-tested claims are labeled separately."
limitations:
  - "Biological calibration and validation are explicitly not demonstrated."
  - "Several accelerator and portability regimes remain untested at full scale."
  - "Runtime execution alone does not establish a MaleCNS computational or behavioral advantage."
controls:
  - "Cross-backend parity and deterministic propagation fixtures test the runtime claim."
history:
  - "2026-09-26: initial placement -> scientific C / interest A, high confidence; strong runtime evidence, no biological-mechanism claim."
---