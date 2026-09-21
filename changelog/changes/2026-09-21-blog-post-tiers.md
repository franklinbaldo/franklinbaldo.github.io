---
type: changelog
date: 2026-09-21
description: Add OKF-native editorial tiers for blog posts, projected beside live Hrönir evidence.
tags: [blog, hronir, tiering, okf, editorial]
---

# Blog post tier board

- Adds the normative `blog-post-tier` OKF type, keyed by blog `translationKey` so translations remain one conceptual work.
- Seeds the first three high-coverage works after reviewing their overall Hrönir standing, perspective spread and duel history.
- Keeps quality S empty: top ranking alone is insufficient while material lens-specific weaknesses remain.
- Separates quality tier, interest tier and confidence.
- Adds `/pt/blog-tiers/`, with current OpenSkill, absolute EWMA, de-confounded quality, W/N and perspective coverage computed from Hrönir at build time rather than copied into the tier cards.
- Extends CI so `okf-parser` validates the canonical tier records against their normative spec.
