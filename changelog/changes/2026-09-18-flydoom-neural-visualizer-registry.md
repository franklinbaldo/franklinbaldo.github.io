---
type: changelog
date: 2026-09-18
description: Add a runtime-selectable neural visualization registry to FlyDoom and FlyDoom Fourier.
tags: [flydoom, malecns, visualization, webgl, connectome]
---

# Pluggable neural visualizers for FlyDoom

FlyDoom and FlyDoom Fourier now expose neural telemetry through a shared browser-side visualization contract. The reader can switch the live view at runtime without changing or restarting the simulation, and the selected renderer is remembered locally.

The initial renderer set includes an activity cloud, a temporal raster, population bars, and a sensory/error field. FlyDoom streams a stable sample of descending-neuron activity from its worker; FlyDoom Fourier exposes its full 1,314-dimensional descending state.

The activity-cloud layout is explicitly labeled topological rather than anatomical. The registry is intentionally open so community renderers and future MaleCNS coordinate-backed anatomical views can be added without coupling visualization code to the simulator.
