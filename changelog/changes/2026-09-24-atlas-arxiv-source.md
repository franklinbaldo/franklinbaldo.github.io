---
type: changelog
date: 2026-09-24
description: Add the official arXiv requester-pays source corpus as a license-gated bulk TeX math lane.
tags: [science-equation-atlas, arxiv, latex, parquet, source-first]
---

# arXiv bulk source lane

Adds deterministic planning over the official arXiv S3 source manifest and a streaming TeX-math adapter that preserves exact attested source expressions while failing closed on redistribution rights. The lane joins local OAI-PMH metadata for categories and article-level licensing, publishes only explicitly cleared derived occurrence rows, and routes accepted data through the shared Parquet/Internet Archive pipeline outside GitHub Actions.
