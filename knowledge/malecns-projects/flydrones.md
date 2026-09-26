---
type: malecns-project
project_id: "spikecalls-flydrones"
name: "FlyDrones"
ownership: "independent"
kind: "MaleCNS-to-drone sensorimotor bridge"
stage: "full-MaleCNS simulation path implemented; public browser demo uses MiniFly; hardware flight not yet demonstrated"
primary_url: "https://github.com/SpikeCalls/FlyDrones"
repository: "SpikeCalls/FlyDrones"
evidence_url: "https://github.com/SpikeCalls/FlyDrones/blob/main/README.md"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
reviewed_at: "2026-09-26"
reviewed_revision: "3e269346b3882c291d2a977bc2c2c6a9c9213c21"
summary: >-
  A real MaleCNS loading, simulation and calibration path is wired to a drone-control
  stack, but the public browser behavior is produced by the 850-neuron MiniFly
  stand-in and the hardware adapters have not yet been flight-tested. This is
  substantial system evidence, not yet evidence that full MaleCNS is a useful
  physical drone controller.
strongest_evidence:
  - "The project implements a MaleCNS v1.0 loader, signed spiking simulation, named visual/descending populations and a calibrated motor readout."
  - "The full-connectome path can be built, inspected, calibrated and run through the same simulator/runtime used by the control stack."
  - "The project explicitly separates MiniFly browser demos, full MaleCNS execution, engineered interfaces and external safety control."
  - "Simulator, retina, decoder, safety, protocol and MaleCNS-loader behavior are covered by tests."
limitations:
  - "The browser demo and GIFs use MiniFly, an 850-neuron hand-wired stand-in, not the full MaleCNS connectome."
  - "The real-drone adapters are documented as not yet flight-tested by the project."
  - "The drone's own flight controller and an external safety governor remain outside the neural substrate."
  - "Camera-to-neuron encoding and the descending-neuron readout are engineered."
controls:
  - "A same-size random-graph benchmark is reported for throughput, but it is not a behavioral topology control."
  - "Dry-run and simulator-first hardware paths provide engineering safety controls."
  - "Missing: full-MaleCNS versus rewired/random recurrent/simple-controller comparison under the same simulated or physical flight task."
history:
  - "2026-09-26: initial placement -> scientific C / interest S, high confidence; full-MaleCNS infrastructure credited, physical/full-brain behavioral claim withheld."
---