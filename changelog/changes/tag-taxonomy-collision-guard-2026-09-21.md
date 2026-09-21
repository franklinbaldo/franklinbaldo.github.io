---
type: changelog
date: 2026-09-21
description: Prevent new SEO-fragmenting tag variants while preserving the six existing taxonomy collisions for deliberate migration.
tags: [seo, taxonomy, ci]
---

# Tag taxonomy gains a collision guard

CI now normalizes published tag labels conservatively for diagnosis (Unicode decomposition, accent removal, case folding and separator collapse) and fails when a new collision or a new variant inside an existing collision appears. The six collision groups already documented in #1909 remain an exact allowlist only; this does not choose canonical labels, rewrite frontmatter or change public tag URLs.
