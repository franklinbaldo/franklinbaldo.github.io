---
type: changelog
date: 2026-09-21
description: Encode exact tag labels consistently in public tag links, breadcrumbs, alternates, and structured data without changing taxonomy semantics.
tags: [seo, taxonomy]
---

# Tag URLs use one encoded builder

Tag labels containing spaces, accents, or reserved URL characters now pass through a shared `tagUrl()` helper before they are emitted into post footers, tag indexes, related-tag links, breadcrumbs, hreflang alternates, or `ItemList`/`CollectionPage` structured data. The helper preserves the exact editorial label and only percent-encodes the URL segment, so this is compatible with the deliberate canonicalization/redirect work tracked in #1909.
