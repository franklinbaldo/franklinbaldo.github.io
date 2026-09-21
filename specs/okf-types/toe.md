---
type: okf-type-spec
filename: toe.md
title: "OKF Type: toe"
description: "Normative spec for Theory-of-Everything Arena concept cards"
resource: okf-type:toe
tags: [okf, toe, theory, arena, spec]
timestamp: "2026-09-18T00:00:00Z"
---

# OKF Type: `toe`

A `toe` card is the canonical knowledge record for one theory or adjacent proposal tracked by ToE Arena.

The Markdown card is the source of truth. UI projections, generated TypeScript objects, tier boards and summaries must be derived from these cards rather than maintained as a second semantic authority.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `toe` |
| `name` | string | Display name of the theory/proposal |
| `kind` | enum | `contender`, `adjacent`, or `exhibition` |
| `scientific_tier` | enum | `S`, `A`, `B`, `C`, `D`, `F`, or `NR` |
| `interest_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `confidence` | enum | `low`, `medium`, or `high` |
| `summary` | string | Current concise description |
| `strengths` | array[string] | Evidence or properties supporting the current placement |
| `open_problems` | array[string] | Unresolved limitations, counterevidence, or audit gaps |
| `source_label` | string | Human-readable primary/reference source label |
| `source_url` | string | URL for the cited source |
| `updated` | date | Last material Arena review date |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `source_date` | string | Publication/revision date when known |
| `note` | string | Placement history or important editorial qualification |

## Identity

The card filename is the stable slug, e.g. `string-m-theory.md` → `string-m-theory`.

One theory/proposal MUST occupy exactly one card. Do not place multiple ToE records in one Markdown file.

## Tier semantics

Scientific tier measures evidential and technical maturity, not truth. Interest tier measures generative/research interest. `NR` means outside the scientific ranking contract, not scientifically false.
