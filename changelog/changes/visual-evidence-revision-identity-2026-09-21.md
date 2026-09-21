---
type: changelog
date: 2026-09-21
description: Make visual-evidence artifacts distinguish the PR head revision from the synthetic merge revision actually tested by GitHub Actions.
tags: [ci, visual-evidence, provenance, github-actions]
---

# Visual evidence records head and tested revisions

The Visual evidence workflow now names artifacts with both the pull-request head SHA and the revision actually tested by GitHub Actions. It also uploads `revision.json` beside the screenshots with the event, head SHA, tested SHA and pull-request number. This prevents the synthetic PR merge ref from being presented as if it were the branch head while preserving the exact revision used for the rendered evidence.
