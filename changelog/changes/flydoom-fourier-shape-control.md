---
type: changelog
date: 2026-09-16
description: Add FlyDoom Fourier, a MaleCNS descending-layer demo that learns to deform a 3D arena toward predefined Fourier shape targets.
tags: [flydoom, malecns, fourier, simulation, reinforcement-learning, 3d]
---

# FlyDoom Fourier

Adds `/flydoom-fourier/` and a Portuguese blog post embedding the demo.

The browser experiment reuses the existing compact MaleCNS assets, compresses the rendered arena into 32 visual columns, reads 1,314 descending neurons through eight deterministic buckets, and trains only a small DN-to-Fourier adapter. Six Fourier coefficients deform a 3D terrain toward one of four target shapes. The UI exposes descending activity, current/target coefficients, similarity, reward, hit count, and MaleCNS step latency.
