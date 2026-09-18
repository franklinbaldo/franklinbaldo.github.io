---
type: changelog
date: 2026-09-18
description: Turn FlyDoom Fourier into a configurable control-capacity experiment with complex targets, thousands of Fourier actuators, and an adaptive grid-resolution actuator.
tags: [flydoom, malecns, fourier, simulation, reinforcement-learning, 3d]
---

# FlyDoom Fourier control capacity

FlyDoom Fourier now separates four experimental axes: target complexity, Fourier actuator count, grid-resolution budget, and the effective grid resolution selected by the controller.

The 1,314 descending neurons form a latent control space that can be interpolated into up to 4,096 Fourier actuators. A dedicated descending meta-actuator controls the effective grid resolution inside a user-selected ceiling from 16×16 to 128×128.

The interface reports the actuator-to-DN control load and supports simple, geometric, organic, random-spectrum, and adversarial multiscale targets.
