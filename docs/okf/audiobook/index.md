---
type: Index
title: Audiobook Factory
description: Índice do sistema multi-work que transforma obras textuais em audiolivros e podcasts reproduzíveis.
tags: [audiobook, okf, multi-work, tts, podcast, github-actions]
timestamp: 2026-08-30T18:45:00Z
---

# Audiobook Factory

Este diretório documenta a **fábrica de audiolivros** do blog: uma pipeline genérica para transformar obras textuais em edições narradas, publicá-las como podcasts independentes e manter toda a produção rastreável e reproduzível.

O produto é a pipeline; cada livro é uma instância.

```text
book/work
  -> original OKF
  -> translation OKF
  -> narration OKF
  -> TTS
  -> audio
  -> durable media storage
  -> per-work podcast RSS
  -> blog/player
```

## Documentos

- [`prd.md`](./prd.md) — PRD e plano de implementação inicial, usando HPMOR como primeira obra end-to-end.
- [`multi-work-architecture.md`](./multi-work-architecture.md) — contrato que garante uma única pipeline para HPMOR, Bhagavad Gita e futuras obras, com `work_id`, configuração e podcast independentes.
- [`github-actions-execution.md`](./github-actions-execution.md) — GitHub Actions como plano de controle; Colab/Kaggle/API como runners substituíveis e execução totalmente headless.
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
add original/translation/narration
configure voices + publication
run the same GitHub Actions workflow
```

Não deve significar criar novos workers, novos runners, novo publisher ou workflow específico para aquela obra.

Cada obra publicada possui sua própria página e seu próprio feed RSS em namespace derivado de `work_id`, enquanto `/audiobooks/` funciona como catálogo agregado no blog.
