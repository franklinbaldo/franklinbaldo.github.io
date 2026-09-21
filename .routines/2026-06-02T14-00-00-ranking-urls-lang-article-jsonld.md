---
date: 2026-06-02T14:00:00
slug: ranking-urls-lang-article-jsonld
branch: claude/great-mccarthy-CUkUc
status: pr-open
session: 29
---

# Sessão 2026-06-02 — Ranking URLs, lang/article, JSON-LD articleSection

## Contexto

Vigésima-nona sessão. Branch designado: `claude/great-mccarthy-CUkUc`.

Estado ao chegar:

- 2 PRs abertos: #216 (takeout + what-winter-opens), #217 (hronir run 2026-06-02)
- Sessão anterior (#20260601): language redirect toast, JSON-LD melhorado, OG image type, Featured badge localizado
- Backlog prioritário: RankingView URLs bilíngues, `lang` no `<article>`, `articleSection` no JSON-LD

## PRs revisados

| PR | Título | CI | Ação |
|----|--------|----|------|
| #217 | hronir: run 2026-06-02 | ✅ All green | **Merged** (squash) |
| #216 | takeout: seventh session + "O que o inverno abre" | ❌ Prettier failure em `what-winter-opens.md` | **Fix pushed** via MCP push_files |

### Root cause PR #216

`what-winter-opens.md` tinha dois problemas de formatação Prettier:
1. Uma linha muito longa sem quebra (>80 chars na linha "In 2025, through the September cutoff: 265.")
2. O Prettier aplicou sua regra de quebra de linha diferente da gerada

Fix: `npx prettier --write src/content/blog/what-winter-opens.md` + push via `mcp__github__push_files` para `claude/keen-franklin-v57hx`. CI vai reprocessar automaticamente.

## Melhorias implementadas

### 1. Bug fix: RankingView.astro — URLs de posts PT

**Problema**: O componente `RankingView.astro` gerava links `/blog/${slug}/` para todos os posts, independente do idioma. Posts PT têm URLs na forma `/pt/blog/${slug}/`. Na página `/pt/ranking/`, todos os links do ranking apontavam para o path errado (EN).

**Impacto**: qualquer usuário PT clicando num post no ranking era redirecionado silenciosamente pelo `Astro.redirect()` — funcionava, mas gerava uma redirect desnecessária e gerava URLs erradas no JSON-LD.

**Mudanças em `src/components/RankingView.astro`**:

a) Interface `UnratedItem` — adicionado campo `lang: string`:
```typescript
export interface UnratedItem {
  slug: string;
  title: string;
  lang: string;
}
```

b) Função `postHref` — usa `lang` do post para construir URL correta:
```javascript
function postHref(key: string): string | null {
  const p = postByKey.get(key);
  if (!p) return null;
  return p.lang === "pt" ? `/pt/blog/${p.slug}/` : `/blog/${p.slug}/`;
}
```

c) Pódio (card de posição 1/2/3) — href corrigido
d) Tabela principal — link do título corrigido
e) Seção "não duellados" — link corrigido

### 2. Bug fix: JSON-LD ItemList nas páginas de ranking

**Problema**: `pt/ranking.astro` e `ranking.astro` geravam URLs de JSON-LD `itemListElement` sempre como `/blog/${slug}/`, incorreto para posts PT.

**Mudança em `src/pages/ranking.astro` e `src/pages/pt/ranking.astro`**:
```javascript
url: r.post
  ? `https://franklinbaldo.github.io/${r.post.lang === "pt" ? "pt/" : ""}blog/${r.post.slug}/`
  : undefined,
