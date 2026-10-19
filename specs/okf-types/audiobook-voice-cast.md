---
type: okf-type-spec
filename: audiobook-voice-cast.md
title: "OKF Type: Audiobook Voice Cast"
description: "Normative spec for the logical voices used to narrate an audiobook work or the blog"
resource: okf-type:audiobook-voice-cast
tags: [okf, audiobook, tts, voices, spec]
timestamp: "2026-10-19T00:00:00Z"
---

# OKF Type: `Audiobook Voice Cast`

An `Audiobook Voice Cast` document declares the logical voices a narration may reference. Each voice is copied into the TTS plan of every segment that uses it and is part of that segment's `input_digest`, so changing a voice invalidates the audio already rendered with it. It lives at `data/audiobooks/<work_id>/voices.md`, or at `data/audio/blog/voices.md` for blog narration.

## Required fields

| Field            | Type   | Meaning                                            |
| ---------------- | ------ | -------------------------------------------------- |
| `type`           | string | Always `Audiobook Voice Cast`                      |
| `default_locale` | string | Locale applied to voices that do not declare one   |
| `voices`         | map    | Logical voices keyed by voice id (see Voice below) |

## Optional fields

| Field     | Type   | Meaning                                                            |
| --------- | ------ | ------------------------------------------------------------------ |
| `schema`  | string | `audiobook-voices-v1`; required for works under `data/audiobooks/` |
| `work_id` | string | Owning work; required for works under `data/audiobooks/`           |

## Voice

| Field                   | Type                 | Meaning                                                 |
| ----------------------- | -------------------- | ------------------------------------------------------- |
| `role`                  | string               | `narrator` or `character`                               |
| `description`           | string               | Provider-neutral description of the voice               |
| `locale`                | string               | Overrides `default_locale`                              |
| `seed`                  | number               | Deterministic seed for backends that take one           |
| `kokoro.voice`          | string or array[map] | Kokoro voice id, or a blend of `{name, weight}` entries |
| `kokoro.voice[].weight` | number               | Weight of one voice in a blend                          |
| `kokoro.speed`          | number               | Kokoro speaking-rate multiplier                         |

## Typing

The OKF parser keeps every frontmatter scalar as its source text. Readers must cast exactly the `number` fields listed in this spec and leave every other scalar a string. `src/audiobook/okf.js` holds the executable list of these casts; a change to one must change the other.
