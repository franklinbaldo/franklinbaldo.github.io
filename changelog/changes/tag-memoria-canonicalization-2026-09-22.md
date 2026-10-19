---
type: changelog
date: 2026-09-22
description: Canonicalize the Portuguese tag memoria to memória while preserving the legacy public URL with a redirect.
tags: [seo, taxonomy]
---

# `memoria` now converges on `memória`

The Portuguese `memoria` / `memória` collision tracked in #1909 is resolved as a deliberately narrow pilot. The only published post still using the unaccented spelling now uses `memória`, matching Portuguese orthography and the existing curated tag description.

The old `/pt/tags/memoria/` URL remains valid through an explicit redirect to `/pt/tags/mem%C3%B3ria/`. The redirect is generated from a declared alias rather than inferred from normalization, so no broader taxonomy policy is introduced. The collision is removed from the known-debt allowlist: if the unaccented variant is reintroduced beside `memória`, the tag collision guard will fail instead of silently accepting the regression.
