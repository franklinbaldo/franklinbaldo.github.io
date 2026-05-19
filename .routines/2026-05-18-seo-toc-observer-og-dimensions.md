---
date: 2026-05-18
slug: seo-toc-observer-og-dimensions
branch: claude/great-mccarthy-obXnp
status: pr-open
session: 12
---

# Sessão 2026-05-18 — og:image dimensions, article:author, TOC observer, 404 translations

## Contexto

Décima-segunda sessão com o sistema `.routines/`. Branch designado: `claude/great-mccarthy-obXnp`.

Estado ao chegar:
- PRs #136, #137, #138 abertos (hronir runs + editorial fix)
- PRs #124, #125, #126, #127, #128 abertos com base desatualizada (conflitos)
- PR #102 aberto há muito tempo com Kilo Code Review falhando (2 bugs confirmados: `---` indentado + `author.moreAbout` → `author.aboutMore`)
- Sitemap com 74 triplets hreflang ✅
- RSS split EN/PT ✅
- Tags pages filtradas por idioma ✅
- LanguageSwitcher com auto-redirect por preferência de navegador ✅

## PRs revisados e mergeados

| PR | Título | Ação |
|----|--------|------|
| #137 | hronir run 2026-05-18T13-11-01 + edit-worst (pontifex-research) | **Mergeado** (squash) — CI verde: check ✅ GitGuardian ✅ |
| #138 | Revisar "Duas Perguntas": corrigir 2ª pergunta Rutt | **Mergeado** (squash) — CI verde: check ✅ GitGuardian ✅ |
| #136 | hronir run 2026-05-18T12-59-25 + edit-worst (inaugural-post) | **Conflito** — base desatualizada após merge de #137/#138, pulado |
| #124–128 | hronir runs antigos | **Pulados** — base muito antiga (4245f22), todos com conflitos |
| #102 | Optimize profile visuals | **Pulado** — Kilo Code Review falhando + base extremamente desatualizada |

## Ações realizadas

### 1. `og:image:width` + `og:image:height` em todas as páginas

**Problema**: `<meta property="og:image">` sem as dimensões `width` e `height` faz com que LinkedIn e Slack precisem fazer um request adicional para descobrir as dimensões antes de renderizar o preview. Isso causa previews lentos ou ausentes.

**Arquivo**: `src/layouts/PageLayout.astro`

