---
type: Change Card
title: Audiobook narration shards now expose TTS-pure bodies
summary: Define, validate and teach the invariant that narration frontmatter carries execution/editorial metadata while the Markdown body is the exact synthesis payload.
tags: [audiobook, narration, tts, okf, validation, skills]
timestamp: 2026-09-01T21:05:00Z
---

The audiobook pipeline now has an explicit direct-TTS body contract. New or migrated narration shards declare `tts_payload: body`; their body must contain only text intended for synthesis, while local production notes live in frontmatter `editorial_notes`.

The canonical OKF validator enforces body purity for shards that opt into the contract and reports remaining legacy narration shards so migration is visible. Chapter readiness requires all narration shards in the chapter to be migrated before `ready_for_audio` can become true.

A dedicated `audiobook-editorial-segment` skill records the one-segment workflow, stable identity/lineage rules, the external-model boundary and the executable narration-envelope convention.
