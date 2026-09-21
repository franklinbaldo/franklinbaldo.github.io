---
type: changelog
date: 2026-09-06
description: Fix duplicate music player aria-labels and add screen-reader status announcements to /books/ and /ranking/battles/ filters.
tags: [a11y, music, books, ranking]
---

# Filter results and player controls now announce themselves correctly

- `src/components/MusicPostLayout.astro`: the floating play button over the
  album cover no longer repeats the same `aria-label` as the primary play
  button below the title — it's now hidden from assistive tech
  (`aria-hidden`/`tabindex="-1"`) since the primary button already covers
  that action. Version-list play buttons now include their position number
  in the label so they don't collide with the primary track's name.
- `src/components/BooksPage.astro` (`/books/` and `/pt/livros/`): filtering
  by favorites/all or changing the sort order now announces the new result
  count to screen readers via a `role="status"` live region.
- `src/pages/ranking/battles/index.astro` and `battles/page/[n].astro`: the
  existing results-count label now announces changes via
  `role="status" aria-live="polite"`; the search box input is debounced so
  it announces once per pause in typing instead of once per keystroke.
