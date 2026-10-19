---
type: changelog
date: 2026-09-19
description: "Prevent the Back to top fallback from accumulating scroll listeners across Astro view transitions."
tags: [performance, accessibility, ux]
---

The Back to top fallback now aborts its previous window-level scroll listener before binding the current page, keeping one active handler across client-side navigations instead of retaining handlers for replaced page elements.
