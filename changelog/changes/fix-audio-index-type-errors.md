---
type: changelog
date: "2026-09-08"
description: Fix type errors in the audio index page blocking `astro check` on main.
tags: [audio, bugfix, ci]
---

# Fix audio index type errors

- `src/pages/audio/index.astro` used `byId.get(...)` results without narrowing away
  `undefined`, and passed `isPublished` directly to `Array.prototype.filter`, which
  leaks the array index into `isPublished`'s optional `now: Date` parameter.
- Replaced the `.map().filter()` chain with `.flatMap()` so TypeScript narrows the
  post to non-`undefined`, and wrapped `isPublished` in an arrow function so only
  the post is forwarded.
- This was pre-existing on `main` since #1681 and failed the `check` CI job on
  every PR since, including unrelated Hrönir rounds (documented in a standing-down
  comment on #1687).
