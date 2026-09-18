---
type: changelog
date: 2026-09-18
description: Make ToE Arena OKF-native with one canonical card per theory.
tags: [toe-arena, okf, architecture, knowledge]
---

# ToE Arena becomes OKF-native

- Registers `toe` as a normative OKF concept type.
- Moves each theory/proposal to its own canonical Markdown card under `knowledge/toe/`.
- Makes `src/data/toe-arena.ts` a build-time projection instead of a second semantic authority.
- Adds CI validation of all ToE cards with `okf-parser`.
- Preserves the current tier board and visual design while making adjacent/screened proposals explicit in the triage section.
