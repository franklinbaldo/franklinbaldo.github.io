---
date: 2026-06-19T05:00:00
slug: hreflang-xdefault
branch: claude/sleepy-pasteur-k95g7o
status: pr-open
issues: [584]
pr_opened: null
pr_merged: null
---

# Sessão 2026-06-19 — hreflang x-default fallback para homepage EN

## Contexto ao chegar

- 9 issues `routine` abertas — abaixo do mínimo de 10; backlog precisava de reposição
- PR pendente da run anterior: nenhum com label `routine` aberto; PR #582 (Goodreads rail) já havia sido mergeado e logado na run de 2026-06-18
- Main no commit `61e765f0` (merge do hronir 10 matches, 2026-06-18)

## Backlog reposto

Criei 5 novas issues para trazer o backlog de 9 → 14:

- **#587** (baixa): seo: PersonPage/ProfilePage schema para /about/ e /pt/about/
- **#588** (baixa): ux: Web Share API — botão nativo de compartilhamento em posts
- **#589** (baixa): perf: preconnect e dns-prefetch para domínios de terceiros
- **#590** (media): seo: BreadcrumbList para /paths/[slug] e /tags/[tag]
- **#591** (baixa): ux: reading time visível nos PostCards do arquivo

## O que foi feito

**Issue #584** — seo: hreflang x-default apontando para raiz EN em todas as páginas.

### Análise

`PageLayout.astro` calculava `xDefaultHref` assim:
```js
const xDefaultHref = lang === DEFAULT_LANG
  ? canonical.href
  : (translations[DEFAULT_LANG] ? new URL(translations[DEFAULT_LANG], Astro.site).href : null);
```

Quando `lang !== DEFAULT_LANG` (PT) e a página não declara `translations['en']` — caso real em `src/pages/pt/tags/[tag].astro` para tags sem contraparte EN (`hasEnCounterpart = false` → `translations={}`) — `xDefaultHref` ficava `null` e o `<link rel="alternate" hreflang="x-default">` era omitido. Isso é contra a recomendação do Google: páginas sem x-default ficam sem sinal de "versão padrão" para buscadores fora de EN/PT.

### Implementação

Em `src/layouts/PageLayout.astro` (linhas 75–79):
```js
// Antes:
const xDefaultHref = lang === DEFAULT_LANG
  ? canonical.href
  : (translations[DEFAULT_LANG] ? new URL(translations[DEFAULT_LANG], Astro.site).href : null);

// Depois:
const enHomepageHref = Astro.site ? new URL("/", Astro.site).href : null;
const xDefaultHref = lang === DEFAULT_LANG
  ? canonical.href
  : (translations[DEFAULT_LANG] ? new URL(translations[DEFAULT_LANG], Astro.site).href : enHomepageHref);
```

Quando não há tradução EN declarada, o x-default cai para a homepage EN — padrão recomendado pelo Google Search Central.

### Verificação no HTML gerado

- `dist/pt/tags/capital-básico-universal/index.html` (tag só PT):
  `hreflang="x-default" href="https://franklinbaldo.github.io/"` ✅
- `dist/pt/tags/identity/index.html` (tag com EN):
  `hreflang="x-default" href="https://franklinbaldo.github.io/tags/identity/"` ✅ (não regrediu)

### CI local
- `npx astro check`: 0 errors, 0 warnings ✅
- `npx prettier --check .`: All matched files use Prettier code style ✅
- `npm run build`: 617 HTML pages, completed ✅

## O que ficou para a próxima run

- Verificar screenshot de produção após deploy (sem mudança visual — apenas metadados)
- Próximas prioridades: #590 (BreadcrumbList para paths/tags, priority:media), #584 é a única media que havia — agora o backlog tem nova media em #590
- Issues de baixa restantes: #249, #250, #251, #495, #552, #553, #583, #585, #587, #588, #589, #591
