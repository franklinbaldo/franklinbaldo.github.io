---
type: changelog
date: 2026-09-24
description: Add EUR-Lex Formex bulk XML as a European legal/regulatory source lane for explicit formulas.
tags: [science-equation-atlas, eur-lex, formex, regulation, parquet]
---

The Scientific Equation Atlas can now ingest explicit mathematical `FORMULA` structures from official EUR-Lex Data Dump / Formex 4 XML exports without page-by-page scraping. The lane preserves the original Formex subtree, CELEX/language/context provenance, and treats every extracted occurrence as attested rather than reconstructed.

Public redistribution remains fail-closed: each bulk batch gets a deterministic inventory digest, Parquet remains the canonical lake format, and Internet Archive publication requires a rights audit/allowlist for the selected EUR-Lex dump before any formula payload is redistributed.
