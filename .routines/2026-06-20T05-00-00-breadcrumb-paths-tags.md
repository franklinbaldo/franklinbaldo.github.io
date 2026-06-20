---
date: 2026-06-20T05:00:00
slug: breadcrumb-paths-tags
branch: claude/sleepy-pasteur-mojyai
status: pr-open
issues: [590]
pr_opened: 594
pr_merged: 592
---

# Sessão 2026-06-20 — BreadcrumbList para /paths/ e /tags/

## Contexto ao chegar

- 13 issues `routine` abertas (faixa saudável 10–20)
- PR da run anterior: #592 (seo: hreflang x-default) já havia sido mergeado pelo Franklin na run de 2026-06-19. Nenhum PR `routine` pendente para mergear.
- Main no commit `f45d1ee` (merge do PR #592)

## O que mergeou

PR #592 (hreflang x-default fallback para homepage EN) — mergeado pelo Franklin ainda durante a run de 2026-06-19.

## O que foi feito

**Issue #590** (priority:media) — seo: BreadcrumbList structured data para /paths/[slug] e /tags/[tag]

### Análise

`PageLayout.astro` já emitia `BreadcrumbList` para posts (`type="article"`), com hierarquia fixa: Home → Blog → título do post. Mas as páginas `/paths/[slug]/`, `/pt/paths/[slug]/`, `/tags/[tag]/` e `/pt/tags/[tag]/` não tinham nenhuma BreadcrumbList — ficavam com apenas o schema `WebSite` (para navegação não-artigo) ou o `CollectionPage` inline (para tags).

### Implementação

1. **`src/layouts/PageLayout.astro`** — adicionado prop `breadcrumb?: Array<{ name: string; item: string }>`. Quando passado, emite um `BreadcrumbList` JSON-LD adicional no `<head>`, separado do breadcrumb de artigos. O prop coexiste sem conflito com o `breadcrumbLd` existente (que só ativa para `type="article"`).

2. **`src/pages/paths/[slug].astro`** — breadcrumb 2 níveis:
   - EN: Home (`/`) → {path.title.en} (`/paths/{slug}/`)
   - (sem nível intermediário `/paths/` pois não há index page)

3. **`src/pages/pt/paths/[slug].astro`** — breadcrumb 2 níveis:
   - PT: Início (`/pt/`) → {path.title.pt} (`/pt/paths/{slug}/`)

4. **`src/pages/tags/[tag].astro`** — breadcrumb 3 níveis:
   - EN: Home (`/`) → Tags (`/tags/`) → `#{tag}` (`/tags/{tag}/`)
   - `/tags/` index existe → hierarquia completa

5. **`src/pages/pt/tags/[tag].astro`** — breadcrumb 3 níveis:
   - PT: Início (`/pt/`) → Etiquetas (`/pt/tags/`) → `#{tag}` (`/pt/tags/{tag}/`)

### Verificação no HTML gerado

| Página | BreadcrumbList |
|--------|---------------|
| `/tags/AI/` | Home → Tags → #AI ✅ |
| `/pt/tags/ia/` | Início → Etiquetas → #ia ✅ |
| `/paths/agency-and-constraint/` | Home → Agency and Constraint ✅ |
| `/pt/paths/memory-and-funes/` | Início → Memória e Funes ✅ |

### CI local

- `npm run build` — 2003 páginas, sem erros ✅
- `npx prettier --check .` — OK ✅
- `npm run hronir:doctor` — 0 inconsistências ✅
- `npm run check:hygiene` — OK ✅

## O que ficou para a próxima run

- Verificar screenshot de produção pós-deploy (sem impacto visual — só metadados `<head>`)
- Próximas prioridades: #583 (a11y: skip-link PT), #495 (aria-label nav), #552 (focus-visible), #553 (CLS imagens), #585 (font-display Fira Code)
- Issues de baixa restantes: #249, #250, #251, #495, #552, #553, #583, #585, #587, #588, #589, #591
