---
type: changelog
date: "2026-09-22"
description: "Prioritize Hrönir editorial review by derived uncertainty and information gain instead of walking the global ranking in order."
tags: [hronir, ranking, editorial, okf, ci]
---

# Add uncertainty-driven Hrönir review priority

- Extends the read-only `tier-evidence` projection with canonical tier presence/confidence, absolute-vs-de-confounded signal agreement, and an ephemeral `review-priority` score with explicit reasons.
- Keeps the score strictly as triage metadata: literary tiers remain the OKF-native `blog-post-tier` records and Hrönir measurements remain derived from canonical evaluation/rate evidence.
- Prioritizes unrated works first, then low-confidence records, missing perspectives, strong signal disagreement, and light evidence coverage instead of assuming the next global rank is the next editorial review.
- Changes the pull-request report/status band to expose the ten highest-priority review candidates rather than `tiered_count + 1 ... + 10` ranking positions.
- Adds pure regression tests covering unrated priority, confidence-versus-agreement separation, and mixed low-coverage uncertainty.
