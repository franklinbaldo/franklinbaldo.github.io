---
type: changelog
date: 2026-10-19
description: Remove the legacy Hrönir token-stuffing and low-quality detection scripts
tags: [hronir, cleanup]
---

The one-off `scripts/hronir/detect-token-stuffing.mjs` and
`scripts/hronir/detect-low-quality.mjs` scans over historical rate files are
removed. Nothing referenced them, and the Hrönir workflow is now OKF-first, with
`okf-parser` as the sole operational validator. They were also two of the
remaining direct users of `js-yaml`.
