---
type: changelog
date: 2026-09-15
description: Locale-correct post rank badge numbers, keyboard-accessible Elo delta, and a music toggle tooltip that tracks its play/pause state.
tags: [a11y, i18n, ranking]
---

# Rank badge locale, Elo delta focus, and a music toggle that keeps its tooltip in sync

- `src/components/BlogPostPage.astro`: the μ/σ tooltip on every post's rank
  badge now formats with `toLocaleString(locale, ...)` instead of
  `toFixed(2)`, so PT posts show `,` as the decimal separator instead of
  always `.`.
- `src/components/RankingView.astro`: the ranking table's Elo column no
  longer hides its delta and peak inside a non-focusable `title` on a
  `<td>` — it now renders a keyboard-reachable `<abbr>` with a visible
  `(+N)`/`(-N)` delta next to the Elo value, so the information isn't
  color-only or mouse-only.
- `src/components/Header.astro`: the header's music play/pause toggle now
  updates its native `title` tooltip alongside `aria-label` when playback
  state changes, instead of leaving it stuck on "Play music".
