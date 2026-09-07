---
type: changelog
date: 2026-09-07
description: Screen readers now announce the genre filter count, the current track, and share-link copy feedback.
tags: [a11y, music]
---

# Music page and player announce their own state changes

- `src/pages/music.astro` and `src/pages/pt/musicas.astro`: the genre-chip
  filter now shows a live `role="status"` counter (`X songs`/`X músicas`,
  correctly pluralized) next to the chips, updated whenever a chip is
  clicked.
- `GlobalMusicPlayer.astro`: switching tracks now announces the new track
  title through a dedicated `aria-live` region, so a screen reader user who
  isn't focused on the player bar still hears what started playing.
- `ShareButton.astro`: the "Link copied"/"Couldn't copy" feedback is now
  exposed through a dedicated `aria-live` status span, instead of only
  changing the button's visible text.
