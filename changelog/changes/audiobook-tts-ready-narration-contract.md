---
type: Change Card
title: Narration shards gain an executable TTS body contract
description: Specifies and validates that narration frontmatter carries non-spoken controls while the Markdown body is the exact TTS payload, and adds agent skills for the audiobook editorial workflow.
tags: [audiobook, narration, tts, okf, validation, skills]
timestamp: 2026-09-01T21:12:00Z
---

Formaliza `tts_body_contract: tts-input-v1` para narration shards. O body de um shard marcado passa a ser validado como payload TTS puro, sem headings, notas editoriais, fenced code, comentários ou outras estruturas de documentação. A especificação estabelece que notas e direção não faladas pertencem ao frontmatter. Também adiciona skills para avanço de unidade editorial e preparação/revisão de narration shards. Shards legados permanecem em migração até receberem o marcador; nenhum TTS é disparado por esta mudança.
