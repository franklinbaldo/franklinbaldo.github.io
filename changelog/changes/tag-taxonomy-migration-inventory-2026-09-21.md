---
type: changelog
date: 2026-09-21
description: Expose source posts and current public tag URLs for each known taxonomy collision without changing labels or routes.
tags: [seo, taxonomy, ci]
---

# Tag collision guard gains migration evidence

`npm run check:tags -- --report` now expands each known collision with assignment counts, source post paths, languages, and the corresponding encoded public tag URLs. The default CI guard remains terse and keeps the same six-collision allowlist; this adds only a derived inventory for planning the deliberate redirect/canonicalization work in #1909.
