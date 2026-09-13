---
type: Audiobook Work
work_id: hpmor
title: Harry Potter and the Methods of Rationality
author: Eliezer Yudkowsky
source_language: en
target_language: pt-BR
source_url: https://hpmor.com/
status: in_progress
publication_mode: non-commercial-experimental
podcast:
  enabled: true
  title: Harry Potter e os Métodos da Racionalidade — Audiolivro
  description: Edição em português brasileiro produzida pela Audiobook Factory de Franklin Baldo.
  language: pt-BR
  author: Franklin Baldo
media:
  durable_backend: github-pages
  base_path: /audio/hpmor/
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

O capítulo 1 foi aprovado, sintetizado e validado. O podcast está habilitado para esta publicação; outros capítulos permanecem não publicados.

O capítulo 1 é servido pelo próprio blog em um endereço estável. Alterar o storage no futuro não altera `work_id`, GUID dos episódios nem URL canônica do feed.
