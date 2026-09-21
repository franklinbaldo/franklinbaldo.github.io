---
type: changelog
date: 2026-09-18
description: Speed up normal GitHub Pages deploys by reusing the committed Repo Factory snapshot and cancelling superseded builds.
tags: [ci, github-pages, performance, build]
---

# Faster Pages deploys

Normal pushes to `main` no longer refresh the public Repo Factory snapshot before every Astro build. That refresh polls dozens of repositories and was adding roughly two minutes to each deploy. Scheduled and repository-dispatch builds still refresh it, and `REFRESH_REPO_FACTORY=1` remains available for explicit refreshes.

The Pages workflow now cancels an older in-progress deploy when a newer commit arrives, so stale builds do not delay the latest site version.
