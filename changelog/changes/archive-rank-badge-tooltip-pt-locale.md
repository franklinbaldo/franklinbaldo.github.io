---
type: changelog
date: 2026-09-20
description: Archive rank-badge tooltip now uses pt-BR decimal separator.
tags: [i18n, ux, ranking]
---

# Archive rank-badge tooltip respects the pt-BR decimal separator

- The archive rank badge's tooltip (`archive/index.astro`,
  `archive/page/[n].astro`, and their `pt/` counterparts) now formats the
  ordinal with `toLocaleString(locale, ...)` instead of `.toFixed(2)`, so
  PT pages show `,` as the decimal separator instead of always `.`.
