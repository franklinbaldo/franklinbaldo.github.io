---
type: okf-type-spec
filename: audiobook-tts-benchmark.md
title: "OKF Type: Audiobook TTS Benchmark"
description: "Normative spec for work-independent TTS benchmark corpora"
resource: okf-type:audiobook-tts-benchmark
tags: [okf, audiobook, tts, benchmark, spec]
timestamp: "2026-10-19T00:00:00Z"
---

# OKF Type: `Audiobook TTS Benchmark`

An `Audiobook TTS Benchmark` document is a synthetic corpus for comparing TTS backends on tasks relevant to audiobooks, independent of any work. It lives at `data/audiobook-benchmarks/<benchmark_id>.md` and is turned into a plan by `scripts/audiobook/benchmark-plan.mjs`.

## Required fields

| Field          | Type       | Meaning                                                        |
| -------------- | ---------- | -------------------------------------------------------------- |
| `type`         | string     | Always `Audiobook TTS Benchmark`                               |
| `schema`       | string     | Always `audiobook-tts-benchmark-v1`                            |
| `benchmark_id` | string     | Benchmark identifier; matches the file name                    |
| `language`     | string     | Corpus language                                                |
| `voices`       | map        | Logical voices keyed by voice id                               |
| `segments`     | array[map] | Segments with `id`, `speaker`, `text` and optional `direction` |

## Optional fields

| Field         | Type   | Meaning                   |
| ------------- | ------ | ------------------------- |
| `description` | string | What the corpus exercises |

## Digest

The plan's `narration_digest` covers every frontmatter field except `type`, which is OKF envelope rather than corpus content. Digests therefore stay comparable with plans made before the corpus became an OKF document.
