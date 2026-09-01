---
name: audiobook-editorial-segment
description: |
  Advance exactly one audiobook editorial segment through source/original OKF,
  translation OKF, narration OKF, and validation/readiness. Use ChatGPT's own
  editorial reasoning; do not call external LLM APIs. Preserve work_id,
  chapter_id, segment_id and lineage across layers. Before touching audio,
  verify work-level style, translation, narration, voice, pronunciation,
  provenance/rights and validation prerequisites. The narration shard must be
  executable under the work's declared payload contract: frontmatter carries
  metadata/direction/notes and the body carries only text intended for TTS.
---

# audiobook-editorial-segment

Use this skill whenever advancing one unit of an audiobook in this repository.

## Unit of work

Advance exactly one next canonical editorial unit. Do not opportunistically prepare the following segment. Derive the cursor from existing canonical shards rather than a manually maintained state file.

For one `segment_id`, create or complete exactly these aligned layers:

```text
original/<segment_id>.okf.md
  -> translation/<segment_id>.okf.md
  -> narration/<segment_id>.okf.md
```

`work_id`, `chapter_id`, and `segment_id` must be byte-for-byte identical across the three layers. `derived_from` must resolve exactly from translation to original and from narration to translation.

## Before editing

Read and apply the project/work prerequisites relevant to the unit: global editorial control plane, translation guide, narration guide, chapter readiness rules, work `editorial.md`, `rights.md`, `voices.yaml` and `pronunciation.yaml`.

If a recurring decision is missing, add it at the work/project level instead of copying ad-hoc instructions into many segments.

## Original shard

Preserve source text exactly for the selected unit. Record source URL, source anchor and digest. Do not combine the next unit merely because it is convenient for TTS.

## Translation shard

Translate with ChatGPT's own reasoning. Do not call an external model API. Preserve meaning, rhetoric, ambiguity and register. Keep translation decisions separate from pronunciation and provider-specific TTS workarounds.

## Narration shard

Narration is the orally executable form of the approved translation. Follow the work's `narration_payload_contract`.

Under `tts-body-v1`, frontmatter owns identity, lineage, TTS direction and editorial notes; body owns the exact TTS payload. Never put headings such as `## Nota de realização oral`, reviewer notes, comments, TODOs, explanations or other non-spoken material in the body. Put local notes in `editorial_notes`, recurring pronunciation in `pronunciation.yaml` and stable voice identity in `voices.yaml`.

Every new narration segment under this contract declares `payload_contract: tts-body-v1`. The body must be usable directly by the TTS adapter without editorial cleanup.

## Validation and readiness

Run the canonical audiobook validation for the work/chapter. A valid segment is not the same thing as an audio-ready chapter. Do not mark a chapter `ready_for_audio` until every project-level readiness prerequisite passes.

External model/API use is forbidden for source selection, translation, rewriting, narration preparation and editorial review. TTS is the only allowed external-model stage, and it may run only after explicit audio readiness.

## Persisted handoff

If the chapter is not complete, leave the repository in deterministic state: aligned shards for the unit, validation evidence, and no shard for the following unit. The next run infers the next `segment_id` from the corpus alone.
