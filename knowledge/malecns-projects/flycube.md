---
type: malecns-project
project_id: "lntegrals-flycube"
name: "FlyCube"
ownership: "independent"
kind: "MaleCNS-derived policy/value model for Rubik's Cube"
stage: "public trained demo with legacy controlled results and corrected propagation code"
primary_url: "https://github.com/lntegrals/flycube-public"
repository: "lntegrals/flycube-public"
evidence_url: "https://github.com/lntegrals/flycube-public/blob/main/docs/results.md"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "c14b3adcbccbd15e3036bbc502af1a77bb50fe92"
summary: >-
  FlyCube places an 8,192-neuron measured MaleCNS subgraph inside a trained
  Rubik's-Cube policy/value loop and reports matched rewired, silenced and
  uninformed controls. Its public controlled advantage is still legacy evidence:
  those checkpoints propagated connectivity in the wrong direction; the code is
  corrected, but corrected-direction results are not yet the published benchmark.
strongest_evidence:
  - "The preparation pipeline imports all 166,700 neurons and 25,582,938 directed edges, then extracts a reproducible 8,192-neuron input-to-readout subgraph with measured IDs, geometry, contact counts and transmitter-predicted signs."
  - "Legacy matched 15-minute controls on the short suite report connectome 44%/57% solved in policy/search mode versus rewired 10%/14%, silenced 0%/14%, and random or uninformed-BFS 6%/14%."
  - "The project preserves zero training overlap for the uniform test set, deterministic same-state policy checks, a negative DAgger result, and the original erroneous checkpoints rather than silently replacing them."
limitations:
  - "The published positive benchmark uses legacy checkpoints trained with reversed connectivity propagation, so it cannot establish a correct-direction MaleCNS topology advantage."
  - "Uniform random cube states are 0/100 solved, and the successful regime is shallow; the project explicitly makes no deep-solving or optimality claim."
  - "Sticker encoding is engineered, neural units are rates rather than biological spikes, and the trained model uses only a reduced subgraph."
controls:
  - "Matched rewired, silenced, untrained and uninformed/random baselines are implemented in the evaluation harness."
  - "Teacher solvers are offline-only and blocked from live inference by tests."
  - "A corrected-direction rerun of the matched controls is the decisive missing control for the strongest current result."
history:
  - "2026-09-26: initial placement -> scientific C / interest S, high confidence; strong control design credited but legacy direction-bug results prevent promotion."
note: "The tier is intentionally conservative until the corrected propagation path reproduces the controlled advantage."
---
