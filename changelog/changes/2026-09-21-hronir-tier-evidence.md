---
type: changelog
date: 2026-09-21
description: Add a read-only Hrönir evidence projection for editorial tier maintenance.
tags: [blog, hronir, tiering, okf, tooling]
---

# Hrönir tier evidence

Adds `hronir tier-evidence`, a read-only projection that recomputes the signals used by editorial tier maintenance directly from canonical Hrönir rate files: OpenSkill rank/ordinal, win and appearance counts, absolute-quality EWMA, de-confounded quality and gap, plus per-perspective coverage and top-10 counts.

The command deliberately persists nothing. Canonical editorial judgments remain the OKF-native `blog-post-tier` cards, while all ranking and quality measurements remain derived Hrönir evidence rather than a second semantic authority.

The repository check workflow now smoke-tests the projection so future tiering rounds can obtain an exact, reproducible evidence summary before changing a tier card.
