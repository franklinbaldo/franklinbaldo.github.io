---
type: changelog
date: 2026-09-24
description: "Add the first canonical project-tier card for okf-parser after a repository-level architecture, release and maintenance review."
tags: [projects, tiers, okf, github]
---

# First canonical project tier: okf-parser

Adds `knowledge/project-tiers/okf-parser.md` for `franklinbaldo/okf-parser`, reviewed at main revision `50e1e91bd7047770f7c9bd025c5aaa2e0b66c8d4`.

The initial placement is **quality A / interest A / medium confidence**. The review credits the strict-core/source-adapter architecture, relational DuckDB/Ibis model, CLI/MCP/GitHub Action surfaces, optional Rust engine, current v0.45.10 release and explicit release engineering. S is withheld because the package remains beta and several open integration stacks are still consolidating write, relation and native-engine contracts.

The evidence gap is recorded rather than hidden: Jatobá timed out during this run and the fallback sandbox had no external DNS, so a fresh independent full-suite execution was unavailable. Repository checks and release evidence remain authoritative before merge.
