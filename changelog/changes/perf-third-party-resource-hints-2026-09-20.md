---
type: changelog
date: 2026-09-20
description: Shared pages no longer preconnect to Suno or prefetch Suno/Goodreads hosts before a feature actually needs them.
tags: [performance, privacy, html]
---

# Third-party connections start only when needed

- Removes two global `preconnect` hints for `suno.com` / `cdn2.suno.ai` and two global DNS prefetches for `cdn1.suno.ai` / `i.gr-assets.com` from `PageLayout`.
- The global music player starts with `about:blank`, so normal articles no longer pay speculative Suno connection setup before a user chooses music.
- Pages that actually embed Suno or Goodreads resources still load them normally when the browser reaches those resources; this change only removes the site-wide speculation.
