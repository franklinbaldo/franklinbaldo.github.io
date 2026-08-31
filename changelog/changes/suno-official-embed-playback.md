---
type: changelog
date: 2026-08-31
description: Migrate Suno playback to official embeds and remove dependence on direct audio URLs.
tags: [suno, playback, embed]
---

# Suno playback uses official embeds

- Replaces direct `audio_url` playback in the global music player with Suno's official embed.
- Preserves site-level selection, previous/next navigation, favorites, history, and links to Suno while leaving cross-origin playback controls to the official player.
- Keeps the fallback Suno link outside the iframe so Astro type checking remains valid.
