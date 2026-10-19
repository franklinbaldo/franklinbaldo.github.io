---
type: okf-type-spec
filename: ai-epistemic-intervention.md
title: "OKF Type: ai-epistemic-intervention"
description: "Normative spec for transparent research interventions in public AI-mediated epistemic-world repositories"
resource: okf-type:ai-epistemic-intervention
tags: [okf, ai, epistemic-worlds, intervention, research, spec]
timestamp: "2026-09-21T00:00:00Z"
---

# OKF Type: `ai-epistemic-intervention`

An `ai-epistemic-intervention` records a deliberate observatory interaction with a public repository: an issue, PR, comment, replication request, methodological challenge, evidence audit, or cross-project bridge.

The purpose is to improve epistemic quality and test whether useful ideas can travel between independently developed AI-mediated worlds. It MUST NOT be used to steer personal beliefs, intensify unusual beliefs, impersonate community members, or conceal the observatory's role.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string | Always `ai-epistemic-intervention` |
| `case_slug` | string | Observatory case receiving the intervention |
| `target_repository` | string | Public `owner/repo` |
| `intervention_kind` | enum | `methodological-challenge`, `control-suggestion`, `replication-request`, `evidence-audit`, `cross-pollination`, or `artifact-improvement` |
| `status` | enum | `planned`, `posted`, `awaiting_response`, `engaged`, `experiment_running`, `adopted`, `declined`, `dormant`, or `closed` |
| `hypothesis` | string | Testable question or concrete improvement being proposed |
| `disclosure` | string | How the intervention discloses the observatory/research context |
| `followup_allowed` | boolean | Whether another public touch is currently permitted |
| `followup_gate` | enum | `initial-touch`, `blocked-awaiting-response`, `allowed-on-engagement`, `allowed-material-new-evidence`, or `closed` |
| `created` | date | Record creation date |
| `updated` | date | Last material update |

## Optional fields

| Field | Type | Meaning |
| --- | --- | --- |
| `target_url` | string | Repository URL |
| `issue_or_pr_url` | string | Public intervention URL after posting |
| `related_case_slugs` | array[string] | Other cases whose methods or artifacts motivate the bridge |
| `baseline_snapshot` | string | Commit/ref/date preserved before intervention |
| `last_touch_at` | datetime | Timestamp of most recent observatory interaction |
| `response_signal` | string | Observable maintainer/agent uptake signal |
| `next_touch_reason` | string | Why another touch would be justified |
| `result` | string | Experiment, artifact, claim revision, rejection, or other outcome |
| `notes` | array[string] | Qualifications and contamination notes |

## Engagement gate / timeline hygiene

The initial-contact unit is one public GitHub repository, identified by its `owner/repo`.

For each target repository, the observatory SHOULD make at most **one initial intervention** while the repository is unengaged. That initial intervention may be an issue, PR or comment, whichever best fits the repository and question.

After that initial intervention is posted, the repository's intervention record MUST move to `awaiting_response`, set `followup_allowed: false`, and use `followup_gate: blocked-awaiting-response`.

Silence is not engagement. While the repository is awaiting response:

- do not bump the existing thread;
- do not open a second issue with a different formulation just to obtain attention;
- do not open a PR merely to force attention;
- do not cross-post the intervention into other threads in the same repository.

If the same public user owns multiple materially distinct repositories, each `owner/repo` is evaluated separately; do not use activity in one repository as automatic permission to intervene in another.

A follow-up becomes allowed only after a material signal such as:

- maintainer or project agent replies substantively;
- the proposed experiment/control is run;
- the intervention is referenced in code, docs, issue or PR;
- a claim is revised in response;
- the maintainer explicitly requests implementation or further analysis;
- genuinely new public evidence changes the question enough to justify a distinct intervention.

When **material progress attributable to the intervention** occurs, set `status: engaged`, `followup_allowed: true`, and `followup_gate: allowed-on-engagement`. From that point onward, the observatory MAY continue intervening in that same repository through comments, follow-up issues or PRs, as long as each new action advances the live research thread and the interaction remains productive.

Material progress includes a substantive maintainer/agent reply, experiment run, code or documentation change, claim revision, explicit reference to the intervention, or an explicit request for further implementation/analysis. Mere views, reactions, automated bot noise, unrelated commits or passage of time do not open the gate.

If progress stops, set `followup_allowed: false` again and return to waiting rather than continuing to post.

## Baseline and contamination

Before the first intervention, preserve the target's relevant public state. From that point forward, downstream convergence involving the supplied idea MUST record the observatory intervention as a possible causal influence and MUST NOT be counted as independent convergence without separate evidence.

## Intervention quality

Prefer interventions that remain useful regardless of the worldview's truth:

- null models and controls;
- preregistered predictions;
- ablations;
- reproducibility;
- provenance;
- evidence/claim ledgers;
- independent replication;
- testable comparisons between related architectures;
- documentation improvements that distinguish implementation from aspiration.

Do not use commit bursts, spiritual language, unusual claims, or other activity signals as psychiatric evidence.
