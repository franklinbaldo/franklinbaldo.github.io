---
type: CLI
title: hronir CLI
description: Comandos do CLI hronir e o fluxo de estados de uma sessão de avaliação.
resource: ../../../scripts/hronir/README.md
tags: [hronir, cli]
timestamp: 2026-07-03T00:00:00Z
---

# hronir CLI

Registrado como o bin `hronir` (`package.json`), exposto também via scripts
`npm run hronir:*`. Não-interativo por design (rodado por agentes) — nunca
lê `stdin` nem pede confirmação em tela.

## Comandos principais

| Comando                        | Função                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `init`                         | Cria a [sessão](../concepts/session.md); `--agent-id` obrigatório.                                 |
| `continue`                     | Avança o estado: imprime post A, depois post B de um [match](../concepts/match.md).                |
| `decide`                       | Registra a decisão; produz um [rate file](../concepts/rate-file.md).                               |
| `ranking`                      | Score acumulado — ver [ranking](../concepts/ranking.md).                                           |
| `worst`                        | Post pior ranqueado (por `ordinal`, ou `--absolute` para `stars`).                                 |
| `diagnose`                     | Leitura pura: de-confounding, vieses `α`/`π`, líder por [perspectiva](../concepts/perspective.md). |
| `draft-worst` / `draft-commit` | Cria e registra uma nova versão do post pior ranqueado (RFC 0010).                                 |
| `select`                       | Recomputa a [seleção de versões](../concepts/selection.md); único escritor do manifesto.           |
| `prune`                        | Remove versões perdedoras elegíveis.                                                               |
| `doctor`                       | Valida inconsistências; usado no CI.                                                               |

Lista completa e flags em `scripts/hronir/README.md` e `CLAUDE.md`.

## Fluxo de uma sessão

```
init → continue → continue → decide → continue → … → need_edit
  → draft-worst → [edição manual] → draft-commit → select
```

## Ver também

- [Sessão](../concepts/session.md)
- [Match](../concepts/match.md)
