---
type: changelog
date: 2026-09-08
description: Battle archive dates render in pt-BR for duels between two PT posts, matching the single-duel page.
tags: [i18n, ranking]
---

# Battle archive dates localize per duel

- `/ranking/battles/` and its pagination pages (`/ranking/battles/page/<n>/`)
  formatted every duel's date as `en-US` regardless of the posts involved,
  unlike `/ranking/battles/<id>/`, which already resolves the date to the
  duel's language. Both index templates now share the same rule: a duel
  reads as `pt-BR` only when both the winner and the loser are `pt` posts.
- No visible change today — no duel between two PT-only posts currently
  exists — but the bug was live and would have surfaced the moment one did.
- Documented, as code comments, the decision to keep these index pages'
  structural chrome (breadcrumbs, headings) in English: they list items
  across every language pair, so there is no single "page language" to
  switch to, unlike the single-duel and single-perspective detail pages.
