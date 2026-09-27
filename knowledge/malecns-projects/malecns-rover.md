---
type: malecns-project
project_id: "chihhsiangchien-malecns-rover"
name: "Drosophila Connectome 3D Rover"
ownership: "independent"
kind: "MaleCNS-derived visual/olfactory subgraph rover and demo suite"
stage: "working public demo suite with engineering tests but no controlled behavioral benchmark"
primary_url: "https://github.com/ChihHsiangChien/maleCNS"
repository: "ChihHsiangChien/maleCNS"
evidence_url: "https://github.com/ChihHsiangChien/maleCNS/blob/master/connectome_matrix_math.md"
scientific_tier: "D"
interest_tier: "A"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "996960f6e086900b3eb644fbf1d7a822527391d2"
summary: >-
  Public browser/Python demo suite that traces MaleCNS visual and olfactory
  pathways into a 3D rover, neural telemetry workbench and arcade experiment.
  It ships real extracted connectome matrices and runnable code, but most of the
  sensing-to-action stack is an engineered Reichardt/matrix-control pipeline,
  and the published tests are primarily unit/synthetic checks rather than a
  controlled closed-loop comparison showing a MaleCNS-specific benefit.
strongest_evidence:
  - "The repository ships extracted MaleCNS pathway matrices and a documented top-down tracing path for LC4, LC11, HS/VS and ORN-PN-LHON circuitry rather than using only a generic recurrent proxy."
  - "The Python and browser implementations expose runnable visual-motion, connectome-matrix, neural-telemetry, 3D-rover and chemotaxis demos, with public GitHub Pages entry points."
  - "The automated test suite checks matrix acquisition/export, retinal preprocessing, excitatory/inhibitory polarity handling and telemetry plumbing end to end at the module level."
limitations:
  - "This is not whole-MaleCNS simulation: it uses selected visual/olfactory pathways aggregated into engineered low-dimensional matrices."
  - "The unit tests exercise synthetic matrices and module behavior; they do not report a held-out navigation benchmark, repeated success rate or causal topology ablation."
  - "Reichardt motion extraction, spatial binning, LC11 gain, odor field, wing/thrust equations and several escape behaviors are engineered outside the measured connectome."
  - "The repository's narrative comparison with hand-written CV/PID/FSM is not a matched empirical baseline."
controls:
  - "Synthetic looming, yaw, pitch and small-target stimuli provide pathway-level smoke tests."
  - "Unit tests verify sign handling and module plumbing but do not destroy or replace the connectome topology."
  - "Missing: matched rewired/degree-preserving graph, random recurrent network and conventional controller under the same 3D navigation task."
history:
  - "2026-09-26: initial placement -> scientific D / interest A, high confidence; real public artifact credited, behavioral/topology claims bounded by synthetic tests and engineered interfaces."
note: "The tier treats the rover as a useful MaleCNS-derived demo, not evidence that the selected biological wiring outperforms a conventional controller."
---
