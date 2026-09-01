---
type: Change Card
title: Audiobook narration body becomes a validated TTS payload
summary: Record the executable narration envelope contract in specs, validation, and a dedicated agent skill.
tags: [audiobook, narration, tts, okf, validation, skills]
timestamp: 2026-09-01T21:05:00Z
---

Narration shards can now declare `tts_body_contract: body-is-payload-v1`. For those shards the frontmatter contains execution/editorial metadata and the Markdown body is the exact synthesis payload.

The OKF validator rejects headings, fenced blocks, comments, empty bodies, invalid local notes, and unknown body-contract values. It also reports legacy narration shards so migration debt is explicit without instantly invalidating the existing in-progress corpus.

Chapter readiness now requires every narration shard to use the contract before `ready_for_audio`, and the `audiobook-editorial-segment` skill teaches agents the same invariant while preserving the external-model boundary.
