---
type: changelog
date: 2026-09-22
description: Canonicalize the AI tag casing to lowercase in English and Portuguese while preserving both legacy uppercase public URLs with explicit redirects.
tags: [seo, taxonomy]
---

# `AI` now converges on `ai`

The `AI` / `ai` collision tracked in #1909 is resolved as a casing-only migration. The diagnostic inventory found 22 published assignments: 20 already used lowercase `ai`, while two paired posts used uppercase `AI`. Those two outliers now use the corpus-majority lowercase label in both route namespaces. This does not decide the separate editorial question of whether Portuguese `ai` and `IA` should eventually converge.

The old `/tags/AI/` and `/pt/tags/AI/` URLs remain valid through explicit redirects to `/tags/ai/` and `/pt/tags/ai/`. The aliases are declared rather than inferred from normalization, and the `ai` collision is removed from the known-debt allowlist so a future uppercase reintroduction beside `ai` fails the taxonomy guard.
