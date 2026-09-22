---
type: solo-builder
name: "Hunter-Gatherer Ecology / Medieval Economy"
public_handle: "rhausch"
building: "A deterministic, browser-visible hunter-gatherer ecology simulation intended as the foundation for later medieval-economy experiments: individual Folk forage, move, remember food patches, survive under scarcity, and use swappable rule/utility deciders whose parameters can be evolved and compared across seeded worlds, with the implementation and experimental loop developed extensively with Claude Code."
domain: [simulation, agent-based-modeling, ecology, evolutionary-search, game-development, experimental-methods, ai-assisted-development]
reception:
  measured_at: "2026-09-22"
  scope: "primary repository accumulated public GitHub state"
  stars: 0
  forks: 0
  watchers: 0
  subscribers: 0
  external_issues: 0
  external_pull_requests: 0
  distinct_external_contributors: "not_measured"
  discussions: 0
  window: "Repository created 2026-09-20; accumulated repository API snapshot through 2026-09-22. Repository metadata reports zero stars, forks, watchers and subscribers; public issue and pull-request searches excluding the owner found no external issues or PRs. Discussions are disabled. Contributor identity was not measured, and account-wide isolation is not claimed."
blocking_constraint: "The simulation and experiment machinery are already unusually mature for a new project: deterministic seeded worlds, hashed run configuration, run manifests, conservation tests, survival analysis, benchmarks, swappable deciders and a seeded genetic algorithm. The first evolutionary result reverses the pre-evolution ordering — utility reaches about 0.12x food coverage at the target survival level versus rules at about 0.17x — but several evolved parameters land on search-range boundaries. The repository therefore built an overnight decider × parameter-range × seed batch and explicitly says the next session must read those results and decide whether utility remains ahead, whether wider ranges help, and what remains missing before cooperation. The visible bottleneck is no longer an implementation primitive but independent methodological scrutiny of whether the comparative conclusion survives range changes, multiple seeds and post-selection evaluation rather than reflecting the chosen curriculum/search space."
missing_resource: reviewer
confidence: medium
source_label: "rhausch/medieval-economy"
source_url: "https://github.com/rhausch/medieval-economy"
source_urls:
  - "https://github.com/rhausch/medieval-economy/blob/main/CLAUDE.md"
  - "https://github.com/rhausch/medieval-economy/blob/main/docs/decisions.md"
  - "https://github.com/rhausch/medieval-economy/blob/main/docs/roadmap.md"
  - "https://github.com/rhausch/medieval-economy/pull/18"
  - "https://github.com/rhausch/medieval-economy/commit/ca915d2032adcfc54093a464d3dc017c8132ab10"
maturity: working
unlock: "Have an independent reviewer evaluate a frozen comparison bundle containing the exact run manifest/config hash, seed schedule, parameter ranges, curriculum trace and final-30-generation summaries for rules and utility, then rerun the winner on held-out world seeds without further tuning. The cheap discriminating question is whether the claimed ordering survives a clean post-selection evaluation rather than merely widening the same search."
synergy_candidates: [isualc, forwaryan, madaka17]
trajectory:
  - "2026-09-20: the repository is created and rapidly builds a deterministic TypeScript simulation, browser client, run logger, benchmarks and analysis pipeline with Claude Sonnet 5 repeatedly credited as co-author."
  - "2026-09-20: the project pivots from its first MVP to a hunter-gatherer foundation with explicit calorie accounting, realistic movement, patchy food, perception/memory and recorded design decisions."
  - "2026-09-21: solo-Folk survival tests expose a large rules-versus-utility gap under scarce food, then a seeded genetic algorithm reverses the ordering on the first run while pushing several parameters to their allowed boundaries."
  - "2026-09-21: PR #18 adds a resumable overnight batch across both deciders, default/wide parameter spaces and separated seeds, plus a comparison script; its handoff says the next work is interpreting the resulting evidence rather than adding another feature."
ai_role: [implementation-collaborator, code-coauthor, experiment-design-collaborator]
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
  note: "The current solo-builder skill and queue script were read first and the canonical GH-Archive refresh was attempted for the current queue window. The connected compute path timed out before sampling could execute, so no admission-band or recurrence values were inferred. This single-person recovery pass used direct public GitHub repository, PR, commit and documentation evidence; recurrence remains immature."
note: "This is a solo-builder card, not an ai-epistemic-world: although the repository is an experimental simulation, its public framing is a conventional engineering/research model whose assumptions are explicitly treated as testable implementation choices, not a reconstructible personal belief, cosmology, identity, agency or meaning system. The pass compared all ten operative solo-builder cards. ISU Survivor is the strongest technical complement because it needs exactly the round-scoped benchmark provenance that medieval-economy already implements through deterministic seeds, run manifests and hashed configuration; Rumor Checking contributes frozen evidence/replay discipline; Madaka17 is the nearest reviewer-bottleneck analogue. This makes reviewer the fourth current solo-builder missing-resource case, but the commonality is external validation after strong internal test machinery, not evidence that the projects themselves are otherwise alike. No public contact was made: the useful method transfer was recorded canonically first, and no concrete external reviewer/person has yet been identified whose introduction would justify the initial touch."
updated: 2026-09-22
---
