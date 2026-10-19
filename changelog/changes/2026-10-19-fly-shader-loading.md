---
type: changelog
date: 2026-10-19
description: Fix the fly-shader demo stopping at its initial loading screen.
tags: [bugfix, demo, fly-shader]
---

# Restore fly-shader startup

- Restore the loop diagram's DOM identifier so readout setup can finish before the first animation frame and MaleCNS download.
- Add a regression test that imports the actual app against IDs from its HTML in all four readouts and verifies that rendering and brain loading start.
