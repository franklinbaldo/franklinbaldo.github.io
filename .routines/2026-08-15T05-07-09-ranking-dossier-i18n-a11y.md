---
date: "2026-08-15T05:07:09Z"
branch: claude/ecstatic-hawking-f3cx8j
status: open
---

# Sessão 2026-08-15T05-07-09 — UX/UI

Issues fechadas: #1535, #1539

O que foi feito:

- #1535: `/ranking/posts/[key].astro` (dossiê de ranking) agora localiza
  `lang`/`Breadcrumbs`/`HronirExplainer` a partir de `postInfo.lang` em vez
  de fixar `"en"`, e todas as strings de UI da página (rank change, win
  rate, wins/duels, sparkline caption, perspective rankings, duel history,
  won/lost, vs, analysis link, breadcrumb Home/Ranking) passam por um
  objeto `strings` en/pt local ao arquivo. `RankingView.astro:331` também
  localiza o tooltip "Dossier: {title}" via novo campo `dossierTooltip` em
  `RankingStrings`, preenchido em `ranking.astro`/`pt/ranking.astro`.
- #1539: `PathsTeaser.astro` — link "Start here →"/"Começar →" repetido em
  cada card de reading path agora tem `aria-label` distinto
  (`"${startHere} — ${pick(lang, path.title)}"`), texto visível inalterado.

CI local: astro check ✅ (0 erros, warnings pré-existentes) · prettier ✅ ·
build ✅. Conferido `dist/ranking/posts/<key>/index.html` (en) e
`dist/pt/ranking/index.html` + `dist/pt/index.html` (pt) — strings e
aria-labels corretos no idioma certo.
