---
type: changelog
date: 2026-09-23
description: Make Hrönir signal agreement account for ordinal, pairwise, absolute, and de-confounded evidence instead of only one quality gap.
tags: [blog, hronir, tiering, editorial]
---

# Hrönir cross-signal agreement

- Keeps canonical tier judgments exclusively in OKF `blog-post-tier` cards; this change only improves the read-only review-priority projection.
- Extends `signal_agreement` beyond the absolute-vs-de-confounded gap by comparing coarse bands for ordinal percentile, pairwise win rate, absolute quality, and de-confounded quality.
- Uses the strongest observed disagreement level for triage without double-counting disagreement severity in the priority score.
- Preserves existing behavior when the additional signals are unavailable.
- Adds a regression test for a high-coverage work whose solid absolute/de-confounded scores conflict with a weak ordinal position and pairwise record.