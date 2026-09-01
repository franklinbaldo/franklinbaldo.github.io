---
name: audiobook-editorial-segment
description: |
  Canonical skill for advancing exactly one audiobook editorial segment through
  source/original OKF -> translation OKF -> narration OKF. Use it whenever an
  agent creates, edits, reviews, or validates audiobook segment shards. A
  narration shard declaring tts_body_contract: body-is-payload-v1 is an
  executable TTS envelope: frontmatter carries identity, lineage, voice/prosody,
  pronunciation references, and editorial notes; the body is exactly the text
  sent to synthesis and must contain no notes or cleanup-only markup.
---

# audiobook-editorial-segment

Use this skill whenever you advance or repair audiobook editorial units in this repository.

## Canonical pipeline

Advance one stable unit through:

```text
source/original OKF -> translation OKF -> narration OKF -> validation/readiness
```

Keep `work_id`, `chapter_id`, and `segment_id` identical across the three layers. `derived_from` must resolve exactly translation -> original and narration -> translation.

Do not create the following segment while finishing the current one unless the task is explicitly a structural migration.

## Original

The original body contains only the source text for that editorial unit. Provenance, source URL, digest and anchor belong in frontmatter.

## Translation

Use ChatGPT's own reasoning. Do not call external LLM APIs. The translation body contains only translated content, not commentary. Persist recurring editorial decisions in work/project guides rather than appending note sections to the body.

Do not contaminate translation with provider-specific TTS workarounds.

## Narration is an executable envelope

For new or migrated narration shards, declare:

```yaml
tts_body_contract: body-is-payload-v1
```

Then obey this invariant:

```text
frontmatter = identity + lineage + speaker + prosody + pauses + editorial direction
body        = exact text to synthesize
```

Put local production observations in `editorial_notes` in frontmatter. Put recurring pronunciation in the work's `pronunciation.yaml`; put logical voice identities in `voices.yaml`.

Never append `## Nota de realização oral`, headings, fenced code blocks, HTML comments, metadata sections, or any other non-spoken material to the narration body. Do not expect the worker to strip them. If `tts(text=body, parameters=frontmatter)` would speak a note, the shard is invalid.

Do not invent vocal events, sound effects, emotions, or stage business absent from the text unless an explicit editorial rule authorizes them.

## Project prerequisites

Before a chapter can be audio-ready, verify the relevant global/work controls exist and apply: translation guidance, narration/TTS guidance, work editorial guide, provenance/rights metadata, `voices.yaml`, `pronunciation.yaml`, validation/readiness rules, and multi-work identity architecture.

A legacy narration shard without `tts_body_contract: body-is-payload-v1` may remain parseable during migration, but it blocks `narration_ready` and `ready_for_audio`.

## Validation

Run the canonical audiobook validation. `scripts/audiobook/validate-okf.py` is the fail-closed segment gate for identity, lineage, prerequisites, voices, pronunciation configuration, and direct-body TTS purity for migrated/new shards.

The validator reports `legacy_narration_segments`; chapter audio readiness requires that count to be zero for the chapter.

## External-model boundary

Editorial generation remains in ChatGPT. External model APIs are prohibited for translation, rewriting, narration preparation, and editorial decisions. Only after a chapter is explicitly `ready_for_audio` may configured TTS execution use external models or free GPU runners.

## State

Persist deterministic progress through canonical shards and PR history. Derive the next cursor from the shard set; do not create an ad-hoc `state.yaml`.
