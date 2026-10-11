---
type: ux-ui-improvement
title: Evolução contínua de UX/UI
description: Raiz do DAG de experiência do blog e das páginas extras
id: UX-ROOT
status: active
scope: entire-site
priority: high
objective: Tornar a navegação e as experiências do site mais bonitas, úteis e acessíveis sem perder desempenho nem identidade editorial.
evidence:
  - "Código: src/layouts/PageLayout.astro e páginas independentes em public/."
reviewed_at: "2026-10-11"
history:
  - "2026-10-10: DAG inicial criado a partir do código atual e da rotina existente."
  - "2026-10-11: raiz movida de index.md reservado para root.md, respeitando o parser OKF pinado."
---

# Evolução contínua de UX/UI

Arestas dirigidas deste DAG: **nó pai → nó filho** por links Markdown, percorríveis com `okf-parser graph knowledge/ux-ui`. `parent_id` é referência de identidade, não link de retorno. Nunca inserir links de um filho para seu ancestral; dependências devem sempre apontar para etapas anteriores, sem ciclos.

- [Experiência de leitura](./reading.md)
- [Navegação e descoberta](./navigation.md)
- [Linguagem visual e componentes](./design-system.md)
- [Páginas extras e laboratórios](./extra-pages.md)

Cada nó tem identificador estável, escopo, objetivo, evidências, prioridade, histórico e status; criar filhos só quando uma decisão de produto exigir uma intervenção concreta. Antes de expandir, verificar PRs abertas, código atual e registros existentes. O estado está nos arquivos OKF; issues e PRs são artefatos de execução, não a memória canônica.

Comandos: `npm run ux:check`, `npm run ux:graph`. A especificação normativa está em [ux-ui-improvement](../../specs/okf-types/ux-ui-improvement.md).
