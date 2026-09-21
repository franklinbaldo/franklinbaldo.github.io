---
type: changelog
date: 2026-09-20
description: Global Astro transition listeners are bundled once instead of being re-registered by inline PageLayout scripts after every client-side navigation.
tags: [performance, accessibility, ux]
---

# Global transition listeners no longer accumulate

- Theme handoff and post-navigation focus management now use Astro-processed scripts, which are bundled and executed once per visit.
- Client-side navigation keeps the same theme preservation and focus behavior without adding another permanent document listener on every swapped page.
