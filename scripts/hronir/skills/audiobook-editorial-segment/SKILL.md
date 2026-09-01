---
name: audiobook-editorial-segment
description: |
  Canonical skill for advancing exactly one audiobook editorial segment through
  source/original OKF -> translation OKF -> narration OKF. Use it whenever an
  agent creates, edits, reviews, or validates audiobook segment shards. The
  narration shard is an executable TTS envelope: frontmatter carries identity,
  lineage, voice/prosody parameters, pronunciation references, and editorial
  notes; the Markdown body is exactly the synthesis payload and must contain no
  notes or cleanup-only markup.
---

# audiobook-editorial-segment

Use this skill when advancing or repairing audiobook editorial units in this repository.

## Core invariant

Every segment keeps the same `work_id`, `chapter_id`, and `segment_id` across all three canonical layers:

```text
original -> translation -> narration
```

`derived_from` must resolve exactly from translation to original and from narration to translation.

## One editorial unit at a time

Advance exactly one next segment unless the task is explicitly structural/migratory. Never silently create the following segment while finishing the current one.

Before editing, inspect the existing work state and determine the next missing canonical unit from the shard intersection. Do not recreate an already canonical segment.

## Original/source shard

The original body contains only the source text for that editorial unit. Frontmatter carries provenance such as source URL, digest, anchor, language and stable identity.

Do not add analysis, translation notes, or narration direction to the original body.

## Translation shard

Translate using ChatGPT's own reasoning. Do not call external LLM APIs.

The translation body contains only the translated editorial text. Keep commentary out of the body. If a translation decision must be persisted, put it in structured frontmatter or the work-level translation/editorial guide rather than appending a note section that could later be mistaken for content.

Preserve meaning, style, humor, logical relations, names and deliberate ambiguity. Do not introduce TTS-provider workarounds here.

## Narration shard = executable TTS envelope

Treat the narration OKF as directly consumable by a TTS adapter.

The contract is:

```text
frontmatter = identity + lineage + speaker + prosody + pauses + editorial direction
body        = exact text to synthesize
```

The body must be ready to pass to the TTS model without preprocessing or heuristic cleanup. Therefore:

- put `speaker`, `emotion`, `pace`, `intensity`, `pause_before_ms`, `pause_after_ms`, `voice_partition` and similar execution parameters in frontmatter;
- put local production/editorial observations in `editorial_notes` in frontmatter;
- keep recurring pronunciation rules in the work's `pronunciation.yaml`;
- keep voice identities in the work's `voices.yaml`;
- never append `## Nota de realização oral`, headings, fenced blocks, HTML comments, metadata sections, or other non-spoken material to the body;
- do not invent vocal events, sound effects, emotions or stage business absent from the text unless an explicit editorial rule authorizes them;
- preserve paragraph breaks when they are part of the intended synthesis payload.

A correct consumer should be able to do the conceptual equivalent of:

```text
segment = parse_okf(file)
tts(text=segment.body, parameters=segment.frontmatter)
```

If that would speak an editorial note, the shard is invalid.

## Project-level prerequisites

Before declaring any chapter audio-ready, verify that the relevant project/work controls exist and apply:

- global translation guidance;
- global narration/TTS preparation guidance;
- work editorial/style guide;
- work provenance and rights metadata;
- `voices.yaml` with logical speaker identities;
- `pronunciation.yaml` with recurring terminology/pronunciation rules;
- validation/readiness rules;
- multi-work identity architecture.

Do not mark a chapter audio-ready merely because the latest segment is complete.

## Validation

Run the canonical audiobook validation. `scripts/audiobook/validate-okf.py` is the fail-closed gate for per-segment identity, lineage, prerequisites, voices, pronunciation configuration, and narration body purity.

Narration-body validation is intentional: the worker must not strip notes or Markdown sections before synthesis. Invalid corpus fails before TTS.

## External model boundary

Editorial generation is performed in ChatGPT. External model APIs are prohibited for source selection, translation, rewriting and narration preparation.

Only after the chapter is explicitly `ready_for_audio` may configured TTS execution use external models or free GPU runners.

## Persisting state

If the chapter cannot be completed, leave deterministic state in canonical files and PR history. The next cursor is derived from the stable shard set; do not create an ad-hoc `state.yaml`.
