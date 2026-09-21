---
type: Data Schema
title: Post
description: Um post do blog (ou música) — desde a RFC 0014 (r1), o próprio arquivo carrega o campo type do OKF.
resource: ../../../src/content.config.ts
tags: [hronir, post, schema]
timestamp: 2026-07-03T00:00:00Z
---

# Post

Cada arquivo em `src/content/blog/<slug>/` (canônico ou versão `v-<timestamp>.md`)
segue o schema `postSchema` de `src/content.config.ts`. Desde a RFC 0014 (r1),
todo post carrega **literalmente** o campo `type` do OKF — obrigatório,
`"Blog Post"` ou `"Music Post"` — em vez de só ser descrito por um bundle de
documentação externo.

## Campos relevantes ao OKF

| Campo                                  | Descrição                                                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `type`                                 | `"Blog Post"` \| `"Music Post"` — obrigatório, classificação OKF (RFC 0014).                                                 |
| `docType`                              | Opcional — taxonomia editorial pré-existente (`essay`/`letter`/`fiction`/`technical`/`dialogue`); **não** é o `type` do OKF. |
| `title`, `description`, `tags`, `date` | Já cobrem os campos recomendados pela spec (`title`, `description`, `tags`, `timestamp`).                                    |

`type` e `docType` são explicitamente **excluídos** do hash de identidade de
versão (`UUID_EXCLUDED_FIELDS` em `src/hronir/posts.ts`) — editá-los não
gera uma nova versão nem desconecta o post do seu histórico de
[matches](./match.md). Ver RFC 0014 §7.2 para o porquê (e o fallback de
UUID de três níveis que preserva continuidade para posts migrados antes
dessa exclusão existir).

## Ver também

- [Match](./match.md) — compara dois posts (ou duas versões do mesmo post).
- [Seleção de versões](./selection.md)
- [RFC 0014 — Adoção do OKF](../rfcs/index.md)
