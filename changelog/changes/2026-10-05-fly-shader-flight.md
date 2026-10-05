---
type: changelog
date: 2026-10-05
description: Add a flight mode to /fly-shader/ — whole compound eye, 29 actions, policy rewarded by the giant fiber.
tags: [connectome, demo, fly-shader]
---

# Flight mode in /fly-shader/: whole eye, many actions, giant-fiber reward

- Adds a third readout, `flight` (also `?readout=flight`). The world is seen by the whole compound eye: 1,771 retinotopic columns on both sides, each driving its own lamina L1, L2 and L3 cells, instead of the 8×4 grid that fed visual projection neurons directly. Light enters with a negative sign because every R1–R6 → L1/L2/L3 synapse in the artifact is inhibitory (1,242 of 1,243 onto L1 and all 1,240 onto L2 are negative).
- Adds `scripts/fly-shader-build-eye.py`, which builds `eye_columns.json` and `dn_types.json` from the MaleCNS v1.0 body annotations. The browser artifact has no body IDs; the script proves that its neuron index is the row among `status == Traced` bodies (all 1,314 DNs, all 9,201 visual projection neurons and the left DN split land exactly on the annotated superclasses) and refuses to write otherwise. Coverage: L1 in 1,767 columns, L2 in 1,766, L3 in 892 (right eye only in the annotation).
- The fly acts on the world in 29 ways: yaw and pitch (exact phase ramps), loom (spectral rescaling about the point straight ahead), contrast, drift speed, and a velocity on each of the 24 mode coefficients. The shader takes the same view transform.
- A linear policy from the DNs to those actions is trained by REINFORCE (exploration noise outside the tanh, one-second eligibility trace, weight decay) while the connectome stays frozen. The reward is the giant fiber, DNp01 (annotated synonym "GF"), measured as its rise above its own 10 s mean in running standard deviations; it is excluded from the policy's input. A takeoff is a crossing of 3σ.
- Feasibility (headless, 3 worlds): the giant fiber does respond to what the compound eye sees, by about 0.01 on a level near 0.1, and its level depends strongly on the pattern, but it is not looming-selective; looming lowered it in all three worlds.
- First learning result (3 worlds × 10 min, takeoffs counted on the giant fiber by an independent tracker): control 8, learning 9, sham learning rewarded by two random DNs 13, fast learning 14. No giant-fiber-specific learning; the extra takeoffs track how hard the policy shakes the world, not what it is rewarded for. An earlier version of the policy, whose weights ran away and saturated, showed 4 vs 16–25 takeoffs for the same reason.
- `.prettierignore` lists the two generated tables, following `retinotopic_columns_1771.json`.
