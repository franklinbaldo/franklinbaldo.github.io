---
type: solo-builder
name: "ISU Survivor / DayZ AI Survivor"
public_handle: "Isualc"
building: "A DayZ multi-agent simulation and mod stack that splits control between server-side reflexes, a local Python tactics layer, and LLM strategy/voice over MCP; it supports up to ten model-driven NPCs with persistent per-agent memory, survival routines, missions, spectator telemetry and a model league."
domain: [game-ai, multi-agent-systems, embodied-agents, dayz, llm-agents, benchmark-instrumentation, memory]
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
  window: "Repository created 2026-06-24; accumulated API snapshot through 2026-09-22. Repository metadata reports zero stars, forks, watchers and subscribers; public issue and pull-request searches excluding the owner found no external issues or PRs. Contributor identity was not measured. The project is also distributed through Steam Workshop and release ZIPs, so reception outside the primary GitHub repository is not measured and account-wide isolation is not claimed."
blocking_constraint: "The product is already packaged and released, and the repository explicitly presents orchestrator-off arena runs as a clean model-vs-model benchmark with league scoring. The league implementation itself records a concrete measurement gap: exact global-round assignment is unavailable without supervisor metadata, battle-royale combat lacks a persistent event log, kills are inferred only as text-log hints, and token/cost data are unavailable for some routed backends. The next discriminating constraint for the model-comparison side is therefore reproducible round-scoped benchmark instrumentation rather than another obvious gameplay feature."
missing_resource: tool
confidence: high
source_label: "Isualc/dayz-ai-survivor"
source_url: "https://github.com/Isualc/dayz-ai-survivor"
source_urls:
  - "https://github.com/Isualc/dayz-ai-survivor/blob/main/README.md"
  - "https://github.com/Isualc/dayz-ai-survivor/blob/main/daemon/league_report.py"
  - "https://github.com/Isualc/dayz-ai-survivor/blob/main/daemon/arena_supervisor.py"
  - "https://github.com/Isualc/dayz-ai-survivor/releases/tag/v1.3.0"
  - "https://github.com/Isualc/dayz-ai-survivor/commit/25dfa410ecfd6b9c4187c60ced753e1922d78455"
maturity: in-use
unlock: "Have the supervisor emit one canonical round manifest and exact event stream: round ID, scenario/map, roster, model/backend, persona and memory refs, identical loadout/seed-like conditions, exact death/kill events, timing and backend observability flags. Cross-link every agent journal and track to that round ID and let league_report consume the manifest instead of approximating round membership from journal timestamps or kill text. This would make the existing arena usable for matched model and memory/persona crossover tests."
synergy_candidates: [forwaryan, mirror-we-emergence]
trajectory:
  - "2026-06-24: public repository created for an autonomous DayZ survivor driven through a three-layer reflex/tactics/LLM architecture."
  - "2026-06-28: v1.1.0 ships a one-click installer; later releases broaden the system from one autonomous survivor into multi-agent missions, battle royale/free-survival modes and model comparison."
  - "2026-08-24: v1.2.0 adds up to ten NPCs, survival chains, spectator/league reporting and multiple model families; the release explicitly frames model-vs-model play as a comparison surface."
  - "2026-09-08: a Claude-coauthored synchronization incorporates fixes from journal forensics, native provider backends and survival upgrades, showing the development loop is driven by runtime evidence as well as feature work."
  - "2026-09-21: v1.3.0 ships English/German UI, local survival behavior, more providers and log-derived fixes; the latest public commit is explicitly co-authored by Claude Fable 5.1."
ai_role: [implementation-collaborator, code-coauthor, embodied-agent-controller]
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
  note: "The canonical GH-Archive refresh could not execute in this runtime: the connected compute endpoint timed out and the local runtime could not resolve the archive host. Direct public GitHub discovery was used as the documented fallback. Admission-band values that could not be reconstructed are preserved as not_measured, and recurrence is not inferred from one sampled pass."
note: "This is a solo-builder card, not an ai-epistemic-world: memory, persona and agent identity are functional game/simulation architecture here, not a reconstructible public belief, cosmology, spirituality or personal meaning system. The pass compared all seven prior solo-builder cards and the relevant observatory convergence corpus. Rumor Checking contributes the strongest evidence/replay discipline for turning each arena round into a frozen audit bundle. The memory-continuity corpus contributes a higher-value experimental bridge: ISU Survivor already has per-NPC persistent CLAUDE.md memory, selectable model backends, personas, equal-loadout battle-royale conditions and an orchestrator-off independent mode, so after round instrumentation is made exact it could test model×memory/persona crossover and memory-reset controls without importing any consciousness or identity claim. No public contact was made: the repository's own code already exposes the instrumentation gap, and no external tool/maintainer introduction has yet been identified that would make a first touch more useful than the canonical cross-project bridge."
updated: 2026-09-22
---
