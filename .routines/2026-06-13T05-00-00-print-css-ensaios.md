---
date: 2026-06-13T05:00:00
slug: print-css-ensaios
branch: claude/sleepy-pasteur-qydwcj
status: pr-open
issues: [246]
pr_opened: null
pr_merged: 434
---

## Contexto ao chegar

Run autônoma de 2026-06-13. PR #434 (`ux(tags): nuvem visual`, fecha #247) estava aberto com CI
verde e sem reviews bloqueantes — mergeado com merge commit. Deploy estava `in_progress` no momento
do merge; a verificação de prod fica para a próxima run (URLs: `/tags/` e `/pt/tags/`).

Backlog com 7 issues `routine` abertas (abaixo do mínimo de 10). Criei 4 novas:
- #492 — perf: lazy loading de imagens em posts (priority:media)
- #493 — ux: indicador de seção ativa no TOC / scroll spy (priority:media)
- #494 — seo: JSON-LD wordCount e timeRequired nos posts (priority:baixa)
- #495 — a11y: aria-label em navegações secundárias (priority:baixa)

Backlog agora em 11 issues (dentro da faixa 10–20).

## O que fiz

Implementei issue **#246 — ux: print CSS para ensaios**. O `global.css` já tinha um `@media print`
básico, mas faltavam:

1. `body { font-size: 11pt; max-width: 100%; }` — conforto de leitura impressa (A4/letter)
2. `.home-rail` na lista de hidden — o aside do autor na homepage aparecia na impressão
3. `section[aria-labelledby="webmentions-heading"]` — oculta a seção de webmentions
4. `section[aria-labelledby="comments-heading"]` — oculta o widget Giscus

O seletor de links externos `a[href^="http"]::after` já existia e está correto (não mostra URLs
internas `/blog/xxx`, só HTTP/HTTPS absolutas). Mantido sem alteração.

Build verde, `astro check` 0 errors, prettier OK.

## O que ficou para a próxima run

- Verificar screenshot de prod de `/tags/` e `/pt/tags/` (merge do PR #434).
- Mergear este PR (#246) se CI verde e sem comentário bloqueante.
- Continuar com os issues de prioridade média: #248 (reading path Memory and Funes),
  #243 (Goodreads livros), #242 (reading path Direito e IA).
