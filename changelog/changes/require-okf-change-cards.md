---
type: changelog
date: 2026-08-31
description: Require an OKF change card for every pull request that changes the repository.
tags: [ci, okf, changelog]
---

# Change cards become the unit of change history

- Adds merge-relative CI enforcement: a pull request that changes source, content, docs, workflows, data, or other repository files must add at least one new card under `changelog/changes/`.
- Validates change cards as OKF knowledge with the same `okf-parser` pattern used by Pink.
- Keeps the historical versioned changelog entry as legacy history instead of requiring artificial version bumps for a continuously deployed site.
- Updates `/changelog/` to render independent change cards alongside the legacy release entry, newest first.
