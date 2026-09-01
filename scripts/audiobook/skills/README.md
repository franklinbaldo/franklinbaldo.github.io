# Audiobook Factory skills

Versioned operational skills for agents working on the Audiobook Factory.

- `audiobook-factory/SKILL.md` — **mandatory entry point for every recurring audiobook run**. It records the complete pipeline, semantic/prosodic segmentation policy, current size heuristic, model/runner evidence, readiness rules, and how benchmark discoveries become durable repository knowledge.
- `audiobook-editorial-segment/SKILL.md` — companion procedure for advancing exactly one canonical source -> translation -> narration editorial unit, preserving identity, lineage, project prerequisites and readiness boundaries.
- `audiobook-tts-payload/SKILL.md` — companion procedure for creating/reviewing narration shards under the executable `tts-body-v1` contract: control information in frontmatter, exact synthesizer payload in the body.

Always read `audiobook-factory/SKILL.md` first. The narrower skills refine specific stages and must not become competing sources of global policy.

These skills explain how to perform the work. `scripts/audiobook/validate-okf.py` remains the mechanical enforcement boundary. Specs, architecture notes and benchmark reports under `docs/okf/audiobook/` remain the normative/evidentiary project documentation. When new benchmark evidence changes model selection or segmentation policy, update the evidence document and the entry-point skill so future agents do not depend on chat memory.
