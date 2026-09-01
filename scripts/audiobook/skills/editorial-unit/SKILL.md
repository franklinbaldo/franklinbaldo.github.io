---
name: audiobook-editorial-unit
description: |
  Advance exactly one audiobook editorial unit through source/original OKF,
  translation OKF, narration OKF and validation/readiness without using an
  external LLM for editorial generation. Preserve stable work/chapter/segment
  identity and keep the narration shard directly consumable by TTS.
---

# audiobook-editorial-unit

Use this skill whenever advancing one audiobook unit in the canonical factory.

## Before editing

Read the project-level audiobook specs and guides, especially:

- `docs/okf/audiobook/editorial-control-plane.md`
- `docs/okf/audiobook/guides/translation.md`
- `docs/okf/audiobook/guides/narration.md`
- `docs/okf/audiobook/narration-segment-contract.md`
- `docs/okf/audiobook/chapter-readiness.md`
- `docs/okf/audiobook/multi-work-architecture.md`

Then read the work-level `work.md`, `editorial.md`, `rights.md`, `voices.yaml` and `pronunciation.yaml`.

## One-unit rule

Advance exactly one next editorial unit. Do not prepare the following unit in the same run.

Preserve the same `work_id`, `chapter_id` and `segment_id` in original, translation and narration shards. Preserve deterministic lineage with `derived_from`.

## Pipeline

1. Create/verify the source shard from the canonical source, with provenance and digest.
2. Produce the translation in ChatGPT itself; do not call an external LLM API.
3. Produce the narration shard in ChatGPT itself; do not call an external LLM API.
4. Apply voice, pronunciation and work-specific editorial guidance.
5. Validate the OKF bundle and readiness constraints.
6. Never dispatch TTS unless the chapter is explicitly audio-ready.

## Narration handoff

For every new narration shard, set:

```yaml
tts_body_contract: tts-input-v1
```

The narration Markdown body is not documentation. It is the exact payload to be synthesized. Put non-spoken direction and notes in frontmatter, usually under `editorial_notes`.

Before finishing, mentally execute:

```text
frontmatter = parse_frontmatter(file)
body = markdown_body(file).strip()
tts(body, frontmatter)
```

If that would speak a note, heading, instruction, metadata or Markdown artifact, the shard is wrong.

## Completion

Run the repository audiobook validator. Persist a deterministic next cursor through the canonical shard set; do not create an ad-hoc `state.yaml`.
