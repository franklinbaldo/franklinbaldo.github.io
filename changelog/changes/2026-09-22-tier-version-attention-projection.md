---
type: changelog
date: 2026-09-22
description: Derive selected-version regression attention from Hrönir version duels and feed it into read-only editorial review priority.
tags: [blog, hronir, tiering, editorial]
---

# Add selected-version attention to tier review priority

- Extends the derived `tier-evidence` projection with `version-attention` and selected-version win/loss counts.
- Flags attention only when the current version loses at least twice across at least two distinct reader perspectives, avoiding one-off churn.
- Raises review priority for that concrete regression signal without changing canonical tier cards or switching versions automatically.
- Derives current UUIDs only where the live single-file version is unambiguous; legacy multi-file selections are skipped conservatively rather than guessed from stale/generated state.
- Keeps historical version-duel rate files as evidence while leaving all canonical editorial judgments in OKF-native `blog-post-tier` cards.
