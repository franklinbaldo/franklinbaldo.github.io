---
type: okf-type-spec
filename: awesome-ai-slop.md
title: "OKF Type: awesome-ai-slop"
description: "Normative spec for the Awesome AI Slop cultural tier board"
resource: okf-type:awesome-ai-slop
tags: [okf, ai, culture, slop, tiering]
timestamp: "2026-09-21T00:00:00Z"
---

# OKF Type: `awesome-ai-slop`

An `awesome-ai-slop` card is the canonical record for one public cultural artifact tracked by **Awesome AI Slop**.

In this collection, **slop is not a negative quality judgment**. It is a playful umbrella term for cultural artifacts that are visibly or explicitly made with substantial AI participation. The board asks a different question: **which AI-made artifacts are actually good?**

The collection evaluates artifacts, not people. Markdown cards under `knowledge/awesome-ai-slop/` are the semantic source of truth. UI projections and tier boards MUST be derived from those cards.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `awesome-ai-slop` |
| `name` | string | Display name of the artifact/project |
| `artifact_type` | string | Song, video, image set, book, website, game, repository, film, meme, etc. |
| `quality_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `interest_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `confidence` | enum | `low`, `medium`, or `high` |
| `summary` | string | Concise description |
| `quality_signals` | array[string] | Observable reasons the artifact earns its quality placement |
| `limitations` | array[string] | Weaknesses or reasons it does not rank higher |
| `ai_mediation_evidence` | array[string] | Direct evidence that AI materially participated |
| `source_label` | string | Human-readable primary source |
| `source_url` | string | Primary public URL |
| `updated` | date | Last material review date |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `creator_handle` | string | Public handle when relevant |
| `source_urls` | array[string] | Additional primary sources |
| `observed_at` | date | Date first reviewed by the collection |
| `note` | string | Editorial qualification or tier history |

## Quality tier semantics

**Higher means better cultural artifact.** AI-ness is the admission criterion, not the ranking criterion.

- **S** — exceptional AI-made culture: memorable, distinctive, well-executed, and strong enough to stand on its own beyond the novelty of AI production.
- **A** — excellent: clearly succeeds artistically, technically or culturally, with only bounded weaknesses.
- **B** — good: worthwhile and successful, but with visible limitations or uneven execution.
- **C** — mixed: interesting or competent, but not consistently good.
- **D** — weak: notable mainly as an experiment or curiosity.
- **F** — failed artifact in its current form.

A work MUST NOT rank highly merely because it uses a lot of AI, was produced quickly, or is technically elaborate.

## Interest tier semantics

Interest is independent of quality. It measures cultural significance, weirdness, novelty, influence, memetic power, technical curiosity, or usefulness as a case study. A rough but historically fascinating artifact can therefore be quality `C` / interest `S`.

## AI admission criterion

The collection requires direct evidence that AI materially participated in making the artifact: explicit credits, public prompts/workflows, repository history, generation metadata, creator disclosure, or equivalent primary evidence. Do not infer AI use solely from style.

The artifact can be human-directed, edited, curated or heavily post-produced. Strong human curation does not disqualify it; in fact, curation may be part of why the artifact is good.

## Evidence discipline

Prefer primary public evidence for both AI mediation and the artifact itself. Tier changes require a material reason and SHOULD be recorded in `note` when the move is meaningful.
