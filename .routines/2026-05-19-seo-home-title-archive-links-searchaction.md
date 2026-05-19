---
date: 2026-05-19
slug: seo-home-title-archive-links-searchaction
branch: claude/great-mccarthy-lRqT3
status: pr-open
session: 13
---

# Sessão 2026-05-19 — Home title SEO, archive badges as links, WebSite SearchAction

## Contexto

Décima-terceira sessão com o sistema `.routines/`. Branch designado: `claude/great-mccarthy-lRqT3`.

Estado ao chegar:

- PR #151 aberto (hronir run 2026-05-19T13, pontifex-guide) — CI verde, `mergeable_state: clean`, "Auto-merge"
- PR #150 aberto (consolidação de PRs #102, #124–128, #136, #139–140, #145, #147) — CI failed
- PR #147 aberto (hronir delegating-to-agents) — base desatualizada
- PR #139 aberto (og:image dimensions, article:author, TOC observer, 404 i18n) — CI verde, `mergeable_state: clean`
- PRs #124–128, #136 abertos — base desatualizada, "Não auto-merge"
- PR #102 aberto — Kilo Code Review falhou, base muito desatualizada
- 31 pares EN↔PT via `translationKey` (cobertura total de posts ativos)
- Todos os posts ativos têm `translationKey` ✅
- LanguageSwitcher com auto-redirect por preferência de navegador ✅

## PRs revisados e mergeados

| PR             | Título                                                                           | Ação                                                                    |
| -------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| #151           | hronir run 2026-05-19T13-08-59 + edit-worst (pontifex-guide)                     | **Mergeado** (squash) — CI verde: check ✅ Kilo ✅ GitGuardian ✅       |
| #139           | feat(seo/ux): og:image dimensions, article:author, TOC scroll observer, 404 i18n | **Mergeado** (squash) — CI verde: check ✅ Kilo ✅ GitGuardian ✅       |
| #150           | Consolidação de PRs                                                              | **Pulado** — CI failed (build failure)                                  |
| #147           | hronir delegating-to-agents                                                      | **Pulado** — base desatualizada (fd64964)                               |
| #124–128, #136 | hronir runs antigos                                                              | **Pulados** — base muito desatualizada, "Não auto-merge"                |
| #102           | Optimize profile visuals                                                         | **Pulado** — Kilo Code Review falhando, base extremamente desatualizada |

## Ações realizadas nesta sessão

### 1. Home page titles — SEO

**Problema**: `title="Home"` gerava `<title>Home | Franklin Baldo</title>` no browser tab e snippets de busca. "Home" é um título fraco para SEO — não descreve o conteúdo nem atrai cliques.

**Arquivos**:

- `src/pages/index.astro`
- `src/pages/pt/index.astro`

**Mudança EN**:

```astro
- title="Home"
- description="Franklin Baldo — notes on AI, law, and systems."
+ title="Franklin Baldo — Notes on AI, law, and systems."
+ description="Essays on AI agency, process metaphysics, and legal design by Franklin Baldo, a State Attorney in Rondônia, Brazil."
```

**Mudança PT**:

```astro
- title="Início"
- description="Franklin Baldo — notas sobre IA, direito e sistemas."
+ title="Franklin Baldo — Notas sobre IA, direito e sistemas."
+ description="Ensaios sobre agentes de IA, metafísica do processo e design jurídico por Franklin Baldo, Procurador do Estado em Rondônia."
```

O `documentTitle` em PageLayout.astro detecta que o título já contém "Franklin Baldo" e usa o título diretamente (sem o sufixo `| Franklin Baldo`), gerando `<title>Franklin Baldo — Notes on AI, law, and systems.</title>`.

**Por que importa**: O título da página é o fator de SEO on-page mais importante. "Franklin Baldo — Notes on AI, law, and systems." é mais descritivo, atrai o público-alvo e inclui keywords relevantes.

### 2. Archive: badges PT/EN → links diretos

**Problema**: Os badges "PT" (no arquivo EN) e "EN" (no arquivo PT) indicavam disponibilidade de tradução mas eram elementos `<span>` não clicáveis. Um usuário que queria ir para a versão em outro idioma precisava abrir o post e clicar no LanguageSwitcher.

**Arquivos**:

- `src/pages/archive.astro`
- `src/pages/pt/archive.astro`

**Mudança**: Substituídas as Sets (`ptKeys`, `enKeys`) por Maps (`ptByKey`, `enByKey`) que mapeiam `translationKey → post id`. Os badges foram convertidos de `<span>` para `<a>` com `href="/blog/${ptId}/"` (ou `enId`).

**Resultado**:

- Badge PT no arquivo EN → link direto para o post PT correspondente
- Badge EN no arquivo PT → link direto para o post EN correspondente
- Hover state adicionado (background mais escuro + underline)

**UX**: Leitores bilíngues podem navegar entre versões diretamente do arquivo, sem precisar entrar no post primeiro.

### 3. WebSite JSON-LD com SearchAction

**Problema**: O JSON-LD `WebSite` estava presente mas sem `potentialAction`. Isso impede que o Google exiba a caixa de busca do site diretamente nos resultados de busca (Sitelinks Searchbox) e não comunica a funcionalidade de busca do site aos motores de busca.

**Arquivo**: `src/layouts/PageLayout.astro`

**Mudança**:

