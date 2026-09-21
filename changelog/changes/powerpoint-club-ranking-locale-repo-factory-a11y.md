---
type: changelog
date: 2026-09-11
description: Fixed image layout shift on PowerPoint Club, decimal separator locale on PT ranking pages, and added a missing aria-live announcement to Repo Factory's search.
tags: [a11y, i18n, cls]
---

# Fix image CLS, ranking number locale, and Repo Factory search announcements

- PowerPoint Club's Theranos slide deck (`nathan-holmes.astro`) had four
  meme/logo images with no `width`/`height` attributes, so every slide
  shifted layout while the image loaded. All four now carry their real
  pixel dimensions.
- Ranking μ/σ/ordinal stats (`RankingView.astro`, `ranking/posts/[key].astro`)
  always rendered with a `.` decimal separator via `.toFixed()`, even on
  `/pt/ranking/` pages where the adjacent date was already `pt-BR`-formatted.
  They now use the same `locale` already derived for dates.
- Repo Factory's search/filter toolbar had no `aria-live` announcement of
  the result count, unlike the equivalent music and books filters
  elsewhere on the site. Added a visually-hidden status region, debounced
  so it doesn't spam screen readers per keystroke while filtering itself
  stays instant.
