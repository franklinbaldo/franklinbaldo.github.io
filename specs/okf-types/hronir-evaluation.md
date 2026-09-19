---
type: Specification
title: Hronir Evaluation
description: Normative persisted contract for one Hrönir editorial evaluation.
tags: [hronir, okf, schema]
timestamp: 2026-09-18T00:00:00Z
---

# Hronir Evaluation

A `Hronir Evaluation` is one immutable editorial judgment produced by an
Hrönir run. The canonical carrier is Markdown with YAML frontmatter under
`.routines/hronir/rates/`.

## Required identity

- `type` MUST equal `Hronir Evaluation`.
- `schema` MUST equal `hronir-evaluation-v1`.
- `id` MUST be a stable string prefixed with `hronir:`.
- `run_id` and `run_at` identify the producing run and timestamp.
- `prompt_version` versions evaluator instructions independently from this
  persisted data schema.

## Required relations

- `post_a` and `post_b` identify the compared post/version sides.
- `agent_id` identifies the evaluator.
- `perspective_id` identifies the editorial perspective.
- `review_lang` identifies the language of the written evaluation.

## Judgment

Completed evaluations carry `winner`, `rate_a`, `rate_b`, `review_a`,
`review_b`, and `clash`. Existing Hrönir invariants (no tied ratings,
minimum review length, perspective validity, language rules) remain enforced by
`hronir:doctor`.

## Immutability and legacy

Historical `Rate File` documents are valid legacy records and MUST NOT be
bulk-rewritten merely to adopt this specification. Readers normalize legacy and
current records to the same computational representation.

## Derived formats

JSON, DuckDB and Parquet materializations are projections. They MUST NOT become
semantic authorities over the canonical Markdown/OKF records.
