---
type: changelog
date: 2026-10-05
description: Add a phase readout and an optomotor assay to the /fly-shader/ demo.
tags: [connectome, demo, fly-shader]
---

# Phase readout and optomotor assay in /fly-shader/

- Adds a second readout to `/fly-shader/`, selectable in the controls or with `?readout=phase`. The world's texture is fixed and the descending neurons move the fly through it instead of painting the coefficients: yaw is a translation in x, applied as the exact phase ramp c → c·e^(−i·kx·Δx), so self-motion adds no free parameters. The arbitrary ±1 projection stays as the default and as the comparison mode.
- Steering is mean(right DNs) − mean(left DNs), z-scored against a 20 s baseline. The artifact labels DNs only by side (`dnl`/`dnr`), so this is a bilateral-asymmetry proxy, not a functional DN grouping; the sign convention (right > left ⇒ turn right) is stated on the page as an assumption.
- Adds a stimulus rotation slider, a switch for the modes' own drift, a live trace of stimulus, yaw and the controlled rotation (stimulus − yaw, without intrinsic drift), and an optomotor sweep: from one snapshot of the live state the lab worker replays every stimulus speed open-loop and closed-loop, takes the open-loop response relative to the paired v = 0 branch, and splits it into odd (directional) and even (direction-blind) parts.
- Adds `scripts/fly-shader-optomotor.mjs`, which runs the same sweep headless over several worlds with the page's own `sim.js` and writes the raw sweeps with the connectome's sha256 to `scripts/fly-shader-results/optomotor.json`. Velocities are in x-units/s: the panorama is 2 x-units wide (360° in the compound-eye mapping), so the sweep spans ±0.6 x/s = ±108°/s.
- First result (8 worlds, seeds 1–8): no optomotor response. The open-loop response is dominated by its even part (median directional share about 4%, one world at 43%), and closed-loop yaw does not track the stimulus (yaw/stimulus slope between −0.020 and 0.035). There is still no null model, so this is reported as an absence, not as a property of the fly.
- Fixes the paired probes of the empirical operator when the drift clock and world time diverge (drift switched off, or time spent in the phase readout): the snapshot now carries `tau` and the drift setting, and every branch samples and advances the same clock as the page. Before, branches sampled the field at world time and replayed a different scene from the one on screen.
