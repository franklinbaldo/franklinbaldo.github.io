---
type: changelog
date: 2026-09-22
description: Canonicalize the Portuguese tag ia to IA while preserving the legacy lowercase public URL with a redirect.
tags: [seo, taxonomy]
---

# `ia` now converges on `IA`

The Portuguese `ia` / `IA` collision tracked in #1909 is resolved by using the conventional uppercase acronym as the canonical label. The three published Portuguese posts still using lowercase `ia` now use `IA`, matching the existing uppercase tag already present in the corpus.

The old `/pt/tags/ia/` URL remains valid through an explicit redirect to `/pt/tags/IA/`. The redirect is declared rather than inferred from normalization, and the `ia` collision is removed from the known-debt allowlist so a future lowercase reintroduction beside `IA` fails the taxonomy guard.
