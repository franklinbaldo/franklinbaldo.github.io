---
type: changelog
date: 2026-10-19
description: Restore selected historical blog URLs in the experimental SSG output using canonical published-only redirects and output validation.
tags: [blog, ssg, redirects, seo, compatibility]
---

# SSG: history-preserving redirects

- Reuses the canonical generated blog alias map and real published post identities to project redirects only when the destination exists in SSG.
- Uses a native MiniJinja redirect layout, rather than generating opaque HTML from a Node renderer.
- Guards against path traversal, off-site destinations, encoded separators, private/unpublished targets, duplicate conflicts and overwriting public content.
- Requires noindex, correct canonical, refresh, fallback and target-file checks against the actual SSG build.
- Persists generated/skipped counts and reasons in CI artifacts so historical URLs are not silently lost.
- Leaves Zola publication unchanged while incomplete route and functional parity remain explicit.
