---
type: changelog
date: 2026-09-04
description: Series context line shows a display title instead of the raw internal slug.
tags: [copy, i18n]
---

# Series line shows a display title, not the raw slug

- `src/lib/series.ts`: `SeriesContext` gains a `title` field, resolved
  through a new `SERIES_TITLES` map (with a title-cased-slug fallback for
  series not yet in the map).
- `src/components/SeriesContext.astro`: the "Part X of Y — `<slug>`" line
  now renders `series.title` instead of the raw `series.slug`, so an
  internal identifier like `harness` no longer leaks into reader-facing
  prose, in both EN and PT.
