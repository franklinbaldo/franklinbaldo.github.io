---
type: okf-type-spec
filename: malecns-project.md
title: "OKF Type: malecns-project"
description: "Canonical evidence tiers for public MaleCNS projects"
resource: okf-type:malecns-project
tags: [okf, malecns, projects, tiering]
timestamp: "2026-09-26T00:00:00Z"
---

# OKF Type: `malecns-project`

One card represents one materially distinct public MaleCNS project. Identity is
`project_id`, not repository, because multiple projects may share a repository.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `malecns-project` |
| `project_id` | string | Stable project identity |
| `name` | string | Display name |
| `ownership` | string | `own` or `independent` |
| `kind` | string | Project class |
| `stage` | string | Current stage |
| `primary_url` | string | Public primary URL |
| `scientific_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `interest_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `confidence` | enum | `low`, `medium`, or `high` |
| `reviewed_at` | date | Latest material review |
| `reviewed_revision` | string | Public revision reviewed |
| `summary` | string | Evidence-calibrated placement |
| `strongest_evidence` | array[string] | Strongest public evidence |
| `limitations` | array[string] | Claim boundaries |
| `controls` | array[string] | Relevant controls or missing controls |
| `history` | array[string] | Material tier history |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `repository` | string | Public GitHub repository |
| `evidence_url` | string | Additional public evidence |
| `note` | string | Visible qualification |

## Semantics

Scientific tier measures evidence strength, not whether the result is positive.
A reproducible null may outrank an uncontrolled success. Interest tier measures
originality, ambition and research fertility. Tier movement requires material
evidence. Cards must separate the MaleCNS substrate from engineered interfaces
and use only public evidence.
