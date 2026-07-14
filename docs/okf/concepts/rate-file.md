---
type: Data Schema
title: Rate file
description: Registro de uma decisão de match — schema stars-v1, um arquivo Markdown por partida, committed em .routines/hronir/rates/.
resource: ../../../.routines/hronir/rates/
tags: [hronir, rate-file, schema]
timestamp: 2026-07-03T00:00:00Z
---

# Rate file

Cada [match](./match.md) decidido produz um arquivo Markdown em
`.routines/hronir/rates/<run_id>_<keyA>_x_<keyB>.md`, front-matter apenas
(corpo vazio). O schema é identificado pelo campo `prompt_version` (hoje
`stars-v3`; a família é conhecida como **`stars-v1`** por convenção de
nomeação de schema do repo — ver `CLAUDE.md` §"Padrão para dados
persistidos"). Rate files são **imutáveis** por convenção: o guardrail de CI
("Rate file deletion guard") bloqueia deleção, exceto para remover uma
avaliação de uma versão publicada por engano.

Desde a RFC 0014 (r1), todo rate file carrega literalmente `type: Rate File`
no front-matter — o campo obrigatório do OKF, escrito pelo CLI em toda
decisão nova e retroagido aos 1764 arquivos já existentes.

## Campos principais

| Campo                                     | Descrição                                                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `type`                                    | `"Rate File"` — classificação OKF (RFC 0014).                                                         |
| `run_id`, `run_at`                        | Identidade e timestamp da rodada.                                                                     |
| `post_a` / `post_b`                       | `key`, `path`, `display_lang`, `content_lang`, `version` (UUIDv5), `ref`.                             |
| `winner`                                  | `"a"` ou `"b"` — derivado das estrelas, não escolhido diretamente.                                    |
| `agent_id`                                | Identidade do avaliador (RFC-obrigatório, flui de `--agent-id`).                                      |
| `perspective_id`                          | A [perspectiva](./perspective.md) sorteada para o match.                                              |
| `eval_lang` / `review_lang`               | Língua da sessão / língua das reviews e do clash (RFC 0012 §6).                                       |
| `objective`                               | Viés de amostragem do match (RFC 0013 §8).                                                            |
| `evaluator_mood` / `evaluator_mood_after` | Estado do avaliador antes e depois da decisão; `mood_glyph` é o glifo sorteado que informa o "after". |
| `impression_a` / `impression_b`           | Legado (RFC 0016): sempre `null` em arquivos novos; preenchidos só em rate files antigos.             |
| `rate_a` / `rate_b`                       | Estrelas 1.00–5.00, sem empate.                                                                       |
| `review_a` / `review_b`                   | Resenha de cada post, ≥100 palavras, na `review_lang`.                                                |
| `clash`                                   | Confronto narrativo entre os dois posts, ≥100 palavras.                                               |

## Ver também

- [Match](./match.md)
- [Ranking](./ranking.md) — consome todos os rate files preenchidos.