**Mudança**: Duas linhas adicionadas após `og:image:alt`:
```html
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

As OG images do site têm dimensões fixas 1200×630 (padrão para `summary_large_image`). Hardcodar os valores é correto e seguro.

### 2. `article:author` para LinkedIn

**Problema**: `<meta name="author">` já existia, mas LinkedIn usa `article:author` (OG property) para atribuição de conteúdo nos previews e no indexador. Ausência desse tag reduz a chance de o LinkedIn exibir o byline do autor.

**Arquivo**: `src/layouts/PageLayout.astro`

**Mudança**: Tag adicionada no bloco article-specific, após os tags `article:modified_time`:
```html
{type === 'article' && <meta property="article:author" content={new URL("/about/", Astro.site).href} />}
```

Aponta para `/about/` que é a página canônica do autor no site.

### 3. TOC IntersectionObserver — highlight ativo ao scroll

**Problema**: A TOC sidebar (`toc-sidebar-nav`) já tinha posicionamento `sticky` mas nenhuma indicação visual de qual seção está visível no momento. Leitores de posts longos perdem a localização.

**Arquivo**: `src/components/TableOfContents.astro`

**Mudança**: Script `IntersectionObserver` adicionado ao final do componente:
- Observa todos os headings (`h2`, `h3`) referenciados na TOC
- Quando um heading cruza o viewport, marca o link correspondente com `.toc-active`
- Fallback por posição de scroll para cobrir casos onde nenhum heading está intersectando
- Classe `.toc-active` aplicada: `color: var(--pico-primary)`, `border-left-color: var(--pico-primary)`, `font-weight: 500`
- Desconecta o observer em `astro:before-swap` (compatível com ClientRouter)
- Registra via `astro:page-load` para funcionar com view transitions

### 4. EN 404 — translations wired up

**Problema**: `src/pages/404.astro` não tinha `lang="en"` explícito nem `translations={{ pt: "/pt/404/" }}`. Usuários PT pousando na 404 EN não viam o botão de troca de idioma habilitado.

**Arquivo**: `src/pages/404.astro`

**Mudança**:
```astro
- <PageLayout title="Not Found" description="Page not found.">
+ <PageLayout title="Not Found | Franklin Baldo" description="Page not found." lang="en" translations={{ pt: "/pt/404/" }}>
```

Também aproveitado para padronizar o title format (`| Franklin Baldo`) consistente com as demais páginas.

## Build

304 páginas — sem erros.

## Estado atual após esta sessão

- `og:image:width` + `og:image:height`: todas as páginas ✅ (novo)
- `article:author` (LinkedIn): todos os artigos ✅ (novo)
- TOC IntersectionObserver: highlight ativo ao scroll ✅ (novo)
- EN 404: `translations` para PT 404 ✅ (novo)
- Sitemap hreflang: 74 triplets ✅
- RSS split EN/PT ✅
- Auto-redirect por preferência de idioma (LanguageSwitcher) ✅
- Tags pages filtradas por idioma ✅
- PR #102: ainda aberto, bloqueado por Kilo Code Review + base muito desatualizada

## Cobertura PT por página

| Página EN | Página PT | Status |
|-----------|-----------|--------|
| `/` | `/pt/` | ✅ translations wired |
| `/about/` | `/pt/about/` | ✅ |
| `/archive/` | `/pt/archive/` | ✅ |
| `/projects/` | `/pt/projects/` | ✅ |
| `/search/` | `/pt/search/` | ✅ |
| `/tags/` | `/pt/tags/` | ✅ |
| `/ranking/` | `/pt/ranking/` | ✅ |
| `/404` | `/pt/404` | ✅ (corrigido nesta sessão) |
| Posts EN | Posts PT (via translationKey) | ~31 pares, cobertura parcial |

Todos os posts EN ainda não traduzidos mostram o LanguageSwitcher desabilitado.

## Próximas sessões — backlog priorizado

### Alta prioridade
1. **PR #102 rebase/fix**: O PR tem valor real (pixel art avatar, Astro Image, latest essay logic). Mas está tão desatualizado que a melhor abordagem é um novo PR cherry-picking as mudanças válidas em cima do main atual, corrigindo os 2 bugs (`---` indentado e `author.moreAbout` → `author.aboutMore`).

2. **Posts sem tradução PT**: ~número de posts EN sem `translationKey` conectado a um post PT. Criar traduções para os posts mais rankeados (topo do Hrönir ranking) é o maior impacto para cobertura PT.

### Média prioridade
3. **Pagination no archive**: O arquivo cresce linearmente. Astro `paginate()` antes de ter >100 posts.

4. **Search page — hreflang no sitemap**: Verificar se `/search/` e `/pt/search/` aparecem no sitemap com hreflang correto.

5. **OG image dinâmica por post**: Gerar imagens OG únicas por post (com título, tags) via `@vercel/og` ou similar. Atualmente todos os posts usam a mesma imagem padrão.

### Baixa prioridade
6. **Focus management** nas transições de página (ClientRouter) — acessibilidade.
7. **`defu` dependabot PR #38** — atualização simples de patch, vale mergear.
8. **Dedup PR #136** — post `inaugural-post` (PR #136 ficou com conflito). A versão atual no main ainda é a versão anterior; considerar reaplicar o edit manualmente.

## Decisões arquiteturais

- **og:image dimensions hardcoded vs dinâmico**: Como todas as OG images do site (geradas por `/src/pages/og/`) têm dimensões fixas 1200×630, hardcodar é mais simples e confiável que tentar extrair dimensões em build time.
- **article:author apontando para /about/**: Alternativa seria apontar para LinkedIn ou Twitter. Preferimos a URL canônica do site para não depender de plataformas externas e para que o valor seja sempre válido.
- **TOC observer: rootMargin '-60%'**: O offset faz com que um heading só seja considerado "ativo" quando chega a 40% do topo do viewport, dando tempo suficiente para o leitor reconhecer a seção antes do highlight mudar.
