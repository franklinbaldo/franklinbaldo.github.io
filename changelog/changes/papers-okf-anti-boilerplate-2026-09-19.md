---
type: changelog
date: 2026-09-19
description: Make Paper cards knowledge-dense by removing derivable boilerplate and moving paper relations into OKF.
tags: [papers, okf, architecture, knowledge]
---

# Paper cards stop carrying template debris

- Removes `order`, redundant `file`, routine-touch `updated`, and constant `related_label` from the `paper` contract.
- Derives source paths from each card slug, with `source_url` only for genuine path/branch exceptions.
- Makes empty Markdown bodies the normal case when front matter already contains all material knowledge.
- Adds material paper-to-paper `relations` to the OKF contract and renders the public relationship map mechanically from those relations.
- Keeps family ordering as a presentation concern and sorts papers deterministically without storing UI order in knowledge cards.
- Removes the hardcoded paper-specific relationship narrative from `papers.astro`, leaving it as a renderer rather than a second semantic catalogue.
