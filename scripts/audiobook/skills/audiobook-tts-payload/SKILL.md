---
name: audiobook-tts-payload
description: |
  Build or review an Audiobook Narration Segment as an executable TTS request.
  Under tts-body-v1, all identity, lineage, voice/prosody parameters and local
  editorial notes live in frontmatter; the Markdown body is exactly the text
  sent to TTS. Use this skill when creating narration shards, reviewing them,
  changing adapters, or debugging accidental narration of notes/Markdown.
---

# audiobook-tts-payload

Use this skill whenever the question is: "can this narration shard be passed to TTS as-is?"

## Core invariant

For a narration shard under `tts-body-v1`, `parse(frontmatter); tts(body, parameters)` must be sufficient. No regex cleanup, section removal, note stripping, Markdown rendering, prompt repair or editorial interpretation may sit between parsing and the TTS adapter.

## Frontmatter owns control information

Put stable identity, `derived_from`, `payload_contract: tts-body-v1`, speaker/voice partition, emotion, pace, intensity, pauses, provider-neutral realization parameters, local `editorial_notes` and any structured adapter-consumable exception in frontmatter.

`editorial_notes` are never concatenated to the spoken text.

## Body owns only speech payload

The body contains exactly the textual payload intended for synthesis. It may contain multiple paragraphs if every paragraph is supposed to be spoken.

Do not put headings, Nota editorial/Nota de realização oral, TODOs, reviewer comments, documentation fences, structural blockquotes/lists, provenance, pronunciation explanations or backend setup instructions in the body.

If information should guide synthesis but should not be spoken, it belongs in structured frontmatter or a work-level guide/config.

## Review procedure

Read the body alone, pretending all frontmatter is invisible. Ask: "If a synthesizer says every character here, is the resulting speech exactly what we want the listener to hear?" If not, move the non-spoken material out of the body.

Then inspect frontmatter and verify that the adapter has enough structured information to synthesize the body without guessing editorial intent. Finally run `scripts/audiobook/validate-okf.py`.

## Migration

A work can declare `narration_payload_contract: tts-body-v1` and `narration_payload_contract_from: <segment_id>` in `work.md`. Segments at or after that boundary must self-declare `payload_contract: tts-body-v1` and pass body-purity validation. Legacy segments before the boundary are migration debt, not examples to copy. New works should normally start `tts-body-v1` at their first narration segment.
