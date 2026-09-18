---
type: changelog
date: 2026-09-18
description: Give FlyDoom Fourier a local spatial target-error afference so the controller can sense which regions are drifting away from the target.
tags: [flydoom, malecns, fourier, control, reinforcement-learning]
---

# FlyDoom Fourier spatial error afference

The controller now receives a 32-region egocentric spatial error field in addition to the rendered retina. Each region carries signed target-minus-current surface error and an urgency term when that region's absolute error is increasing.

The local error is injected into matching left/right sensory ingress bins before MaleCNS recurrence. Reward remains a separate global scalar for credit assignment.
