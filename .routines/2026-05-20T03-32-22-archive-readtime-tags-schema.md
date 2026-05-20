---
date: 2026-05-20
slug: archive-readtime-tags-schema
branch: claude/great-mccarthy-5fu2T
status: pr-open
session: 15
---

# Sessão 2026-05-20 (T03) — Reading time no arquivo, ItemList schema para tags, fechamento de PRs obsoletos

## Contexto

Décima-quinta sessão com o sistema `.routines/`. Branch designado: `claude/great-mccarthy-5fu2T`.

Estado ao chegar:

- PR #155 aberto (4 posts bilíngues: Suno, Manifold, GitHub, franklinbaldo handle) — CI verde ✅
- PR #150 aberto (consolidação) — CI failed, Kilo failed
- PRs #124–128, #136, #147 — hronir runs com base muito desatualizada
- PR #102 — Kilo Review failed, base extremamente desatualizada
- Commit `a1c52ff` em main: PostNav prev/next, CollectionPage schema nas tags, PostCard tags, about fix (sessão 14)
- 36 pares EN↔PT (36 EN + 36 PT, incluindo 4 novos posts de PR #155)
- Cobertura bilingual: 100% posts + 100% páginas estáticas ✅

## PRs revisados

| PR                     | Título                                            | Ação                                                        |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| #155                   | 4 bilingual posts (Suno, Manifold, GitHub, handle) | **Mergeado** (squash) — CI verde: check ✅ Kilo ✅ GitGuardian ✅ |
| #150                   | Consolidação                                      | **Fechado** — CI/Kilo failed, conteúdo já absorvido         |
| #147                   | hronir run 2026-05-18T19 (delegating-to-agents)   | **Fechado** — base desatualizada, dirty merge state         |
| #136                   | hronir run 2026-05-18T12 (inaugural-post)         | **Fechado** — base muito desatualizada                      |
| #124, #125, #126, #127, #128 | hronir runs 2026-05-18T05–09               | **Fechados** — base extremamente desatualizada              |
| #102                   | Optimize profile visuals                          | **Mantido aberto** — tem valor real (pixel art, latest essay) |

## Ações realizadas nesta sessão

### 1. Reading time na tabela do arquivo (EN e PT)

**Problema**: A tabela do arquivo mostrava data e título, mas não dava ao leitor nenhuma indicação de quanto tempo demora cada ensaio. Leitores precisavam abrir o post para ver o tempo de leitura na metadata do artigo.

**Arquivos modificados**:
- `src/pages/archive.astro`
- `src/pages/pt/archive.astro`

**Como funciona**:

```typescript
function estMinutes(body: string | undefined): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
```

A função usa `post.body` (raw markdown do glob loader do Astro 5) para estimar palavras a 200 wpm — a mesma taxa usada pelo `remark-reading-time` plugin. O resultado aparece como coluna `~min` na tabela, com estilo muted e `tabular-nums`.

**UX**: Coluna oculta em mobile (<480px) para manter a tabela legível em telas pequenas. Em desktop, aparece antes da badge de idioma.

### 2. CollectionPage JSON-LD para /archive/ e /pt/archive/

**Problema**: As páginas do arquivo tinham bom conteúdo mas nenhum structured data. O Google não conseguia inferir que `/archive/` é uma coleção de artigos.

**Arquivos modificados**: `src/pages/archive.astro`, `src/pages/pt/archive.astro`

**Mudança**: Adicionado `CollectionPage` JSON-LD com `hasPart` listando todos os posts (headline, url, datePublished), injetado via `slot="head"` no PageLayout.

```json
{
  "@type": "CollectionPage",
  "name": "Archive — Franklin Baldo",
  "inLanguage": "en-US",
  "hasPart": [{ "@type": "BlogPosting", "headline": "...", "url": "...", "datePublished": "..." }]
}
```

### 3. ItemList JSON-LD para /tags/ e /pt/tags/

**Problema**: As páginas de índice de tags não tinham structured data. O Google não sabia que era uma lista de tópicos disponíveis para browsing.

**Arquivos modificados**: `src/pages/tags/index.astro`, `src/pages/pt/tags/index.astro`

**Mudança**: Adicionado `ItemList` JSON-LD com `itemListElement` mapeando cada tag para sua URL e posição na lista (ordenada por frequência):

```json
{
  "@type": "ItemList",
  "name": "Tags — Franklin Baldo",
  "numberOfItems": 28,
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "#ia (12)", "url": ".../tags/ia/" }
  ]
}
```

## Build

343 páginas — sem erros, 0 type errors.

## Estado atual após esta sessão

- Reading time (`~N min`) na tabela do arquivo EN e PT ✅ (novo)
- CollectionPage JSON-LD em /archive/ e /pt/archive/ ✅ (novo)
- ItemList JSON-LD em /tags/ e /pt/tags/ ✅ (novo)
- PRs obsoletos fechados: #124, #125, #126, #127, #128, #136, #147, #150 ✅ (limpeza)
- PostNav prev/next ✅ (sessão 14)
- Tags CollectionPage JSON-LD ✅ (sessão 14)
- Tags descrições melhoradas ✅ (sessão 14)
- About: 100% EN+PT ✅ (sessão 14)
- PostCard: tags visíveis ✅ (sessão 14)
- Home title descritivo EN/PT ✅ (sessão 13)
- Archive badges → links diretos ✅ (sessão 13)
- WebSite JSON-LD SearchAction ✅ (sessão 13)
- og:image width/height ✅ (sessão 12)
- article:author ✅ (sessão 12)
- TOC IntersectionObserver ✅ (sessão 12)
- 36 pares EN↔PT via translationKey ✅
- LanguageSwitcher auto-redirect por navegador ✅
- Hreflang sitemap ✅
- RSS split EN/PT ✅

## PRs abertos remanescentes

- **PR #102** (Optimize profile visuals): Kilo Review failed, base muito desatualizada. O valor real está em: (a) pixel art avatar, (b) Astro Image para bio/home rail, (c) lógica "latest essay" no home. Implementar do zero em novo PR sobre main atual.

## Próximas sessões — backlog priorizado

### Alta prioridade

1. **PR #102 reimplementação** — Implementar do zero as 3 features do PR #102:
   - Pixel art avatar na home (`/avatar-pixel.png`)
   - Astro `<Image>` nos componentes `HomeAuthorRail.astro` e `AuthorBio.astro`
   - "Read latest essay" link correto apontando para o post mais recente

2. **Suno post restructuring** — O usuário enviou um request detalhado nesta sessão para:
   - Criar componente `SunoPlaylist.svelte` com `<audio>` HTML5 para playlists
   - Reestruturar post Suno em "Low quality slop" / "High quality slop"
   - Usar dados de `src/data/suno-songs.jsonl` (aguardando arquivo do usuário)
   - **BLOQUEADO**: requer que Franklin faça drop do arquivo JSONL no repo

3. **OG image per-post**: verificar se `/og/[...slug].png` está sendo gerado e servido corretamente no deploy. Spot-check 3–5 posts com social card preview.

### Média prioridade

4. **Archive pagination**: Astro `paginate()` antes de ter >60 posts (atualmente 36 EN, 36 PT).

5. **Pagefind URL param**: verificar se o handler `?q=` pré-popula a search box no deploy real.

6. **Ranking page structure data**: `/ranking/` e `/pt/ranking/` poderiam ter `ItemList` JSON-LD.

7. **PR #38** (dependabot defu 6.1.4 → 6.1.6): atualização simples de patch.

### Baixa prioridade

8. **Focus management** (ClientRouter) — acessibilidade em transições de página.

9. **Visual breadcrumbs** — JSON-LD breadcrumbs já existem; adicionar UI visual no header dos posts.

## Decisões arquiteturais

- **`post.body` vs `render()` para reading time no arquivo**: Chamar `render(post)` em todos os 36 posts EN seria caro (processamento de cada markdown em build time). Usar `post.body` diretamente é O(n) sobre o texto raw e produz estimativas suficientemente precisas (±1 minuto). O remark plugin usa a mesma taxa de 200 wpm.

- **CollectionPage no /archive/ vs paginação**: O `hasPart` lista todos os posts — quando a paginação for implementada, o JSON-LD deverá ser atualizado para usar `@type: "DataFeed"` ou referenciar apenas os posts da página atual.

- **ItemList ordenado por frequência**: A ordem reflete como os tags aparecem na UI (mais frequentes primeiro). O `position` no JSON-LD segue essa mesma ordem, o que é semanticamente correto.
