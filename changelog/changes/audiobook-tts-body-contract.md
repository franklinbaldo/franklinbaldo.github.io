---
type: Change Card
title: Audiobook Factory gains executable TTS contract and durable operational skill
description: Defines and validates tts-body-v1, semantic/prosodic segmentation and a mandatory audiobook-factory skill that persists pipeline, segment-size and backend/runner knowledge for recurring agents.
tags: [audiobook, tts, okf, validation, skills]
timestamp: 2026-09-01T21:05:00Z
---

Formaliza `tts-body-v1` para impedir que notas editoriais ou Markdown estrutural sejam enviados acidentalmente ao sintetizador. HPMOR adota o contrato a partir de `hpmor-001-s0043`; unidades anteriores ficam explicitamente como dívida de migração, enquanto novas unidades passam a ser validadas mecanicamente. O repositório também ganha uma skill canônica `audiobook-factory`, obrigatória no início de toda rotina, que registra o pipeline completo, a política de segmentação semântico-prosódica, a heurística atual de tamanho, o estado evidencial dos backends/runners e o procedimento para transformar novos benchmarks em conhecimento persistido no próprio repositório.
