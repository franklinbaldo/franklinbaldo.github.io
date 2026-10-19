---
type: changelog
date: 2026-10-05
description: Add a flight mode to /fly-shader/ — compound eye into the lamina, 29 actions, policy rewarded by the giant fiber; first result is null.
tags: [connectome, demo, fly-shader]
---

# Flight mode in /fly-shader/: compound eye, many actions, giant-fiber reward

- Adds a third readout, `flight` (also `?readout=flight`). The world is seen by the compound eye: 1,771 retinotopic columns (879 left, 892 right), each driving its own lamina L1 and L2 cells, instead of the 8×4 grid that fed visual projection neurons directly; 1,768 columns have at least one cell. L3 is not used: MaleCNS v1.0 annotates it in the right eye only (892 of 892 right columns, 0 of 879 left), and a one-sided input is an asymmetry a reward-seeking policy would exploit. Light enters with a negative sign because every R1–R6 → L1/L2 synapse in the artifact is inhibitory (1,242 of 1,243 onto L1, all 1,240 onto L2).
- Adds `scripts/fly-shader-build-eye.py`, which builds `eye_columns.json` and `dn_types.json` from the MaleCNS v1.0 body annotations. The browser artifact has no body IDs; the script proves that its neuron index is the row among `status == Traced` bodies (all 1,314 DNs, all 9,201 visual projection neurons and the left DN split land exactly on the annotated superclasses) and refuses to write otherwise.
- The fly acts on the world in 29 ways: yaw and pitch (exact phase ramps), loom (spectral rescaling about the point straight ahead), contrast, drift speed, and a velocity on each of the 24 mode coefficients. The shader takes the same view transform.
- A linear policy from the DNs to those actions learns by reward-modulated node perturbation with a one-second eligibility trace (exploration noise outside the tanh, weight decay) while the connectome stays frozen. With the loop open it neither acts, explores nor learns, and its trace is cleared. The reward is the giant fiber, DNp01 (annotated synonym "GF"), measured as its rise above its own 10 s mean in running standard deviations, and excluded from the policy's input. A crossing of 3σ is counted as a takeoff proxy: an event in this rate model, not an observed takeoff.
- Adds `scripts/fly-shader-flight-assay.mjs`, which runs both assays headless with the page's own `sim.js` and writes `scripts/fly-shader-results/flight-assay.json` with seeds, configuration and the sha256 of the connectome and eye tables.
- Stimulus assay (worlds 2–4, 3 s per stimulus from one snapshot): the giant fiber responds to what the eye sees, by up to about 0.02 on levels between −0.03 and 0.13 that depend on the pattern, but it is not looming-selective; looming lowered it in two of three worlds.
- Learning assay (worlds 2–4 × 10 min, giant-fiber crossings counted by an independent tracker): control 3, learning 5, sham learning rewarded by two random DNs 8, fast learning 8. No evidence of giant-fiber-specific learning: the sham crosses as often as anything rewarded by the giant fiber, so the extra crossings track how much the policy shakes the world, not what it is rewarded for. Counts are small and there is no connectome null model yet.
- `.prettierignore` lists the two generated tables, following `retinotopic_columns_1771.json`.