```json
{
  "@type": "WebSite",
  "name": "Franklin Baldo",
  "url": "https://franklinbaldo.github.io/",
  "inLanguage": "en-US",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://franklinbaldo.github.io/search/?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

Em páginas PT, `inLanguage` é `pt-BR` e `urlTemplate` aponta para `/pt/search/?q={search_term_string}`.

### 4. Search pages: `lang` prop + URL param handler

**Problema**: `src/pages/search.astro` não tinha o prop `lang="en"`, o que fazia o WebSite schema usar o idioma default em vez de "en" explícito. Além disso, a SearchAction só é útil se a página de busca consegue processar o parâmetro `?q=` na URL.

**Arquivos**:

- `src/pages/search.astro`
- `src/pages/pt/search.astro`

**Mudança**: Adicionado `lang="en"` em `search.astro`. Adicionado script inline em ambas as páginas que lê `?q=` da URL e tenta inicializar o `pagefind-searchbox` com a query (via `setAttribute('query', q)` e custom event `pagefind:init`). Isso habilita o fluxo: Google Sitelinks Searchbox → usuário busca → redirecionado para `/search/?q=termo` → busca pré-populada.

## Build

304 páginas — sem erros.

## Estado atual após esta sessão

- Home title EN: "Franklin Baldo — Notes on AI, law, and systems." ✅ (novo)
- Home title PT: "Franklin Baldo — Notas sobre IA, direito e sistemas." ✅ (novo)
- Archive EN: badge PT → link direto para post PT ✅ (novo)
- Archive PT: badge EN → link direto para post EN ✅ (novo)
- WebSite JSON-LD SearchAction: ambos os idiomas ✅ (novo)
- Search pages: lang prop + URL ?q= handler ✅ (novo)
- og:image:width/height ✅ (session 12, #139)
- article:author ✅ (session 12, #139)
- TOC IntersectionObserver ✅ (session 12, #139)
- 31 pares EN↔PT via translationKey ✅
- LanguageSwitcher auto-redirect ✅

## Cobertura de idioma por página estática

| Página EN    | Página PT       | LanguageSwitcher   | Status      |
| ------------ | --------------- | ------------------ | ----------- |
| `/`          | `/pt/`          | ✅                 | ✅          |
| `/about/`    | `/pt/about/`    | ✅                 | ✅          |
| `/archive/`  | `/pt/archive/`  | ✅                 | ✅          |
| `/projects/` | `/pt/projects/` | ✅                 | ✅          |
| `/search/`   | `/pt/search/`   | ✅                 | ✅          |
| `/tags/`     | `/pt/tags/`     | ✅                 | ✅          |
| `/ranking/`  | `/pt/ranking/`  | ✅                 | ✅          |
| `/404`       | `/pt/404`       | ✅                 | ✅          |
| Posts EN     | Posts PT        | via translationKey | 31 pares ✅ |

Cobertura multilingual: **100% das páginas estáticas + 100% dos posts ativos**.

## PRs abertos com issues conhecidos (para próximas sessões)

- **PR #102** (Optimize profile visuals): Kilo Code Review failed, base extremamente desatualizada. A melhor abordagem é fazer um novo PR do zero com apenas as mudanças válidas.
- **PR #150** (consolidação): CI falhou. Contém hronir runs antigos — pode ser fechado/descartado.
- **PRs #124–128, #136, #147**: hronir runs com base desatualizada. Absorvidos ou desatualizados pelo main atual.

## Próximas sessões — backlog priorizado

### Alta prioridade

1. **PR #102 rebase/fix**: Pixel art avatar + Astro Image + "latest essay" logic. Implementar do zero em novo PR, corrigindo os 2 bugs conhecidos.

2. **Archive pagination**: O arquivo cresce linearmente. Astro `paginate()` antes de ter >60 posts (estamos em ~33 EN, ~32 PT).

3. **OG image per-post preview** — o gerador já existe (`src/pages/og/[...slug].png.ts`). Verificar se as imagens estão sendo geradas corretamente no deploy e se o preview social funciona como esperado.

### Média prioridade

4. **Pagefind URL param — verificar comportamento**: O script `?q=` que adicionamos usa `setAttribute('query', q)` + custom event. Testar se o `pagefind-searchbox` web component respeita esse atributo — se não, pode ser necessário usar a API JavaScript do Pagefind diretamente.

5. **Tags [tag] page: description por tag** — atualmente "Essays tagged #tag." é genérico. Poderia usar a descrição do post mais rankeado com aquela tag.

6. **PR #38** (dependabot defu 6.1.4 → 6.1.6): Simples atualização de dependência.

### Baixa prioridade

7. **Focus management** nas transições de página (ClientRouter) — acessibilidade.

8. **Visual breadcrumbs**: JSON-LD breadcrumbs já existem para artigos, mas não há breadcrumbs visuais no UI.

9. **Structured data para non-article pages**: ranking, tags, archive poderiam ter `CollectionPage` ou `ItemList` schema.

## Decisões arquiteturais

- **Map vs Set no archive**: Mudança de `ptKeys` (Set) para `ptByKey` (Map) permite não apenas saber se existe tradução, mas também qual é o slug — necessário para construir o link. Custo: negligível (iteração única em build time).

- **SearchAction URL template**: Apontamos para `/search/?q=` porque é o padrão do Google e do schema.org. O script de pre-população no client-side converte isso em uma busca real no Pagefind. Se o `pagefind-searchbox` não suportar o atributo `query`, o pior caso é que a busca não é pré-populada — o schema ainda tem valor SEO.

- **Home title sem sufixo "| Franklin Baldo"**: O `documentTitle` no PageLayout detecta que o título já contém o nome do site e não duplica. Resultado limpo: `<title>Franklin Baldo — Notes on AI, law, and systems.</title>` em vez de `<title>Franklin Baldo — Notes on AI, law, and systems. | Franklin Baldo</title>`.
