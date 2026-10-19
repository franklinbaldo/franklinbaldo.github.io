---
type: changelog
date: 2026-09-18
description: "Keep hreflang x-default on equivalent localized content instead of sending untranslated pages to the homepage."
tags: [seo, hreflang, i18n]
---

`x-default` now stays within the page's content cluster: translated pages continue to prefer the English counterpart, while pages without an English equivalent use their own canonical URL as the fallback.
