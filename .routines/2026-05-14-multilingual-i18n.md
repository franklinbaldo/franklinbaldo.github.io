---
date: 2026-05-14
slug: multilingual-i18n
branch: claude/gallant-gates-MCyCa
status: pr-open
session: 2
---

# Sessão 2026-05-14 — Multilingual / i18n

## Contexto

Segunda sessão com o sistema `.routines/`. Chegou com PR #65 aberto (SEO, acessibilidade).
Objetivo principal: sistema multilingual (EN padrão, PT-BR em todo post/página, UI serve conforme preferência do usuário).

## O que foi feito nesta sessão

### Merge de PR aberta
- **PR #65** (SEO/acessibilidade) — todas as CI checks verdes → squash merge realizado.
- **PR #38** (dependabot defu) — mantida aberta (conflito de merge; baixa prioridade).

### Infraestrutura multilingual (branch `claude/gallant-gates-MCyCa`)

| Arquivo | Mudança |
|---------|---------|
| `src/content.config.ts` | Campo `translationKey: z.string().optional()` para parear posts traduzidos |
| `src/lib/i18n.ts` | **Novo** — dicionário de strings de UI em EN e PT; helper `t(lang, key)` e `detectLang()` |
| `src/components/LanguageSwitcher.svelte` | **Novo** — botão de flag (🇧🇷/🇺🇸) com Svelte 5 runes; persiste em `localStorage.lang`; auto-redireciona via `window.__translationHref` quando preferência ≠ lang do post e tradução existe |
| `src/components/Header.astro` | Inclui `<LanguageSwitcher client:idle />` ao lado do ThemeToggle |
| `src/layouts/PageLayout.astro` | Prop `translationHref?: string`; injeta `window.__translationHref`; tags `<link rel="alternate" hreflang>` para SEO |
| `src/pages/blog/[...slug].astro` | Lê `translationKey` do frontmatter; busca post parceiro na coleção; passa `translationHref` ao layout |
| `src/pages/blog/[...slug].astro` | Link "🇧🇷 Ler em Português" / "🇺🇸 Read in English" no footer do post quando tradução existe |
| `src/components/PostCard.astro` | Badge `🇧🇷 PT` nos cards de posts em PT; data formatada em `pt-BR` para posts PT |
| Posts (29 arquivos) | `lang: pt` ou `lang: en` adicionado ao frontmatter de todos os posts |

### Por que cada mudança importa

- **i18n.ts**: single source of truth para strings; evita hardcode espalhado em múltiplos componentes.
- **LanguageSwitcher**: UX mínima sem recarregar página; o botão grayed-out quando não há tradução sinaliza isso sem confundir.
- **translationKey**: permite parear posts futuros sem mudar URLs (a sessão de criação de conteúdo traduzido usará isso).
- **hreflang**: Google Search Console usa para servir versão correta por país; essencial para indexação PT-BR vs EN.
- **lang badge no PostCard**: permite ao usuário no índice/arquivo escanear qual língua é cada post antes de clicar.
- **data pt-BR**: datas como "14 de maio de 2026" nos posts PT melhoram coerência de leitura.

## Estratégia i18n adotada

Pesquisa realizada sobre recomendações de Astro, Svelte e Pico CSS para i18n:
- **Não usamos o roteamento i18n do Astro** (`/en/`, `/pt/`): o projeto está em SSG (GitHub Pages); a reestruturação de rotas seria destrutiva e desnecessária.
- **URL-agnóstica por idioma**: EN posts em `/blog/slug/`, PT posts em `/blog/slug-pt/` — sem prefixo de locale na URL. Pares ligados por `translationKey`.
- **Strings de UI via `i18n.ts`**: objeto simples, sem biblioteca pesada (svelte-i18n, paraglide, etc.).
- **Preferência via localStorage**: segue o mesmo padrão do ThemeToggle já existente.

## Estado atual

- Todo post existente tem `lang: pt` ou `lang: en` no frontmatter.
- Nenhum par de tradução criado ainda (`translationKey` configurado mas não usado) — a infraestrutura está pronta.
- Build bem-sucedido: 131 páginas sem erros.

## Próximas sessões — backlog priorizado

### Alta prioridade
1. **Criar traduções de posts EN → PT** (ou PT → EN): usar `translationKey` para parear. Começar pelos posts mais recentes/lidos. Cada tradução = nova entrada na coleção com slug diferente.
2. **Versões PT das páginas estáticas** (`/about/`, `/index/`): criar `src/pages/pt/about.astro` e `src/pages/pt/index.astro` com conteúdo traduzido; LanguageSwitcher navega entre elas.
3. **Table of Contents** para posts longos — backlog desde sessão anterior.

### Média prioridade
4. **Pagination** em `/archive/` e `/tags/[tag]/` (Astro `paginate()`).
5. **Related Posts** ao fim de cada post (interseção de tags).
6. **dependabot #38** — atualizar `defu` manualmente.

### Baixa prioridade
7. **Filtro de língua no índice/arquivo**: checkbox EN/PT para filtrar posts por idioma.
8. **og:locale:alternate** quando `lang=pt`.
9. **wordCount no JSON-LD** (minutesRead já disponível).

## Decisões arquiteturais

- **`window.__translationHref` pattern**: evita threading de props Astro → Header → Svelte. Seguimos o mesmo padrão do `data-theme` do ThemeToggle.
- **Auto-redirect com `sessionStorage`**: redireciona uma vez por sessão (se preferência ≠ lang do post e tradução existe), mas não bloqueia se o usuário navegar de volta.
- **Svelte 5 runes** (`$state`, `$derived`): consistente com ThemeToggle existente.
