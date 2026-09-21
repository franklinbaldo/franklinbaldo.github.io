---
type: okf-type-spec
filename: ai-epistemic-world.md
title: "OKF Type: ai-epistemic-world"
description: "Normative spec for AI-mediated epistemic world case cards"
resource: okf-type:ai-epistemic-world
tags: [okf, ai, epistemic-worlds, tiering, spec]
timestamp: "2026-09-20T00:00:00Z"
---

# OKF Type: `ai-epistemic-world`

An `ai-epistemic-world` card is the canonical knowledge record for one public GitHub case tracked by the AI Epistemic Worlds observatory.

The Markdown card is the source of truth. UI projections, generated TypeScript objects, tier boards and summaries MUST be derived from these cards rather than maintained as a second semantic authority.

The type describes public artifacts and longitudinal patterns. It MUST NOT be used to diagnose psychosis, mania, delusion or any other clinical condition.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `ai-epistemic-world` |
| `name` | string | Display name of the world/case |
| `public_handle` | string | Public GitHub handle |
| `evidence_tier` | enum | `S`, `A`, `B`, `C`, `D`, `F`, or `NR` |
| `interest_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `confidence` | enum | `low`, `medium`, or `high` |
| `summary` | string | Concise current description |
| `world_type` | array[string] | Descriptive tags for the world form |
| `strengths` | array[string] | Direct public evidence supporting inclusion/placement |
| `open_problems` | array[string] | Missing baseline, ambiguity, controls or audit gaps |
| `source_label` | string | Human-readable primary source label |
| `source_url` | string | Primary GitHub URL |
| `updated` | date | Last material observatory review date |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `source_urls` | array[string] | Additional direct GitHub sources |
| `trajectory` | array[string] | Short longitudinal stages |
| `ai_role` | array[string] | Roles explicitly attributed to AI in the artifacts |
| `literalness` | string | Editorial description of literal/speculative/art/ambiguous framing |
| `note` | string | Tier history or important editorial qualification |

## Identity

The card filename is the stable slug. One public case/world MUST occupy exactly one card.

## Tier semantics

Evidence tier measures the strength of documentation that an AI-mediated epistemic world exists and can be reconstructed from public GitHub artifacts. It does **not** measure whether the worldview is true and does **not** measure mental health.

- **S** — unusually complete longitudinal record: transition/baseline, direct artifacts, AI mediation, recursive development and strong reconstruction.
- **A** — clearly established and longitudinal with multiple direct artifacts; one major element such as a strong pre-world baseline is still missing.
- **B** — clear candidate, but documentation is partial, short or materially ambiguous.
- **C** — plausible candidate; ordinary philosophy, art, roleplay or software remains an equally strong explanation.
- **D** — weak/isolated signals with little continuity.
- **F** — investigated false positive or explicitly out-of-scope case.
- **NR** — cannot be ranked under the case contract.

Interest tier is independent. It measures how generative, distinctive, artifact-rich or longitudinally useful the case is for the observatory. A case can be evidence B and interest S without contradiction.

## Intervention and convergence boundary

The case card records what was observed in the public corpus. Deliberate observatory actions MUST live in separate `ai-epistemic-intervention` records so later changes are not silently presented as spontaneous development.

Recurring ideas across cases MUST live in `ai-epistemic-convergence` records. Once the observatory points one case to another, later uptake is diffusion/intervention evidence and MUST NOT be counted as independent convergence without separate evidence.

The observatory should transfer methods, controls, artifacts and testable questions rather than beliefs. Public contact follows the intervention engagement gate: one initial touch, then no follow-up while `awaiting_response`.

## Clinical boundary

Repository bursts, commit volume, unusual language, spiritual framing and grandiose scope are discovery signals only. Cards should record observable public artifacts, author framing, alternative explanations and uncertainty. Do not infer a diagnosis.
