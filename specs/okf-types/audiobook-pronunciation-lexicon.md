---
type: okf-type-spec
filename: audiobook-pronunciation-lexicon.md
title: "OKF Type: Audiobook Pronunciation Lexicon"
description: "Normative spec for recurring pronunciation decisions of an audiobook work or the blog"
resource: okf-type:audiobook-pronunciation-lexicon
tags: [okf, audiobook, tts, pronunciation, spec]
timestamp: "2026-10-19T00:00:00Z"
---

# OKF Type: `Audiobook Pronunciation Lexicon`

An `Audiobook Pronunciation Lexicon` document records recurring pronunciation decisions, so that narration files do not repeat them chapter by chapter. It lives at `data/audiobooks/<work_id>/pronunciation.md`, or at `data/audio/blog/pronunciation.md` for blog narration.

## Required fields

| Field     | Type       | Meaning                                  |
| --------- | ---------- | ---------------------------------------- |
| `type`    | string     | Always `Audiobook Pronunciation Lexicon` |
| `locale`  | string     | Locale the pronunciations target         |
| `entries` | array[map] | Pronunciation entries (see Entry below)  |

## Optional fields

| Field     | Type   | Meaning                                                                   |
| --------- | ------ | ------------------------------------------------------------------------- |
| `schema`  | string | `audiobook-pronunciation-v1`; required for works under `data/audiobooks/` |
| `work_id` | string | Owning work; required for works under `data/audiobooks/`                  |
| `version` | number | Lexicon revision, used by the blog lexicon                                |

## Entry

| Field    | Type   | Meaning                                      |
| -------- | ------ | -------------------------------------------- |
| `term`   | string | Term as written in the text                  |
| `say_as` | string | How the term should be read aloud            |
| `scope`  | string | Where the decision applies, such as `global` |
| `status` | string | Decision status, such as `review`            |
| `note`   | string | Editorial note about the decision            |

## Typing

The OKF parser keeps every frontmatter scalar as its source text. Readers must cast exactly the `number` fields listed in this spec and leave every other scalar a string. `src/audiobook/okf.js` holds the executable list of these casts; a change to one must change the other.
