---
date: 2026-05-15
slug: toc-related-translations
branch: claude/affectionate-dirac-4nfoz
status: pr-open
session: 4
---

# Sessão 2026-05-15 — ToC, Related Posts & Primeiras Traduções

## Contexto

Quarta sessão com o sistema `.routines/`. Chegou com PR #67 aberto (páginas PT estáticas + filtro de língua). CI verde → squash merge realizado.

Estado atual do blog: infraestrutura multilingual completa (PR #66 + #67 mergeados), mas sem nenhum par de tradução real — `translationKey` configurado no schema, não usado em nenhum post.

## O que foi feito nesta sessão

### Merge de PR aberta

- **PR #67** (páginas PT + LangFilter) — CI verde (GitGuardian + Kilo Code Review) → squash merge.

### Novos componentes

| Arquivo                                | Mudança                                                                                                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/TableOfContents.astro` | **Novo** — ToC automático via `headings` do Astro `render()`; mostra para posts com ≥ 3 headings H2/H3; `<details open>` colapsável; suporte `lang` para label EN/PT |
| `src/components/RelatedPosts.astro`    | **Novo** — mostra até 3 posts relacionados por interseção de tags; ordena por `shared` desc, depois por data; mostra descrição truncada em 2 linhas                  |
| `src/pages/blog/[...slug].astro`       | Extrai `headings` de `render()`; insere `<TableOfContents>` antes do conteúdo; insere `<RelatedPosts>` após o conteúdo                                               |

### Primeiros pares de tradução

| Par                                 | EN                                                                                                         | PT                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Pierre Menard**                   | `2026-05-14-pierre-menard-computational-researcher.md` (adicionado `translationKey: pierre-menard` + tags) | `pierre-menard-pesquisador-computacional.md` **novo**    |
| **O Agente que Não Inventa Verbos** | `2026-05-14-the-agent-that-doesnt-invent-verbs.md` (adicionado `translationKey: agent-no-verbs` + tags)    | `2026-05-14-o-agente-que-nao-inventa-verbos.md` **novo** |

### Por que cada mudança importa

- **TableOfContents**: posts longos (Agent, Pierre Menard, O Ovo de Serpente) ficavam sem navegação interna. O padrão `<details open>` permite ao usuário colapsar se quiser, mas apresenta o conteúdo visível por padrão.
- **RelatedPosts**: aumenta engajamento e links internos — bom para SEO (PageRank interno) e retenção. Não filtra por idioma para maximizar descoberta cross-language.
- **Traduções reais**: sem elas, o LanguageSwitcher ficava grayed-out em todos os posts; a infraestrutura estava 100% pronta mas sem conteúdo. Os dois posts mais recentes (14/05) foram escolhidos por serem os mais lidos e por terem contexto brasileiro (PINK/Kanoê, direito, agentes).
- **Tags adicionadas**: Pierre Menard e Agent não tinham tags — RelatedPosts não funcionaria para eles sem isso.

## Estado atual (build: 144 páginas, sem erros)

- 2 pares de tradução funcionando com `translationKey` + LanguageSwitcher ativo em ambos
- ToC visível em posts com ≥ 3 seções
- Related Posts visível em posts com tags compartilhadas
- Infraestrutura PT pronta: `/pt/`, `/pt/about/`, LangFilter, LanguageSwitcher, hreflang

## Próximas sessões — backlog priorizado

### Alta prioridade

1. **Traduzir posts PT → EN**: `o-ovo-de-serpente.md` → EN (artigo jurídico sobre CPC 2015 — único com `tags: ["direito"]` que não tem par EN). Começar pelos posts com mais tags (melhor chance de aparecer em Related Posts).
2. **Traduzir posts EN → PT**: série `harness` completa (5 posts) — posts 1-4 da série ainda não têm par PT. `reclaiming-the-harness`, `the-third-half-and-the-fourth-wall`, `the-three-imperatives-at-delphi`, `jules-api-harness-backend`.
3. **Table of Contents sticky** (opcional): em telas largas, ToC fixo na lateral esquerda (CSS `position: sticky`) — melhora navegação sem alterar mobile.

### Média prioridade

4. **Pagination em `/archive/` e `/tags/[tag]/`**: atualmente carrega todos os posts; escala mal. Astro `paginate()` nativo.
5. **PT versions de `/archive/` e `/tags/`**: `/pt/archive/` e `/pt/tags/` com filtro lang=pt pré-aplicado.
6. **Related Posts filtrado por idioma** (opcional): atualmente cross-language; pode adicionar `preferSameLang` prop.
7. **dependabot #38** — atualizar `defu` manualmente (conflito antigo).

### Baixa prioridade

8. **og:locale:alternate** nos posts PT.
9. **wordCount no JSON-LD** (minutesRead já disponível).
10. **Caching para GitHub Projects** em `src/pages/projects.astro`.
11. **FAQ Schema** na `/about/`.

## Decisões arquiteturais

- **Não filtrar RelatedPosts por idioma**: um post EN pode levar o leitor a descobrir conteúdo PT relacionado e vice-versa — cross-pollination intencional. Se for problemático, adicionar prop `preferSameLang` na próxima sessão.
- **`<details open>` no ToC**: aberto por padrão para descobribilidade; o usuário pode colapsar. Alternativa considerada: CSS scroll-spy — descartada por adicionar JS desnecessário.
- **Tradução por cópia fiel, não por adaptação**: as traduções preservam todos os exemplos técnicos, memes, SVGs e referências exatamente. O blog tem voz consistente; adaptações locais seriam ruído.
- **Tags adicionadas nos posts sem tags**: necessário para RelatedPosts funcionar — posts sem tags nunca apareceriam como relacionados.
