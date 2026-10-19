---
type: okf-type-spec
filename: audiobook-work-state.md
title: "OKF Type: Audiobook Work State"
description: "Normative spec for the editorial and publication ledger of one audiobook work"
resource: okf-type:audiobook-work-state
tags: [okf, audiobook, state, spec]
timestamp: "2026-10-19T00:00:00Z"
---

# OKF Type: `Audiobook Work State`

An `Audiobook Work State` document is the machine-maintained ledger of one audiobook work: which chapters exist, which editorial gates each chapter has passed, and what has been published. It lives at `data/audiobooks/<work_id>/state.md`. `scripts/audiobook/apply-publication.mjs` rewrites its frontmatter when a chapter is published and keeps its body.

## Required fields

| Field         | Type   | Meaning                                                      |
| ------------- | ------ | ------------------------------------------------------------ |
| `type`        | string | Always `Audiobook Work State`                                |
| `schema`      | string | Always `audiobook-work-state-v1`                             |
| `work_id`     | string | Work identifier; must match the directory and `work.md`      |
| `status`      | string | Overall work status, such as `in_progress` or `published`    |
| `next_action` | string | The next concrete step for the work                          |
| `chapters`    | map    | Chapter states keyed by chapter id (see Chapter state below) |

## Optional fields

| Field                                        | Type         | Meaning                                                   |
| -------------------------------------------- | ------------ | --------------------------------------------------------- |
| `project_gates`                              | map[boolean] | Work-level readiness gates                                |
| `publication`                                | map          | Work-level publication policy                             |
| `publication.public_distribution_authorized` | boolean      | Whether episodes of this work may be distributed publicly |

## Chapter state

Each value of `chapters` is a map with these fields:

| Field                                             | Type         | Meaning                                                                      |
| ------------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| `status`                                          | string       | Chapter status                                                               |
| `next_action`                                     | string       | Next step for the chapter                                                    |
| `files`                                           | map[string]  | Paths relative to the work directory (`narration` is required to plan audio) |
| `gates`                                           | map[boolean] | Editorial gates; seven are required before `ready_for_audio`                 |
| `ready_for_audio`                                 | boolean      | Whether the chapter may be sent to TTS                                       |
| `publication`                                     | map          | Episode publication record                                                   |
| `publication.duration_seconds`                    | number       | Episode duration                                                             |
| `publication.enclosure.bytes`                     | number       | Size of the published audio file                                             |
| `publication.transcript.verification.headStatus`  | number       | HTTP status of the transcript HEAD check                                     |
| `publication.transcript.verification.rangeStatus` | number       | HTTP status of the transcript range check                                    |
| `publication.chapters[].start_seconds`            | number       | Start time of an in-episode chapter marker                                   |

## Typing

The OKF parser keeps every frontmatter scalar as its source text. Readers must cast exactly the `boolean` and `number` fields listed in this spec and leave every other scalar a string. `src/audiobook/okf.js` holds the executable list of these casts; a change to one must change the other.
