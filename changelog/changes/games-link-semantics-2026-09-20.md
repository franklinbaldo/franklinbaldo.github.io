---
type: changelog
date: 2026-09-20
description: The Games index now keeps its two navigation calls to action as links instead of overriding their semantics as buttons.
tags: [accessibility, ux, semantics]
---

# Games calls to action keep native link semantics

- The Repo Factory and Rug Pull Simulator cards still navigate to the same internal destinations.
- Their footer calls to action no longer override anchor semantics with `role="button"`, so assistive technology announces navigation consistently.
