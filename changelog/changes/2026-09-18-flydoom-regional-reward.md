---
type: changelog
date: 2026-09-18
description: Add per-region negative reward and spatial credit assignment to FlyDoom Fourier.
tags: [flydoom, malecns, reinforcement-learning, fourier, control]
---

# FlyDoom Fourier regional reward

Each of the 32 egocentric error regions now gets its own reward signal. Local improvement is positive, residual error is mildly negative, and regions whose error is actively worsening receive a stronger negative reward.

Those regional rewards are projected back to the Fourier modes and descending latent controls that influence the corresponding spatial locations. The global task reward remains in place, but spatial credit now dominates local correction.

The UI exposes the mean and worst regional reward so negative local credit is directly observable.
