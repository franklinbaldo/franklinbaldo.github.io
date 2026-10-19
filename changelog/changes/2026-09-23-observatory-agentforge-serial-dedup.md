---
type: changelog
date: 2026-09-23
description: "Record a new serial duplicate coverage PR in AgentForge, refine the coordination transfer into reuse-before-start plus atomic reservation, and make one gated follow-up on the already-engaged PR thread."
tags: [ai-epistemic-worlds, solo-builder, observatory, intervention]
---

Run mode: `discovery`.

The merged `solo-builder-triage`, `solo-builder`, `ai-epistemic-intervention` and `ai-epistemic-convergence` contracts were read before selection or contact. The canonical queue refresh was attempted under criteria version `2026-09-21`, but the connected compute path timed out before GH Archive sampling. No admission-band field, recurrence claim or `times_sampled` value was changed. Under the queue-resilience fallback, the pass selected an already-investigated card with material new evidence rather than inventing a new manual candidate.

The examined account is `hidday`, card type `solo-builder`, project `hidday/AgentForge`. The accumulated repository reception snapshot was refreshed to 0 stars, 0 forks, 0 watchers, 0 subscribers, 0 externally authored issues and 0 externally authored pull requests; the observatory-originated PR #31 thread is tracked separately from organic reception. Recurrence remains immature at `times_sampled: 1` because no new queue sample completed.

The existing blocker remains `missing_resource: tool`, operational subtype `coordination`. The fresh evidence is PR #32: it opened on 2026-09-23 from base `8ddb41ee82bab15648cadbed8fbc0d9f8f216261`, exactly the same base as PR #31, nearly a day after #31 was already visible, and repeats the same repository-wide scheduled coverage work across 103 changed files and 20,281 additions. That sharpens the diagnosis: AgentForge has both a serial reuse failure and a possible simultaneous-start race.

Comparison against the relevant corpus did not justify a new convergence file. AgentForge's own earlier Phase-0.5 backlog pressure-valve/theme-dedup remains the strongest resource; `sanduk` remains the nearest adjacent warning about concurrent scheduled-agent state. The actionable transfer is now two-stage: `reuse-before-start` should search durable active runs/open PRs by `routine + base SHA + work class` and return/reuse equivalent work before branch/worktree/agent creation; only if nothing reusable exists should an atomic reservation be acquired. The two regressions are correspondingly separate: an existing #31 must make a later same-base run reuse/exit without creating a branch, while two simultaneous clean starts may produce only one reservation winner.

The canonical intervention gate was `allowed-on-engagement` because the owner-side agent had substantively verified the prior diagnosis and escalated it. The smallest useful channel remained the existing PR #31 conversation. One follow-up was posted at https://github.com/hidday/AgentForge/pull/31#issuecomment-5790560704, focused only on the new #32 evidence and the serial-versus-concurrent distinction. No new issue or PR was created. The intervention record is returned to `blocked-awaiting-response` after this touch. Uptake remains confirmation/escalation, not implementation or adoption; PR #32 is negative adoption evidence and a useful regression fixture.
