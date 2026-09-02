---
type: changelog
date: 2026-09-02
description: Global rank link title in perspective rankings now names the post.
tags: [a11y, ranking]
---

# Global rank tooltip identifies which post it describes

- `src/pages/ranking/perspectives/[id].astro`: the "global #" link in the
  per-perspective ranking table now sets `title` to the post's title,
  instead of the identical `"Global rank"` tooltip on every row.
