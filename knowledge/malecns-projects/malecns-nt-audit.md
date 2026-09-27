---
type: malecns-project
project_id: "neuropunks-malecns-nt-audit"
name: "MaleCNS NT Audit"
ownership: "independent"
kind: "whole-connectome neurotransmitter-source/sign audit and converter"
stage: "released reproducible audit with converter, verification script and DOI"
primary_url: "https://github.com/neuropunks/malecns-nt-audit"
repository: "neuropunks/malecns-nt-audit"
evidence_url: "https://doi.org/10.5281/zenodo.22975837"
scientific_tier: "A"
interest_tier: "A"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "ab0ccab271ebecf163c6531fa3200127409e5a36"
summary: >-
  Full-graph MaleCNS v1.0 audit of neurotransmitter source columns and polarity
  mapping, with a corrected three-class converter and a separate recomputation
  script for every published count. The evidence is unusually direct and
  reproducible for an infrastructure project: it operates on the released
  25.6-million-edge graph and preserves exact accounting. The tier does not
  imply that its three-class polarity abstraction validates any downstream
  spiking model or behavioral claim.
strongest_evidence:
  - "The audit covers the full 166,700-neuron, 25,582,938-edge MaleCNS v1.0 graph and reports concrete source-column/sign discrepancies rather than a sampled subset."
  - "It quantifies four systematic error classes, including 884,631 Kenyon-cell output edges that change class under predicted versus consensus NT labels and 89,723 histaminergic edges affected by the legacy sign mapping."
  - "The corrected conversion preserves an exact 25,582,938-edge total, while verify_audit.py independently recomputes the quoted counts from the raw feather files and emits explicit PASS/FAIL checks."
  - "The analysis, converter and reproduction contract are released publicly with a citable Zenodo DOI."
limitations:
  - "The audit validates annotation/source-column accounting, not biological dynamics, cognition or controller performance."
  - "Treating dopamine, serotonin and octopamine as a separate modulatory class with zero instantaneous signed drive is a modeling choice; it does not reproduce receptor-specific neuromodulatory kinetics."
  - "The verification script is independent code within the same project, not an external replication by another group."
controls:
  - "Direct predicted_nt versus consensus_nt comparisons expose source-column sensitivity."
  - "The converter can reproduce the legacy predicted/two-class path, enabling exact old-versus-corrected comparisons."
  - "The verification stage recomputes published totals from raw official tables and the converted parquet rather than trusting cached summaries."
  - "Missing for downstream claims: matched task-level experiments measuring how corrected versus legacy NT mappings change reservoir/control performance."
history:
  - "2026-09-26: initial placement -> scientific A / interest A, high confidence; full-graph reproducible audit credited, downstream dynamical/behavioral claims explicitly excluded."
note: "This card scores the audit as a scientific infrastructure result, not as evidence that a particular MaleCNS simulator is behaviorally faithful."
---
