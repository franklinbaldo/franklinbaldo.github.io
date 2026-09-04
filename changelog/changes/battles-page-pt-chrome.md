---
type: changelog
date: 2026-09-01
description: Localize structural chrome of the battle detail page for PT-only duels.
tags: [ux, i18n, ranking]
---

# Battle detail page follows the duel's language

- `src/pages/ranking/battles/[id].astro` no longer hardcodes `lang="en"`,
  English breadcrumbs, and `en-US` date formatting — it now resolves the
  page language from both duel sides, same pattern already used by
  `posts/[key].astro`.
- Applies to breadcrumbs, headings, aria-labels, and Winner/Challenger
  labels; technical badges (`Season N`, confidence, `content:`/`critique:`
  chips) stay untranslated per existing convention.
