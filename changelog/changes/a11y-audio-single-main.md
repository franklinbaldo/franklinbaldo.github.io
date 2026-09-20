---
type: changelog
date: 2026-09-20
description: Remove the nested main landmark from the audio index so the page exposes a single primary-content landmark to assistive technology.
tags: [accessibility, audio, semantics]
---

# Audio index exposes a single main landmark

- `/audio/` no longer nests a second `<main>` inside `PageLayout`'s existing primary landmark.
- The inner wrapper remains a `.container`, so layout and content stay unchanged while the document landmark structure becomes valid and unambiguous.
