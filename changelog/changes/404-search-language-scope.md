---
type: changelog
date: 2026-09-09
description: Scope the 404 page's search box to the page's own language.
tags: [a11y, i18n, search]
---

# 404 page search no longer mixes languages

- `src/pages/404.astro` and `src/pages/pt/404.astro`: the `pagefind-searchbox`
  had no language filter, unlike `search.astro`/`pt/search.astro` which
  already scope results with `data-filter="lang:en"` / `"lang:pt"`.
- A reader landing on a broken or old link — exactly the moment they most
  need search — got mixed EN+PT results instead of the same-language results
  the dedicated search pages already gave.
