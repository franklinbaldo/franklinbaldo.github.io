---
type: changelog
date: 2026-10-10
description: The bilingual books pages now recover gracefully from an empty Goodreads feed and preserve keyboard-friendly sorting across Astro navigation.
tags: [ux, accessibility, books, okf]
---

# Bookshelf recovery and UX improvement graph

- The English and Portuguese books pages now show welcoming empty and unavailable states, with a direct route to Goodreads rather than raw internal errors.
- The Favorites view explains an empty selection, and filter/sort controls rebind after Astro client-side navigation without duplicate listeners.
- Book cards gain a visible keyboard-focus affordance and honor reduced-motion preferences.
- A typed OKF DAG records design decisions and progress across the blog and its independent experiences. The graph root is a normal concept in `root.md` while `index.md` remains an OKF-reserved navigation document.
