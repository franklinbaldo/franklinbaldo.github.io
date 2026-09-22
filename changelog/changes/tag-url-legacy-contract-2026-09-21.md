---
type: changelog
date: 2026-09-21
description: Freeze the current public URL contract for all tag variants involved in the six known taxonomy collisions before canonicalization work begins.
tags: [seo, taxonomy, testing]
---

# Legacy tag URLs get a regression contract

The shared `tagUrl()` helper now has an explicit compatibility test covering every spelling in the six collision groups tracked by #1909, in both English and Portuguese route prefixes. This records the pre-migration URLs as executable expectations so later canonicalization work cannot silently normalize, re-encode, or drop an old public path without deliberately updating the compatibility layer.

No tag labels, frontmatter, redirects, aliases, canonicals, or public routes change in this card.
