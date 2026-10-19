---
type: changelog
date: 2026-10-19
description: Audit the real translated article bodies, titles and languages in SSG against the Zola output, beyond URL existence.
tags: [blog, ssg, article, parity, ci]
---

# Semantic article parity gate

- Compares the full rendered article body inside the existing Zola content boundary against the SSG native prose output.
- Verifies each published article's language and title across generators.
- Measures normalized multiset token overlap and word-count ratios; publishes weaker matches as diagnostics, without mistaking overlap for full content parity.
- Missing HTML, wrong languages, title differences and invalid article documents fail the candidate CI.
- Preserves machine-readable per-route evidence in GitHub Actions; no production generator changes.
