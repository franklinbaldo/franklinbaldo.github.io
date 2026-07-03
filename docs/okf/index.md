---
type: Index
title: Hrönir
description: Sistema de avaliação par-a-par de posts do blog, com ranking OpenSkill e seleção de versões.
resource: ../../CLAUDE.md
tags: [hronir]
timestamp: 2026-07-03T00:00:00Z
---

# Hrönir

O Hrönir roda comparações par-a-par entre posts do blog (`src/content/blog/`),
com um avaliador (humano ou agente) atribuindo estrelas, resenhas e um
confronto a cada partida, sob a lente de uma **perspectiva de leitor**
sorteada. O placar acumulado (OpenSkill) ranqueia os posts; o pior ranqueado
recebe uma nova versão (draft), que passa a competir com a selecionada nos
duelos de versão.

## Mapa de conceitos

- [Sessão](./concepts/session.md) — a rodada de N matches que um agente conduz.
- [Match](./concepts/match.md) — uma partida par-a-par entre dois posts.
- [Rate file](./concepts/rate-file.md) — o registro de uma decisão, no schema `stars-v1`.
- [Ranking](./concepts/ranking.md) — como o placar OpenSkill é calculado a partir dos rate files.
- [Seleção de versões](./concepts/selection.md) — como o ranking decide qual versão de cada post é a publicada.
- [Perspectiva](./concepts/perspective.md) — a persona de leitor sorteada por match.

## Outras seções do bundle

- [CLI](./cli/index.md) — comandos do `hronir` e o fluxo de estados de uma sessão.
- [RFCs](./rfcs/index.md) — índice navegável das RFCs do projeto (fonte canônica de cada decisão).

## Fora do escopo deste bundle

Instruções operacionais passo a passo (como rodar uma sessão, flags exatas,
constraints de validação) vivem em [`CLAUDE.md`](../../CLAUDE.md) — este
bundle documenta os conceitos, não o procedimento.
