---
type: changelog
date: 2026-09-18
description: Keep FlyDoom Fourier learning continuously instead of resetting the task every 6.5 seconds.
tags: [flydoom, malecns, fourier, reinforcement-learning]
---

# Continuous FlyDoom Fourier

Removes the fixed 6.5-second episode timer from FlyDoom Fourier. The controller now keeps working on the same target for as long as needed, preserving learned state and only restarting when the user explicitly resets or changes the task.
