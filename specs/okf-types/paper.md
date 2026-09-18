---
type: okf-type-spec
filename: paper.md
title: "OKF Type: paper"
description: "Normative spec for the public Papers portfolio cards"
resource: okf-type:paper
tags: [okf, paper, portfolio, research, spec]
timestamp: "2026-09-18T00:00:00Z"
---

# OKF Type: `paper`

A `paper` card is the canonical knowledge record used by the public `/papers` portfolio.

The Markdown card is the source of truth. Astro pages, TypeScript projections, counts, tier boards and summaries MUST be derived from these cards rather than maintained as a second semantic authority.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `paper` |
| `order` | integer | Stable editorial display order within the portfolio |
| `file` | string | Paper path in `franklinbaldo/papers` |
| `title` | string | Public display title |
| `family` | string | Research family / programme |
| `kind` | string | Conceptual, empirical, formal, legal, computational, etc. |
| `scientific_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `interest_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `confidence` | enum | `low`, `medium`, or `high` |
| `idea` | string | Plain-language central idea |
| `status` | string | Current evidence/maturity state |
| `limit` | string | Main limitation, falsifier, or open question |
| `updated` | date | Last material portfolio review |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `source_url` | string | Override URL when the canonical paper is not on `main` |
| `related_file` | string | Related audit/companion file in `franklinbaldo/papers` |
| `related_label` | string | Human-readable label for `related_file` |

## Identity and storage

Each paper MUST occupy exactly one card under `knowledge/papers/`. The card filename is a stable slug. Do not put multiple papers into one card.

Do not add or update an individual paper by editing a hardcoded array in `src/pages/papers.astro`, a JSON catalog, or another parallel store. Any TypeScript module is a build-time projection only.

## Tier semantics

Scientific tier measures current evidential/technical maturity within the paper's domain, not truth or author quality. Interest tier measures research fertility and generative value. Novelty by itself belongs primarily in interest, not scientific maturity.
