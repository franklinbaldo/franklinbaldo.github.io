---
type: changelog
date: "2026-09-22"
description: "Keep Hrönir editorial tier priority scoped to works that are still published in the blog instead of resurfacing deleted historical competitors."
tags: [hronir, editorial, ranking, okf]
---

# Keep editorial tier priority on the live corpus

- Filters the read-only `tier-evidence` / `review-priority` projection through the current publishable content tree before choosing editorial targets.
- Preserves historical Hrönir rate files and ranking evidence for provenance; deleted works are simply no longer eligible for active blog tiering.
- Fixes the information-gain queue incorrectly surfacing historical keys such as `manifold-betting-ideas`, which was removed from the published blog in June 2026.
- Keeps canonical tier authority unchanged: one OKF `blog-post-tier` record per live `translationKey`.
