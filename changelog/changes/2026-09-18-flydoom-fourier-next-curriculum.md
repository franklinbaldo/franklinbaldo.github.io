---
type: changelog
date: 2026-09-18
description: Add an automatic one-dimension-at-a-time curriculum, absolute bad-state discomfort, and progressively richer visualization to FlyDoom Fourier Next.
tags: [flydoom, malecns, curriculum, reinforcement-learning, visualization]
---

# FlyDoom Fourier Next curriculum

The successor now starts with exactly one Fourier actuator and one localized scalar sensory signal. After the policy holds match ≥ 0.970 for 12 consecutive sensory ticks, exactly one new actuator and one new localized scalar signal are unlocked while all previously solved target dimensions are preserved. Signals are revealed center-out across the 8×4 sheet and cycle through the six geometric feature families.

Displayed reward combines temporal progress with an absolute state-discomfort penalty. A bad but stable state is therefore still strongly negative: at match 0.12 the state term is about -0.52, while it approaches zero near the success threshold. Perturbation learning uses improvement in that discomfort rather than the absolute negative value, so a move from 0.120 to 0.121 still receives positive directional credit.

The human visualization follows the curriculum instead of showing the full 3D problem from the start: early stages are a growing spectrum, then a 1D cross-section, then 2D height maps, and only late stages expose the 3D surface. The rendered fly has been removed because locomotion is not the object of this experiment.
