---
type: changelog
date: 2026-10-19
description: Compare native SSG against the complete Zola site, classify audit failures, and fail closed on unsupported public content.
tags: [blog, ssg, ci, architecture, parity]
---

# SSG: full-site baseline and publication safety

- Adds a deterministic comparison of every Zola HTML path, other public output files and canonical static assets against the candidate SSG artifact.
- Summarizes the native SSG quality report by failing pillar instead of treating 8/10 quality pillars as a single opaque statistic.
- Rejects unsupported published posts and disallowed editorial locales instead of producing a passing SSG build with missing content.
- Blocks percent-encoded slashes and backslashes in projected article routes.
- Runs the comparison against both full artifacts built from the same commit in GitHub Actions, while Zola remains the production publisher.
- Reports incomplete coverage as machine-readable migration evidence rather than silently treating a green partial build as permission to cut over.
