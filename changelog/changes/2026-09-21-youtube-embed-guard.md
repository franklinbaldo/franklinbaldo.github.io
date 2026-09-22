---
type: changelog
date: 2026-09-21
description: Prevent raw YouTube embeds from regressing on accessibility, lazy loading, or embeddable URLs.
tags: [blog, accessibility, performance, ci]
---

# Guard raw YouTube embeds

- Adds a read-only check for raw YouTube iframes in blog Markdown and MDX.
- Rejects non-HTTPS `/embed/` URLs, missing accessible names, and missing `loading="lazy"` so new content cannot silently reintroduce the defects tracked in #1845.
- Leaves the larger component/privacy decision (`youtube.com` versus `youtube-nocookie.com`) untouched; this gate only preserves the safe baseline already reached by existing embeds.
