---
type: changelog
date: 2026-09-18
description: Reconcile thin trainable IO adapters and geometric meta-control with the reward-safe FlyDoom Fourier core.
tags: [flydoom, malecns, reinforcement-learning, fourier, control, adapters]
---

# Reconciled thin IO adapters and meta-control

FlyDoom Fourier now keeps the reward-safe control core from main — robust full-state match, frequency-aware coefficient and velocity bounds, target-aware global spectral energy budget, and potential-based precision reward — while adding two thin trainable interfaces around the frozen MaleCNS.

The sensory adapter learns a per-region mixture of retina, local target error, and worsening. The motor adapter learns gain, bias, and limited neighbor mixing across the 1,314 descending outputs. Ablation can disable either adapter independently.

Eleven geometric meta-actuators are added on top of the existing translation X/Z and grid-resolution controls: curvature X/Z, saddle, tilt X/Z, rotation, scale X/Z, shear, global amplitude attenuation, and spectral bandwidth attenuation. The target is generated with the same meta-geometry. Fourier coefficients remain constrained by the safe core, and final similarity requires both robust Fourier agreement and meta-geometry agreement.
