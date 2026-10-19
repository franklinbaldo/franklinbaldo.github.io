---
type: changelog
date: 2026-09-21
description: "Updates CI and deploy Astro caching to actions/cache 6.1.0 and keeps restore/save on the same pinned release."
tags: [ci, dependencies, performance, maintenance]
---

- Replaces the v4.3.0 Astro cache action in pull-request builds and deploys with actions/cache 6.1.0 at pinned SHA `55cc8345863c7cc4c66a329aec7e433d2d1c52a9`.
- Aligns the standalone `actions/cache/restore` step to the same v6.1.0 release, avoiding mixed cache-action generations.
- Does not change site content, routing, or cache keys.
