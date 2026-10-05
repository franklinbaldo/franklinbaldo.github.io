---
type: changelog
date: 2026-09-01
description: Describe synthesized audiobook segments against a declared rubric using an audio-capable model, and surface the result in the benchmark workflow.
tags: [audiobook, tts, qa, gemini]
---

# Audio quality gets checked, not assumed

- Adds `scripts/audiobook/audition.py`: an audio-capable model describes each clip on the dimensions a rubric declares — perceived age, gender, accent, articulation, naturalness, artefacts — and the fit against the target profile is computed locally.
- Declares the rubrics in `data/audiobook-rubrics/roles.yaml`, so a role's requirements are editable data rather than code.
- Adds an optional audition step to the TTS benchmark workflow, off when the input is blank and non-blocking when the judge is unavailable.
- Deliberately does not ask the model which clip is best: a description can be checked against a listener, an opinion cannot.
