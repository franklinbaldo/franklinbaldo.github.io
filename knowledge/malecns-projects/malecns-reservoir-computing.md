---
type: malecns-project
project_id: "jangyeongsil-malecns-reservoir-computing"
name: "MaleCNS Reservoir Computing"
ownership: "independent"
kind: "whole-connectome reservoir computer / chaotic forecasting benchmark"
stage: "GPU whole-connectome driven forecasting demonstrated; autonomous rollout fails to reproduce the attractor"
primary_url: "https://github.com/JangYeongSil69420/malecns-reservoir-computing"
repository: "JangYeongSil69420/malecns-reservoir-computing"
evidence_url: "https://github.com/JangYeongSil69420/malecns-reservoir-computing/blob/main/README.md"
scientific_tier: "C"
interest_tier: "A"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "cdf3b9764af1a17bd6f0f27646f73ecf52b9a65a"
summary: >-
  A full MaleCNS-derived sparse recurrent reservoir with a trained linear readout
  reaches strong driven Mackey-Glass forecasts and preserves a clear negative
  autonomous-rollout result. The evidence shows that the implemented fixed
  connectome reservoir is computationally usable, but it does not isolate an
  advantage of biological wiring over matched random or rewired reservoirs.
strongest_evidence:
  - "The project builds a sparse GPU recurrent reservoir from the full MaleCNS graph while leaving recurrent connectome weights fixed and training only a Ridge readout."
  - "Reported held-out driven forecasting reaches R2 0.9933 at one step and remains above 0.8 at the 20-step direct horizon."
  - "The autonomous 200-step feedback rollout is reported to fail quickly into a large-amplitude regular limit cycle, and that negative result is treated as a central limitation rather than omitted."
  - "The repository provides an end-to-end notebook, pinned data acquisition/checksums, sparse GPU execution and explicit single-channel versus multi-channel measurements."
limitations:
  - "The multi-channel gain confounds anatomical routing with richer engineered transforms of the same scalar signal: raw value, velocity and nonlinear acceleration."
  - "No matched degree-preserving rewire, random recurrent network or simple conventional reservoir is reported under the same readout and feature budget."
  - "Mackey-Glass is a synthetic forecasting benchmark and does not establish biological behavior or task-general usefulness."
  - "Strong driven forecasting does not survive autonomous generation in the reported closed-loop rollout."
controls:
  - "Single-channel versus three-channel injection is reported, but this is not a topology control because the information representation also changes."
  - "The autonomous rollout acts as an adversarial generative check and produces a clear negative result."
  - "Missing: biological topology versus degree-matched rewire/random ESN under identical input transforms, sampled-state dimension and Ridge protocol."
history:
  - "2026-09-26: initial placement -> scientific C / interest A, high confidence; strong reproducible driven result credited, topology-specific claim withheld."
---