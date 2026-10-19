---
type: changelog
date: 2026-09-20
description: Blog post client helpers now release page-specific listeners across Astro client-side navigation instead of accumulating stale callbacks.
tags: [performance, ux]
---

# Blog post navigation no longer accumulates stale listeners

- Inline post helpers now initialize the current page directly instead of registering permanent `astro:page-load` callbacks on every navigation.
- Reading-progress `scroll` and `resize` listeners are aborted before the next Astro page swap, so they cannot retain detached progress elements.
