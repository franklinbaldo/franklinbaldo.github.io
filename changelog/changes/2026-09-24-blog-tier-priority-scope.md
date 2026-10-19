---
type: changelog
date: 2026-09-24
description: Keep Hrönir blog tier evidence and review priority strictly inside the normal editorial-post domain.
tags: [blog, hronir, tiering, editorial]
---

# Keep blog tier priority inside normal-post scope

- Makes the hard tier-domain boundary executable in the read-only Hrönir tier-evidence projection: `postType: music` and `translationKey: music-*` are excluded before review priority, stale-version, or version-attention triage.
- Excludes legacy `music-*` blog-tier cards from canonical blog-card lookup while preserving the files as provenance.
- Reuses one shared scope predicate in the blog tier UI projection so normal-post filtering cannot silently diverge between the board and review-priority report.
- Adds regression coverage for both music markers, including a music post whose translation key does not use the `music-` prefix.
- Does not change any canonical tier judgment or generated Hrönir ranking state.
