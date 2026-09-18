---
type: changelog
date: 2026-09-18
description: Stop using Prettier formatting as a blocking CI gate while keeping lint, tests, build, and type checks intact.
tags: [ci, prettier, developer-experience]
---

# Prettier no longer blocks CI

The Check workflow no longer runs `npx prettier --check .` as a required gate. Formatting remains available through the existing local `format` and `format:check` scripts, while lint, tests, content checks, Astro type checking, build, Lighthouse, and security checks remain unchanged.
