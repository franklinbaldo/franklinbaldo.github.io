---
type: changelog
date: 2026-10-19
description: Restore native-compiled bilingual archive pages and deterministic 50-item pagination while SSG's upstream sidecar bug remains unresolved.
tags: [blog, ssg, archive, accessibility, architecture]
---

# SSG: native-compiled bilingual archive and pagination

- Project canonical published articles into 50-item Markdown archive pages for both EN and PT; keep the SSG compiler and templates responsible for HTML.
- Preserve language segregation and newest-first order with deterministic route tiebreaks, real titles and dates, and explicit page links.
- Add build-artifact verification of locale, actual article links, page counts, headings and archive manifest, not just URL existence.
- Keep native listing configuration for eventual upstream repair and document the exact SSG 0.0.68 sidecar promotion defect.
- Correct the PT homepage's archive destination. Public GitHub Pages remains on Zola until the full cutover gates pass.
