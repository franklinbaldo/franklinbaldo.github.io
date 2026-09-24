---
type: changelog
date: 2026-08-31
description: Add Kokoro-82M as an audiobook TTS backend, with emotion and speaker carried as text spans the renderer strips before synthesis.
tags: [audiobook, tts, kokoro, audio]
---

# Kokoro joins the audiobook backends, with span-level direction

- Adds Kokoro-82M behind the same provider-neutral plan and worker contract. It reached the best intelligibility of every candidate on the pt-BR corpus at a real-time factor of 0.06, under Apache-2.0.
- Approximates emotion by moving through voice space, since the model has no style prompt: each preset is a weighted blend of style tensors plus a speed and a gain. Only presets a listening pass judged good are enabled; two are marked provisional and two judged bad are left out.
- Carries emotion and speaker as spans in the segment text, stripped before synthesis. A tag left in the text is otherwise pronounced aloud.
- Derives `voice_partition` from the presence of speaker spans, so one editorial segment can hold a character and the narrator without being split.
- Splits a paragraph per clause by default, which was judged better than reading it in a single call with the same voice and text.
- Records that misaki's `[word](/ipa/)` pronunciation override is not usable under Portuguese phonemisation: it is read aloud, and the un-overridden reading was better.
