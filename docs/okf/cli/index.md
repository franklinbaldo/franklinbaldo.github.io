---
type: CLI
title: Hrönir agent interface
description: A interface operacional do Hrönir é Markdown OKF validado por okf-parser; o antigo CLI Node foi removido.
resource: ../../hronir-agent-routine.md
tags: [hronir, okf, cli, agent]
timestamp: 2026-09-21T00:00:00Z
---

# Interface de agente Hrönir

O antigo binário `hronir` e os comandos `npm run hronir:*` foram retirados da
interface operacional.

## Fluxo canônico

```text
criar/editar avaliação .md
→ okf-parser check
→ ler OKF011
→ preencher/corrigir o Markdown
→ repetir até conformant: true
```

Novos registros usam `type: Hronir Evaluation`; o contrato está em
`specs/okf-types/hronir-evaluation.md`.

A execução canônica usa `uv run`:

```bash
uv run --with 'okf-parser @ git+https://github.com/franklinbaldo/okf-parser@3d4f31f41bca4aecb11a627f23900051f3f68685' \
  okf-parser check .routines/hronir/evaluations \
  --require-spec ../../../specs/okf-types/{slug}.md \
  --normative-spec
```

Não há sessão intermediária, `generate-match`, `submit-eval`, `decide` ou
`doctor`. O próprio arquivo é o estado.

## Compatibilidade

`Rate File` é o formato histórico e permanece legível. O TypeScript do site
pode consumir registros e calcular projeções públicas, mas não é autoridade de
escrita/validação.
