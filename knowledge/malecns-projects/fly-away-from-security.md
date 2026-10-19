---
type: malecns-project
project_id: "quillotaku-fly-away-from-security"
name: "fly-away-from-security"
ownership: "independent"
kind: "MaleCNS visual-circuit simulation and branded-house avoidance art demo"
stage: "working replay-backed simulation with targeted circuit lesion"
primary_url: "https://github.com/Quillotaku/fly-away-from-security"
repository: "Quillotaku/fly-away-from-security"
evidence_url: "https://github.com/Quillotaku/fly-away-from-security/blob/master/docs/PIPELINE.md"
scientific_tier: "C"
interest_tier: "A"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "7f8ee1b16887e3a866715e37a1370454fb073724"
summary: >-
  A deliberately playful MaleCNS simulation in which a 49,002-neuron
  visual-to-descending subgraph receives engineered staged visual drive and a
  decoder determines whether a fly enters or avoids a house. The published
  replay pipeline is reproducible and a targeted LC4/LPLC2 lesion flips the
  branded-house decision while leaving the stimulus injection in place,
  demonstrating a real causal path inside the declared model. Scientific credit
  is limited because the brand association and action decoder are explicitly
  invented, the effect is not a natural task, and no matched topology null or
  conventional controller establishes MaleCNS-specific utility.
strongest_evidence:
  - "The pipeline rebuilds a 49,002-neuron, 1,026,595-edge MaleCNS subgraph lying between visual projection neurons and descending neurons, with source files verified by published hashes."
  - "Under the published scenarios, the intact branded-house condition produces a +0.0487 decoder signal and avoidance, while lesioning the 146 driven LC4/LPLC2 neurons changes the signal to -0.0179 and entry even though the stimulus is still injected."
  - "Alarmix and Casa Tranquila receive identical inputs and produce the same -0.0380 result, preserving the explicit boundary that the model distinguishes only the association deliberately encoded by the authors."
  - "Replay generation validates timing, ID ranges, normalization and browser/pipeline agreement before artifacts are served."
limitations:
  - "The mapping from a fictional brand sign to LC4/LPLC2 drive is intentionally invented; it is not biological evidence that flies recognize brands or alarm signage."
  - "The LIF parameters and global synaptic gain are modeling choices rather than measured MaleCNS physiology."
  - "The project uses a selected visual-to-descending subgraph rather than the full CNS, and the decoder from descending activity to approach/avoid is engineered."
  - "There is no naturalistic behavioral task, independent replication, matched rewire/random-network control or strong conventional baseline."
controls:
  - "A targeted lesion blocks propagation from the driven LC4/LPLC2 population while retaining stimulus injection, distinguishing pathway dependence from simply turning off the sensor."
  - "Two non-target brand scenarios use identical inputs and yield identical outputs, checking that the implementation does not secretly distinguish them."
  - "The browser recomputes decisions from replay data and checks them against the pipeline expectation."
  - "Topology-preserving and topology-destroying matched nulls are absent."
history:
  - "2026-09-26: initial placement -> scientific C / interest A, high confidence; reproducible causal lesion credited while the intentionally fabricated semantic association and missing topology controls bound the scientific claim."
note: "The scientific claim is intentionally narrow: the modeled MaleCNS-derived pathway causally carries an engineered signal in this simulation. The joke premise is not treated as biological evidence."
---
