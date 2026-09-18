---
type: changelog
date: 2026-09-18
description: Expand FlyDoom Fourier into a closed-loop control-capacity experiment with adaptive grid resolution, complex targets, and up to 4,096 Fourier actuators.
tags: [flydoom, malecns, fourier, simulation, reinforcement-learning, 3d]
---

# FlyDoom Fourier — closed-loop control capacity

Updates `/flydoom-fourier/` and its Portuguese blog post.

The demo now uses an egocentric retinal view plus an explicit artificial morphology-error afference before MaleCNS recurrence. The 1,314 descending neurons are retained individually as a latent control space rather than collapsed into eight controller buckets; the eight buckets remain visual summaries only.

The output space is configurable from 16 to 4,096 Fourier actuators. When the actuator count exceeds 1,314, a smooth decoder interpolates the descending latent controls into the larger spectral action space. The UI reports `control load = actuators / 1,314`.

Grid resolution is independently configurable from 16×16 to 128×128. The user selects the resolution ceiling, while a dedicated descending meta-actuator selects the effective grid resolution during the task. This lets the experiment map actuator count, target complexity, grid budget, chosen effective resolution, and achieved performance separately.

Targets now include simple, geometric, organic, random-spectrum, and adversarial multiscale families, with user-controlled spectral complexity and regenerable random targets.
