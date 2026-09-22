---
type: changelog
date: 2026-09-21
description: Restore a read-only Hrönir tier-evidence CI projection after the OKF-first workflow migration.
tags: [hronir, ranking, editorial, ci, okf]
---

# Restore the Hrönir tier-evidence read projection

- Adds a dedicated CI projection that prints the top 30 works with OpenSkill, absolute-quality, de-confounded and perspective-coverage evidence directly from canonical Hrönir records.
- This restores editorial visibility lost when PR #2023 correctly removed the old Node agent/write CLI and its smoke step.
- The projection is diagnostic and read-only. Hrönir creation, filling and validation remain exclusively OKF-native Markdown plus `okf-parser`; canonical tier judgments remain `blog-post-tier` cards.
