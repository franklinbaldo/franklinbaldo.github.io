---
type: changelog
date: 2026-09-23
description: Derive stale tier-review priority from material selected-content changes.
tags: [blog, hronir, tiering, editorial, okf]
---

# Derive stale tier-review priority

- Extends the read-only Hrönir tier-evidence projection to compare current flat selected content with each canonical tier card's `reviewed_revision` using Hrönir semantic UUIDs.
- Raises review priority when selected content changed materially after the semantic review, while lifecycle-only changes and byte-identical content do not create churn.
- Fails conservatively to unknown when a historical path cannot be resolved, so a move or rename by itself is never treated as a stale review.
- Adds a `stale-version` projection column/reason and gives it more triage weight than ordinary version-attention but less than low-confidence evidence.
- Fetches full history only in the read-only tier-evidence workflow so historical review anchors are available without creating a second source of truth.
