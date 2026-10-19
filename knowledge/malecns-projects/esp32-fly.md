---
type: malecns-project
project_id: "slvdev-esp32-fly"
name: "ESP32 Fly"
ownership: "independent"
kind: "MaleCNS subgraph on microcontroller with untrained escape readout"
stage: "hardware-verified subgraph execution and escape demo"
primary_url: "https://github.com/slvDev/esp32-ai"
repository: "slvDev/esp32-ai"
evidence_url: "https://github.com/slvDev/esp32-ai/blob/main/docs/fly-connectome/README.md"
scientific_tier: "B"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "52ebcbbd905270592c1d415efd1128d04d0fa365"
summary: >-
  A 48,311-neuron MaleCNS subgraph runs directly on an ESP32-S3 with exact
  retained contact counts, reproducible host/device gold checks and an untrained
  looming-to-escape readout. The artifact strongly demonstrates compact
  execution of a biologically sourced pathway, but not a whole-CNS or
  topology-specific advantage.
strongest_evidence:
  - "The released device graph contains 48,311 neurons and 9,462,135 directed edges with retained synaptic contact counts, and every inference step traverses the retained graph."
  - "Device verification reports 9,275,712 graph-gold values with max error 3.9e-7, 960 escape-gold values with max error 1.8e-7, and 60 autonomous decisions replayed against the host with max error 3.0e-8."
  - "Looming-detector stimulation makes known escape descending neurons dominate 20 same-size random visual-group controls; for DNp01, DNp02, DNp04 and DNp11, 0 of 20 controls reached the reported loom response."
limitations:
  - "The board cannot fit the whole MaleCNS graph; the retained 48,311-neuron subset excludes the VNC and most optic-lobe intrinsic neurons."
  - "The runtime uses engineered rate dynamics and positive contact-count weights; it does not reproduce transmitter signs, receptor effects, delays, biological plasticity or measured firing dynamics."
  - "No degree-preserving rewire, random recurrent network or matched conventional circuit is reported for the escape computation."
controls:
  - "Twenty random visual-projection groups of matched size provide a stimulus-to-readout specificity control."
  - "Independent host/device graph gold, escape gold and autonomous-decision replay test numerical fidelity of the port."
  - "A topology-destroying matched graph control remains missing for a MaleCNS-specific computation claim."
history:
  - "2026-09-26: initial placement -> scientific B / interest S, high confidence; strong hardware and pathway evidence credited, topology-specific and whole-CNS claims withheld."
note: "The tier credits the verified connectome computation and deployment artifact, not biological realism."
---