---
type: okf-type-spec
filename: science-branch.md
title: "OKF Type: science-branch"
description: "Normative spec for one node in the Scientific Equation Atlas taxonomy"
resource: okf-type:science-branch
tags: [okf, science, taxonomy, equations]
timestamp: "2026-09-22T00:00:00Z"
---

# OKF Type: `science-branch`

A `science-branch` card is one node in the scientific taxonomy used by the Scientific Equation Atlas.

The Markdown card is the source of truth. Parent/child structure is expressed with ordinary relative Markdown links in the body, so the OKF graph can project the same relations people navigate on GitHub.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `science-branch` |
| `name` | string | Human-readable branch name |
| `level` | enum | `root`, `domain`, `field`, `subfield`, or `topic` |
| `description` | string | Concise scope of the branch |
| `updated` | date | Last material review date |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `taxonomy_sources` | array[string] | External classification systems consulted for this node |

A branch card SHOULD link to its immediate children. Formula cards link back to the most specific branches in which they are actually used.
