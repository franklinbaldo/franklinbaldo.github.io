---
type: ux-ui-improvement
title: Resiliência e affordance da estante de livros
description: Estados vazios e controles confiáveis na biblioteca EN/PT
id: UX-BOOKS-001
parent_id: UX-EXTRAS
status: in-review
scope: /books/ and /pt/livros/
priority: high
objective: Evitar que um catálogo vazio pareça uma tela quebrada e manter filtros funcionais após navegação interna.
evidence:
  - "Antes: BooksPage.astro só renderizava controles para books.length > 0, mas o script acessava grid e sortSelect sem guardas."
  - "Antes: o script só fazia bind na primeira execução; PageLayout.astro usa Astro ClientRouter."
  - "Antes: cartões respondiam visualmente a hover, mas não a focus-within."
reviewed_at: "2026-10-10"
history:
  - "2026-10-10: selecionado como primeiro filho acionável. Fallback PT/EN, rebinding, foco e reduced-motion implementados no branch de PR."
---

# UX-BOOKS-001

**Decisão:** conservar a estante atual e recuperar os estados de falha/vazio com orientação clara e acesso ao Goodreads. Uma estante apenas com livros abaixo de 4 estrelas também precisa explicar por que a aba Favoritos está vazia. Filtros são reinicializados a cada nova visita do ClientRouter, sem múltiplos listeners no mesmo DOM.

**Verificação:** `npm run build`, `npx astro check`, `npx prettier --check .`; depois conferir teclado, Favoritos/Todos, mudança de ordenação, ida e volta entre rotas e ausência de feed em EN/PT. Não declarar testes de navegador executados antes de realmente executá-los.

**Próximo aprofundamento:** teste de fluxo com Playwright e comparação visual de estados claros/escuros em celular.
