---
type: changelog
date: 2026-09-22
description: Canonicalize the remaining software-engineering tag collision on the hyphenated label, preserve the retired spaced URLs, and align curated tag metadata with the canonical key.
tags: [seo, taxonomy]
---

# `software engineering` now converges on `software-engineering`

The final within-language collision tracked in #1909 is resolved as an explicit taxonomy migration. Three published assignments still used the spaced label: the English and Portuguese Building Funes pair plus the English Jules harness post. Existing published content already used `software-engineering`, including the delegation/harness family, so the hyphenated form is the lower-friction canonical label and matches the Portuguese `engenharia-de-software` migration.

Those three frontmatter assignments now use `software-engineering`. The retired `/tags/software%20engineering/` and `/pt/tags/software%20engineering/` URLs remain valid through explicit redirects to the hyphenated routes; no normalization heuristic is introduced. The curated tag-description key moves with the canonical label, and the resolved group is removed from the known-debt allowlist so any future within-language spelling split fails the taxonomy guard.
