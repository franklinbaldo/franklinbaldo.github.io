---
type: changelog
date: 2026-09-20
description: Article language alternates now exclude draft and future-scheduled translations that do not have public routes yet.
tags: [seo, i18n, ux]
---

# Language alternates only point to published posts

- Translation siblings now reuse the same `isPublished()` boundary as static blog route generation.
- `hreflang`, visible translation links, and language-switch data no longer advertise draft or future-scheduled counterparts before their routes exist.
