---
date: "2026-06-27T05:09:23Z"
branch: claude/sleepy-pasteur-fsgb5n
status: pr-open
issues: [758]
pr_opened: null
pr_merged: null
---

# Run autônoma — 2026-06-27

## Contexto ao chegar

Nenhum PR `routine` aberto para mergear — o último (PR #785, preconnect para suno.com) foi mergeado ontem (2026-06-26T08:04). Backlog com 13 issues abertas com label `routine`, dentro da faixa saudável de 10–20. Dois itens com `priority:media`: #764 (Lighthouse CI) e #758 (related posts).

## O que foi feito

Escolhi o issue #758 (ux/discovery: related posts section no rodapé de posts) por ser o de maior impacto para o leitor. O componente `RelatedPosts.astro` já existia e estava wired nos dois slug pages (EN e PT), mas faltavam os detalhes pedidos no issue:

### Melhorias no `src/components/RelatedPosts.astro`
- **Data**: cada card agora mostra a data do post formatada na locale correta (en ou pt-BR)
- **Trecho**: descrição truncada em 120 chars com reticências (antes mostrava a descrição completa)
- **Tags em comum**: exibe os hashtags compartilhados entre o post atual e o relacionado
- **Threshold mínimo de 2**: seção só renderiza se houver ≥ 2 posts relacionados (antes mostrava com 1+)
- **Variável renomeada**: `shared` (count) → `sharedTags` (array completo), eliminando também o shadow da importação `t` da i18n

### Atualização dos strings i18n em `src/lib/i18n.ts`
- EN: "Related posts" → "You might also like"  
- PT: "Posts relacionados" → "Você também pode gostar"

### Artefatos gerados atualizados
- `src/generated/ranking-snapshot.json`: regenerado com dados das sessões Hrönir recentes (856 duelos vs 333 anteriores)
- `src/generated/versions-selected.json`: seleção de versões atualizada

## Verificação local
- `npm run build`: 3121 páginas, 0 erros
- `npx astro check`: 0 erros, 0 warnings
- `npx prettier --check .`: verde
- `npm test`: 39/39 pass
- `npm run hronir:doctor`: 0 inconsistências

## O que fica pra próxima run

- Verificar o screenshot de produção da seção "You might also like" em algum post com ≥ 2 posts relacionados por tag
- Avaliar issue #764 (Lighthouse CI) para a próxima run
