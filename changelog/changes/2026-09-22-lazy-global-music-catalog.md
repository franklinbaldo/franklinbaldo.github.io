---
type: changelog
date: 2026-09-22
description: Move the global music-player catalog out of every page HTML and load the full static catalog only when playback needs it.
tags: [blog, performance, ux, music]
---

# Lazy-load the global music catalog

The global player now keeps only a one-song bootstrap in page HTML and exposes the full ranked catalog as `/music-player.json`. Playback, queue navigation, favorites and post links still use the same catalog projection, but the full array is fetched only after a music interaction. The build now measures and guards the bootstrap payload so the full catalog cannot silently return to every page.
