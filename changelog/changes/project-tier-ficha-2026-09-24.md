---
type: changelog
date: 2026-09-24
description: "Add the canonical project-tier card for Ficha after reviewing its public data contract, verified snapshots, CI and active maintenance."
tags: [projects, tiers, okf, github]
---

# Canonical project tier: Ficha

Adds `knowledge/project-tiers/ficha.md` for `franklinbaldo/ficha`, reviewed at main revision `98c5c110d9938d55b40c91d2309c99e40b186758`.

The initial placement is **quality A / interest S / medium confidence**. The review credits the browser-native DuckDB-WASM architecture, a reusable public manifest, content-addressed multi-gigabyte snapshots preserved on Internet Archive, verified monthly data releases, cross-platform ETL testing, benchmark smokes, accessibility/deploy checks and recent fail-closed integrity work. Interest is S because the project turns a centralized public-data workload into unusually reusable static civic infrastructure.

S quality is withheld because the ETL/publication surface remains operationally complex, the public manifest still selects the 2026-07 snapshot at review time, and some identity/history work remains under active investigation. The evidence gap is explicit: Jatobá timed out and the fallback sandbox had no outbound DNS, so a fresh independent full-suite run and direct live Pages probe could not be reproduced in this review. Repository checks must remain authoritative before merge.
