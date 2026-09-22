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
| `ai_role` | array[string] | Non-empty roles for AI assistance explicitly supported by public artifacts |
| `queue_provenance` | object | How this account entered triage, including manual recovery/discovery; see below |
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
| `note` | string | Editorial qualification |

## AI-assistance evidence

AI assistance is part of the admission definition, not an inference from activity
volume or coding style. `ai_role` MUST be non-empty and every role recorded there MUST
be supported by a direct public artifact, for example explicit AI co-authorship,
repository instructions/configuration for an AI coding agent, an agent-generated or
agent-operated workflow documented by the project, or a public evaluation path in
which the AI system is an actual workload. Conventional solo repositories without
artifact-level AI evidence are out of scope for this type.

At least one of `source_url` or `source_urls` MUST point to the public evidence that
supports the recorded AI role. Do not infer AI assistance merely because output is
large, prose resembles model output, or the project topic concerns AI.

## Reception

`reception` records the measured absence or presence of lateral recognition. It is the
defining observation of this type, so it MUST distinguish a measured `0` from
`not_measured`, and MUST record the window it was measured over.

Every `reception` object MUST contain these nested keys:

| Key | Type | Meaning |
| --- | --- | --- |
| `measured_at` | date | Date of the accumulated-reception measurement |
| `stars` | integer or `not_measured` | Accumulated stars for the measured repository scope |
| `forks` | integer or `not_measured` | Accumulated forks |
| `watchers` | integer or `not_measured` | Accumulated watchers/subscribers where exposed as watchers |
| `external_issues` | integer or `not_measured` | Public issues attributable to actors other than the owner |
| `external_pull_requests` | integer or `not_measured` | Public PRs attributable to actors other than the owner |
| `distinct_external_contributors` | integer or `not_measured` | Distinct external contributors when measured |
| `window` | string | Human-readable measurement scope/window and source qualification |

A numeric zero means the field was actually measured and no reception was found. If a
field could not be measured, use the literal string `not_measured`; omission MUST NOT
be interpreted as zero. Additional fields such as `subscribers`, `discussions`, or a
more precise `scope` MAY be recorded when useful.

A sampling window of a few hours is not evidence of accumulated isolation: an account
can show zero interaction across six sampled hours and still hold hundreds of stars.
Accumulated counts MUST come from the repository API or equivalent direct public
evidence before a card claims isolation.

## Queue provenance

`queue_provenance` is REQUIRED so records admitted under different criteria remain
comparable over time. It MUST contain `criteria_version`, `first_sampled`,
`times_sampled`, and `collection_mode`.

`collection_mode` MUST make the admission path explicit, for example `queue`,
`manual-fallback`, `manual-recovery`, or `manual-discovery`. Queue-derived records
SHOULD preserve the admission values that applied. Manual recovery/discovery MUST use
`not_measured` for admission-band values that were not actually reconstructed rather
than manufacturing equivalents from repository recency or search rank.

Triage criteria are revised as they are tested against real data, and without
provenance an older card cannot be distinguished from one admitted by a filter since
abandoned. A single sampled day does not establish recurrence or persistence.

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
with its own disclosure and follow-up gate. For `solo-builder` cases, the account-level
gate below is stricter than the generic intervention contract's repository-level gate.

Before an initial public touch, inspect canonical intervention records for **all public
repositories owned by the same `public_handle`**. While that builder is unengaged, the
observatory MUST make at most one initial intervention to the account, regardless of
which repository receives it. If that initial touch receives no material engagement,
do not open a second issue, PR, or comment in another repository owned by the same
builder merely to regain attention. Silence is an answer.

A later touch to that account becomes eligible only after the same material engagement
signals recognized by `ai-epistemic-intervention` — substantive reply, experiment or
control run, code/docs adoption, claim revision, explicit request for more work — or
genuinely material new public evidence that independently satisfies the current
follow-up gate. Preserve the repository-specific intervention record while enforcing
this stricter account-level ceiling during solo-builder triage.
