---
date: 2026-05-14
slug: pt-pages-lang-filter
branch: claude/affectionate-dirac-S75Iu
status: pr-open
session: 3
---

# Sessão 2026-05-14 — Páginas PT estáticas e filtro de idioma

## Contexto

Terceira sessão com o sistema `.routines/`. Chegou com PR #66 aberto
(infraestrutura multilingual: LanguageSwitcher, i18n.ts, todos os posts tagueados).
Objetivo: completar a cobertura multilingual com páginas estáticas PT e filtro de
idioma no índice e arquivo.

## O que foi feito nesta sessão

### Merge de PR aberta

- **PR #66** (multilingual infrastructure) — merge squash realizado.
- **PR #38** (dependabot defu) — mantida aberta (conflito de merge; baixa prioridade).

### Implementações nesta branch (`claude/affectionate-dirac-S75Iu`)

| Arquivo                            | Mudança                                                                                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/LangFilter.svelte` | **Novo** — filtro All / 🇺🇸 EN / 🇧🇷 PT com Svelte 5 runes; persiste preferência em `localStorage.lang`; aplica `display:none` em `[data-post-lang]` |
| `src/components/PostCard.astro`    | `data-post-lang={postLang}` no `<article>` — permite que LangFilter filtre cards                                                                   |
| `src/pages/index.astro`            | `translationHref="/pt/"` no PageLayout + `<LangFilter client:load />`                                                                              |
| `src/pages/about.mdx`              | `lang: en` e `translationHref: /pt/about/` no frontmatter                                                                                          |
| `src/pages/archive.astro`          | `<LangFilter client:load />` + `data-post-lang` em cada `<li>` + flag 🇧🇷 nos posts PT                                                              |
| `src/pages/pt/index.astro`         | **Novo** — homepage em PT (`lang="pt"`, `translationHref="/"`, hero em português)                                                                  |
| `src/pages/pt/about.astro`         | **Novo** — página sobre em PT (`lang="pt"`, `translationHref="/about/"`)                                                                           |

### Por que cada mudança importa

- **LangFilter**: usuários PT chegam ao índice via auto-redirect do LanguageSwitcher, veem
  posts filtrados por preferência sem clicar em nada — UX de zero fricção.
- **data-post-lang no PostCard**: sem este atributo o LangFilter não tem âncora no DOM.
- **translationHref nas páginas estáticas**: sem isso o LanguageSwitcher ficava grayed-out
  (sem tradução) em `/` e `/about/` — agora navega corretamente entre os pares.
- **PT pages (`/pt/`, `/pt/about/`)**: completam o requisito "todo post e página tem versão
  PT-BR". `lang="pt"` dispara o auto-redirect do LanguageSwitcher para usuários PT.
- **hreflang em pares**: todas as 4 páginas estáticas (/, /pt/, /about/, /pt/about/)
  têm `<link rel="alternate" hreflang>` cruzados — Google Search Console servirá a versão
  correta por região.
- **Flag 🇧🇷 no archive**: permite escanear visualmente o idioma antes de clicar, sem
  ocupar espaço de coluna extra.

## Estado atual do sistema multilingual

- [x] LanguageSwitcher com auto-redirect e localStorage (PR #66)
- [x] Todos os posts tagueados com `lang: en` ou `lang: pt` (PR #66)
- [x] Infraestrutura `translationKey` para pares de tradução (PR #66)
- [x] Filtro de idioma em `/` e `/archive/` (esta sessão)
- [x] Páginas estáticas `/pt/` e `/pt/about/` (esta sessão)
- [ ] Traduções reais de posts (translationKey ainda sem uso)
- [ ] Filtro de idioma em `/tags/` e `/search/`
- [ ] PT versions of `/archive/` e `/tags/`

## Próximas sessões — backlog priorizado

### Alta prioridade

1. **Criar pares de tradução de posts** — usar `translationKey` para linkar. Começar
   pelos 3 posts mais recentes em EN (The Agent That Doesn't Invent Verbs,
   Pierre Menard, The Three Imperatives). Cada tradução = novo arquivo `.md` com slug PT.
2. **Table of Contents** para posts longos — headings via rehypeSlug já existem;
   componente Astro que gera `<nav>` com âncoras de H2/H3.
3. **Related Posts** ao fim de cada post — interseção de tags, ordenado por data.

### Média prioridade

4. **LangFilter em /tags/ e /search/** — consistência UX.
5. **PT version de /archive/** — URL `/pt/archive/` com textos em PT.
6. **Pagination** em `/archive/` e `/tags/[tag]/` (Astro `paginate()`).
7. **dependabot #38** — atualizar `defu` manualmente (baixo risco).

### Baixa prioridade

8. **og:locale:alternate** quando `lang=pt`.
9. **wordCount no JSON-LD** (minutesRead já disponível).
10. **FAQ Schema** na /about/ e /pt/about/.
11. **Focus management** nas transições de página (ClientRouter).

## Decisões arquiteturais

- **`client:load` vs `client:idle` para LangFilter**: usamos `client:load` para aplicar o
  filtro sem flash perceptível. `client:idle` causaria flash pois hidrataria só quando o
  browser estivesse ocioso — posts PT apareceriam brevemente antes de serem escondidos.
- **CSS `display:none` vs remoção do DOM**: `display:none` é mais simples e não causa
  reflow pesado; Svelte gerencia o estado, HTML mantém todos os artigos no DOM.
- **`data-post-lang` no article do PostCard**: seguiu o padrão de `data-theme` no ThemeToggle
  — atributos `data-*` como ponte entre Astro (SSR) e Svelte (CSR).
- **PT páginas como `.astro`, não `.mdx`**: páginas `.astro` permitem passar `translationHref`
  diretamente como prop, sem depender do parsing de frontmatter MDX.
- **`/pt/about/` como .astro inline**: conteúdo suficientemente curto para não precisar de
  arquivo `.md` separado; mantém coerência com `/pt/index.astro`.
