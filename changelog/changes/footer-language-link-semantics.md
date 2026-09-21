---
type: changelog
date: 2026-09-20
description: Footer language links no longer expose a placeholder fragment URL before their real translation target is known.
tags: [seo, accessibility, ux]
---

# Footer alternate-language links use real targets only

- The hidden footer language control no longer ships an `href="#"` placeholder into the server-rendered HTML.
- When a translation exists, the real target now receives `hreflang` and `lang` metadata before the control is revealed.
