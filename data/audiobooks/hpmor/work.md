---
type: Audiobook Work
work_id: hpmor
title: Harry Potter and the Methods of Rationality
author: Eliezer Yudkowsky
source_language: en
target_language: pt-BR
source_url: https://hpmor.com/
status: preparing
publication_mode: non-commercial-experimental
---

# Harry Potter and the Methods of Rationality

## Papel no projeto

HPMOR é a primeira obra end-to-end da Audiobook Factory e deve exercitar ficção longa, narrador, diálogos, múltiplos personagens, nomes ingleses e terminologia técnica.

A implementação da fábrica não pode depender deste título, desta estrutura narrativa ou do inglês como idioma-fonte.

## Fonte

O original canônico deve ser importado por capítulo a partir da fonte declarada, preservando URL/proveniência e digest do snapshot efetivamente usado.

O texto integral não é duplicado neste arquivo de metadata.

## Política editorial

- idioma alvo: português brasileiro;
- tradução e narração são camadas distintas;
- decisões recorrentes sobem para `editorial.md`/`pronunciation.yaml`;
- nomes e terminologia devem permanecer consistentes ao longo da obra;
- o primeiro capítulo só pode chegar a `ready_for_audio` depois dos gates de `docs/okf/audiobook/chapter-readiness.md`.

## Publicação

O projeto começa como experimento não comercial. Mudanças futuras de alcance/distribuição podem exigir revisão própria, mas não alteram o contrato técnico da fábrica.

Quando habilitada, a obra terá feed RSS próprio no blog e um item estável de mídia no Internet Archive.
