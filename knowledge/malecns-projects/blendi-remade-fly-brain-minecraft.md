---
type: malecns-project
project_id: blendi-remade-fly-brain-minecraft
name: Fly Brain Minecraft
ownership: independent
kind: full-MaleCNS spiking model embodied as a Minecraft Fabric fly mod
stage: public Minecraft 1.21.1 Fabric implementation, embedded connectome, headless scenario benches and author-run in-game smoke test
primary_url: https://github.com/blendi-remade/fly-brain-minecraft
repository: blendi-remade/fly-brain-minecraft
evidence_url: https://github.com/blendi-remade/fly-brain-minecraft/blob/6cfa30175003ef25da68a237d5eda958f8047b82/docs/VALIDATION.md
scientific_tier: B
interest_tier: S
confidence: medium
reviewed_at: '2026-10-09'
reviewed_revision: 6cfa30175003ef25da68a237d5eda958f8047b82
summary: >-
  Fabric mod coupling a thresholded, signed male Drosophila CNS-derived graph
  to Minecraft sensory streams and motor actions, with visible neural telemetry,
  explicit provenance and headless pathway tests. It demonstrates usable
  sensory-to-motor propagation within the implemented model, not an advantage
  of MaleCNS wiring over simpler embodied controllers or biological validity
  of the generated fly behaviour.
strongest_evidence:
  - 'Public source and bundled provenance record 176,422 neurons and 6,287,749 connections of at least five synapses, with 90,296,905 synapses retained and a compressed 23 MB binary; reconstructing transformations are documented.'
  - 'Author-run seeded benches report sugar GRN drive producing MN9 activity (30-90 Hz), bitter co-stimulation suppressing MN9, and analytically injected LC4/LPLC2 looming drive reaching the giant-fibre/TTMn escape channel.'
  - 'An embodied scenario bench and a separate parametric Brian2-style study record major negative findings: olfactory saturation, motor-mode masking and stimulus-dependent runaway excitation; the latter disputes calibration solely from feeding.'
  - 'The public Fabric build workflow succeeded for the reviewed main SHA, and a documented in-game build/world smoke test exists; headless test/bench claims have not been independently reproduced in this review.'
limitations:
  - 'Sensors and actuators are strongly engineered: looming-related LC channels are driven analytically, movement is decoded by hand-built arbitration, and food-seeking can use an explicitly labelled reflex controller.'
  - 'The author reports 25-60 ms of compute for a 50 ms brain tick on a 32-logical-core machine in a favourable case; richer embodied scenarios recorded 50-100 ms per tick and can lag real time. This is not a matched cross-project performance comparison.'
  - 'Uniform LIF parameters and a threshold of five synapses omit weaker contacts; dopamine/peptide modulation, gap junctions, spontaneous activity and validated courtship are absent.'
  - 'September 3 embodied-bench logs recorded flight-state saturation masking feeding and grooming and two failing sensory-encoder tests. Follow-up notes describe subsequent fixes, but no independent post-fix all-scenario rerun is established by those historical logs.'
  - 'No published random or degree-preserving rewired MaleCNS graph, sensor-only reflex baseline or matched ordinary controller demonstrates a topology-specific benefit in Minecraft.'
controls:
  - 'Quiet/no-sensory baseline, dark-versus-lit stimulus cases, sugar-versus-bitter co-stimulation, gain sweep and receptor/pathway stimulation; deterministic-seed traces are described.'
  - 'A separate parameter sweep checks post-stimulus network shutdown and disputes a gain fixed only by the sugar response; treat internal consistency disagreement as an unresolved result, not an independently reproduced biological finding.'
  - 'Missing connected-versus-degree-preserving rewired controller and same-budget non-neural/compact-RNN comparison under identical Minecraft scenarios, with held-out scenes and multiple seeds.'
history:
  - '2026-10-09: initial scientific B / interest S / medium confidence from public code, provenance, author-run pathway controls, failed embodied assays and open mechanistic calibration disagreement. No existing tier changed.'
note: >-
  Unlike a virtual fly-body simulator such as shute2004/virtual-fly, this is a
  Minecraft Fabric mod with a live HUD and world-building visualization. Its
  fly movement combines MaleCNS readouts and engineered reflex/physics; neither
  its interactive demo nor its internal Brian2 study establishes wiring-specific
  behavioural superiority. Compare with the controlled but still limited
  Flyhard steering experiment.
---
