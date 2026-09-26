---
type: malecns-project
project_id: "monomyth-fly-brain-codex"
name: "Fly Brain Codex"
ownership: "independent"
kind: "MaleCNS-derived robot-arm controller"
stage: "native pickup-and-hold baseline with broader experimental controller"
primary_url: "https://github.com/monomyth/fly-brain-codex"
repository: "monomyth/fly-brain-codex"
evidence_url: "https://github.com/monomyth/fly-brain-codex/blob/main/docs/results.md"
scientific_tier: "C"
interest_tier: "A"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "f77513b4000d5d61bf270fdb3fdce182eff580e1"
summary: >-
  MaleCNS-derived visual and proprioceptive controller for a simulated arm and
  gripper. The retained baseline has repeated pickup-and-hold evidence, while
  the broader controller remains experimental.
strongest_evidence:
  - "The retained native baseline reports 19/20 pickup-and-hold trials in a defined region."
  - "Separate runs verified pickup, hold and release checks."
limitations:
  - "The stable result is restricted to a small placement region and one cube size."
  - "A learned motor head and engineered interfaces prevent attributing success to fixed MaleCNS topology alone."
controls:
  - "A matched random or rewired recurrent comparator is not reported for the native success rate."
history:
  - "2026-09-26: initial placement -> scientific C / interest A, high confidence."
---
