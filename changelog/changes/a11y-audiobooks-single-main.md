---
type: changelog
date: 2026-09-20
description: Remove nested main landmarks from the audiobook catalog, work, and chapter pages so each document exposes one primary-content landmark.
tags: [accessibility, audiobooks, semantics]
---

# Audiobook pages expose a single main landmark

- `/audiobooks/`, audiobook work pages, and chapter pages no longer nest a second `<main>` inside `PageLayout`'s existing primary landmark.
- The inner wrappers keep the same classes and content, so layout and behavior stay unchanged while landmark navigation becomes unambiguous for assistive technology.
