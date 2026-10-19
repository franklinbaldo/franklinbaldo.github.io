---
type: changelog
date: 2026-09-18
description: "Keep post-card reading-time estimates consistent with the reading-time calculation used on article pages."
tags: [ux, content, consistency]
---

Post cards now use the same 200-words-per-minute baseline as the blog's `reading-time` pipeline, avoiding cases where a card and the article it links to show different reading-time estimates for the same post.
