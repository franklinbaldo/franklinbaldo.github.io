---
type: solo-builder
name: "AgentForge"
public_handle: "hidday"
building: "A local-first agentic software-development foundry that turns Linear tickets into GitHub pull requests through a deterministic state machine, using Claude Code, Codex and Cursor CLI subprocesses for planning, review, implementation and remediation while preserving explicit human approval and final-review gates."
domain: [agent-orchestration, software-development, claude-code, codex, local-first, workflow-automation, human-in-the-loop]
reception:
  measured_at: "2026-09-22"
  scope: "primary repository accumulated public GitHub state"
  stars: 0
  forks: 0
  watchers: 0
  subscribers: 0
  external_issues: 0
  external_pull_requests: "not_measured"
  distinct_external_contributors: "not_measured"
  discussions: 0
  window: "Repository created 2026-02-19; accumulated repository API snapshot through 2026-09-22. Repository metadata reports zero stars, forks, watchers and subscribers; a public issue search excluding the owner found no external issues. Exhaustive external pull-request measurement was interrupted by GitHub secondary rate limiting, so external_pull_requests remains not_measured. Discussions are disabled. Account-wide isolation is not claimed."
blocking_constraint: "AgentForge already has deterministic workflow state, cross-model plan/code review and explicit human gates, but its own scheduled autonomous routines repeatedly rediscover work already in flight. In August the repository documented that a scheduled research task had generated about 170 near-duplicate Linear issues and added a backlog pressure valve plus theme-level dedup. In September, the coverage routine again produced overlapping branches: PR #30 says it independently rediscovered PR #24 after doing substantial duplicate work, and PR #31 is a further scheduled coverage pass on the same base that supersedes the earlier attempts. The visible constraint is therefore cross-run reservation/deduplication before expensive agent work begins, not another implementation or review stage after the work already exists."
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
maturity: working
unlock: "Promote the research routine's existing Phase-0.5 pressure-valve idea into a shared preflight for every scheduled producer: acquire a task/theme reservation keyed to base SHA plus work class, search open PRs/issues before generation, abort successfully when equivalent work is already active, and record the reservation in the same durable state the orchestrator uses for runs. The coverage routine is an immediate regression test: only one of #24/#30/#31 should have been allowed to start expensive implementation from the same base."
synergy_candidates: [isualc, forwaryan, leprekonsg]
trajectory:
  - "2026-02-19: AgentForge repository created as a local orchestrator that consumes tickets and advances AI-agent work through a deterministic state machine to a human-reviewed pull request."
  - "2026-08-02: a Claude-coauthored maintenance pass records that the scheduled research routine had generated roughly 170 near-duplicate Linear issues over four months; it adds a backlog pressure valve, theme-level dedup, a codebase reality check, an at-most-one quota and an explicit zero-output success state."
  - "2026-08-04: Claude-coauthored infrastructure work makes the local foundry/UI persistent under pm2, preserving the same agent-assisted development loop."
  - "2026-09-20 to 2026-09-22: scheduled coverage runs open overlapping PRs from the same master base. PR #30 explicitly discovers the already-open #24 only after independently writing overlapping tests; PR #31 then performs another broad coverage pass and supersedes the prior attempts, exposing the same pre-execution dedup problem in a second automation path."
  - "2026-09-22: the observatory posts an initial method-transfer comment on PR #31 proposing a shared pre-execution reservation and a two-job same-base regression test; any later adoption is uptake/diffusion evidence, not independent convergence."
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
  note: "The current queue skill and script were read before selection, and the canonical GH-Archive refresh for 2026-09-21 was attempted. The connected compute path timed out before the sample could run, so no admission-band values or recurrence were inferred. Direct public GitHub evidence was used for this single-person recovery pass; recurrence remains immature."
note: "This is a solo-builder card, not an ai-epistemic-world: the public artifacts describe an engineering/orchestration system and its automation failures, not a reconstructible AI-mediated belief, cosmology, identity, agency or meaning framework. The pass compared the full operative solo-builder corpus and current convergence records. ISU Survivor is the nearest missing_resource=tool case but its gap is benchmark instrumentation rather than work coordination; Rumor Checking contributes evidence/replay discipline and Beat The Scalper contributes explicit one-way authority gates. sanduk adds an adjacent warning from a scheduled-agent runtime where concurrent wakeups share state, but AgentForge's own already-proven research-task pressure valve remains the strongest repo-native source for the unlock. Under the updated contact rule this bridge is actionable without first finding a perfect external reviewer: the observatory used the already-open PR #31 as the smallest useful surface and posted https://github.com/hidday/AgentForge/pull/31#issuecomment-5782371524 proposing a shared reservation keyed to routine + base SHA + work class and a same-base concurrency regression test. The account-level initial-touch gate is now consumed; follow-up is blocked until material engagement or genuinely new evidence."
updated: 2026-09-22
---
