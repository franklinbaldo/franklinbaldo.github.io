---
type: changelog
date: 2026-09-18
description: Feed FlyDoom Fourier localized multi-statistic grid mismatch into distinct sensory sub-populations.
tags: [flydoom, malecns, fourier, proprioception, sensory-feedback]
---

# Localized multi-statistic grid discomfort

Each of the 32 egocentric surface regions now carries a six-channel mismatch vector instead of a single signed height error. The channels measure height difference, forward and lateral slope difference, curvature difference, surface-normal disagreement, and slope-magnitude difference.

The MaleCNS ingress population for each spatial region is deterministically partitioned into feature/opponent sub-populations. This preserves both where the mismatch occurs and what kind of mismatch it is, while worsening amplifies the local sensory drive.

Regional reward now uses the aggregate local mismatch magnitude, and the UI exposes the RMS of each mismatch statistic. Differential geometry is sampled at the sensory cadence rather than every render frame to keep the mobile demo responsive.
