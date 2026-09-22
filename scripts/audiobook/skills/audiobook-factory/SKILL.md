---
name: audiobook-factory
description: |
  Canonical operational skill for the Audiobook Factory. Read this before any
  recurring audiobook run. It defines the end-to-end source -> translation ->
  narration -> readiness -> TTS -> publication pipeline, semantic/prosodic
  segmentation policy, current TTS model/runner evidence, validation gates,
  and the rule for turning new benchmark evidence into durable repository
  knowledge instead of relying on agent memory.
---

# audiobook-factory

This is the entry-point skill for all audiobook work in this repository. Read it before advancing any work, chapter or segment. More specialized skills may refine individual stages, but they do not replace this one.

## 1. Source of durable knowledge

The factory must not depend on what a recurring agent happens to remember. Durable knowledge lives in this repository:

- this skill records the current operational policy and the current evidence-backed defaults;
- `docs/okf/audiobook/` records normative specs, architecture decisions and benchmark reports;
- work-level files under `data/audiobooks/<work_id>/` record rights, voices, pronunciation and editorial overrides;
- `scripts/audiobook/validate-okf.py` mechanically enforces invariants that can be checked automatically.

When a real experiment changes what we know about segment size, model behavior, runner reliability, pronunciation, prosody or quality, update the relevant benchmark/spec and then update this skill in the same change or an immediately-following PR. Do not leave an important operational discovery only in a chat, issue comment or agent memory.

## 2. Canonical pipeline

For books that require translation, the editorial pipeline is:

```text
canonical source
  -> source/original OKF
  -> translation OKF
  -> narration OKF
  -> validation/readiness
  -> deterministic TTS plan
  -> TTS backend on configured runner
  -> assembled media
  -> publication/storage
```

Editorial generation stops before TTS. Source selection, translation, rewriting, narration preparation and editorial review use the agent's own reasoning and MUST NOT call external LLM/model APIs. TTS is the only external-model stage and may run only after explicit readiness.

The architecture is multi-work. HPMOR, Bhagavad Gita and future works use the same identity, readiness, media and publication contracts with work-specific overrides.

## 3. One recurring run = one next editorial unit

A recurring editorial run advances exactly one next canonical unit. It must first reconstruct the current state from GitHub and existing shards so concurrent work is not duplicated.

The three canonical layers for the unit share exactly the same:

```text
work_id
chapter_id
segment_id
semantic source span
```

Lineage is exact:

```text
original -> translation -> narration
```

Do not create the following segment in the same editorial run. The next cursor is derived from the corpus, not from an ad-hoc state file.

## 4. How to segment

The unit of segmentation is a **semantic/prosodic block**, not a sentence counter and not automatically a paragraph.

Choose the source span before translating. Prefer a contiguous block that a modern expressive TTS can understand as one coherent movement: one thought, one exchange, one descriptive beat, one argument step, or a short cluster of paragraphs that belong together.

Natural boundaries include:

- a meaningful speaker or voice-direction change that cannot be represented cleanly inside one request;
- a scene or temporal break;
- a strong rhetorical/prosodic reset;
- a long block whose single-request synthesis becomes empirically unstable;
- a unit whose internal voice partition must be rendered separately for technical reasons.

Do **not** split merely because a sentence ended. More linguistic context usually gives advanced TTS systems more information for rhythm, emphasis, coarticulation and sentence-to-sentence prosody. Conversely, do not merge unrelated movements merely to maximize request size.

### Current size heuristic

The current repository heuristic is **roughly 240–1800 characters of narration body** for an ordinary canonical segment.

This range is an editorial review heuristic, **not a claimed model context limit**. A coherent segment may be smaller or larger. When it is exceptionally short, record `short_segment_reason`; when exceptionally long, record `long_segment_reason`. The validator uses those explanations to catch accidental microsegmentation or unjustified giant units.

The target should evolve from evidence. In particular, benchmarks should test whether larger coherent payloads improve or degrade:

- pronunciation/phonetic accuracy;
- omissions or repetitions;
- emotional/prosodic continuity;
- speaker consistency;
- latency and GPU memory;
- truncation or model instability.

If a backend has a smaller technical request limit than the canonical segment, its adapter may deterministically subdivide that segment into media requests without changing `segment_id` or the editorial corpus.

## 5. Source/original OKF

The source shard preserves the exact canonical source span and records provenance, anchor and digest. It contains no translation decisions.

Never put four paragraphs in the source shard while translating only one of them. Span alignment is part of identity, not just a filename convention.

## 6. Translation OKF

Translate the complete selected source span with the agent's own reasoning. Preserve meaning, rhetoric, ambiguity, register and useful repetition. Do not introduce TTS-provider hacks into the canonical translation.

Translation notes are control/editorial information. Keep them in frontmatter or work-level guidance rather than contaminating narration payloads.

## 7. Narration OKF: executable TTS envelope

For works under `tts-body-v1`:

```text
frontmatter = identity + lineage + voice/prosody controls + non-spoken notes
body        = exact textual payload sent to TTS
```

A consumer must be able to conceptually do:

