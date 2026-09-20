---
type: changelog
date: 2026-09-20
description: The sticky table-of-contents observer now releases its Astro transition cleanup listener after the next page swap instead of accumulating callbacks across navigation.
tags: [performance, accessibility, ux]
---

# Table-of-contents cleanup listeners no longer accumulate

- The sidebar ToC still disconnects its `IntersectionObserver` before Astro swaps the page.
- Its `astro:before-swap` cleanup callback is now one-shot, so repeated client-side navigation does not retain already-used observer closures.
