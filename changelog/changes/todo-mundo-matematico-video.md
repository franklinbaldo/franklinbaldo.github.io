---
type: changelog
date: 2026-10-28
description: Add the Remotion source of the animated video "Todo mundo é matemático agora!"
tags: [experiment, video, lean]
---

Adds a self-contained Remotion project under `experiments/todo-mundo-matematico/`:
a nine-minute animated comedy for the Clube dos Silveira Baldo about AI,
formalization and Lean as the proof inspector. Narration timing drives every
animation cue, so regenerating the voice track re-syncs the scenes.

The Lean proofs shown on screen are real files checked with Lean 4.35.0; the
video displays their captured output. The hygiene check now allows a nested
`package.json` inside `experiments/`, and the root `tsconfig.json` excludes that
folder from the site type check.
