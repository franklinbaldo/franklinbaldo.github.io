---
type: malecns-project
project_id: "shute2004-virtual-fly"
name: "virtual-fly"
ownership: "independent"
kind: "whole-connectome embodied agent with local plasticity"
stage: "canonical v1 reproduced; plasticity demonstrated, behavioral gain not demonstrated"
primary_url: "https://github.com/shute2004/virtual-fly"
repository: "shute2004/virtual-fly"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "74df0cbfce4a693aa4a6e94df28b3ac06e966ff4"
summary: >-
  Whole-MaleCNS embodied reconstruction coupled to FlyBody/MuJoCo with local
  plasticity. Canonical v1 provides a public reproduction path and demonstrates
  stored-weight changes, while frozen before/after evaluation does not show
  categorical behavioral improvement.
strongest_evidence:
  - "Canonical v1 reports a whole-MaleCNS closed loop using a 166,700-neuron / 25,582,938-edge snapshot."
  - "The canonical training run records 2,163,179 changed stored edges and publishes manifests plus a reproduction path."
  - "Frozen initial and final evaluations produce the same categorical outcome, so weight change is not promoted into a behavioral-success claim."
limitations:
  - "The short canonical run does not demonstrate improved behavior, generalization or long-term learning stability."
  - "The simulator does not claim complete biophysical fidelity."
  - "Asynchronous simulator trajectories are not claimed to be bit-identical across hardware."
controls:
  - "Frozen pre/post evaluation disables learning-time modulation."
  - "Historical visual results are explicitly separated from canonical evidence."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; A withheld because the central behavioral learning payoff is not demonstrated."
---