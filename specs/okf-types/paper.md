---
type: okf-type-spec
filename: paper.md
title: "OKF Type: paper"
description: "Normative spec for the public Papers portfolio cards"
resource: okf-type:paper
tags: [okf, paper, portfolio, research, spec]
timestamp: "2026-09-19T00:00:00Z"
---

# OKF Type: `paper`

A `paper` card is the canonical knowledge record used by the public `/papers` portfolio.

## Publication boundary

The public portfolio is curated and intentionally non-exhaustive. Existence of a paper, branch, experiment, audit, findings record, tracker, tier, or publication-readiness state in `franklinbaldo/papers` does **not** authorize publication here.

- Creating a new public paper card requires explicit publication approval in the canonical upstream OKF state. Accepted signals include an explicit boolean such as `publication_approved: true`, `public: true`, `approved_for_public_blog: true`, or an equivalent field explicitly defined by the current upstream contract. Absence, ambiguity, tier assignment, or Zenodo/publication readiness is not approval.
- A sync routine may update an already-public card from upstream facts, but MUST NOT infer that a new upstream paper should become public.
- When publication approval is withdrawn, remove the public card and public references while leaving the research record in its source repository untouched.
- Do not preserve names, summaries, relations, changelog prose, generated indexes, or routine artifacts for intentionally withheld research merely for provenance. Public provenance starts again only if publication is later re-authorized.
- The absence of a paper from this repository is not evidence that the research does not exist, was abandoned, or received a negative evaluation.

The Markdown card is the source of truth. Astro pages, TypeScript projections, counts, tier boards, relationships and summaries MUST be derived from these cards rather than maintained as a second semantic authority.

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

| Field | Type | Meaning |
| --- | --- | --- |
| `source_url` | string | Override only when the canonical paper is not available as `<slug>.md` on `franklinbaldo/papers` main |
| `related_file` | string | Material audit/companion file in `franklinbaldo/papers` |
| `relations` | list[map] | Material paper-to-paper relationships; each item has `type`, `target`, and optional `note` |

A relation `target` is another paper-card slug. Prefer concrete relationship verbs such as `extends`, `tests`, `formalizes`, `applies`, `contrasts_with`, `shares_mechanism_with`, and `provides_control_for`. The optional `note` explains the substantive connection without duplicating either paper's summary.

## Identity, derivation and storage

Each paper MUST occupy exactly one card under `knowledge/papers/`. The card filename is the stable slug. Do not put multiple papers into one card.

The canonical paper path is derived mechanically as `<slug>.md`. Use `source_url` only when that derivation is factually wrong, for example because a historical filename differs in case or the paper lives on a non-main branch.

Display order is a projection/UI concern. Do not store `order` in a paper card. Likewise, do not store a redundant `file`, routine-touch `updated` date, or constant UI copy such as `related_label`.

Do not add or update an individual paper by editing a hardcoded array in `src/pages/papers.astro`, a JSON catalog, or another parallel store. Any TypeScript module is a build-time mechanical projection only.

## Anti-boilerplate rule

Paper cards exist to preserve knowledge, not to satisfy a template.

- Keep only fields that carry material knowledge.
- Do not persist values derivable from the card path/slug, UI sorting, routine execution time, constants, empty/default values, or ceremonial prose.
- The Markdown body SHOULD be empty when all material knowledge fits in front matter.
- Never repeat the title, type, repository path, or phrases such as “canonical OKF card” in the body.
- Use the body only for substantive prose that cannot be represented cleanly in the front matter.

## Tier semantics

Scientific tier measures current evidential/technical maturity within the paper's domain, not truth or author quality. Interest tier measures research fertility and generative value. Novelty by itself belongs primarily in interest, not scientific maturity. A tier moves only when evidence, formalization, scope, criticism, replication, or another material fact changes.
