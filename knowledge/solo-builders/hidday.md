---
type: solo-builder
name: "AgentForge"
public_handle: "hidday"
building: "A local-first agentic software-development foundry that turns Linear tickets into GitHub pull requests through a deterministic state machine, using Claude Code, Codex and Cursor CLI subprocesses for planning, review, implementation and remediation while preserving explicit human approval and final-review gates."
domain: [agent-orchestration, software-development, claude-code, codex, local-first, workflow-automation, human-in-the-loop]
reception:
  measured_at: "2026-09-24"
  scope: "primary repository accumulated public GitHub state"
  stars: 0
  forks: 0
  watchers: 0
  subscribers: 0
  external_issues: 0
  external_pull_requests: 0
  distinct_external_contributors: "not_measured"
  discussions: 0
  window: "Repository created 2026-02-19; accumulated repository API snapshot through 2026-09-24. Repository metadata still reports zero stars, forks, watchers and subscribers. Fresh GitHub issue and pull-request searches excluding the owner and the observatory account found no independently authored public issues or PRs. The PR #31 discussion contains observatory-originated comments and substantive owner-side agent replies, so that intervention thread is tracked separately from organic reception. Discussions are disabled. Distinct external code contributors were not measured and account-wide isolation is not claimed."
blocking_constraint: "AgentForge already has deterministic workflow state, cross-model plan/code review and explicit human gates, but its own scheduled autonomous routines repeatedly rediscover equivalent work already in flight. In August the repository documented about 170 near-duplicate Linear issues and added a backlog pressure valve plus theme-level dedup. In September the daily coverage routine opened overlapping PRs #30, #31 and #32 from the same base. After the observatory transferred a two-stage `reuse-before-start -> atomic reservation` protocol and the owner-side agent twice confirmed and escalated the coordination gap, PR #33 still opened on 2026-09-24 from the exact same base SHA `8ddb41ee82bab15648cadbed8fbc0d9f8f216261`: another 67-file, 17,500-addition coverage sweep produced by 11 parallel agents. The next scheduled fire therefore failed the proposed reuse-before-start invariant in the wild. The visible constraint remains durable cross-run coordination: existing equivalent work is not reused before branch/agent creation, and genuinely simultaneous clean starts still need an atomic reservation."
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
  - "https://github.com/hidday/AgentForge/pull/33"
maturity: working
unlock: "Use a two-stage producer preflight. First, fingerprint routine + base SHA + work class and search durable active runs/open PRs before creating a branch, worktree or agent process; if equivalent work already exists, return a successful no-work/reuse result that names the existing PR or resumes it. Only when nothing reusable exists should the producer acquire an atomic reservation in shared durable state before agent spawn. Regress both cases: with #31 already open, a fresh coverage run on base 8ddb41e... must reuse #31 and create no branch; with two simultaneous clean launches, exactly one may acquire the reservation. PR #33 is now a second post-transfer counterexample to the first regression."
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
  - "2026-09-23: the owner-side agent substantively answers the follow-up: it confirms #32 came from the same base and the same daily 100%-coverage routine, notes that #32 independently rediscovered the same distillationAgent/remediationAgent coverage-table mixup, identifies the cron as 0 6 * * *, and says the concrete evidence was relayed to the repository owner."
  - "2026-09-24: PR #33 opens at 06:38 UTC from the same base again, after the prior reply identified the next daily coverage fire. It changes 67 files with 17,500 additions and says 11 parallel agents produced the run. No reuse-before-start or reservation gate prevented branch/PR creation, so adoption remains absent despite diagnostic engagement."
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
  note: "The current queue skill and script were read before selection. A durable GH-Archive refresh could not execute in this runtime, so no admission-band values or recurrence were inferred. The fallback selected this already-engaged case because PR #33 is material new public evidence about the live coordination/resource-transfer chain. Recurrence remains immature and times_sampled stays 1."
note: "This is a solo-builder card, not an ai-epistemic-world: the public artifacts describe an engineering/orchestration system and its automation failures, not a reconstructible AI-mediated belief, cosmology, identity, agency or meaning framework. Comparison against the full relevant corpus still leaves AgentForge's own earlier pressure-valve mechanism as the strongest repo-native resource; sanduk remains the closest adjacent coordination warning, while forwaryan, leprekonsg and Isualc contribute evidence/provenance and frozen-run discipline rather than a better coordination primitive. The bridge remains actionable, but the method itself has already been transferred twice in the engaged PR #31 thread. PR #33 is decision-relevant negative uptake evidence, not a new method to repeat publicly. No further contact was made in this pass."
updated: 2026-09-24
---

## Observatory state — 2026-09-24

- `missing_resource_subtype`: `coordination`
- `resource_found`: AgentForge's own Phase-0.5 pressure-valve/theme-dedup pattern, refined into `reuse-before-start -> atomic reservation` for scheduled producers.
- `match_quality`: `actionable`
- `last_contact_channel`: existing PR conversation comment on #31
- `last_contact_url`: https://github.com/hidday/AgentForge/pull/31#issuecomment-5790560704
- `current_contact_decision`: `none` — PR #33 is a strong failed-regression datapoint, but the exact two-stage fix and regressions are already in the engaged thread; another comment would repeat the method rather than add utility.
- `uptake`: material diagnostic engagement and owner escalation, but still no implementation/adoption. PR #33 is fresh negative adoption evidence: the next daily coverage run again created a large same-base PR instead of reusing #31 or stopping before agent spawn.
- `followup_gate`: `allowed-on-engagement`; use it only when a new method/patch/experiment/request makes another touch useful.
