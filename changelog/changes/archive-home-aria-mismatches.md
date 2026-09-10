---
type: changelog
date: 2026-09-10
description: Fixed aria-live and aria-label text that didn't match a page's own visible language or heading.
tags: [a11y, i18n]
---

# Fix aria-label/aria-live mismatches on archive and home pages

- The PT archive's `aria-live="polite"` filter-status text (both the
  first page and its pagination pages) hardcoded the English word
  "posts" while every other visible string on the page says "ensaios".
  Screen-reader users now hear the announcement fully in Portuguese.
- The home page's `<section class="home-recent">` `aria-label` didn't
  match its own visible eyebrow heading — "Recent posts" vs. "Recent
  essays" on the EN page, and "Posts recentes" (an anglicism used
  nowhere else on the PT page) vs. "Ensaios recentes" on the PT page.
  Both now match their visible heading exactly.
