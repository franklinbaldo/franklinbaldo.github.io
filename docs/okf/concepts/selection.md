---
type: Algorithm
title: Seleção de versões
description: Função pura que recomputa qual versão de cada post é a publicada, a partir do ranking de duelos de versão.
resource: ../../../src/hronir/selection.ts
tags: [hronir, selection, algorithm]
timestamp: 2026-07-03T00:00:00Z
---

# Seleção de versões

Desde a RFC 0010 (emenda 2026-07-01), cada post vive como um conjunto de
arquivos `v-<timestamp>.md` em `src/content/blog/<slug>/`, sem filename
privilegiado. A versão **publicada** é a que
`src/generated/versions-selected.json` (schema `selection-v1`) aponta —
gerado por `hronir select`, o único escritor do manifesto.

## Propriedade central: função pura, sem histerese

`select()` recomputa a seleção inteira a partir do zero a cada chamada — só
função de [rate files](./rate-file.md) + arquivos de versão existentes, sem
memória de qual era a seleção anterior. Por isso o arquivo é gitignorado
(não committed): `prebuild` o regenera antes de todo build, e deve ser
regenerado localmente antes de qualquer outro comando `hronir` num checkout
novo.

## Poda

Versões perdedoras elegíveis (≥0.5★ abaixo da selecionada, n≥3 duelos) podem
ser removidas por `hronir prune`, que registra `slug@uuid` em
`versions-pruned.json` para o build emitir redirects de permalink.

## Ver também

- [Ranking](./ranking.md) — fonte dos duelos de versão que a seleção consome.
- [Match](./match.md)
- [RFC 0010 — Versões como pares](../rfcs/index.md)
