---
type: changelog
date: 2026-09-21
description: Restack the fail-closed blog audio publication workflow on current main and current CI conventions.
tags: [audio, blog, tts, internet-archive, github-actions]
---

# Restack Blog Audio workflow

Rebases the existing Blog Audio workflow work onto current `main` without reopening the already-landed player/feed/publication boundary. The workflow keeps synthesis and publication fail-closed, updates GitHub Action pins to the repository's current versions, and persists verified publication state through a checked pull request rather than a direct push to `main`.
