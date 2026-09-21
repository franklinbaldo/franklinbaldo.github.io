---
type: okf-type-spec
filename: ai-epistemic-convergence.md
title: "OKF Type: ai-epistemic-convergence"
description: "Normative spec for recurring ideas and cross-case synergies among AI-mediated epistemic worlds"
resource: okf-type:ai-epistemic-convergence
tags: [okf, ai, epistemic-worlds, convergence, synergy, spec]
timestamp: "2026-09-21T00:00:00Z"
---

# OKF Type: `ai-epistemic-convergence`

An `ai-epistemic-convergence` records a recurring idea, mechanism, artifact pattern, or research opportunity observed across multiple public AI-mediated epistemic worlds.

A convergence record asks whether several projects independently reached a related idea and whether one project's methods can productively test another's claims. Similarity is not evidence that the underlying claim is true.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `ai-epistemic-convergence` |
| `name` | string | Human-readable convergence name |
| `hypothesis_key` | string | Stable machine-readable concept key |
| `summary` | string | What is recurring |
| `case_slugs` | array[string] | Cases currently exhibiting the pattern |
| `overlap_dimensions` | array[string] | Mechanism, ontology, artifact, prediction, method, etc. |
| `independence_status` | enum | `established`, `partial`, `not-established`, or `contaminated` |
| `evidence_quality` | enum | `low`, `medium`, or `high` |
| `updated` | date | Last material review |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `independent_case_count` | integer | Count only when independence is actually established |
| `known_influences` | array[string] | Explicit cross-project exposure or shared source |
| `testable_predictions` | array[string] | Experiments suggested by the convergence |
| `cross_pollination_candidates` | array[string] | Case-to-case bridges worth proposing |
| `contamination_notes` | array[string] | Observatory or external influences that break independence |
| `source_urls` | array[string] | Direct public artifacts |

## Independence rule

Do not silently count two projects as independent because their maintainers are different people. Independence requires checking for direct references, shared communities, copied prompts/frameworks, common upstream documents, and observatory interventions.

Once the observatory points case A to case B, later adoption in A is valuable as diffusion but cannot be counted as independent convergence.

## Cross-pollination

Cross-project bridges should transfer methods, controls and artifacts rather than beliefs. Good examples:

- use one project's falsification protocol to test another's consciousness metric;
- use one project's memory architecture as an ablation target for another's identity claim;
- compare two independently developed agent-continuity systems under the same reset protocol;
- port a claim/evidence ledger or provenance discipline into a more speculative corpus.

Every public bridge should be represented by an `ai-epistemic-intervention` record.
