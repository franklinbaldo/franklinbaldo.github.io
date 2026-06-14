---
date: 2026-06-14T05:00:00
slug: lazy-images-perf
branch: claude/sleepy-pasteur-caw01l
status: pr-open
issues: [492]
pr_opened: null
pr_merged: null
---

## Contexto ao chegar

Run autônoma de 2026-06-14. PR #497 (`ux(print): CSS completo para impressão de ensaios`, fecha #246) estava fechado como merged (`2026-06-13T06:05:08Z`) — sem PR de rotina pendente para mergear.

Backlog com 10 issues `routine` abertas — dentro da faixa 10–20. Nenhuma reposição necessária.

Issues `priority:media` abertas: #493 (scroll spy TOC), #492 (lazy loading), #248 (reading path Memory and Funes), #243 (Goodreads rail), #242 (reading path Direito e IA).

## O que fiz

Implementei issue **#492 — perf: lazy loading de imagens em posts**.

Auditoria mostrou:
- Hero images e music covers em `src/pages/blog/[...slug].astro` já usam o `<Image>` do Astro com `loading="eager"` — corretos, não afetados.
- Imagens renderizadas do corpo markdown (sintaxe `![alt](src)`) não tinham `loading` — eram `<img>` sem atributo, carregando todas no load inicial.

Solução: rehype plugin inline `rehypeLazyImages` adicionado a `astro.config.mjs`, no bloco `markdown.rehypePlugins`, após `rehypeWrapTables`. O plugin percorre a hast tree recursivamente e injeta `loading="lazy"` em todo elemento `img` sem atributo `loading` já definido.

A abordagem é zero-dependency (sem novo pacote), preserva `loading="eager"` onde explicitamente definido, e não tem impacto visual algum — só muda o comportamento de carregamento.

Checks locais:
- `npm run build`: 2417 páginas, 0 erros ✓
- `npx astro check`: 0 errors ✓
- `npx prettier --check .`: All matched files use Prettier code style ✓
- Verificação no HTML gerado: hero images mantêm `loading="eager"`; imagens de conteúdo recebem `loading="lazy"` ✓

## O que ficou para a próxima run

- Mergear este PR se CI verde e sem comentário bloqueante de Franklin.
- Continuar com issues de prioridade média: #493 (scroll spy TOC), #248, #243, #242.
- Não há screenshot de prod a verificar desta run — mudança é de atributo HTML, sem impacto visual.
