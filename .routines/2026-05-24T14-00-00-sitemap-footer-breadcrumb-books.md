---
date: 2026-05-24
slug: sitemap-footer-breadcrumb-books
branch: claude/great-mccarthy-ycWcI
status: pr-open
session: 19
---

# Sessão 2026-05-24 — Sitemap books/livros, footer completo, breadcrumb JSON-LD bilingue

## Contexto

Décima-nona sessão com o sistema `.routines/`. Branch designado: `claude/great-mccarthy-ycWcI`.

Estado ao chegar:

- PRs abertos: #177 (hronir run 2026-05-23, stale), #180 (hronir run 2026-05-24), #181 (video queue post), #182 (Books page), #183 (YouTube GAS script)
- main em `d2a4c92` (7 reader UX improvements)
- Livros/books recém adicionados por PR #182 mas faltando no sitemap e no footer
- Breadcrumb JSON-LD com labels hardcoded em inglês para posts PT

## PRs revisados e mergeados

| PR   | Título                                              | Ação                                                   |
| ---- | --------------------------------------------------- | ------------------------------------------------------ |
| #177 | hronir: run (2026-05-23, stale)                     | **Fechado** — CI failed, base stale, supersedido por #180 |
| #180 | hronir: run 2026-05-24T13-02-54                     | **Mergeado** (squash) — CI ✅ clean                      |
| #181 | video queue post: 35 talks AI agents + civic tech   | **Mergeado** (squash) — CI ✅ clean                      |
| #182 | Books page /books/ + /pt/livros/                    | **Mergeado** (squash) — CI ✅ clean                      |
| #183 | Google Apps Script YouTube weekly post              | **Aguardando** — CI ✅ mas Kilo ainda em progresso       |

## Ações realizadas nesta sessão

### 1. Sitemap: par `/books/` ↔ `/pt/livros/`

**Arquivo modificado**: `astro.config.mjs`

O PR #182 adicionou as páginas mas não atualizou os `staticPairs` do sitemap. Corrigido:

```js
[base + "/books/"]: base + "/pt/livros/",
```

Agora todas as páginas estáticas bilíngues têm hreflang no sitemap:

| Página  | EN          | PT            | Sitemap hreflang |
| ------- | ----------- | ------------- | ---------------- |
| Home    | /           | /pt/          | ✅               |
| About   | /about/     | /pt/about/    | ✅               |
| Archive | /archive/   | /pt/archive/  | ✅               |
| Tags    | /tags/      | /pt/tags/     | ✅               |
| Search  | /search/    | /pt/search/   | ✅               |
| Projects| /projects/  | /pt/projects/ | ✅               |
| Ranking | /ranking/   | /pt/ranking/  | ✅               |
| Music   | /music/     | /pt/musicas/  | ✅               |
| Books   | /books/     | /pt/livros/   | ✅ (novo)        |

### 2. Footer: links completos (Tags, Search adicionados)

**Arquivo modificado**: `src/components/Footer.astro`

Footer antes: Archive · Music · Ranking · Projects · About + RSS · GitHub  
Footer depois: Archive · **Tags** · Music · Books · Ranking · Projects · **Search** · About + RSS · GitHub

O footer agora espelha o nav do header completamente — crawler e usuário têm acesso a todas as páginas estáticas a partir de qualquer página.

### 3. Breadcrumb JSON-LD bilingue (fix de SEO)

**Arquivo modificado**: `src/layouts/PageLayout.astro`

**Bug**: Para posts em PT, o breadcrumb JSON-LD emitia:
```json
{ "name": "Home", "item": "https://franklinbaldo.github.io/" }
{ "name": "Blog", "item": "https://franklinbaldo.github.io/archive/" }
```

Isso é incorreto para posts PT: o home canônico PT é `/pt/` e o arquivo é `/pt/archive/`. Google usa esses dados para rich snippets; labels errados degradam a experiência de busca em PT.

**Fix**: Tornar os itens 1 e 2 do breadcrumb sensíveis ao `lang`:

```typescript
{
  name: lang === "pt" ? "Início" : "Home",
  item: new URL(lang === "pt" ? "/pt/" : "/", Astro.site).href,
},
{
  name: lang === "pt" ? "Arquivo" : "Blog",
  item: new URL(lang === "pt" ? "/pt/archive/" : "/archive/", Astro.site).href,
},
```

## Build

347 páginas — 0 errors, 0 type errors.

## Estado atual após esta sessão

- Sitemap hreflang completo para todas as 9 páginas estáticas bilíngues ✅ (novo)
- Footer com todas as páginas do nav + Tags e Search ✅ (novo)
- Breadcrumb JSON-LD bilingue correto para posts PT ✅ (novo fix de SEO)
- PR #177 fechado ✅
- PRs #180, #181, #182 mergeados ✅
- PR #183 (YouTube GAS) aguardando Kilo

## Próximas sessões — backlog priorizado

### Alta prioridade

1. **Pixel art avatar** — BLOQUEADO: requer drop de `/public/avatar-pixel.png` por Franklin.

2. **PR #183** — Aguardando Kilo Code Review. Se ✅, mergeado na próxima sessão.

3. **PT translation do post video-queue-ai-civictech** — O post tem `translationKey: video-queue-ai-civictech-2026-05` mas sem par PT. Requisito: todo post com par PT.

4. **OG image por página estática** — /books/, /music/, /ranking/, /projects/ usam o OG genérico (home.png). Criar OG específico aumentaria CTR em compartilhamentos.

### Média prioridade

5. **Archive pagination** — `paginate()` antes de >60 posts (atual: ~38 EN + ~38 PT).

6. **PR #38** (dependabot defu 6.1.4 → 6.1.6) — Atualização patch, avaliar segurança.

7. **Focus management** (ClientRouter) — Acessibilidade em transições de página.

8. **HomeAuthorRail mobile** — Considerar versão compacta (avatar + nome) acima do conteúdo em mobile.

### Baixa prioridade

9. **Ranking no nav principal** — Atualmente só no footer. Avaliar se o nav suporta mais um item.

10. **"Leituras recentes" no AuthorRail** — Mostrar 2-3 livros recentes do Goodreads na rail lateral.

## Decisões arquiteturais

- **Footer espelha o header nav**: Todas as páginas do nav header agora estão no footer. Isso melhora crawlability (pagerank interno) e UX (usuários que chegam ao fim da página têm acesso completo à navegação). A duplicação é intencional.

- **Breadcrumb JSON-LD vs visual**: O breadcrumb visual já estava correto (usava `t(lang, 'nav.home')` e `urlPrefix(lang)`). Apenas o JSON-LD estava errado. Fix cirúrgico no `PageLayout.astro` sem tocar no breadcrumb visual.

- **PT home no breadcrumb JSON-LD como `/pt/`**: Seguindo a convenção do sitemap onde `/pt/` é a home canônica PT. Consistent com o hreflang.
