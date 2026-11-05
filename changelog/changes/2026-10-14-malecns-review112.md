---
type: changelog
date: 2026-10-14
description: "Curate Same Smell dual-connectome browser demo with causal and anatomical provenance limits."
tags: [malecns, tiers, okf, evidence]
---

# MaleCNS review 112 — Same Smell

Add independent `anzal1/samesmell` at initial **scientific C**, **interest A**, **confidence medium**, pinned to public commit `f5891d9206802e172c619e2bcede9d25e2cb79f1` (2026-09-12). It has sampled MaleCNS v1.0/FlyWire v783 data, a public provenance-oriented extractor, a WebGL visualization and LIF-like model.

Important limitation from source inspection: `src/modes.js` fixes male LUNGE and female PAUSE strings; `src/sim.js` merely triggers the per-side callback on the first descending-neuron firing. Sex-labelled behavior therefore cannot be attributed causally to the measured graphs. Parameter weights and Pong sensor/readout mappings are engineered. The repository's POC spec distinguishes synthetic fallback from real-derived assets; validation against original datasets and independent runtime reproduction remain outstanding. Suggested controls are swapped graphs, degree-matched nulls and quantitative matched readouts. No previously published tier is altered.

Candidate was not represented in the public main/curation PR #2363/#2367/#2369 cards. Within the previously screened shortlist, Same Smell was the sole unreviewed candidate remaining after WIP deduplication; no lottery was required in this round. Markdown OKF remains canonical; public evidence only; no parallel catalog. Jatoba was not used.
