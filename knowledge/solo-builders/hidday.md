---
type: solo-builder
name: "AgentForge"
public_handle: "hidday"
building: "A local-first agentic software-development foundry that turns Linear tickets into GitHub pull requests through a deterministic state machine, using Claude Code, Codex and Cursor CLI subprocesses for planning, review, implementation and remediation while preserving explicit human approval and final-review gates."
domain: [agent-orchestration, software-development, claude-code, codex, local-first, workflow-automation, human-in-the-loop]
reception:
  measured_at: "2026-09-23"
  scope: "primary repository accumulated public GitHub state"
  stars: 0
  forks: 0
  watchers: 0
  subscribers: 0
  external_issues: 0
  external_pull_requests: 0
  distinct_external_contributors: "not_measured"
  discussions: 0
  window: "Repository created 2026-02-19; accumulated repository API snapshot through 2026-09-23. Repository metadata reports zero stars, forks, watchers and subscribers; public issue and pull-request searches excluding the owner found no externally authored issues or PRs. The PR #31 discussion now contains observatory-originated comments and a substantive owner-side agent reply, so that intervention thread is tracked separately from organic reception. Discussions are disabled. Distinct external code contributors were not measured and account-wide isolation is not claimed."
blocking_constraint: "AgentForge already has deterministic workflow state, cross-model plan/code review and explicit human gates, but its own scheduled autonomous routines repeatedly rediscover work already in flight. In August the repository documented that a scheduled research task had generated about 170 near-duplicate Linear issues and added a backlog pressure valve plus theme-level dedup. In September, the coverage routine produced overlapping branches: PR #30 says it independently rediscovered PR #24 after doing substantial duplicate work, PR #31 repeated the same work from base 8ddb41ee82bab15648cadbed8fbc0d9f8f216261, and on 2026-09-23 PR #32 opened nearly a day later from that exact same base with another 103-file, ~20k-line coverage sweep. The new recurrence shows two separate coordination failures: existing equivalent work is not reused before a run starts, and simultaneous clean starts still need an atomic reservation."
missing_resource: tool
confidence: high
source_label: "hidday/AgentForge"
source_url: "https://github.com/hidday/AgentForge"
source_urls:
  - "https://github.com/hidday/AgentForge/blob/master/README.md"
  - "https://github.com/hidday/AgentForge/blob/master/CLAUDE.md"
  - "https://github.com/hidday/AgentForge/commit/573bdedcca3bd9ccffd1bec7cf5d7db9e647e0ed"
  - "https://github.com/hidday/AgentForge/pull/30"
  - "https://github.com/hidday/AgentForge/pull/31"
  - "https://github.com/hidday/AgentForge/pull/32"
maturity: working
unlock: "Use a two-stage producer preflight. First, fingerprint routine + base SHA + work class and search durable active runs/open PRs before creating a branch, worktree or agent process; if equivalent work already exists, return a successful no-work/reuse result that names the existing PR or resumes it. Only when nothing reusable exists should the producer acquire an atomic reservation in shared durable state before agent spawn. Regress both cases: with #31 already open, a fresh coverage run on base 8ddb41e... must reuse #31 and create no branch; with two simultaneous clean launches, exactly one may acquire the reservation."
synergy_candidates: [isualc, forwaryan, leprekonsg]
trajectory:
  - "2026-02-19: AgentForge repository created as a local orchestrator that consumes tickets and advances AI-agent work through a deterministic state machine to a human-reviewed pull request."
  - "2026-08-02: a Claude-coauthored maintenance pass records that the scheduled research routine had generated roughly 170 near-duplicate Linear issues over four months; it adds a backlog pressure valve, theme-level dedup, a codebase reality check, an at-most-one quota and an explicit zero-output success state."
  - "2026-08-04: Claude-coauthored infrastructure work makes the local foundry/UI persistent under pm2, preserving the same agent-assisted development loop."
  - "2026-09-20 to 2026-09-22: scheduled coverage runs open overlapping PRs from the same master base. PR #30 explicitly discovers the already-open #24 only after independently writing overlapping tests; PR #31 then performs another broad coverage pass and supersedes the prior attempts, exposing the same pre-execution dedup problem in a second automation path."
  - "2026-09-22: the observatory posts an initial method-transfer comment on PR #31 proposing a shared pre-execution reservation and a two-job same-base regression test; any later adoption is uptake/diffusion evidence, not independent convergence."
  - "2026-09-22: the owner-side project agent substantively replies that PRs #19 through #31 are all open from the same base with the same recurring coverage pattern, calls it a real coordination gap, and says it flagged the reservation proposal directly to the repository owner; no reservation implementation has yet appeared."
  - "2026-09-23: PR #32 opens from the exact same base SHA as #31 almost a day later and repeats essentially the same repository-wide coverage job, demonstrating that the problem is not only a simultaneous-start race: the routine also fails to discover and reuse already-visible equivalent PR work before agent spawn."
  - "2026-09-23: after the prior substantive engagement opened the follow-up gate, the observatory adds one follow-up on PR #31 separating a cheap reuse-before-start gate from the atomic reservation needed only for true concurrent starts, with one regression test for each failure mode."
ai_role: [implementation-collaborator, code-coauthor, orchestrated-runtime, scheduled-repository-agent]
queue_provenance:
  criteria_version: "2026-09-21"
  first_sampled: "2026-09-22"
  times_sampled: 1
  collection_mode: "manual-recovery"
  event_count: "not_measured"
  distinct_repos: "not_measured"
  own_repo_event_share: "not_measured"
  distinct_event_kinds: "not_measured"
  other_actors_in_sample_window: "not_measured"
  note: "The current queue skill and script were read before selection. The canonical GH-Archive refresh was attempted again on 2026-09-23, but the connected compute path timed out before sampling, so no admission-band values or recurrence were inferred. The fallback selected this previously investigated card because PR #32 is material new artifact-level evidence on the existing blocker. Recurrence remains immature and times_sampled stays 1."
note: "This is a solo-builder card, not an ai-epistemic-world: the public artifacts describe an engineering/orchestration system and its automation failures, not a reconstructible AI-mediated belief, cosmology, identity, agency or meaning framework. Comparison against the full relevant corpus still leaves AgentForge's own earlier pressure-valve mechanism as the strongest repo-native resource, while sanduk remains the closest adjacent warning about concurrent scheduled-agent state. PR #32 sharpens the transfer: a simple reuse-before-start scan should catch serial duplicates such as #31 -> #32, while the shared reservation closes the narrower concurrent race. Because the 2026-09-22 owner-side reply was substantive engagement, one follow-up was permitted and posted on the existing PR #31 thread; the gate is now returned to waiting pending a reply, implementation, experiment, consolidation action or explicit request. Uptake remains confirmation/escalation, not implementation or adoption."
updated: 2026-09-23
---

## Observatory state — 2026-09-23

- `missing_resource_subtype`: `coordination`
- `resource_found`: AgentForge's own Phase-0.5 pressure-valve/theme-dedup pattern, refined into `reuse-before-start -> atomic reservation` for scheduled producers.
- `match_quality`: `actionable`
- `contact_channel`: existing PR conversation comment on #31
- `contact_url`: https://github.com/hidday/AgentForge/pull/31#issuecomment-5790560704
- `uptake`: prior diagnosis confirmed and escalated by the owner-side agent; no implementation/adoption observed yet. PR #32 is negative adoption evidence and a direct regression fixture.
- `followup_gate`: `blocked-awaiting-response`
