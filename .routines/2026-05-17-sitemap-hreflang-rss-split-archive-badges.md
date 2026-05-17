---
date: 2026-05-17
slug: sitemap-hreflang-rss-split-archive-badges
branch: claude/great-mccarthy-kdWBD
status: pr-open
session: 11
---

# Sessão 2026-05-17 — Sitemap hreflang para posts, RSS split EN/PT, badges no arquivo

## Contexto

Décima-primeira sessão com o sistema `.routines/`. Branch designado: `claude/great-mccarthy-kdWBD`.

Estado ao chegar:
- PR #103 aberto (feat(seo): PT 404, FAQ schema, wordCount JSON-LD, x-default hreflang) — CI verde, `mergeable_state: clean`
- PR #102 aberto (Optimize profile visuals) — Kilo Code Review FAILED (2 bugs de build: `---` indentado e key `author.moreAbout` inexistente)
- 31 pares de tradução conectados via `translationKey`
- Sitemap com hreflang para apenas 6 páginas estáticas (sem cobertura de posts de blog)
- Feed RSS incluindo posts EN + PT misturados com `<language>en-us</language>`

## Ações realizadas

### PRs revisados
- **PR #103** mergeado (squash) — todos os checks passando ✅
- **PR #102** mantido aberto — Kilo Code Review falhou; bugs de build confirmados pelo PR #103

### 1. Sitemap hreflang para todos os pares de posts de blog

**Problema**: O sitemap tinha hreflang apenas para 6 páginas estáticas. Os 31 pares de posts EN↔PT (62 URLs de blog) não tinham hreflang no sitemap — sinal de idioma incompleto para crawlers.

**Solução**:
- `scripts/generate-translation-pairs.mjs` — script novo que lê o frontmatter de todos os `.md` em `src/content/blog/`, agrupa por `translationKey`, e emite `src/generated/blog-translation-pairs.json` (mapa bidirecional `{ "/blog/slug/": { en, pt } }`)
- `package.json` — `prebuild` e `predev` agora executam o script antes do build
- `astro.config.mjs` — importa o JSON gerado e usa no `serialize()` do sitemap para adicionar hreflang `en-US`, `pt-BR` e `x-default` para cada URL de post que tem par

**Resultado**: sitemap passou de 6 para **74 triplets de hreflang** (6 estáticos + 31 pares × 2 URLs cada).

| Antes | Depois |
|-------|--------|
| 6 URLs com hreflang | 74 URLs com hreflang |
| Posts sem sinal de idioma no sitemap | Todos os 62 posts pareados têm `en-US`, `pt-BR`, `x-default` |

### 2. RSS split EN/PT

**Problema**: `rss.xml` incluía todos os posts (EN + PT) com `<language>en-us</language>` — dado incorreto que confundia agregadores e leitores.

**Mudanças**:

| Arquivo | Mudança |
|---------|---------|
| `src/pages/rss.xml.js` | Adicionado filtro `.filter(lang === 'en')` |
| `src/pages/pt/rss.xml.js` | **Novo** — feed PT-only, `<language>pt-br</language>`, título "Franklin Baldo (Português)" |
| `src/layouts/PageLayout.astro` | `<link rel="alternate" type="application/rss+xml">` agora aponta para `/pt/rss.xml` em páginas PT e `/rss.xml` em páginas EN; título do link também localizado |
| `src/components/Footer.astro` | Recebe `lang` prop; link "RSS" no rodapé aponta para o feed correto por idioma |
| `src/pages/pt/about.astro` | Link RSS atualizado para `/pt/rss.xml` |

**Fluxo correto agora**:
- Usuário EN visita `/` → RSS autodiscovery aponta para `/rss.xml` (EN only, `en-us`)
- Usuário PT visita `/pt/` → RSS autodiscovery aponta para `/pt/rss.xml` (PT only, `pt-br`)
- Rodapé mostra o link RSS correto por idioma

### 3. `<meta name="author">` em todas as páginas

**Arquivo**: `src/layouts/PageLayout.astro`

Adicionado `<meta name="author" content="Franklin Baldo" />` logo após `<meta name="description">`. Sinal de atribuição de conteúdo para motores de busca e ferramentas de análise de byline.

