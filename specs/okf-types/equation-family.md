---
type: okf-type-spec
filename: equation-family.md
title: "OKF Type: equation-family"
description: "Normative spec for a recurring mathematical structure shared by scientific formulas"
resource: okf-type:equation-family
tags: [okf, mathematics, equations, graph]
timestamp: "2026-09-22T00:00:00Z"
---

# OKF Type: `equation-family`

An `equation-family` card records a mathematical structure that recurs across scientific formula occurrences.

A family is not established by visual similarity alone. The Markdown body SHOULD show the substitutions, transformations, limiting argument, nondimensionalization, or other reproducible reasoning that supports the relation.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `equation-family` |
| `name` | string | Human-readable family name |
| `canonical_latex` | string | Canonical mathematical form used for comparison |
| `summary` | string | Short description of the shared structure |
| `status` | enum | `hypothesis`, `verified`, or `audited` |
| `updated` | date | Last material review date |

Family cards SHOULD link to their scientific occurrences. Those links are projections of the authored Markdown graph, not a second database.
