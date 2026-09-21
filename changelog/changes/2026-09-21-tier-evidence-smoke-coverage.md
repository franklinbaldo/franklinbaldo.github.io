---
type: changelog
date: 2026-09-21
description: Expand the read-only Hrönir tier-evidence CI smoke projection from the top 12 to the top 20 works.
tags: [hronir, ranking, editorial, ci]
---

# Expand Hrönir tier-evidence smoke coverage

- CI now prints the top 20 works from `hronir tier-evidence` instead of only the top 12, making the next high-coverage unrated candidates visible during editorial tier maintenance.
- The command remains read-only and recomputes evidence from canonical Hrönir rate files.
- Canonical editorial judgments remain the OKF-native `blog-post-tier` cards; this change does not create a second ranking or tier authority.
