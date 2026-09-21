---
type: okf-type-spec
filename: solo-builder.md
title: "OKF Type: solo-builder"
description: "Normative spec for solo high-output builders observed without lateral recognition"
resource: okf-type:solo-builder
tags: [okf, ai, solo-builders, triage, spec]
timestamp: "2026-09-21T00:00:00Z"
---

# OKF Type: `solo-builder`

A `solo-builder` card records one public GitHub account producing substantially, alone,
with AI assistance, on work that is not a commodity, and receiving little or no
interaction from other people.

The card exists so that a later pass can connect people. It is triage for
introduction, not a case file. Where an account also qualifies as an AI-mediated
epistemic world, use `ai-epistemic-world` instead; this type covers builders whose work
carries no such framing — an operating system, a language, a file system — and who are
therefore invisible to vocabulary-based discovery.

The type describes public artifacts and public interaction counts. It MUST NOT be used
to diagnose any clinical condition, and clinical vocabulary MUST NOT appear in a card.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `solo-builder` |
| `name` | string | Display name for the work, not the person |
| `public_handle` | string | Public GitHub handle |
| `building` | string | What they are actually making, in plain terms |
| `domain` | array[string] | Descriptive area tags |
| `reception` | object | Measured lateral recognition; see below |
| `blocking_constraint` | string | What appears to be stopping them, read from artifacts |
| `missing_resource` | enum | `knowledge`, `tool`, `reviewer`, `user`, `peer`, `none-apparent`, or `not-assessed` |
| `confidence` | enum | `low`, `medium`, or `high` |
| `source_label` | string | Human-readable primary source label |
| `source_url` | string | Primary GitHub URL |
| `updated` | date | Last material review date |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `source_urls` | array[string] | Additional direct sources |
| `personal_site` | string | URL of a `<login>.github.io` or equivalent self-published site |
| `maturity` | enum | `prototype`, `working`, `in-use`, `stalled`, or `resumed` |
| `unlock` | string | The cheap hint that might dissolve the constraint, if one is apparent |
| `synergy_candidates` | array[string] | Slugs of other cards solving adjacent problems |
| `trajectory` | array[string] | Short longitudinal stages |
| `ai_role` | array[string] | Roles explicitly attributed to AI in the artifacts |
| `queue_provenance` | object | How this account entered triage; see below |
| `note` | string | Editorial qualification |

## Reception

`reception` records the measured absence or presence of lateral recognition. It is the
defining observation of this type, so it MUST distinguish a measured `0` from
`not_measured`, and MUST record the window it was measured over.

Useful fields are `measured_at`, `stars`, `forks`, `watchers`, `external_issues`,
`external_pull_requests`, `distinct_external_contributors`, and `window`.

A sampling window of a few hours is not evidence of accumulated isolation: an account
can show zero interaction across six sampled hours and still hold hundreds of stars.
Accumulated counts MUST come from the repository API before a card claims isolation.

## Queue provenance

`queue_provenance` SHOULD record `criteria_version`, `first_sampled`, `times_sampled`
and the admission values that applied. Triage criteria are revised as they are tested
against real data, and without provenance an older card cannot be distinguished from
one admitted by a filter since abandoned.

## Missing resource

`missing_resource` is the field that converts observation into action, and the reason
the card is worth writing. It names what the blocking constraint implies is absent,
not what the person should do.

It is also the field that aggregates: several builders blocked for want of a reviewer
is a pattern about the environment, while one builder unaware that a library exists is
a single message.

## Volume is not a measure of a person

Commit counts, repository counts, event volume and streaks are used only as an
admission band during triage — a floor and a ceiling — and MUST NOT be recorded as a
ranking, a tier, or a characteristic of the person. High output with no reception is
the observation; output alone says nothing.

## Identity

The card filename is the stable slug. One public account MUST occupy exactly one card.
An account MUST NOT hold both a `solo-builder` and an `ai-epistemic-world` card; when
the framing changes, migrate the card and keep the slug.

## Contact

A card does not authorize contact. Any interaction is an `ai-epistemic-intervention`
with its own disclosure and follow-up gate. Silence is an answer.
