---
type: solo-builder
name: "较真 / Rumor Checking"
public_handle: "forwaryan"
building: "A Chinese fact-checking product that decomposes messages into atomic claims, retrieves evidence from multiple public sources, ranks evidence semantically, runs fast and deep verification paths with an LLM planner/critic, and exposes the evidence and decision trace to the user."
domain: [fact-checking, chinese-nlp, llm-agents, rag, evidence-retrieval, provenance]
reception:
  measured_at: "2026-09-22"
  scope: "primary repository accumulated public GitHub state"
  stars: 0
  forks: 0
  watchers: 0
  external_issues: 0
  external_pull_requests: 0
  distinct_external_contributors: "not_measured"
  discussions: "not_measured"
  window: "Repository created 2026-03-13; accumulated API snapshot through 2026-09-22. GitHub issue/PR searches excluded the owner and Dependabot and found no other public issues or pull requests. Discussions are disabled. Account-wide isolation is not claimed."
blocking_constraint: "The repository already has a substantial retrieval, evidence-ranking, multi-agent, critic, replay and durability stack, including a small internal replay set and extensive automated tests, but the accumulated public repository state shows no non-bot external issues or pull requests and no stars or forks. The next visible information bottleneck is therefore independent real-user evidence on whether the verdict/evidence-chain design remains useful and trustworthy on messy, adversarial and ambiguous rumors, rather than another obvious missing pipeline primitive."
missing_resource: user
confidence: medium
source_label: "forwaryan/rumor-checking"
source_url: "https://github.com/forwaryan/rumor-checking"
source_urls:
  - "https://github.com/forwaryan/rumor-checking/blob/main/README.md"
  - "https://github.com/forwaryan/rumor-checking/commit/da78273889a090b9fc2b7f4a029dfbc65625862b"
  - "https://github.com/forwaryan/rumor-checking/commit/a3f2c54298bf8f13803581558012f89e12d99aad"
maturity: working
unlock: "A small set of independent users bringing real mixed, ambiguous and time-sensitive claims, paired with a frozen blinded comparison of the fast and deep paths, would add external evidence about where the extra agent/critic complexity improves decisions and where it only adds cost or explanation detail."
synergy_candidates: [mirror-we-emergence, synchronism]
trajectory:
  - "2026-03-13: rumor-checking repository created as a Chinese fact-checking system."
  - "2026-07-26: a Claude-coauthored expansion adds sequence planning, content-grounded snapshots, parallel per-claim retrieval and a monotonic synthesis critic that can only downgrade unsupported decisive verdicts."
  - "2026-08-28: Claude-coauthored live-run fixes tighten subject anchoring, temporal evidence discipline and model failover after observed failures on a real rumor-analysis path."
  - "2026-09-13: durable analysis sessions, replay/reconnect behavior and an eight-case regression replay are recorded at the latest public main HEAD examined."
ai_role: [implementation-collaborator, code-coauthor]
queue_provenance:
  criteria_version: "2026-09-21"
  first_sampled: "2026-09-22"
  times_sampled: 1
  collection_mode: "manual-fallback"
  event_count: "not_measured"
  distinct_repos: "not_measured"
  own_repo_event_share: "not_measured"
  distinct_event_kinds: "not_measured"
  other_actors_in_sample_window: "not_measured"
  note: "The canonical GH-Archive queue runner was attempted first but raw.githubusercontent.com did not resolve in the runtime. This card therefore came from the current skill's manual-fallback procedure using direct GitHub repository, commit, issue and pull-request evidence. Queue recurrence is not established from one sample."
note: "This is a solo-builder card, not an ai-epistemic-world: the public framing is an engineering/product architecture for evidence-backed fact checking, not a reconstructible personal belief, cosmology, identity or meaning system. Low reception is asserted only for the measured primary-repository fields above; account-wide isolation is not claimed. Comparison against the prior corpus found the strongest transferable method in existing blinded/frozen-condition observatory experiments: evaluate fast versus deep output without revealing which path generated it, keep matched retrieval budgets, and retain null/negative cases. This complements the repository's existing replay set without treating internal replay success as independent user reception. A repo-specific initial issue proposing that benchmark was attempted after comparison, but GitHub returned 403 Resource not accessible by integration; no public intervention occurred and the repository remains unengaged."
updated: 2026-09-22
---
