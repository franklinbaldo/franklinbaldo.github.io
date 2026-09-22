---
type: Data Schema
title: Hrönir evaluation record
description: Registro OKF de uma avaliação par-a-par; novas avaliações usam Hronir Evaluation e são preenchidas diretamente por agentes.
resource: ../../../.routines/hronir/evaluations/
tags: [hronir, rate-file, schema, okf]
timestamp: 2026-09-21T00:00:00Z
---

# Registro de avaliação Hrönir

Cada avaliação concluída vive como um arquivo Markdown versionado em
`.routines/hronir/evaluations/`. O Markdown é a fonte de verdade: não existe banco de
sessão nem etapa de submissão separada.

## Formato canônico novo

Novas avaliações usam:

```yaml
type: Hronir Evaluation
```

O contrato normativo vive em
[`specs/okf-types/hronir-evaluation.md`](../../../specs/okf-types/hronir-evaluation.md).
O agente começa com um documento mínimo e executa `okf-parser check` com
`--require-spec` e `--normative-spec`. Diagnósticos `OKF011` apontam os
campos obrigatórios ausentes; o agente edita o próprio Markdown e repete o check
até `conformant: true`.

Os lados do duelo são deliberadamente planos
(`post_a_key`, `post_a_path`, `post_b_key`, `post_b_path` etc.) para que
cada campo possa produzir um diagnóstico independente.

## Legado

Arquivos históricos com:

```yaml
type: Rate File
```

continuam válidos e legíveis. Eles usam os objetos aninhados `post_a` e
`post_b` e não devem ser migrados em massa: são evidência histórica imutável.
A spec mínima de compatibilidade está em
[`specs/okf-types/rate-file.md`](../../../specs/okf-types/rate-file.md).

## Consumidores

O build Astro/TypeScript pode ler tanto o formato legado quanto
`Hronir Evaluation` para produzir ranking, histórico e páginas públicas. Esse
código é uma projeção de leitura; ele não cria, completa nem valida avaliações.

A autoridade de escrita/validação é o `okf-parser`.
