---
date: 2026-05-20
slug: home-cta-ranking-schema-breadcrumbs
branch: claude/great-mccarthy-DlvXV
status: pr-open
session: 16
---

# Sessão 2026-05-20 (T14) — Home CTA "latest essay", ItemList schema no ranking, breadcrumbs visuais

## Contexto

Décima-sexta sessão com o sistema `.routines/`. Branch designado: `claude/great-mccarthy-DlvXV`.

Estado ao chegar:

- PR #158 aberto (hronir run 2026-05-20T13-16-16 — pontifex-research) — CI verde ✅
- PR #102 aberto (Optimize profile visuals) — Kilo failed, base ~10 dias desatualizada
- Commit `3652165` em main: hronir run mergeado (sessão 15)
- 36 pares EN↔PT (100% cobertura)
- Backlog prioritário: PR #102 reimplementação, OG image verify, ranking structured data

## PRs revisados

| PR   | Título                                                           | Ação                                                                        |
| ---- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| #158 | hronir: run 2026-05-20T13-16-16 + edit-worst (pontifex-research) | **Mergeado** (squash) — CI verde ✅ Kilo ✅ GitGuardian ✅                  |
| #102 | Optimize profile visuals and fix latest essay logic              | **Fechado** — base muito desatualizada, Kilo failed, avatar binário ausente |

## Ações realizadas nesta sessão

### 1. "Read latest essay" CTA na home (EN e PT)

**Problema**: A home page tinha apenas nome, tagline e lista de posts recentes. Não havia nenhum CTA claro para o leitor começar a leitura imediatamente — primeira ação exigia scroll.

**Arquivos modificados**: `src/pages/index.astro`, `src/pages/pt/index.astro`

**Como funciona**:

```typescript
const latest = all[0]; // posts já ordenados por date desc, filtrado por lang
const latestHref = latest ? `/blog/${latest.id}/` : "/archive/";
```

Na hero section:

```html
<p class="home-cta">
  <a href={latestHref} class="contrast">Read latest essay →</a>
</p>
```

EN: "Read latest essay →" | PT: "Ler último ensaio →"

**Por que importa**: CTA claro na dobra aumenta engagement e reduz bounce rate. O link aponta para o post mais recente na língua correta da página.

### 2. ItemList JSON-LD para /ranking/ e /pt/ranking/

**Problema**: As páginas de ranking listam posts ordenados por score OpenSkill, mas não tinham structured data. O Google não conseguia inferir que é uma lista ordenada de conteúdo.

**Arquivos modificados**: `src/pages/ranking.astro`, `src/pages/pt/ranking.astro`

**Schema adicionado**:

```json
{
  "@type": "ItemList",
  "name": "Ranking — Franklin Baldo",
  "description": "Posts ranked by pairwise comparisons under the Hrönir system.",
  "inLanguage": "en-US",
  "numberOfItems": 36,
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Post Title", "url": "https://franklinbaldo.github.io/blog/..." }
  ]
}
```

Injetado via `slot="head"` no PageLayout. A PT version usa `inLanguage: "pt-BR"` e descrição em português.

**Consistência**: Agora todas as páginas de índice têm structured data — `/archive/` (CollectionPage), `/tags/` (ItemList), `/tags/[tag]/` (CollectionPage), `/ranking/` (ItemList) ✅

### 3. Breadcrumbs visuais nos posts

**Problema**: Os posts já tinham `BreadcrumbList` JSON-LD (injetado via PageLayout), mas não havia UI visual de breadcrumbs. Leitores vindos de busca orgânica não viam onde estavam na estrutura do site.

**Arquivo modificado**: `src/pages/blog/[...slug].astro`

**Markup**:

```html
<nav aria-label="Breadcrumb" class="post-breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/archive/">Archive</a></li>
    <li aria-current="page">{title}</li>
  </ol>
</nav>
```

- EN: Home → Archive → {title}
- PT: Início → Arquivo → {title}
- `aria-current="page"` para acessibilidade
- Título truncado com `max-width: 40ch` + `text-overflow: ellipsis` em mobile
- Separadores via CSS `::before` content `" / "` — sem markup extra

**Por que importa**: Breadcrumbs visuais ajudam o usuário a entender a hierarquia e navegar de volta. Complementam o BreadcrumbList JSON-LD que o Google já lê.

### 4. Fechamento do PR #102

PR #102 "Optimize profile visuals" fechado. Motivos:

