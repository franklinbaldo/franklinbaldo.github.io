---
date: 2026-05-14
slug: seo-ux-accessibility
branch: claude/trusting-fermi-IbmMb
status: pr-open
---

# Sessão 2026-05-14 — SEO, UX & Acessibilidade

## Contexto

Primeira sessão com o sistema `.routines/`. O blog estava bem estruturado
(OG images dinâmicas, JSON-LD, RSS, sitemap), mas com lacunas identificadas
num audit completo.

## O que foi feito nesta sessão

### PR aberto — dependabot #38
- `defu` 6.1.4 → 6.1.6 tem conflito de merge; não foi possível fazer merge.
  Ação: fechar manualmente e atualizar o lock file na próxima sessão.

### Melhorias implementadas (branch `claude/trusting-fermi-IbmMb`)

| Arquivo | Mudança |
|---------|---------|
| `src/components/Header.astro` | `aria-label` em todos os links de nav (acessibilidade WCAG 2.1) |
| `src/layouts/PageLayout.astro` | `twitter:site`, `twitter:creator`, `og:locale` dinâmico, `og:image:alt`, `twitter:image:alt` |
| `src/layouts/PageLayout.astro` | BreadcrumbList JSON-LD para artigos (Home > Blog > Post) |
| `src/layouts/PageLayout.astro` | Prop `lang` passada até o `<html lang>` |
| `src/content.config.ts` | Campo `lang: z.enum(['en','pt']).optional()` no schema |
| `src/pages/blog/[...slug].astro` | Passa `lang` do frontmatter para o layout |
| `public/robots.txt` | Criado: permite tudo, bloqueia `/og/`, aponta para sitemap |

### Por que cada mudança importa

- **aria-labels no nav**: leitores de tela anunciavam só o emoji — inútil sem label.
- **twitter:creator/site**: posts compartilhados no X não tinham atribuição ao autor.
- **og:locale dinâmico**: posts em PT eram indexados como `en_US` pelo Facebook/LinkedIn.
- **BreadcrumbList**: Google Search Console mostra breadcrumbs nos rich results; melhora CTR.
- **lang no HTML**: requisito de acessibilidade; posts em PT precisavam de `lang="pt"`.
- **robots.txt**: sem ele, crawlers não sabiam evitar `/og/` (imagens internas de OG).

## Próximas sessões — backlog priorizado

### Alta prioridade
1. **Table of Contents automático** para posts longos — usar headings rehypeSlug já
   existentes. Componente Astro que gera `<nav>` com âncoras dos H2/H3.
2. **Pagination em /archive/ e /tags/[tag]/** — carregar todos os posts de uma vez
   vai escalar mal; Astro suporta `paginate()` nativo.
3. **Related Posts** — ao final de cada post, mostrar 2-3 posts com tags em comum.
   Algoritmo simples: interseção de tags, ordenado por data.

### Média prioridade
4. **dependabot #38** — atualizar `defu` manualmente (npm update defu, commitar lock file).
5. **og:locale:alternate** — quando `lang=pt`, adicionar `<meta property="og:locale:alternate" content="en_US">`.
6. **wordCount no JSON-LD** — `minutesRead` já está disponível via remark plugin; passar
   para o BlogPosting schema.
7. **Caching para GitHub Projects** — `src/pages/projects.astro` faz fetch live; se
   a API falhar o build quebra. Adicionar fallback com dados cacheados.

### Baixa prioridade
8. **FAQ Schema** na página /about/.
9. **Focus management** nas transições de página (ClientRouter).
10. **Testar posts em PT** adicionando `lang: pt` no frontmatter dos posts PT existentes
    (e.g., `o-ovo-de-serpente.md`).

## Decisões arquiteturais

- **Não implementei pagination agora**: mudança com impacto maior, precisa de
  revisão de UX (infinita scroll vs. paginação clássica?).
- **`lang` como enum `['en','pt']`**: extensível para outros idiomas; simples de validar.
- **BreadcrumbList no layout, não no template**: evita duplicação se outros tipos de
  página quiserem breadcrumbs futuramente.
