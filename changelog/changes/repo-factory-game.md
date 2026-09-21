---
type: changelog
date: 2026-09-01
description: Add Repo Factory, a GitHub-powered industrial map that turns public repository work into issues, assembly lines, machine runs, cross-repo belts, and finished products.
tags: [games, github, visualization, data]
---

# Repo Factory maps the public GitHub production floor

- Adds `/games/repo-factory/`, an interactive factory-floor view of public repositories, issues, pull requests, Actions runs, merges, releases, and explicit cross-repository references.
- Generates the production snapshot during token-enabled builds with `gh api`, while keeping a safe committed fallback for local and token-less checks.
- Excludes private repositories by construction and never sends a GitHub token to the browser.
- Adds the new surface to `/games/` and to the reproducible desktop/mobile visual-capture set.
