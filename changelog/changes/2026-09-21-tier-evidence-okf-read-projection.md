---
type: changelog
date: "2026-09-21"
description: "Restore the read-only Hrönir tier-evidence CI projection after the OKF-first agent migration, exposing the top 32 works without reviving a Node write path."
tags: [hronir, ranking, editorial, okf, ci]
---

# Restore Hrönir tier evidence as an OKF-compatible read projection

- Restores the read-only tier evidence smoke step that disappeared when the former Node Hrönir agent CLI and npm write commands were removed.
- Invokes the existing TypeScript read-side projection directly and prints the top 32 works, enough to keep the next unrated candidates visible as editorial coverage grows.
- Does not restore the retired Node authoring interface: new evaluations remain OKF-native Markdown validated through `okf-parser`, and canonical tier judgments remain the `blog-post-tier` cards.
