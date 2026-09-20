---
type: changelog
date: 2026-09-20
description: "Adds a one-shot verified export of the current blog repository before the planned public-history reset, including Git/LFS, open issues, open PRs, discussions, and the sanitized public seed."
tags: [backup, migration, repository, github]
---

# Pre-recreation backup export

- Exports a verified full Git bundle and LFS object store before the public repository is recreated.
- Preserves open issues and PRs with their current bodies, discussions, reviews, inline comments, and binary patches for migration to new numbering.
- Pins the sanitized public seed separately so the recreated blog can begin from one new root commit without carrying the old public history.
