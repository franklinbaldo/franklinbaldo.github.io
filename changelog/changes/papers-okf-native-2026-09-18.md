---
type: changelog
date: 2026-09-18
description: Make the Papers portfolio OKF-native with one canonical card per paper.
tags: [papers, okf, architecture, knowledge]
---

# Papers becomes OKF-native

- Registers `paper` as a normative OKF concept type.
- Migrates all 37 current paper records from the hardcoded Astro array to one Markdown card per paper under `knowledge/papers/`.
- Makes `src/data/papers.ts` a build-time projection over the cards.
- Leaves `src/pages/papers.astro` responsible for presentation and portfolio-level editorial relations, not per-paper storage.
- Adds CI validation of Paper cards with `okf-parser`.
- The hourly Papers curator now updates OKF cards instead of reintroducing a JSON/TypeScript/Astro catalog.
