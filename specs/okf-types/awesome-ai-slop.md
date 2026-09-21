---
type: okf-type-spec
filename: awesome-ai-slop.md
title: "OKF Type: awesome-ai-slop"
description: "Normative spec for the Awesome AI Slop tier board"
resource: okf-type:awesome-ai-slop
tags: [okf, ai, slop, tiering, culture]
timestamp: "2026-09-21T00:00:00Z"
---

# OKF Type: `awesome-ai-slop`

An `awesome-ai-slop` card is the canonical record for one public artifact tracked by **Awesome AI Slop**.

The collection evaluates artifacts, not people. "AI slop" here means AI-mediated output where scale, fluency or production speed substantially outruns curation, originality, verification, coherence or editorial judgment. It may still be funny, beautiful, useful, culturally important or technically impressive.

Markdown cards under `knowledge/awesome-ai-slop/` are the semantic source of truth. UI projections and tier boards MUST be derived from those cards.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `awesome-ai-slop` |
| `name` | string | Display name of the artifact/project |
| `artifact_type` | string | Repository, website, paper, app, book, video, image set, feed, etc. |
| `slop_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `interest_tier` | enum | `S`, `A`, `B`, `C`, `D`, or `F` |
| `confidence` | enum | `low`, `medium`, or `high` |
| `summary` | string | Concise description |
| `slop_signals` | array[string] | Observable reasons for the slop placement |
| `redeeming_features` | array[string] | Interesting, useful, funny, novel or technically notable properties |
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

## Slop tier semantics

**Higher means more canonical slop, not better quality.**

- **S** — canonical AI slop: unmistakably AI-mediated, extremely high-density, repetitive or overproduced, and exemplary enough to define the category.
- **A** — strong slop: multiple clear slop signals with little doubt about the classification.
- **B** — substantial slop, but with meaningful human curation, originality or ambiguity.
- **C** — mixed: AI-mediated and somewhat sloppified, but ordinary assisted creation remains an equally strong description.
- **D** — weak slop signal.
- **F** — investigated false positive; not meaningfully slop under this contract.

Slop tier does not imply fraud, low intelligence, mental illness or moral failure. It is an artifact-level editorial category.

## Interest tier semantics

Interest is independent. It measures cultural value, weirdness, humor, technical curiosity, influence, originality of failure, or usefulness as a case study. An artifact can be **slop S / interest S**.

## Evidence discipline

Prefer direct public evidence: repository history, prompts, generated files, explicit AI credits, metadata, repeated templates, automation traces and reproducible output patterns. Do not infer AI use solely from writing style.

Tier changes require a material reason and SHOULD be recorded in `note` when the move is meaningful.
