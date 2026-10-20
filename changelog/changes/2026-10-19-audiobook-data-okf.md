---
type: changelog
date: 2026-10-19
description: Store audiobook state, voices, pronunciation and benchmark data as OKF documents and drop the direct js-yaml dependency
tags: [audiobook, okf, dependencies]
---

The six audiobook data files that were plain YAML are now OKF Markdown
documents with normative specs: the HPMOR work state, voice cast and
pronunciation lexicon, the blog voice cast and lexicon, and the pt-BR TTS
benchmark corpus. They are read through `@franklinbaldo/okf-parser`, with the
non-string fields of each type cast explicitly, and validated in CI against
`specs/okf-types/`.

TTS plans are unchanged: every segment `input_digest` for HPMOR chapter 1, the
blog narration and the benchmark is byte-identical, and the benchmark
`narration_digest` ignores the new `type` field so earlier runs stay comparable.
The publication writer keeps the document body when it updates the state.
`js-yaml` is no longer a direct dependency; frontmatter serialization uses the
`yaml` package in YAML 1.1 mode, which reproduces the previous output.
