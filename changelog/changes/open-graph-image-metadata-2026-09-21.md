---
type: changelog
date: 2026-09-21
description: Keep Open Graph image type and dimensions aligned with the actual social image instead of always claiming PNG 1200×630.
tags: [seo, metadata, social]
---

# Open Graph image metadata follows the image

`PageLayout` now derives `og:image:type` from the image extension and only emits the known 1200×630 dimensions for generated `/og/` cards. Custom hero images no longer advertise dimensions that may be false.
