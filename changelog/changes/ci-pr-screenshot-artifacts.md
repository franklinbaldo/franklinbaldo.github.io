---
type: changelog
date: 2026-09-01
description: Capture pull-request screenshots in CI so visual changes have reproducible before/after evidence.
tags: [ci, visual-regression, cobogo]
---

# PR screenshot artifacts

- Runs the existing screenshot harness against an Astro preview in pull-request CI.
- Uploads the captured routes as a workflow artifact for visual review.
- Makes the before/after evidence required by the Cobogó surface-review loop reproducible from the PR head.
