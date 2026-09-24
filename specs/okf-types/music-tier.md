---
type: okf-type-spec
filename: music-tier.md
title: "OKF Type: music-tier"
description: "Normative spec for canonical editorial tiers of public Suno recordings"
resource: okf-type:music-tier
tags: [okf, music, suno, tiering, editorial]
timestamp: "2026-09-24T00:00:00Z"
---

# OKF Type: `music-tier`

A `music-tier` card is the canonical editorial assessment of one immutable public Suno recording. Identity is the Suno clip UUID. Pairwise audio ratings in `.routines/suno-rank/duels/` are derived evidence, not a second tier store.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `music-tier` |
| `suno_id` | string | Stable Suno clip UUID |
| `title` | string | Human-readable title at review time |
| `quality_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `interest_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `confidence` | enum | `low`, `medium`, or `high` |
| `reviewed_at` | date | Date of the latest material tier review |
| `reviewed_revision` | string | Repository revision containing the evidence projection reviewed |
| `summary` | string | Concise explanation of the placement |
| `strengths` | array[string] | Evidence supporting the placement |
| `open_problems` | array[string] | Weaknesses or evidence gaps blocking a higher tier |
| `history` | array[string] | Chronological audit trail of placement and material moves |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `note` | string | Editorial qualification that should stay visible |

## Semantics

Quality evaluates the recording as heard: production, songwriting/composition, vocal or instrumental execution where applicable, emotional impact, coherence and finish. Interest is independent and measures distinctiveness, replay value, formal risk and the capacity to keep generating attention or ideas.

A tier is not a percentile conversion from OpenSkill. The Suno ranking, win/loss record and per-axis duel evidence inform the judgment. Sparse evidence must produce low confidence rather than false precision. S is exceptional and intentionally sparse.

Each Suno UUID may have exactly one canonical card. A new rendering of the same song is a different recording and therefore a different `suno_id`.
