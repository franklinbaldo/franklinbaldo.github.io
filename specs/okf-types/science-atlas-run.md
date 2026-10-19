---
type: okf-type-spec
filename: science-atlas-run.md
title: "OKF Type: science-atlas-run"
description: "Normative spec for one recurrent Scientific Equation Atlas research run"
resource: okf-type:science-atlas-run
tags: [okf, science, routine, audit]
timestamp: "2026-09-22T00:00:00Z"
---

# OKF Type: `science-atlas-run`

A `science-atlas-run` card is a historical record of one recurring research execution.

Runs make frontier selection, prior-art consultation, additions, rejected hypotheses and remaining evidence debt inspectable. Temporary operational state belongs in these repository records rather than in the stable executor prompt.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `science-atlas-run` |
| `date` | date | Execution date |
| `mode` | string | Main work mode used in the run |
| `summary` | string | Concise result |
| `updated` | date | Last material edit date |
