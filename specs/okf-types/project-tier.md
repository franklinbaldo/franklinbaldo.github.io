---
type: okf-type-spec
filename: project-tier.md
title: "OKF Type: project-tier"
description: "Normative spec for canonical tiers of Franklin Baldo public projects"
resource: okf-type:project-tier
tags: [okf, projects, github, tiering, editorial]
timestamp: "2026-09-24T00:00:00Z"
---

# OKF Type: `project-tier`

A `project-tier` card is the canonical assessment of one public, non-fork, non-archived project repository. The repository is the identity; stars, activity, releases, tests, documentation and other GitHub signals are evidence rather than the tier itself.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `project-tier` |
| `repository` | string | GitHub repository in `owner/name` form |
| `name` | string | Human-readable project name |
| `quality_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `interest_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `confidence` | enum | `low`, `medium`, or `high` |
| `reviewed_at` | date | Date of the latest material review |
| `reviewed_revision` | string | Target repository revision reviewed |
| `summary` | string | Concise explanation of the placement |
| `strengths` | array[string] | Evidence supporting the placement |
| `open_problems` | array[string] | Weaknesses or evidence gaps blocking a higher tier |
| `history` | array[string] | Chronological audit trail of placement and material moves |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `note` | string | Qualification that should stay visible |

## Semantics

Quality evaluates achieved project execution: usefulness, coherence, engineering or craft quality, reliability, documentation, tests, operability and maintenance appropriate to the project's kind. Interest is independent and evaluates originality, leverage, conceptual fertility, strategic value and whether the project opens useful new work.

Stars and recency are not tier definitions. New or lightly inspected projects should be provisionally placed with low confidence. S is exceptional and sparse. A tier move requires a material reason and a history entry.
