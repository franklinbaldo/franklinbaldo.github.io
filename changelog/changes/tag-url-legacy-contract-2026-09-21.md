---
type: changelog
date: 2026-09-21
description: Freeze route construction for every tag spelling involved in the six known taxonomy collisions before canonicalization work begins.
tags: [seo, taxonomy, testing]
---

# Legacy tag routes get a regression contract

The shared `tagUrl()` helper now has an explicit compatibility test covering every spelling in the six collision groups tracked by #1909, under both English and Portuguese route prefixes. These are route-construction expectations rather than a claim that every spelling currently has posts in both languages; the corpus inventory remains available through `npm run check:tags -- --report`.

Together, the inventory and this test make later canonicalization safer: a migration cannot silently normalize or re-encode one of the known legacy spellings without deliberately updating the compatibility layer. No tag labels, frontmatter, redirects, aliases, canonicals, or public routes change in this card.
