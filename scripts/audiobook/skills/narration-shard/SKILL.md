---
name: audiobook-narration-shard
description: |
  Prepare and review an Audiobook Narration Segment as an executable TTS
  envelope: all non-spoken controls and notes in frontmatter, and only the
  exact text to synthesize in the Markdown body.
---

# audiobook-narration-shard

Use this skill whenever creating, reviewing or migrating an `Audiobook Narration Segment`.

## Contract

A canonical narration shard is an executable handoff:

```text
frontmatter = TTS/editorial control plane
body        = exact TTS input
```

Set `tts_body_contract: tts-input-v1` on new shards.

## Frontmatter

Keep identity, lineage, language, speaker, voice partition, emotion, pace, intensity, pauses and every non-spoken instruction in frontmatter. Put prose notes under `editorial_notes` rather than after the body.

Provider-specific IDs, secret values and backend hacks do not belong in the canonical shard.

## Body purity

The body must survive this operation unchanged:

```text
tts(markdown_body.strip(), frontmatter)
```

Do not put headings, editorial notes, model instructions, comments, fenced code, Markdown-only links/images, metadata or explanations in the body.

Do not rely on a later consumer to remove `## Nota de realização oral` or any other suffix. There is no cleanup heuristic in the contract.

## Review questions

Before accepting the shard, answer yes to all of these:

- Is every character in the body intended to participate in the spoken payload?
- Are all non-spoken directions represented in frontmatter or work-level config?
- Does `speaker` resolve through `voices.yaml`?
- Are recurring pronunciations handled by `pronunciation.yaml` rather than copied as hacks?
- Does the body preserve the approved translation's meaning?
- Can a backend-independent adapter consume the shard without editorial inference?

## Validation

Run `scripts/audiobook/validate-okf.py`. A shard declaring `tts-input-v1` must fail validation if its body contains obvious Markdown/documentation structures or is empty.

A chapter cannot become `ready_for_audio` until all of its required narration shards satisfy the current TTS body contract.
