---
date: 2026-06-23T05:00:00
slug: preconnect-dns-prefetch
branch: claude/sleepy-pasteur-9vyk9u
status: pr-open
issues: [589]
pr_opened: null
pr_merged: 642
---

# Sessão 2026-06-23 — perf: preconnect + dns-prefetch para domínios externos

## Contexto ao chegar

- PR #642 (`perf: preload Inter 400 WOFF2 no head`) estava aberto desde 2026-06-22, sem label `routine` mas claramente gerado pela run anterior. CI verde, sem review humano bloqueando. Mergei via `merge_pull_request` (merge commit, conforme convenção do repo).
- Backlog: 9 issues `routine` abertas antes do merge. Após merge (#249 auto-fechado pelo PR #642) + fechamento de #585 (Fira Code não instalado), ficamos em 7 — abaixo do mínimo de 10. Abrindo 3 novas issues para repor.

## Verificação pós-merge PR #642

Deploy em progresso no momento da execução (`in_progress` desde 04:24Z). Não há screenshot de prod disponível nesta run; a verificação visual fica para a próxima run.

## Issues fechadas por obsolescência

- **#585** (`perf: font-display Fira Code`): `@fontsource/fira-code` não está instalado no projeto. O blog usa `var(--pico-font-family-monospace, monospace)` via Pico.css. Fechada como `not_planned` com explicação.

## Reabastecimento do backlog (7 → 10 issues)

Criadas 3 novas issues:
- **#677**: `a11y: i18n strings no ShareButton para PT-BR` — `aria-label`, flash labels e label padrão do ShareButton.astro estão hardcoded em inglês, violação WCAG 2.1 SC 3.1.1.
- **#678**: `seo: JSON-LD MusicRecording em posts de música` — Posts `postType: music` emitem só `Article` schema; `MusicRecording` com `embedUrl` Suno melhoraria rich results.
- **#679**: `perf: fetchpriority="high" na hero image above-the-fold de posts` — Hero image é candidata LCP; `loading="eager"` + `fetchpriority="high"` elimina o atraso de lazy-load.

## Trabalho desta run — issue #589

**perf: preconnect e dns-prefetch para domínios de terceiros** em `src/layouts/PageLayout.astro`.

### Domínios confirmados no código-fonte

- `cdn2.suno.ai` — imagens de capa de músicas Suno (`src/pages/blog/[...slug].astro:172`)
- `suno.com` — embeds iframe (`src/components/SunoEmbed.astro:12`) e links externos
- `i.gr-assets.com` — CDN típica para capas de livros do Goodreads RSS (campo `book_image_url` renderizado como `<img>` em `HomeAuthorRail.astro` e `BooksPage.astro`)

### Mudança aplicada

Adicionadas 3 linhas em `PageLayout.astro` após o `<link rel="preload">` para Inter 400:

```html
<link rel="preconnect" href="https://cdn2.suno.ai" crossorigin="anonymous" />
<link rel="dns-prefetch" href="//suno.com" />
<link rel="dns-prefetch" href="//i.gr-assets.com" />
```

`preconnect` para `cdn2.suno.ai` porque serve imagens que aparecem em posts de música (potencialmente LCP em primeiras visitas). `dns-prefetch` para `suno.com` e `i.gr-assets.com` — custo baixo, sem TCP, apenas antecipa o DNS lookup.

### CI local

- `npm run build` ✅ (206 páginas, 0 erros)
- `npx astro check` ✅ (0 erros, 0 novos warnings)
- `npx prettier --check .` ✅

## Para a próxima run

- Screenshot de prod do PR #642 (Inter preload) — confirmar ausência de regressão visual.
- Verificar se o preconnect para `cdn2.suno.ai` aparece no HTML gerado (buscar por `preconnect` no source de qualquer página).
- Candidatos do backlog: #677 (ShareButton i18n), #250 (OG image paths), #552 (focus-visible), #251 (skip-to-content PT).
