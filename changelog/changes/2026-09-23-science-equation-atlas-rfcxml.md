---
type: changelog
date: 2026-09-23
description: Add RFC Editor RFCXML as a source-first formal-structure lane on the Atlas' existing Parquet/Internet Archive data plane.
tags: [science-equation-atlas, rfc, rfcxml, data]
---

# Scientific Equation Atlas: RFCXML source lane

Adds an official RFC Editor rsync/RFCXML adapter for attested `sourcecode` blocks, initially ABNF and pseudocode. The adapter now emits the contemporary `OccurrenceV1` field contract and reuses the already-canonical Parquet materializer and Internet Archive publisher instead of carrying a second storage implementation.
