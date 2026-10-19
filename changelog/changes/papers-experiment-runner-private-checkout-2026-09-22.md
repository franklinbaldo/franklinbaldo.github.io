---
type: changelog
date: 2026-09-22
description: Require an explicit read-only cross-repository credential for the private papers experiment runner instead of falling back to the blog workflow token.
tags: [ci, research, github-actions, security]
---

# Harden the papers experiment checkout

The papers experiment runner now fails explicitly when `PAPERS_READ_TOKEN` is unavailable and uses that credential only in the checkout step. The experiment command does not inherit the token, and the workflow no longer implies that the blog repository's default `github.token` can read the private `franklinbaldo/papers` repository.
