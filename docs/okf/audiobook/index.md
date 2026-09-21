---
type: Index
title: Audiobook Factory
description: Índice do sistema multi-work que transforma obras textuais em audiolivros e podcasts reproduzíveis.
tags: [audiobook, okf, multi-work, tts, podcast, github-actions, chatgpt]
timestamp: 2026-08-30T20:20:00Z
---

# Audiobook Factory

Este diretório documenta a **fábrica de audiolivros** do blog: uma pipeline genérica para transformar obras textuais em edições narradas, publicá-las como podcasts independentes e manter toda a produção rastreável e reproduzível.

O produto é a pipeline; cada livro é uma instância.

A fábrica tem dois planos de controle deliberadamente separados:

```text
ChatGPT / agente editorial recorrente
  -> original OKF
  -> translation OKF
  -> narration OKF
  -> editorial review
  -> ready_for_audio

GitHub Actions / fábrica de mídia
  -> TTS (API / Colab / Kaggle)
  -> audio
  -> durable media storage
  -> per-work podcast RSS
  -> blog/player
```

O trabalho editorial usa o próprio agente do ChatGPT e o estado versionado no Git. **Não há chamada de API externa de LLM para tradução ou preparação de narração.** APIs/modelos externos entram apenas no estágio TTS depois do gate editorial.

## Documentos

- [`prd.md`](./prd.md) — PRD e plano de implementação inicial, usando HPMOR como primeira obra end-to-end.
- [`multi-work-architecture.md`](./multi-work-architecture.md) — contrato que garante uma única pipeline para HPMOR, Bhagavad Gita e futuras obras, com `work_id`, configuração e podcast independentes.
- [`editorial-control-plane.md`](./editorial-control-plane.md) — agente recorrente do ChatGPT, persistência de estado e separação entre trabalho editorial e síntese.
- [`chapter-readiness.md`](./chapter-readiness.md) — gates obrigatórios antes de uma unidade poder ser enviada ao TTS.
- [`benchmarks/pt-br-audiobook-v1-breeze.md`](./benchmarks/pt-br-audiobook-v1-breeze.md) — primeiro benchmark TTS **executado** em GPU remota: Breeze TTS 2 em Kaggle e Colab, com medições objetivas de qualidade pt-BR, custo e determinismo.
- [`guides/editorial-style.md`](./guides/editorial-style.md) — defaults editoriais compartilhados por todas as obras.
- [`guides/translation.md`](./guides/translation.md) — contrato da tradução canônica em pt-BR.
- [`guides/narration.md`](./guides/narration.md) — preparação provider-neutral da versão destinada à fala.
- [`github-actions-execution.md`](./github-actions-execution.md) — GitHub Actions como plano de controle de mídia; Colab/Kaggle/API como runners substituíveis e execução headless.
- [`podcast-publication.md`](./podcast-publication.md) — contrato de RSS, episódio, enclosure, transcript, storage e publicação; Internet Archive é o destino durável preferencial da mídia quando habilitado.

## Casos de referência

### HPMOR

Primeira obra a ser implementada. Valida tradução, múltiplas vozes, diálogo, interpretação dramática, geração incremental e publicação de um corpus longo.

### Bhagavad Gita

Segundo caso de referência arquitetural. Não precisa ser implementado na primeira fase; existe desde já para impedir acoplamento acidental do motor a HPMOR, inglês, ficção ou múltiplos personagens.

## Invariante de produto

Adicionar uma obra normal deve significar essencialmente:

```text
create data/audiobooks/<work_id>/work.md
add work-level editorial/pronunciation/voice configuration
run the recurring editorial agent until chapters become ready_for_audio
run the same GitHub Actions media workflow
```

Não deve significar criar novos workers, novos runners, novo publisher ou workflow específico para aquela obra.

Cada obra publicada possui sua própria página e seu próprio feed RSS em namespace derivado de `work_id`, enquanto `/audiobooks/` funciona como catálogo agregado no blog.
