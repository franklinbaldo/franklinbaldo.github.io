---
type: changelog
date: "2026-09-22"
description: "Expose the read-only Hrönir tier-evidence projection in the GitHub job summary so editorial automation can inspect aggregate signals without persisting a second ranking authority."
tags: [hronir, ranking, editorial, okf, ci]
---

# Publish Hrönir tier evidence in the job summary

- Adds a small read-only pull-request workflow that recomputes the top 50 Hrönir tier-evidence rows from canonical rate files and publishes the TSV to the ephemeral GitHub job summary.
- Makes OpenSkill, absolute EWMA, de-confounded quality, coverage, and perspective counts inspectable by humans and automation even when raw runner logs are unavailable.
- Publishes the next ten untiered rank rows as ephemeral commit statuses for machine-readable triage; no ranking snapshot or authoring path is persisted.
- Hrönir evaluations remain OKF-native Markdown and canonical editorial judgments remain `blog-post-tier` records.
