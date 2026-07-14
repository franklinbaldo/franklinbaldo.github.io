---
type: Concept
title: Sessão
description: Uma rodada de N matches conduzida por um agente ou humano identificado por agent-id.
resource: ../../../src/hronir/commands.ts
tags: [hronir, session]
timestamp: 2026-07-03T00:00:00Z
---

# Sessão

Uma sessão é uma rodada de avaliação: um agente roda `hronir init
--agent-id <id> --matches N`, e o CLI conduz N [matches](./match.md) em
sequência, cada um sob uma [perspectiva](./perspective.md) sorteada. O estado
da rodada ativa vive em `hronir_session.json`, tracked no git de propósito —
sinaliza que uma rodada está em andamento e o `hronir doctor` reclama se
existir uma sessão aberta sem trabalho recente.

## Máquina de estados

```
ready_for_next → deciding → ready_for_next → …
  → need_edit → (sessão fechada)
```

Cada match consome os passos `continue` (lê post A, depois post B) e
`decide` (registra a decisão, que produz um [rate file](./rate-file.md)).
Depois do N-ésimo match, a sessão entra em `need_edit`: o post pior
ranqueado (ver [ranking](./ranking.md)) recebe uma nova versão via
`draft-worst`/`draft-commit` (RFC 0010), a menos que a sessão tenha sido
iniciada com `--skip-edit`.

## Identidade do avaliador

`--agent-id` é obrigatório e flui, verbatim, para a mensagem de commit
(`hronir: N matches — <agent-id>`) e para o campo `agent_id` de cada
[rate file](./rate-file.md) que a sessão produz.

## Ver também

- [Match](./match.md)
- [Rate file](./rate-file.md)
- [CLI](../cli/index.md)
