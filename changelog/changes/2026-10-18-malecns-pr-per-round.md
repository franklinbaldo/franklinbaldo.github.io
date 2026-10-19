---
type: changelog
date: 2026-10-18
description: Document the MaleCNS curation policy of one PR per round, merged only after its gates pass
tags: [docs, malecns, process]
---

A new page, `docs/malecns-curation-workflow.md`, records how MaleCNS curation
rounds are published. Each round opens its own branch and PR, and a round counts
as published only after the normative checks pass, the PR is merged and the
public page is verified. The page also states that build and test gates run
outside Jatobá, keeps the scientific, interest and confidence tiers independent,
and requires every blocked operation to be reported explicitly instead of
worked around.
