---
type: changelog
date: 2026-08-31
description: Advance HPMOR chapter 1 incrementally through the source, pt-BR translation, narration, and readiness pipeline while preserving stable editorial segment identities.
tags: [audiobook, hpmor, translation, narration, okf]
---

# HPMOR chapter 1 enters the canonical editorial pipeline

- Tracks chapter 1 as aligned source, pt-BR translation, and narration OKF layers with stable `work_id`, `chapter_id`, and `segment_id` identities.
- Persists one-unit-at-a-time editorial progress so scheduled runs resume deterministically without duplicating or renumbering completed work.
- Keeps TTS and public distribution blocked until the chapter-level audio contract/readiness gates and explicit rights authorization are satisfied.
