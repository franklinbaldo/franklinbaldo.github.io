---
type: changelog
date: 2026-10-19
description: Add a native SSG build candidate with typed content schemas, bilingual source projection, and independent CI auditing.
tags: [blog, rust, ssg, migration, ci]
---

# Native SSG candidate with built-in validation

- Introduces an experimental SSG 0.0.68 generator pipeline with native MiniJinja templates, content schemas, i18n, SEO, feeds, accessibility audits, and native search.
- Projects canonical published Hrönir-selected blog sources into temporary Markdown inputs while preserving English and Portuguese URLs, source identity, translations, draft filtering, and media references.
- Keeps the Zola GitHub Pages deployment unchanged. This candidate lives in a separate CI preview with route manifest and SARIF audit results.
- First verified native build compiled 252 public posts with zero missing projected routes and validated two native content schemas. The cutover is blocked by six special route roots, including the native archive, and the remaining functional and accessibility audit findings.
- Consolidates generator-independent publication rules in `scripts/lib/publication.mjs` and retains a Zola compatibility facade; documents route ownership and the SSG architecture boundaries for future incremental cleanup.
