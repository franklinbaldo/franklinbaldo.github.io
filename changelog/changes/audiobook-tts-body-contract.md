---
type: Change Card
title: Narration shards gain executable TTS body contract
description: Defines and validates tts-body-v1 so narration frontmatter carries controls/notes while the body is the exact synthesizer payload; adds operational skills for segment editing and TTS payload review.
tags: [audiobook, tts, okf, validation, skills]
timestamp: 2026-09-01T21:05:00Z
---

Formaliza `tts-body-v1` para impedir que notas editoriais ou Markdown estrutural sejam enviados acidentalmente ao sintetizador. HPMOR adota o contrato a partir de `hpmor-001-s0043`; unidades anteriores ficam explicitamente como dívida de migração, enquanto novas unidades passam a ser validadas mecanicamente. O repositório também ganha skills versionadas para o fluxo editorial de um segmento e para a revisão do payload TTS.
