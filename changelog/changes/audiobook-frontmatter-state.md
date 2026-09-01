---
type: changelog
date: 2026-09-01
description: Derive audiobook editorial state, readiness, cursor, publication rights, and episode metadata from canonical OKF/frontmatter instead of a duplicated state.yaml ledger.
tags: [audiobook, okf, frontmatter, workflow]
published: false
---

# Audiobook state now derives from documents

The audiobook factory no longer treats a mutable `state.yaml` file as a second source of truth. Runtime status is reconstructed from work/rights frontmatter plus the aligned source, translation, and narration documents and segment shards.
