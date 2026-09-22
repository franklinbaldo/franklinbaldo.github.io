---
type: okf-type-spec
filename: rate-file.md
title: "OKF Type: Rate File"
description: "Legacy Hrönir evaluation record retained for compatibility"
resource: okf-type:Rate File
tags: [okf, hronir, legacy, evaluation]
timestamp: "2026-09-21T00:00:00Z"
---

# OKF Type: `Rate File`

Legacy Hrönir records remain readable and immutable. New evaluations MUST use `Hronir Evaluation`.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `Rate File` |
| `run_id` | string | Stable evaluation id |
| `post_a` | object | Legacy nested side A |
| `post_b` | object | Legacy nested side B |
| `winner` | enum | `a` or `b` |
