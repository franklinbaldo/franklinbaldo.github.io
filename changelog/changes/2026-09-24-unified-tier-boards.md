---
type: changelog
date: 2026-09-24
description: Unify post, music, and project tier surfaces around shared Astro tier infrastructure and OKF-native domain records.
tags: [blog, tiers, okf, music, projects, hronir]
---

# Unified tier boards

- Add a reusable `TierBoard` component and shared tier types.
- Show canonical normal-post tiers directly on the ranking page.
- Separate music from the normal-post tier projection and add a dedicated `music-tier` type backed by the audio-first Suno ranking evidence.
- Add a `project-tier` type for public project repositories.
- Turn the Music and Projects pages into tier-first surfaces while retaining their complete catalogs below the boards.
- Validate music and project tier cards with the same normative OKF type-spec pipeline used by the existing knowledge bundles.
