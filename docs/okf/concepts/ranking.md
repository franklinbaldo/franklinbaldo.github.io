---
type: Algorithm
title: Ranking
description: Placar OpenSkill acumulado a partir de todos os rate files, com de-confounding de vieses de avaliador e perspectiva.
resource: ../../../src/hronir/ranking.ts
tags: [hronir, ranking, algorithm]
timestamp: 2026-07-03T00:00:00Z
---

# Ranking

O ranking usa [OpenSkill](https://github.com/philihp/openskill.js) sobre a
sequência ordenada (por `run_at`, depois filename) de todos os
[rate files](./rate-file.md) preenchidos. Cada [match](./match.md) atualiza
o rating dos dois posts envolvidos; o score final por post é o `ordinal`
do OpenSkill.

## De-confounding (RFC 0002)

Nem toda diferença de estrelas é qualidade: parte é viés de avaliador (`α`)
e de perspectiva (`π`). O ranking roda uma solução ridge-least-squares
(`DECONFOUND_RIDGE`) para separar o efeito do post do efeito de quem avaliou
e sob qual [perspectiva](./perspective.md), produzindo um score
"de-confundido" além do score cru. `hronir diagnose` expõe ambos, o `gap`
entre eles, e os vieses `α`/`π` por avaliador/perspectiva — leitura pura,
não muda estado.

## Duelos de versão

Matches onde os dois lados compartilham a mesma `key` (duelo de versão, RFC 0010) são excluídos do ranking de qualidade entre posts e computados à parte,
alimentando a [seleção de versões](./selection.md).

## Ver também

- [Rate file](./rate-file.md)
- [Seleção de versões](./selection.md)
- [RFC 0002 — De-confounding](../rfcs/index.md)
- [RFC 0009 — Correção de assimetria sigma](../rfcs/index.md)
