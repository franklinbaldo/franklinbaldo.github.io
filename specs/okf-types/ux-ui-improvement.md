---
type: okf-type-spec
filename: ux-ui-improvement.md
title: "OKF Type: ux-ui-improvement"
description: Contrato normativo dos nós do DAG de evolução UX/UI
resource: okf-type:ux-ui-improvement
tags: [okf, ux, ui, dag]
timestamp: "2026-10-10T00:00:00Z"
---

# OKF Type: `ux-ui-improvement`

Cada arquivo é um nó persistente e único. Links Markdown dos nós pais para os filhos formam arestas dirigidas. Identidades `id` permanecem estáveis em revisões e PRs.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `ux-ui-improvement` |
| `id` | string | Stable unique ID, e.g. `UX-BOOKS-001` |
| `title` | string | Human-readable subject |
| `status` | enum | `planned`, `active`, `in-review`, `done`, or `blocked` |
| `scope` | string | Routes or components affected |
| `priority` | enum | `high`, `medium`, or `low` |
| `objective` | string | Measurable or verifiable user outcome |
| `evidence` | array[string] | Concrete observations or source references |
| `reviewed_at` | date | Last material review date |
| `history` | array[string] | Audit trail of decisions, PRs, tests and outcomes |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `description` | string | Short summary |
| `parent_id` | string | Stable ancestor ID; must not point to itself |
| `depends_on` | array[string] | Dependency IDs, always acyclic |
| `pull_request` | string | GitHub PR URL when created |
| `outcome` | string | Observed post-merge result |

## Regras semânticas

O parser valida a estrutura; o agente verifica unicidade dos IDs, existência de pais e dependências, ausência de ciclos, evidências e critérios de aceite. Não marcar `done` antes da PR integrada e dos resultados verificados. O registro da melhoria não substitui testes nem screenshots.
