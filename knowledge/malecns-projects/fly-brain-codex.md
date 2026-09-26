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
  MaleCNS-derived visual/proprioceptive controller for a simulated six-joint
  arm and gripper. The retained native baseline has repeated pickup-and-hold
  evidence, while the broader touch-gated controller is explicitly
  experimental. The public record does not yet isolate value attributable to
  MaleCNS topology from the learned head and engineered interfaces.
strongest_evidence:
  - "The retained native baseline reports 19/20 pickup-and-hold trials in a defined 20 mm cube region."
  - "Separate normal-UI runs verified pickup, five-second hold and scripted release/drop checks."
  - "The deployed controller receives two rendered RGB views plus robot feedback rather than cube XYZ or task-phase oracle state."
limitations:
  - "The stable result is restricted to a small placement region and one cube size; broader placements include missed or unstable grasps."
  - "Release is an explicit scripted completion routine rather than a learned neural action."
  - "Training selected connections, response offsets and a learned motor head prevents attributing success to fixed MaleCNS topology alone."
controls:
  - "The project preserves separate stable, experimental and fit-only profiles instead of conflating their evidence."
  - "A matched random/rewired recurrent or small-network comparator is not reported for the native success rate."
history:
  - "2026-09-26: initial placement -> scientific C / interest A, high confidence; repeated native task evidence credited, MaleCNS-specific mechanism unresolved."
---