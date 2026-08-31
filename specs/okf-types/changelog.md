---
type: okf-type-spec
filename: changelog.md
title: "OKF Type: changelog"
description: "Normative spec for site change cards"
resource: okf-type:changelog
tags: [okf, changelog, spec]
timestamp: "2026-08-31T00:00:00Z"
---

# OKF Type: `changelog`

Change cards are the durable, reader-facing record of changes to the site and its supporting automation.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `changelog` |
| `date` | date | Date associated with the change |
| `description` | string | Short reader-facing summary of the change |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `tags` | array[string] | Small set of discovery labels |

Change cards describe historical change. They are not normative documentation of current behavior.
