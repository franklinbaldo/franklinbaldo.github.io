---
type: ai-epistemic-convergence
name: "Agent runtime boundary and durable work coordination"
hypothesis_key: agent-runtime-boundary-coordination
summary: "sanduk and AgentForge expose complementary failure boundaries in autonomous coding workflows. sanduk concentrates on where an agent runs: disposable containers, host-held credentials, sealed/key-safe networking, audit logs and explicit model/provider policy. AgentForge concentrates on what work an agent is allowed to start and how it advances: deterministic state, human gates and multi-model review, but its scheduled producers have repeatedly rediscovered work already in flight. The transferable pattern is a two-layer control plane: isolate and audit each execution, and reserve/deduplicate the work before that execution spends tokens or writes code."
case_slugs: [shakfu, hidday]
overlap_dimensions: [method, agent-orchestration, execution-boundary, coordination, provenance]
independence_status: not-established
evidence_quality: high
testable_predictions:
  - "Routing one AgentForge implementation/review step through sanduk sealed mode should preserve the same ticket-to-review semantics while keeping the real provider credential outside the worker container and producing a per-run model-call audit trail; any required undeclared network path becomes an explicit failure rather than ambient capability."
  - "Adding an AgentForge-style durable pre-execution reservation keyed by task/theme plus base state to sanduk's scheduled assistants should prevent two overlapping schedulers from starting semantically duplicate expensive work, while still allowing a later wakeup after the reservation closes or the base state changes."
  - "A combined system should fail earlier and more legibly than either control layer alone: duplicate work should be rejected before launch, while execution-boundary violations should be rejected before or during the isolated run without silently widening agent authority."
cross_pollination_candidates:
  - "shakfu -> hidday: use sanduk as an optional worker runtime for Claude/Codex steps so AgentForge can separate orchestration authority from disposable execution, host-held credentials and auditable model traffic."
  - "hidday -> shakfu: adapt AgentForge's already-learned pressure-valve lesson into a durable assistant preflight/lease that checks equivalent work before a scheduled sanduk wakeup begins, rather than relying only on run-local isolation and statistics."
contamination_notes:
  - "Different maintainers do not establish independent convergence. Both projects participate in the same contemporary coding-agent ecosystem and may share upstream practices or model-generated design patterns."
  - "The observatory intervened on AgentForge PR #31 on 2026-09-22 with a concrete reservation/deduplication proposal, and the owner-side project agent subsequently confirmed the diagnosis and escalated it to the repository owner. No introduction to shakfu was made, but any later AgentForge adoption of the proposed reservation must be treated as observatory-influenced diffusion/uptake rather than independent convergence."
source_urls:
  - "https://github.com/shakfu/sanduk"
  - "https://github.com/shakfu/sanduk/blob/main/README.md"
  - "https://github.com/shakfu/sanduk/blob/main/CHANGELOG.md"
  - "https://github.com/hidday/AgentForge"
  - "https://github.com/hidday/AgentForge/pull/30"
  - "https://github.com/hidday/AgentForge/pull/31"
  - "https://github.com/hidday/AgentForge/pull/31#issuecomment-5782371524"
  - "https://github.com/hidday/AgentForge/pull/31#issuecomment-5782570527"
updated: 2026-09-22
---