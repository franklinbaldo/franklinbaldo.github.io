---
type: malecns-project
project_id: "hotocoo-malecns-monaco"
name: "MaleCNS Monaco"
ownership: "independent"
kind: "whole-connectome spiking vehicle controller"
stage: "full-scale Monaco driver plus implemented Kuala Lumpur road-law/perception transition; KL success not yet demonstrated"
primary_url: "https://github.com/hotocoo/malecns"
repository: "hotocoo/malecns"
evidence_url: "https://github.com/hotocoo/malecns/blob/main/docs/AUDIT.md"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "c8d5ca0ed9e9c984eb6670af89e36e725e9ce923"
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
  - "The current public revision adds Kuala Lumpur route geometry, Malaysia road-law data, camera/perception, scene, route and law-reward code with dedicated tests; this is credited as scope expansion, not as a successful MaleCNS KL driving result."
limitations:
  - "The sensory transduction, readout projection, vehicle physics and optimization procedure are engineered around the task."
  - "The graph builder uses consensus_nt and correctly treats histamine as inhibitory, but maps dopamine, serotonin and octopamine to fast excitatory drive; the public MaleCNS NT audit identifies those amines as a distinct modulatory class, so the driving result has not yet been stress-tested against that modeling choice."
  - "The project does not yet report an ensemble of matched rewired graphs or a comparably trained small conventional controller for the same evaluation suite."
  - "Repository audit quality and internal deterministic tests are not equivalent to independent replication."
controls:
  - "Deterministic evaluation, stress tracks and a documented training-loop audit constrain implementation artifacts."
  - "The independent MaleCNS NT audit (https://doi.org/10.5281/zenodo.22975837) supplies a concrete alternative transmitter-class mapping that should be rerun against the same lap suite."
  - "A topology-destroying matched graph control remains necessary before assigning a MaleCNS-specific advantage."
history:
  - "2026-09-26: initial placement -> scientific C / interest S, high confidence; full-scale system and audit credited, topology attribution withheld."
  - "2026-09-26: transmitter-mapping clash review -> tier unchanged; consensus_nt avoids the audit's source-column error, while monoamine-as-fast-excitatory remains a material dynamical sensitivity to test."
---