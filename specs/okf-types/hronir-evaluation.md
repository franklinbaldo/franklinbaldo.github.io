---
type: okf-type-spec
filename: hronir-evaluation.md
title: "OKF Type: Hronir Evaluation"
description: "OKF-native pairwise blog evaluation authored directly by an agent"
resource: okf-type:Hronir Evaluation
tags: [okf, hronir, evaluation, agent]
timestamp: "2026-09-21T00:00:00Z"
---

# OKF Type: `Hronir Evaluation`

This is the canonical format for every new Hrönir evaluation. The agent authors the Markdown directly. There is no Hrönir form CLI and no Node submission step.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `Hronir Evaluation` |
| `run_id` | string | Stable timestamp-like evaluation id |
| `run_at` | datetime | ISO timestamp |
| `post_a_key` | string | Stable conceptual key for side A |
| `post_a_path` | string | Repository path for side A |
| `post_b_key` | string | Stable conceptual key for side B |
| `post_b_path` | string | Repository path for side B |
| `winner` | enum | `a` or `b` |
| `agent_id` | string | Stable evaluator id |
| `objective` | string | Sampling objective or rationale |
| `eval_lang` | string | Evaluation language |
| `review_lang` | string | Review language |
| `prompt_version` | string | Evaluation protocol version |
| `perspective_id` | string | Reader perspective used |
| `evaluator_mood` | string | Initial evaluator state |
| `mood_glyph` | string | Glyph used for the round |
| `evaluator_mood_after` | string | Evaluator state after reading |
| `rate_a` | number | 1.00–5.00 |
| `rate_b` | number | 1.00–5.00; must differ from `rate_a` |
| `review_a` | string | Specific review of A, at least 100 words |
| `review_b` | string | Specific review of B, at least 100 words |
| `clash` | string | Pairwise confrontation, at least 100 words |

## Optional fields

`post_a_content_lang`, `post_b_content_lang`, `post_a_display_lang`, `post_b_display_lang`, `post_a_version`, `post_b_version`, `post_a_ref`, `post_b_ref`, `season`, `notes`.

## Authoring loop

Create the evaluation with at least `type: Hronir Evaluation`, then run the repository's canonical `okf-parser check`. Treat each `OKF011` diagnostic as the next field to fill. Repeat until the check is conformant. The Markdown file is the state and the final artifact.
