---
type: changelog
date: 2026-09-20
description: Finish the dependency backlog with coordinated major upgrades for TypeScript, OpenSkill and pinned GitHub Actions on top of the current dependency graph.
tags: [dependencies, typescript, openskill, github-actions, maintenance]
---

# Final coordinated major dependency refresh

This change finishes the dependency backlog after the coordinated minor/patch refresh.

It upgrades TypeScript 5.9 to 7.0 and OpenSkill 4 to 5 without replacing the already-reconciled Astro/MDX lockfile. The OpenSkill transitive runtime closure is transplanted onto the current lock graph rather than accepting the stale Dependabot lock wholesale.

Pinned GitHub Actions are upgraded together so CI exercises the new action generations as part of this pull request: checkout 7.0.1, setup-node 7.0.0, cache 6.1.0, upload-pages-artifact 5.0.0 and deploy-pages 5.0.1.

The old individual Dependabot PRs become superseded once this coordinated change passes the repository gates.
