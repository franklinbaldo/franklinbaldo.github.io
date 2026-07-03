---
type: Concept
title: Perspectiva
description: A persona de leitor sorteada para um match, cuja lente informa as estrelas, resenhas e o confronto.
resource: ../../../scripts/hronir/perspectives/
tags: [hronir, perspective]
timestamp: 2026-07-03T00:00:00Z
---

# Perspectiva

Cada [match](./match.md) sorteia uma perspectiva de leitor de
`scripts/hronir/perspectives/*.md` — uma persona com um jeito específico de
ler (o que valoriza, o que ignora, o que a irrita). O avaliador escreve as
resenhas e o confronto **através dessa lente**, não da própria. O
[ranking](./ranking.md) de-confunde o viés sistemático de cada perspectiva
(`π`) do score de qualidade do post.

## Perspectivas atuais

`applied-thinker`, `comedy-carries-argument`, `craft-listener`,
`curious-outsider`, `fact-checker`, `felt-not-explained`, `internet-native`,
`lateral-essayist`, `long-form-rationalist`, `lyric-as-poem`,
`meme-sommelier`, `returning-reader`, `skeptical-specialist`,
`weird-clarity`.

O id sorteado é registrado como `perspective_id` no
[rate file](./rate-file.md) do match.

## Ver também

- [Match](./match.md)
- [Ranking](./ranking.md) — de-confounding do viés `π` por perspectiva.
