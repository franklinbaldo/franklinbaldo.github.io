---
type: changelog
date: 2026-09-21
description: Publish the read-only Hrönir tier-evidence projection as a short-lived CI artifact for reproducible editorial review.
tags: [hronir, ranking, editorial, ci]
---

# Publish Hrönir tier-evidence as a CI artifact

- Adds a focused pull-request workflow that recomputes `hronir tier-evidence` directly from canonical Hrönir rate files whenever tier records or Hrönir evidence change.
- Uploads the projection as a seven-day `tier-evidence.txt` artifact so editorial automation can inspect exact ordinal, absolute, de-confounded, appearance, win/loss and perspective signals without copying generated snapshots into the repository.
- Canonical tier judgments remain the OKF-native `blog-post-tier` cards; the artifact is ephemeral derived evidence, not a second semantic authority.
