---
type: changelog
date: 2026-09-18
description: Add a blank-sheet successor prototype for FlyDoom Fourier with a small reachable action space and thin learnable adapters around frozen MaleCNS.
tags: [flydoom, malecns, fourier, blank-sheet, reinforcement-learning, simulation]
---

# FlyDoom Fourier Next — blank-sheet successor

Adds a parallel `/flydoom-fourier-next/` prototype rather than rewriting the existing public demo in place.

The successor uses 32 Fourier residual modes plus five shared global transforms (translation X/Z, tilt X/Z, bowl curvature). Current and target therefore live in exactly the same reachable state space.

The task input is an explicit 8×4 artificial proprioceptive mismatch sheet, not the rendered 3D view. MaleCNS recurrence remains frozen. A tiny learnable feature-gain adapter sits before the connectome and a low-rank 1,314-DN → 32-context → 37-action readout learns after it.

Success is scored on realized geometry with dense height/normal/curvature checks and a worst-patch term. Reward is progress-based with an exponential late-precision tail, and a hit requires several consecutive sensory ticks above threshold before the same target shape relocates.

The old `/flydoom-fourier/` route is intentionally left untouched so the two designs can be compared before any replacement decision.
