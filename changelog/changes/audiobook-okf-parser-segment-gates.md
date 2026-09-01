---
type: changelog
date: 2026-09-01
description: Make okf-parser the mandatory validation boundary for canonical audiobook segments and enforce per-segment identity, lineage, provenance, narration metadata, and orphan checks before readiness/TTS.
tags: [audiobook, okf, validation, ci, tts]
published: false
---

# Audiobook segments now pass through okf-parser

Canonical source, translation, and narration shards are loaded through pinned `okf-parser` before the existing audiobook readiness validator runs. The gate fails closed on malformed OKF, missing layer-specific metadata, unstable IDs, orphan layers, broken source→translation→narration lineage, or canonical shard filename mismatches.