- Base ~10 dias desatualizada (fundada em commit `f7c0f62`, main em `3652165`)
- Kilo Code Review failed
- Dependia de avatar pixel art binário (`src/assets/images/avatar.png`) ausente do repo
- O `.gemini/skills/` não é relevante para este projeto Astro

Features válidas do PR #102 que foram/serão implementadas:

- ✅ "Read latest essay" → implementado nesta sessão
- ❌ Pixel art avatar → bloqueado sem binário do usuário
- ❌ Astro `<Image>` para AuthorBio/HomeAuthorRail → requer `src/assets/images/avatar.png`

## Build

343 páginas — sem erros, 0 type errors.

## Estado atual após esta sessão

- Home CTA "Read latest essay" / "Ler último ensaio" ✅ (novo)
- ItemList JSON-LD em /ranking/ e /pt/ranking/ ✅ (novo)
- Breadcrumbs visuais em todos os posts ✅ (novo)
- PR #102 fechado ✅ (limpeza)
- Reading time no arquivo ✅ (sessão 15)
- CollectionPage JSON-LD em /archive/ e /pt/archive/ ✅ (sessão 15)
- ItemList JSON-LD em /tags/ e /pt/tags/ ✅ (sessão 15)
- PostNav prev/next ✅ (sessão 14)
- Tags CollectionPage JSON-LD ✅ (sessão 14)
- About: 100% EN+PT ✅ (sessão 14)
- PostCard: tags visíveis ✅ (sessão 14)
- Home title descritivo EN/PT ✅ (sessão 13)
- WebSite JSON-LD SearchAction ✅ (sessão 13)
- 36 pares EN↔PT via translationKey ✅
- LanguageSwitcher auto-redirect por navegador ✅
- Hreflang sitemap ✅
- RSS split EN/PT ✅

## Cobertura de structured data por tipo de página

| Tipo de página    | JSON-LD                      | Status    |
| ----------------- | ---------------------------- | --------- |
| Artigo individual | BlogPosting + BreadcrumbList | ✅        |
| /archive/         | CollectionPage               | ✅        |
| /tags/ (índice)   | ItemList                     | ✅        |
| /tags/[tag]/      | CollectionPage               | ✅        |
| /ranking/         | ItemList                     | ✅ (novo) |
| Home (/)          | WebSite + Person             | ✅        |
| /about/           | WebSite + Person             | ✅        |

## Próximas sessões — backlog priorizado

### Alta prioridade

1. **Pixel art avatar** — Requer que Franklin faça drop de `/public/avatar-pixel.png` (ou `src/assets/images/avatar.png`) no repo. Com o binário disponível:
   - Substituir `/public/avatar.png` pela versão pixel art
   - Usar `astro:assets` `<Image>` em `AuthorBio.astro` e `HomeAuthorRail.astro`

2. **OG image per-post** — Verificar se `/og/[...slug].png` está sendo gerado e servido corretamente no deploy. Spot-check 3–5 posts com social card preview.

3. **Suno post restructuring** — BLOQUEADO: requer arquivo `src/data/suno-songs.jsonl` do usuário.

### Média prioridade

4. **Archive pagination** — `paginate()` antes de ter >60 posts (36 EN + 36 PT atualmente).

5. **Pagefind URL param** — Verificar se `?q=` pré-popula a search box no deploy real.

6. **HomeAuthorRail no home** — O componente existe mas não está sendo usado. Avaliar integração como bloco abaixo do hero ou como sidebar em telas largas.

7. **PR #38** (dependabot defu 6.1.4 → 6.1.6) — atualização simples de patch.

### Baixa prioridade

8. **Focus management** (ClientRouter) — acessibilidade em transições de página.

9. **Breadcrumb truncation mobile** — O `max-width: 40ch` no item `[aria-current="page"]` pode truncar títulos longos. Considerar duas linhas em vez de ellipsis.

## Decisões arquiteturais

- **"Read latest essay" aponta para `all[0]`**: Posts EN/PT já vêm filtrados por idioma e ordenados por date desc. `all[0]` é sempre o mais recente publicado naquela língua. Sem depender de `featured` flag.

- **Breadcrumbs antes do `<article>`**: Posicionado fora do `<article data-pagefind-body>` para não interferir com o índice de busca do Pagefind.

- **ItemList no ranking usa `filter((item) => item.url)`**: Posts sem `translationKey` não têm URL resolvida — filtramos em vez de deixar `url: undefined` no JSON-LD.
