---
type: changelog
date: 2026-09-18
description: Make FlyDoom Fourier reward and penalty increasingly strong as the surface approaches the target.
tags: [flydoom, malecns, fourier, reinforcement-learning, reward-shaping]
---

# Exponential precision reward for FlyDoom Fourier

Global and regional shaping now use the temporal difference of an exponential precision potential. Equal improvements are worth progressively more as the current surface approaches the target, and equal regressions receive a symmetric increasingly strong penalty.

The global potential is normalized against the 97% HIT threshold, so the exponential tail is concentrated where the agent actually needs to extract the last precision before success. A small linear progress term remains as a learning signal when the surface is still far from the target.

The shaping is progress-based rather than an absolute proximity payment: staying still produces zero reward. Task resets and target relocation reset the potential memory so a new target does not create a synthetic penalty.
