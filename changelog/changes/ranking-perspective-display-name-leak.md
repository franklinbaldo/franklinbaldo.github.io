---
type: changelog
date: 2026-09-05
description: Perspective display name replaces the raw internal slug across battles and dossier pages.
tags: [copy, i18n, ranking]
---

# Perspective display name replaces the raw slug

- Reader-facing text on `/ranking/battles/`, `/ranking/battles/<id>/`,
  `/ranking/posts/<key>/`, and the "Recent Battles" section of `/ranking/`
  now shows the perspective's display name (e.g. "The Applied Thinker")
  instead of the raw internal slug (`applied-thinker`), including the
  `<meta description>` on the battle detail page — previously the worst
  offender, leaking the id even without a `replace(/-/g, " ")`.
- `src/lib/hronir-rank.ts` gains a shared `perspectiveLabel(id)` helper
  (falls back to the slugified id for orphaned ids), replacing four
  near-duplicate inline implementations.
- `src/hronir/perspectives.ts`: `listPerspectives()` is now memoized, since
  it is called once per generated battle/dossier page.
- `data-perspective` / `href` / `style` attributes are unchanged — only
  visible text and the meta description switched to the display name.
