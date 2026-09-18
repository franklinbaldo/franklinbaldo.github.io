---
type: changelog
date: 2026-09-18
description: Add thin trainable input/output adapters plus symmetric geometric meta-actuators and targets to FlyDoom Fourier.
tags: [flydoom, malecns, reinforcement-learning, fourier, control, adapters]
---

# FlyDoom thin IO adapters and meta-control

FlyDoom Fourier now wraps the frozen MaleCNS with two deliberately small trainable interfaces.

The sensory adapter learns a per-region mixture of egocentric retina, local target error, and worsening. The motor adapter learns gain, bias, and limited neighbor mixing over the 1,314 descending neurons before the existing decoder. An ablation selector supports no learned adapters, input only, output only, or both.

The output space now also includes 11 continuous geometric meta-actuators: X/Z curvature, saddle, X/Z tilt, rotation, X/Z scale, shear, global amplitude, and spectral bandwidth. Grid resolution remains an additional meta-actuator.

Targets are generated in the same representation: pose + the same geometric meta-parameters + Fourier residual. This makes target complexity and controller capacity comparable at the same levels of representation.
