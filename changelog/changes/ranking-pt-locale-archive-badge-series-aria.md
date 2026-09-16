---
type: changelog
date: 2026-09-16
description: Fixed PT decimal separators in rating numbers, archive rank badge links, and series list accessibility.
tags: [i18n, a11y, ux]
---

# PT decimal separators, archive rank deep-link, series aria-current

- Rating/duel numbers in `RankingView.astro` (`avgDuels`, recent-battle
  rates), the post ranking dossier's duel list, individual battle pages,
  and Hrönir review badges now use `toLocaleString(locale, ...)` instead
  of `.toFixed(n)`, so they render with `,` as the decimal separator in
  `lang="pt"` context instead of always `.`.
- The archive's rank badge (`#N`) now links to the post's own ranking
  dossier (`/ranking/posts/<key>/`) instead of the generic ranking page,
  matching the deep-link already used on the post page itself.
- The "all posts in series" list now marks the current post with
  `aria-current="page"`, matching the existing pattern in `Breadcrumbs`.
