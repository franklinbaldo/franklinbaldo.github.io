---
type: okf-type-spec
filename: blog-post-tier.md
title: "OKF Type: blog-post-tier"
description: "Normative spec for editorial tier records of conceptual blog works"
resource: okf-type:blog-post-tier
tags: [okf, blog, hronir, tiering, editorial]
timestamp: "2026-09-21T00:00:00Z"
---

# OKF Type: `blog-post-tier`

A `blog-post-tier` card is the canonical editorial assessment of one conceptual blog work. Identity is the blog `translationKey`: Portuguese and English translations are one work and MUST share one card.

The Markdown card is the semantic source of truth for the tier decision. Hrönir ratings, absolute-quality EWMA, de-confounded quality, win/loss counts and per-perspective standings are **derived evidence** and MUST be recomputed from `.routines/hronir/` rather than copied into a second canonical store.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `blog-post-tier` |
| `translation_key` | string | Stable conceptual work identity; must match blog `translationKey` |
| `quality_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `interest_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `confidence` | enum | `low`, `medium`, or `high` |
| `reviewed_at` | date | Date of the latest material tier review |
| `reviewed_revision` | string | Repository revision against which the semantic review was made |
| `summary` | string | Concise explanation of the current placement |
| `strengths` | array[string] | Evidence supporting the current placement |
| `open_problems` | array[string] | Weaknesses, disagreements or evidence gaps that prevent a higher tier |
| `history` | array[string] | Chronological audit trail of initial placement and material tier moves |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `note` | string | Editorial qualification that should remain visible with the record |

## Identity and projection

The card filename SHOULD equal `translation_key`. Exactly one card may exist for a conceptual work. UI pages MAY choose the Portuguese or English title for display, but MUST NOT create separate tier records for translations.

Current Hrönir measurements are projections. A page or report MAY show rank, ordinal, μ, σ, wins, appearances, absolute stars, de-confounded quality and perspective coverage beside the canonical card, but those values remain owned by Hrönir.

## Quality tier semantics

Quality tier evaluates achieved writing and thinking quality across argument, clarity, originality, structure, epistemic calibration, memorability and resilience across diverse reader perspectives.

- **S** — exceptional and sparse. Requires strong absolute quality, repeated success across diverse perspectives, adequate duel coverage and no major unresolved weakness.
- **A** — excellent and robust, with only bounded or lens-specific weaknesses.
- **B** — good/strong, but with visible limitations that materially constrain the work.
- **C** — competent or mixed; worthwhile but not consistently strong.
- **D** — materially weak, underdeveloped or structurally impaired.
- **F** — reviewed failure or work that should not remain in the active editorial canon in its current form.

A post is not promoted merely because it occupies a high percentile. Rank is evidence, not the tier definition.

## Interest tier semantics

Interest tier is independent of quality. It measures generativity, distinctiveness, surprise, rereadability, artifact richness and capacity to produce further thought or conversation. An executionally imperfect post can therefore be quality `C` / interest `S`.

## Confidence

Confidence reflects evidence coverage: number and diversity of Hrönir duels, perspective coverage, agreement among ordinal, absolute-quality and de-confounded signals, and whether the currently published work changed materially after those evaluations.

New or lightly evaluated work SHOULD receive a provisional tier with `low` confidence rather than being punished for uncertainty.

## Change discipline

Tier changes require a material evidentiary reason. Every promotion or demotion MUST append a `history` entry naming the date, previous tier, new tier and evidence that changed. An initial placement records itself as such and has no fictitious previous tier.

If the selected/published content changes materially, the old tier MUST be treated as stale until reviewed against the new work. The tier is not blindly inherited across substantive revisions.

Substantive rewrites are outside this type: tiering assesses the work. If assessment reveals that a rewrite is needed, track that work separately rather than editing the post merely to improve its letter.
