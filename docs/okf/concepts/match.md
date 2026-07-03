---
type: Concept
title: Match
description: Uma partida par-a-par entre dois posts (ou duas versões do mesmo post), decidida por estrelas atribuídas pelo avaliador.
resource: ../../../src/hronir/matches.ts
tags: [hronir, match]
timestamp: 2026-07-03T00:00:00Z
---

# Match

Um match compara dois posts — identificados por `key` (o `translationKey`
do post), `path` e `version` (UUIDv5 do conteúdo) — sob uma
[perspectiva](./perspective.md) sorteada. Quando `key` é igual dos dois
lados, é um **duelo de versão** (RFC 0010): compara duas versões
(`v-<timestamp>.md`) do mesmo post, e o resultado alimenta a
[seleção](./selection.md), não o ranking de qualidade entre posts distintos.

O vencedor é derivado mecanicamente — quem recebeu mais estrelas
(`rate_a` vs `rate_b`), sem input adicional do avaliador. O registro
completo da decisão é um [rate file](./rate-file.md).

## Amostragem

Os dois posts de um match são escolhidos por **active sampling**, com viés
configurável via `--objective` (`coverage`, `refine-top`, `hunt-worst`;
RFC 0013 §8) — não é uma escolha aleatória uniforme.

## Ver também

- [Sessão](./session.md)
- [Rate file](./rate-file.md)
- [Perspectiva](./perspective.md)
