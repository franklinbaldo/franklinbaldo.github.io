---
type: changelog
date: 2026-09-03
description: Fix the site name wrapping onto two lines around 920-1000px width.
tags: [a11y, header, i18n]
---

# Header brand stays on one line at laptop widths

- `src/components/Header.astro`: the "Franklin Baldo." brand link lacked
  `white-space: nowrap`, unlike every `.nav-inline` item, so it wrapped
  onto two lines around 920-1000px viewport width — in both English and
  Portuguese — even though there was plenty of room for it to stay on one
  line. Fixed on `.brand`.
- The fix is scoped to the ≥899px `.nav-inline` layout only: under the
  899px burger breakpoint, `.brand` falls back to `white-space: normal`
  again, since narrow phone widths (≤412px) need the wrap as a safety
  valve against horizontal overflow.
- Re-verified with Playwright, in both languages, that `.nav-inline`
  itself never wraps or overflows between 899-1280px — the breakpoint's
  own `Unverified` code comment is now replaced with the measured
  justification.
