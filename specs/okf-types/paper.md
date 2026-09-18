---
type: okf-type-spec
title: "OKF Type: paper"
description: "Normative spec for public Papers portfolio cards"
resource: okf-type:paper
tags: [okf, paper, portfolio, research, spec]
---

# OKF Type: `paper`

A `paper` card is the canonical knowledge record used by the public `/papers` portfolio.

The card MUST contain knowledge, not template ceremony. Do not add fields or body text merely because other cards have them.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `paper` |
| `title` | string | Public display title |
| `family` | string | Research family / programme |
| `kind` | string | Conceptual, empirical, formal, legal, computational, etc. |
| `scientific_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `interest_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `confidence` | enum | `low`, `medium`, or `high` |
| `idea` | string | Plain-language central idea |
| `status` | string | Current evidence/maturity state |
| `limit` | string | Main limitation, falsifier, or open question |

## Optional fields

Optional means semantically optional, not boilerplate to be filled with empty/default values.

| Field | Type | Meaning |
| --- | --- | --- |
| `source_url` | string | Only when the canonical source cannot be derived from the card slug |
| `related_file` | string | Only when a specific audit/companion file materially helps the reader |

## Identity and derived values

Each paper occupies exactly one card under `knowledge/papers/`. The filename without `.md` is the stable slug.

By default, the canonical paper filename is derived as `<slug>.md` in `franklinbaldo/papers`. Do not repeat it as a `file` field.

Display order is a UI concern and MUST NOT be stored as `order` in a knowledge card. The projection may use a deterministic sort or page-level grouping.

Do not require `updated` merely to record that an automation touched the card. Add temporal data only when the date itself is material knowledge.

## Body

The Markdown body MAY be empty. Do not repeat the title, type, repository location, or generic text such as “canonical card”.

Use the body only when the paper needs substantive knowledge that is genuinely clearer as prose than as structured front matter.

## No duplicate authority

Do not add or update an individual paper by editing a hardcoded array in `src/pages/papers.astro`, a JSON catalog, or another parallel store. Any TypeScript module is a build-time projection only.

## Tier semantics

Scientific tier measures current evidential/technical maturity within the paper's domain, not truth or author quality. Interest tier measures research fertility and generative value. Novelty by itself belongs primarily in interest, not scientific maturity.
