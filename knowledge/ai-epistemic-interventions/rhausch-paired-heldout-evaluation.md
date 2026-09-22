---
type: ai-epistemic-intervention
case_slug: "rhausch"
target_repository: "rhausch/medieval-economy"
target_url: "https://github.com/rhausch/medieval-economy"
intervention_kind: "cross-pollination"
status: "planned"
hypothesis: "Will treating seed as a paired factor in the current decider × range batch, then freezing the selected configs before a disjoint held-out-seed evaluation, distinguish a stable utility-versus-rules advantage from seed difficulty and post-selection effects?"
disclosure: "The public comment will state that the suggestion emerged from a public observatory comparing evaluation methods in AI-assisted solo-builder projects, and will name only the directly relevant frozen replay/evidence analogy from forwaryan/rumor-checking."
followup_allowed: true
followup_gate: "initial-touch"
related_case_slugs: [forwaryan, isualc]
baseline_snapshot: "rhausch/medieval-economy PR #18 at head 3ffb0d4fee803c9656a08df9bc2389c810554a43, reviewed 2026-09-22. scripts/overnight.sh uses seeds 1, 1001 and 2001 for every decider × parameter-space condition; scripts/compare_evolution.py reports per-run values and unpaired group mean/min/max summaries. The roadmap says fresh worlds/seeds should be used after selecting evolved parameters, but the selection/evaluation boundary is not yet encoded as a distinct manifest contract."
next_touch_reason: "The account-level initial-touch gate remains unused because neither attempted write produced a public GitHub artifact. Retry only if repository-specific write authorization becomes available; do not keep switching GitHub endpoints merely to obtain attention."
result: "Two attempts to use the already-open PR #18 as the smallest useful surface both failed with GitHub 403 Resource not accessible by integration: first a top-level PR review, then on 2026-09-22 a top-level PR Conversation comment after that surface had been proven writable in another public repository. No public review/comment was created."
notes:
  - "No prior canonical intervention targeting a rhausch repository was found in the observatory corpus before these attempted touches."
  - "The proposed transfer is methodological: paired per-seed deltas, explicit selection-versus-evaluation seed sets, retained null/reversal results, and a manifest-level guard against evaluating a changed post-selection configuration."
  - "The chosen surface remains the existing PR #18, not a new issue, because it already contains the exact overnight-batch evaluation work."
  - "The failed writes do not consume the account-level initial-touch gate and create no contamination or uptake signal."
  - "The second failure shows the blocker is repository-specific authorization, not simply use of the PR-review endpoint: the same top-level PR Conversation comment operation succeeded earlier in hidday/AgentForge."
  - "No alternate issue or PR was opened to compensate for the unavailable surface."
  - "Any adoption after a future successful public contact is diffusion evidence and must not be counted as independent convergence."
created: 2026-09-22
updated: 2026-09-22
---
