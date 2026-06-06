---
date: 2026-06-06T14:00:00
slug: font-inter-optional-backlog-restock
branch: claude/sleepy-pasteur-Jkm3y
status: pr-open
issues: [237]
pr_opened: null
pr_merged: null
---

# Sessão 2026-06-06 — font-display: optional para Inter + reabastecimento do backlog

## Contexto ao chegar

Trigésima-segunda sessão. Branch designado: `claude/sleepy-pasteur-Jkm3y`.

Estado ao chegar:
- **0 issues `routine` abertas** — backlog zerado, abaixo do mínimo de 10
- **1 PR aberto**: #236 (hronir: run 2026-06-06, não é meu)
- Sessão anterior (#31, 2026-06-05): dual RSS footer, Web App Manifest, PostCard i18n, PageLayout description PT
- Último commit em `main`: `b17df52` (merge PR #222, claude/keen-franklin-DKo9I)

Sem PR routine pendente para mergear.

## Reabastecimento do backlog

Backlog zerado exigiu pensar estrategicamente no futuro do blog. Analisei:
- Estrutura atual: ~66 posts bilíngues EN/PT, Astro + Pico.css, SSG no GitHub Pages
- Componentes: ranking hronir, reading paths (2 trilhas), search pagefind, OG images Satori
- Gaps identificados: font-display, i18n webmentions, pagefind warnings, archive navegação, taxonomia

**15 issues criadas (#237–#251):**

| # | Título | Prioridade |
|---|--------|-----------|
| 237 | Font Inter font-display: optional (LCP/FOUT) | alta |
| 238 | Webmentions i18n — labels EN em posts PT | alta |
| 239 | Pagefind indexando RSS/sitemap — warnings PT | alta |
| 240 | Archive: colapsar anos antigos por default | alta |
| 241 | Taxonomia de tipo de documento (essay/letter/fiction) | alta |
| 242 | Novo reading path "Law and AI" | media |
| 243 | Livros recentes no HomeAuthorRail | media |
| 244 | RSS atom:link rel="self" | media |
| 245 | Indicador de progresso de leitura em posts longos | media |
| 246 | Print CSS para ensaios | media |
| 247 | Tags page: nuvem visual | media |
| 248 | Atualizar reading path "Memory and Funes" | media |
| 249 | Preload Inter 400 WOFF2 | baixa |
| 250 | OG image audit para paths pages | baixa |
| 251 | Verificar skip-to-content em páginas PT | baixa |

## Trabalho executado: issue #237 — font-display: optional para Inter

### Problema
`@import "@fontsource/inter/400.css"` (e 600, 700) em `global.css` injeta `@font-face { font-display: swap }`. Isso causa FOUT — o texto aparece brevemente em fallback antes de a fonte carregar. Penaliza CLS no Lighthouse e é visualmente ruidoso para um blog editorial.

### Solução
Substituí os 3 `@import "@fontsource/inter/*.css"` por 3 declarações `@font-face` manuais com:
- `font-display: optional` (zero FOUT; fonte só aplica se já em cache)
- Apenas o subset Latin (suficiente para EN + PT — caracteres PT estão todos em U+0000-00FF)
- Arquivos WOFF2 copiados para `public/fonts/` (3 × 24KB = 72KB)

**Vantagem extra**: O subset Latin reduz o número de `@font-face` de 18 (6 subsets × 3 weights) para 3, diminuindo o overhead de CSS parsing.

### Arquivos modificados
- `src/styles/global.css` — substituição dos imports por @font-face com font-display: optional
- `public/fonts/inter-latin-400-normal.woff2` — novo (24KB)
- `public/fonts/inter-latin-600-normal.woff2` — novo (24KB)
- `public/fonts/inter-latin-700-normal.woff2` — novo (24KB)

### Verificação
- `npm run build`: 376 páginas construídas, 0 erros ✅
- `npx astro check`: 0 erros, 0 warnings ✅
- `npx prettier --check .`: All matched files use Prettier code style ✅
- CSS bundlado confirmado: `font-display:optional` presente em `dist/_astro/PageLayout.*.css` ✅
- Arquivos de fonte em `dist/fonts/` ✅

### Nota sobre Fraunces
`@fontsource/fraunces` em `typography.css` tem o mesmo problema. Não foi incluído nesta run — scope de uma issue por run.

## Plano para próximas sessões

Por prioridade:
1. **#238**: Webmentions i18n — labels EN hardcoded em componente usado em posts PT
2. **#239**: Pagefind warnings — fix do build noise para não mascarar erros reais
3. **#240**: Archive collapse — UX degradando com 90+ posts
4. **#241**: Taxonomia de tipo de documento

## Decisões arquiteturais

- **font-display: optional vs swap**: `swap` garante que a fonte sempre aparece mas causa FOUT; `optional` é mais correto para web editorial onde o conteúdo importa mais que a tipografia na primeira visita. Em revisitas, o cache resolve. A troca vale.

- **Subset Latin apenas**: O blog é EN/PT. Nenhum post usa cirílico, grego ou vietnamita. Remover subsets desnecessários é higiene, não risco. Caso surja conteúdo nessas línguas, re-adicionar o subset é trivial.

- **Copiar para `public/fonts/` vs referenciar `node_modules`**: `public/` é a única opção confiável — URLs de node_modules não são resolvidas em CSS @font-face escrito manualmente (Vite resolve URLs relativas dentro dos CSS processados do próprio package, não em CSS externo).

---

_Sessão: 2026-06-06 | Branch: `claude/sleepy-pasteur-Jkm3y` | franklinbaldo@gmail.com_