### 4. Badges de tradução no arquivo

**Problema**: O arquivo (`/archive/` e `/pt/archive/`) mostrava apenas data + título. Não havia indicação de quais posts tinham versão no outro idioma.

**Mudança**: Adicionada coluna "PT" (no arquivo EN) e "EN" (no arquivo PT) com um badge colorido quando a tradução existe. O badge usa `color-mix()` com a cor primária do Pico para seguir o tema (light/dark automaticamente).

| Arquivo | Mudança |
|---------|---------|
| `src/pages/archive.astro` | Nova coluna PT; set de `translationKey` PT para lookup O(1); badge estilizado |
| `src/pages/pt/archive.astro` | Nova coluna EN; set de `translationKey` EN para lookup O(1); badge estilizado |

**UX**: Leitor EN que vê um post com badge PT sabe que pode recomendar para falantes de PT. Leitor PT vê quais posts têm versão EN.

## Build

294 páginas — sem erros. Feed RSS PT gerado em `/pt/rss.xml`.

## Estado atual após esta sessão

- Sitemap: 74 triplets hreflang (era 6) ✅
- RSS EN: `/rss.xml` — EN-only, `<language>en-us</language>` ✅
- RSS PT: `/pt/rss.xml` — PT-only, `<language>pt-br</language>` ✅ (novo)
- `<meta name="author">` em todas as páginas ✅
- Archive EN: badge PT em posts pareados ✅
- Archive PT: badge EN em posts pareados ✅
- PR #102: ainda aberto (bugs de build não corrigidos)

## Próximas sessões — backlog priorizado

### Alta prioridade
1. **PR #102 fix**: O PR tem 2 bugs: `---` frontmatter indentado em `PageLayout.astro` e `author.moreAbout` (key inexistente, deveria ser `author.aboutMore`). Vale corrigir esses bugs e mergear o PR, pois a funcionalidade (pixel art de perfil + "Read latest essay" chronológico) é válida.
2. **Dedup: `defu` atualização**: PR #38 do dependabot — `defu` 6.1.4 → 6.1.6. Simples atualização no `package.json`.

### Média prioridade
3. **Tags /tags/[tag]/ exibindo mix EN+PT**: A página de tags mostra posts EN e PT juntos. Deveria filtrar por idioma (igual ao archive) ou ao menos mostrar o badge de idioma.
4. **Pagination**: `/archive/` e `/pt/archive/` — crescimento linear. Astro `paginate()` antes de ter >100 posts.
5. **TOC IntersectionObserver**: Highlight ativo do item TOC conforme scroll. O CSS do `.toc-col` já tem `sticky`, falta o JS observer.
6. **`og:image:width` + `og:image:height`** no PageLayout — melhora preview em LinkedIn/Slack. As OG images têm dimensões fixas (1200×630).

### Baixa prioridade
7. **Tags page: filtro por idioma** — `/tags/` e `/pt/tags/` provavelmente não filtram por idioma (mostram todas as tags de todos os posts). Verificar e corrigir.
8. **`article:author` meta tag** para LinkedIn — complementa o `<meta name="author">`.
9. **Focus management** nas transições de página (ClientRouter).

## Decisões arquiteturais

- **Prebuild script para pares**: alternativa seria resolver os pares diretamente no `astro.config.mjs` via importação estática do JSON (gerado uma vez e commitado). Escolhemos regenerar em cada build via script para manter o JSON sempre sincronizado com os posts — zero risco de dessincronia se alguém adicionar um post sem rodar o script manualmente.
- **RSS split vs RSS único com `<language>` por item**: RSS 2.0 não suporta `<language>` por item (apenas por canal). Um feed unificado seria sempre rotulado com um único idioma. Split por canal é a solução correta e o que grandes blogs multilíngues fazem.
- **Badge simples vs link para tradução no arquivo**: optamos pelo badge sem link (só indica disponibilidade). Link direto para a tradução seria útil mas complica o layout; o LanguageSwitcher no post já oferece navegação cross-language.
- **`color-mix()` para badges**: garante que o badge segue o tema (dark/light) sem CSS duplicado. Suportado em todos os browsers modernos e compatível com Pico.css v2.
