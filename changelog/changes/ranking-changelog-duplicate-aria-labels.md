---
type: changelog
date: 2026-09-01
description: Fix duplicate aria-labels on battle cards and changelog release tags.
tags: [a11y, ranking, changelog]
---

# Screen reader labels identify which item they describe

- `src/pages/ranking/battles/index.astro` and `battles/page/[n].astro`: the
  "rates not available" placeholder on a battle card without tension data
  now includes the two posts in its `aria-label`, instead of repeating the
  same generic label for every card that lacks rates.
- `src/pages/changelog/index.astro`: the tag list under each changelog entry
  now labels itself with that entry's title (`Tags for <label>`) instead of
  the identical `"Change tags"` on every entry.
