---
type: changelog
date: 2026-09-18
description: Coordinate dependency upgrades, align the Astro 7.3 stack with MDX 8, and replace stale Dependabot lockfile drift with one tested dependency graph.
tags: [dependencies, astro, mdx, maintenance, ci]
---

# Coordinated dependency refresh

This change consolidates the open dependency backlog into one coherent graph instead of merging stale Dependabot lockfiles independently.

The critical compatibility fix is the Astro content stack: Astro 7.3.3 is paired with @astrojs/mdx 8.0.1 and @astrojs/markdown-remark 7.3.1 so MDX and markdown-satteri use the same 0.11/0.4 generation of Astro internals.

The branch also absorbs the current minor and patch updates plus the individually queued dependency fixes that remain compatible with the resulting graph. The intent is to validate one lockfile with build, lint, tests and the repository's normal CI before superseding the old dependency PRs.

Maintenance note (2026-09-20): revalidated this consolidated dependency surface against the current `main` rather than opening another dependency PR; dependency intent is unchanged.
