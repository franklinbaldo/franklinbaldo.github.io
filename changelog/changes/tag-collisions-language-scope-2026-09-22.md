---
type: changelog
date: 2026-09-22
description: Scope tag-collision debt to each public language namespace so EN/PT spelling equivalents are reported without being treated as duplicate taxonomy pages.
tags: [seo, taxonomy]
---

# Tag collisions now respect language route boundaries

The collision guard tracked by #1909 now distinguishes a real duplicate inside one language namespace from two equivalent spellings that live only on different language routes.

This resolves `amazonia` / `amazônia` as an intentional EN/PT split rather than forcing the English tag to adopt Portuguese orthography. The English assignment remains under `/tags/amazonia/`; the Portuguese assignment remains under `/pt/tags/amaz%C3%B4nia/`. Because those pages occupy separate route namespaces and each language has only one spelling, they do not compete as duplicate collection pages within a locale.

`npm run check:tags -- --report` still lists cross-language equivalents diagnostically. If either language later contains two normalized-equivalent spellings, the group becomes a collision again and the guard requires an explicit migration or allowlist decision.