```

### 3. Bug fix: `lang` adicionado a unrated items

**Problema**: `ranking.astro` e `pt/ranking.astro` criavam `UnratedItem` sem o campo `lang` (agora obrigatório na interface), causaria erro de tipo.

**Mudança em `src/pages/ranking.astro`**:
```javascript
unrated.push({ slug: preferred.id, title: preferred.data.title, lang: preferred.data.lang ?? "en" });
```

**Mudança em `src/pages/pt/ranking.astro`**:
```javascript
unrated.push({ slug: preferred.id, title: preferred.data.title, lang: preferred.data.lang ?? "pt" });
```

### 4. A11y: `lang` attribute no `<article>` em páginas de post

**Problema**: O elemento `<article>` no layout de post (EN e PT) não tinha atributo `lang`. O `lang` no `<html>` cobre a página toda, mas especificar `lang` no `<article>` é especialmente útil para screen readers quando há conteúdo misto na mesma página, e é uma boa prática per WCAG 3.1.2.

**Mudança em `src/pages/blog/[...slug].astro`** (linha 119):
```astro
<article data-pagefind-body data-pagefind-filter={`lang:${lang}`} lang={postLang}>
```

**Mudança em `src/pages/pt/blog/[...slug].astro`** (linha 121):
```astro
<article data-pagefind-body data-pagefind-filter={`lang:${lang}`} lang={lang ?? 'pt'}>
```

### 5. SEO: `articleSection` no JSON-LD BlogPosting

**Problema**: O schema `BlogPosting` já tinha `keywords` (todos os tags como string) e `article:section` no OG meta, mas faltava `articleSection` no JSON-LD — que é o campo que o Google usa para identificar a categoria do artigo em rich results.

**Mudança em `src/layouts/PageLayout.astro`**:
```javascript
...(tags?.length && { articleSection: tags[0] }),
```

O primeiro tag é usado como seção (convenção: tags são ordenados por relevância no frontmatter). Consistente com o `<meta property="article:section">` já existente.

**Por que**: O `articleSection` em JSON-LD pode aparecer em breadcrumbs ricos nos resultados de busca do Google, especialmente para sites com categorias bem definidas. Para essays filosóficos com tags como `ai`, `law`, `process-metaphysics`, isso ajuda a agrupar os posts corretamente.

## Build

```
Discovered 2 languages: en, pt-br
Indexed 82 pages
Finished in 0.473 seconds
```

Prettier check: `All matched files use Prettier code style!` ✅

## Estado após esta sessão

- PR #217 mergeado ✅
- PR #216 prettier fix pushed → aguarda CI rerun ✅
- RankingView URLs corretas para posts PT ✅
- JSON-LD ItemList URLs corretas para posts PT ✅
- `lang` no `<article>` em posts EN e PT ✅
- `articleSection` no JSON-LD BlogPosting ✅

## Plano para próximas sessões

### Alta prioridade

1. **Verificar PR #216 pós-fix** — CI deve reprocessar com o prettier fix. Merge na próxima run se verde.

2. **Font Inter: importar apenas pesos usados** — `@import "@fontsource/inter"` carrega todos os pesos (100–900). Migrar para:
   ```css
   @import "@fontsource/inter/400.css";
   @import "@fontsource/inter/500.css";
   @import "@fontsource/inter/600.css";
   ```
   Reduz o bundle CSS e elimina subsets não usados. Impacto direto em LCP.

3. **Sitemap PT** — verificar se `/pt/` URLs aparecem corretamente no sitemap com `hreflang` e `lastmod`.

### Média prioridade

4. **Livros recentes no HomeAuthorRail** — Mostrar 2–3 livros recentes do Goodreads RSS no rail do autor (desktop). Parser já existe em `BooksPage.astro`. Fetch no build com `fallback: []`.

5. **Focus management: focar `<h1>` em vez de `<main>`** — Após `astro:after-swap`, focar `document.querySelector('h1')` dá um anúncio mais informativo para screen readers ("título do artigo") do que focar `<main>` (sem anúncio). Mudança de 2 linhas em PageLayout.

6. **Archive pagination** — Threshold: 50+ posts EN no mesmo ano. Atualmente 42+ em 2026. Monitorar.

### Baixa prioridade

7. **RSS bilíngue** — link de subscribe no footer separado para EN e PT.

8. **Preload do font Inter** — link `rel="preload"` para o woff2 principal. Requer conhecer o hash de saída do Vite. Alternativa: usar `font-display: optional` para reduzir FOIT.

## Decisões arquiteturais

- **`articleSection: tags[0]`**: Primeiro tag como seção é a mesma heurística do `<meta property="article:section">` já existente. Não cria inconsistência. Alternativa (campo `section` dedicado no frontmatter) adicionaria complexidade sem benefício claro para um blog pessoal.

- **`lang` no `<article>` vs `<html>`**: O `lang` no `<html>` já cobre a página. O `lang` no `<article>` é redundante para páginas mono-lingual, mas defensivo para páginas que misturem conteúdo (search, tags, home). Custo zero, benefício marginal mas real para WCAG 3.1.2.

- **RankingView unificado vs separado por lang**: O `RankingView.astro` é um único componente reutilizado por EN e PT. A abordagem de passar `lang` nos dados (via `RankPostInfo.lang` e `UnratedItem.lang`) é mais correta do que ter dois componentes separados. A interface `RankPostInfo` já tinha `lang` — era só a função `postHref` e os templates hardcoded que ignoravam o campo.

## Arquivos modificados

- `src/components/RankingView.astro` — interface UnratedItem + postHref + podium + table + unrated links
- `src/pages/ranking.astro` — JSON-LD URL + lang em unrated
- `src/pages/pt/ranking.astro` — JSON-LD URL + lang em unrated
- `src/pages/blog/[...slug].astro` — lang no article
- `src/pages/pt/blog/[...slug].astro` — lang no article
- `src/layouts/PageLayout.astro` — articleSection no JSON-LD
- `.routines/2026-06-02T14-00-00-ranking-urls-lang-article-jsonld.md` — este arquivo

---

_Sessão: 2026-06-02 | Branch: `claude/great-mccarthy-CUkUc` | franklinbaldo@gmail.com_
