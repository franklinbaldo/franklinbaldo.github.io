---
type: changelog
date: 2026-09-20
description: Finish the dependency backlog with OpenSkill 5, the latest Astro-compatible TypeScript 6, and coordinated GitHub Actions major upgrades.
tags: [dependencies, typescript, openskill, github-actions, maintenance]
---

# Final coordinated major dependency refresh

This change finishes the remaining dependency backlog on top of the current main.

OpenSkill moves from 4.1.1 to 5.0.1. TypeScript moves from 5.9.3 to 6.0.3, the newest line accepted by the currently published @astrojs/check 0.9.10. TypeScript 7.0.2 was tested and is intentionally deferred because Astro's check package currently declares a TypeScript 5/6 peer range.

Pinned GitHub Actions move together: checkout 7.0.1, setup-node 7.0.0, upload-pages-artifact 5.0.0 and deploy-pages 5.0.1. actions/cache 6.1.0 had already landed on main separately and is preserved rather than reapplied.

The OpenSkill runtime dependency closure is layered onto the already-reconciled current lock graph instead of replacing it with a stale Dependabot lockfile.
