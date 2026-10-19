---
type: changelog
date: 2026-09-20
description: Hidden GlobalMusicPlayer links no longer ship empty href targets before a real song is selected.
tags: [seo, accessibility, ux, music]
---

# Global music player links receive targets only when playable

- Removes the two empty `href=""` placeholders from the hidden global player.
- `showId()` already assigns the article/Suno URLs before revealing the player, so visible behavior is unchanged while initial HTML no longer exposes two self-link-like empty targets on every page.
