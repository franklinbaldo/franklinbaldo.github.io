---
type: changelog
date: 2026-09-22
description: Canonicalize the Portuguese software-engineering tag on the hyphenated label while preserving the retired space-containing public URL with an explicit redirect.
tags: [seo, taxonomy]
---

# `engenharia de software` now converges on `engenharia-de-software`

The Portuguese `engenharia de software` / `engenharia-de-software` collision tracked in #1909 is resolved as an explicit taxonomy migration. The corpus had one published assignment on each spelling. This migration keeps `engenharia-de-software`, which already labels the Portuguese harness post paired with the English `software-engineering` tag and yields a stable path segment without changing the tag model.

The published post that still used `engenharia de software` now uses the canonical hyphenated label. The old `/pt/tags/engenharia%20de%20software/` URL remains valid through an explicit redirect to `/pt/tags/engenharia-de-software/`; no normalization heuristic is introduced. The resolved group is removed from the known-debt allowlist so reintroducing both spellings in Portuguese fails the taxonomy guard.
