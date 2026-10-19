---
type: malecns-project
project_id: sukoji-flyboard
name: FLYBOARD (sukoji)
ownership: independent
kind: music-response and connectome simulation
stage: public playable 3D viewer and author-run comparisons
primary_url: https://github.com/sukoji/flyboard
repository: sukoji/flyboard
evidence_url: https://github.com/sukoji/flyboard/blob/e9bb48408e570b151b797da9def8fcdb1c11f46d/README.md
scientific_tier: C
interest_tier: A
confidence: medium
reviewed_at: '2026-10-09'
reviewed_revision: e9bb48408e570b151b797da9def8fcdb1c11f46d
summary: >-
  An authored LIF simulation maps music to Johnston's-organ sensory channels
  and compares MaleCNS-wide firing patterns to simulated fly courtship song.
  It is a reproducible engineering demonstration, not a measurement of fly
  musical preferences or a causal advantage for full-connectome processing.
strongest_evidence:
  - 'Author reports 84 songs, four independent listens each and between-session Spearman rho 0.87.'
  - 'Author reports an ear-only baseline with rho 0.884 relative to the full-brain ranking, so most ranking structure does not require downstream connectome computation.'
  - 'The viewer, per-song score table, stimulus controls and giant-fiber lesion script are publicly inspectable.'
limitations:
  - 'The score measures similarity to a synthetic courtship-song reference, not biological attraction or preference.'
  - 'Ear preprocessing, sensory rate transduction, neuron dynamics and rating rule are engineered.'
  - 'Reported reproducibility is across author-run stochastic listens; no external independent replication.'
controls:
  - 'Independent listens, white noise, a tone, a metronome and separately generated courtship song.'
  - 'An ear-only comparison, reduced-synapse-gain and adaptation perturbations weaken any claim that whole-network wiring drives the chart.'
  - 'Missing degree-preserving or cell-identity matched full-network rewiring with equal-compute sensory inputs.'
history:
  - '2026-10-09: initial C/A/medium from public author-run controls; strong ear-only null limits causal interpretation.'
note: 'Different from NullLabTests FLYBOARD, which is an electrical stimulation simulator rather than a music chart.'
---
