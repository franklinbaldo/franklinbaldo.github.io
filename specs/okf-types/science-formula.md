---
type: okf-type-spec
filename: science-formula.md
title: "OKF Type: science-formula"
description: "Normative spec for one scientific formula occurrence"
resource: okf-type:science-formula
tags: [okf, science, formula, equations]
timestamp: "2026-09-22T00:00:00Z"
---

# OKF Type: `science-formula`

A `science-formula` card records a formula as it is used in a scientific domain.

The original domain notation is preserved. Cross-domain mathematical equivalence is represented by links to `equation-family` cards and explained in the Markdown body rather than by overwriting the scientific expression.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `science-formula` |
| `name` | string | Conventional formula name |
| `latex` | string | Display LaTeX for the domain form |
| `summary` | string | Short explanation of what the formula does |
| `status` | enum | `candidate`, `sourced`, `verified`, `normalized`, or `audited` |
| `updated` | date | Last material review date |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `source_label` | string | Short label for a primary or reference source |
| `source_url` | string | URL for that source |

The body SHOULD explain variables, validity conditions, common use, evidence, and any demonstrated transformation to a mathematical family. Links to branch and family cards carry the graph relations.