```text
parse frontmatter
send body.strip() to the TTS adapter with the structured parameters
```

without heuristic cleanup.

Therefore headings, `Nota de realização oral`, TODOs, reviewer comments, Markdown documentation, provenance text and other non-spoken material are forbidden in the narration body. Put local non-spoken guidance in `editorial_notes`; stable pronunciation belongs in `pronunciation.yaml`; logical voices belong in `voices.yaml`.

Read `scripts/audiobook/skills/audiobook-tts-payload/SKILL.md` whenever creating or reviewing narration shards.

## 8. Voice and pronunciation

Canonical shards refer to logical speakers, not ephemeral provider voice IDs. `voices.yaml` maps the work's stable character/narrator identities. `pronunciation.yaml` carries recurring lexical decisions.

A backend may translate provider-neutral fields such as `speaker`, `emotion`, `pace`, `intensity`, pauses and work-level voice descriptions into whatever prompt/configuration that backend supports. Provider-specific workarounds belong in adapters, not in the canonical text.

## 9. Readiness before TTS

A valid segment is not automatically an audio-ready chapter. Before `ready_for_audio`, verify at least:

- source coverage and provenance;
- complete aligned translation;
- complete aligned narration;
- applicable style/translation/narration guides;
- terminology/pronunciation policy;
- voices/character guidance;
- rights/publication metadata;
- body-purity and identity/lineage validation;
- no unresolved editorial TODOs;
- a usable media plan/backend configuration.

Failure of a required gate blocks TTS dispatch.

## 10. Current TTS and runner knowledge

The factory is intentionally provider-neutral. Do not confuse "backend integrated" with "backend accepted for this language/work".

### Breeze TTS 2

`BreezeBlue/Breeze-TTS-2` is the first fully integrated real backend and remains valuable as an architecture/load-test backend. The repository proved that the same deterministic plan and worker can run on both Kaggle and Colab, with stable logical voice seeds and successful artifact round-tripping.

However, **Breeze TTS 2 is rejected for pt-BR audiobook production** based on the committed benchmark `docs/okf/audiobook/benchmarks/pt-br-audiobook-v1-breeze.md`: the model is English/Chinese, Portuguese was not detected in the benchmark outputs, and forced-pt ASR produced very high WER. Its strength was expressive direction/prosody; its failure was Portuguese phonetics. Do not select it for HPMOR pt-BR production merely because the adapter works.

Breeze can still be useful for English material, regression-testing the runner architecture, voice-design experiments and verifying that segment-size changes do not break the general pipeline.

### Production backend for pt-BR

At the time this skill was written, **no pt-BR production backend has yet earned canonical acceptance in the repository**. Candidates such as Kokoro or other modern TTS systems must be evaluated through the same benchmark protocol rather than promoted by reputation alone.

A backend becomes preferred only when repository evidence supports it. Record the accepted model/revision and the reasons here after the benchmark is committed.

### Runner preference

Kaggle and Colab both proved the runner-independent contract with Tesla T4-class free GPU execution. Existing evidence favored Kaggle slightly for bootstrap time, while inference speed was effectively the same. Treat availability/reliability as operational considerations rather than changing the editorial corpus.

## 11. How we learn the right segment size

Do not freeze the 240–1800 heuristic by intuition. Grow this knowledge experimentally.

When evaluating a backend, include coherent samples at several sizes (for example short, medium and long semantic units) while keeping content/voice categories representative. Compare objective and auditory evidence. At minimum inspect ASR accuracy/omissions, duration, truncation, repeated material, model errors, latency and GPU memory; for expressive systems also review prosodic continuity and whether larger context improves delivery.

Persist conclusions in a benchmark report with model revision, runner, corpus and artifacts/run IDs. Then update:

1. this skill's current size policy/model table;
2. validation thresholds only if evidence supports a mechanical rule;
3. backend adapter limits only when they are technical constraints;
4. work-level overrides only when the finding is specific to a work/language/style.

Never turn one anecdotal bad generation into a global segment-size rule.

## 12. Validation

Run the repository's canonical audiobook validator. It uses `okf-parser` plus project invariants for IDs, lineage, voices, work prerequisites, payload contract and segment-size exception declarations.

The validator should encode crisp invariants. Editorial judgment remains in this skill/specs. If a recurring human/agent mistake can be detected deterministically, add a validator rule and tests rather than relying on the skill text alone.

## 13. Publication and rights

TTS readiness and public distribution permission are separate. A work may be editorially complete yet blocked from publication by `rights.md`. Never infer public distribution authorization from the existence of source text or from technical readiness.

Media/storage and publication must preserve stable editorial identity. Regenerating with a better TTS backend does not mint a new chapter identity.

## 14. Required companions

After reading this entry-point skill, use the narrower skills when relevant:

- `audiobook-editorial-segment/SKILL.md` for advancing one canonical unit;
- `audiobook-tts-payload/SKILL.md` for executable narration-body review.

Project specs and benchmark reports remain the evidence behind this operational summary. If this skill disagrees with a newer normative spec or benchmark, repair the skill instead of silently following stale text.
