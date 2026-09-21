---
type: changelog
date: 2026-09-01
description: Capture reproducible visual evidence in CI and make the published audiobooks catalog discoverable from global navigation.
tags: [ci, visual-regression, navigation, audiobooks, cobogo]
---

# Audiobooks navigation with reproducible evidence

- Runs the existing screenshot harness against an Astro preview in pull-request CI.
- Uploads the captured routes as workflow artifacts for before/after visual review.
- Adds Audiobooks/Audiolivros to the existing secondary Header and Footer navigation, linking to `/audiobooks/` without promoting it to a primary CTA.
- Keeps claims scoped to the published catalog surface; it does not imply that a disabled podcast/feed is active.
