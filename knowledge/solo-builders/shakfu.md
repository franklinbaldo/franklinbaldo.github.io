---
type: solo-builder
name: "sanduk"
public_handle: "shakfu"
building: "A local-first Python runtime for coding agents that runs Claude Code, Codex and other agent CLIs inside disposable containers, with Docker/Apple-container backends, host-side credential relays, sealed/key-safe execution modes, per-run audit/provenance, extensible agent/provider registries, and scheduled stateful assistants."
domain: [agent-tools, sandboxing, containers, security, provenance, local-first, agent-orchestration]
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
  window: "Repository created 2026-09-07; accumulated repository API snapshot through 2026-09-22. Repository metadata reports zero stars, forks, watchers and subscribers; public issue and pull-request searches excluding the owner found no external issues or PRs. Discussions are disabled. Contributor identity was not measured, and account-wide isolation is not claimed."
blocking_constraint: "The project already has unusually detailed internal threat-model and runtime validation work, and its 0.3.1 changelog records fixes for several self-discovered boundary failures involving audit-log placement, cleanup, sealed-network reuse and concurrent wakeup statistics. The current security notes still identify one unfixed critical integrity hole: kit `copy` files are not hash-pinned, so changing a catalogue-local file can alter what an image runs without the pin refusing the build. The current unreleased host-facing socket/user/stdin/stream-json paths are also covered by argv/dry-run tests but explicitly have not yet been exercised against a container engine. With no external public issues or PRs, the next high-value evidence is independent adversarial review of these trust-boundary assumptions and new host-facing paths rather than another agent adapter."
missing_resource: reviewer
confidence: medium
source_label: "shakfu/sanduk"
source_url: "https://github.com/shakfu/sanduk"
source_urls:
  - "https://github.com/shakfu/sanduk/blob/main/README.md"
  - "https://github.com/shakfu/sanduk/blob/main/TODO.md"
  - "https://github.com/shakfu/sanduk/blob/main/CHANGELOG.md"
  - "https://github.com/shakfu/sanduk/blob/main/docs/dev/microvms.md"
  - "https://github.com/shakfu/sanduk/commit/f2fc814ba4012260403f64fbb6d6bc3e1774cf48"
maturity: working
unlock: "Freeze the current security invariants and have an independent container/security reviewer attack them: every build input that affects an image must be content-pinned; the real provider key must remain host-only in relayed modes; sealed execution must have no unintended egress; audit artifacts must remain outside agent-writable mounts; mounted sockets must not be replaceable by the agent; and the new socket/user/stdin paths should be exercised on real Docker and Apple-container runs, with gVisor where the existing suite supports it. Counterexamples and negative results are more useful here than another feature pass."
synergy_candidates: [hidday, leprekonsg]
trajectory:
  - "2026-09-07: the public sanduk repository is created around a disposable-container boundary for coding agents."
  - "By 0.3.0: recipes/kits, multiple agent CLIs, host-side provider relays and live model-agent tests are in place; the test-agents path proves code execution inside the container by requiring a model-driven agent to hash a random nonce."
  - "0.3.1: the project records and fixes several security/correctness defects found through its own audit, including agent-writable audit logs, unsafe sealed-network reuse, incomplete pre-launch cleanup and shared wakeup statistics."
  - "2026-09-20: the microVM investigation explicitly ranks the still-unpinned kit-copy input above adding another isolation boundary, and distinguishes measured gVisor behavior from unmeasured Kata assumptions."
  - "2026-09-21: the latest public commit improves checks while the unreleased changelog adds socket/user/stdin/stream-json surfaces that still await real container-engine exercise."
ai_role: [instrumented-agent-runtime, live-model-evaluation, scheduled-assistant-runtime]
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
  note: "The merged solo-builder queue runner was read and a canonical GH-Archive refresh for 2026-09-21 was attempted first, but the connected compute path returned upstream 504 timeouts before sampling could execute. This recovery pass used direct public GitHub repository, commit and documentation evidence. A date-scoped repository search was used only to recover a candidate, not as a ranking or persistence signal; unavailable admission-band values remain not_measured and recurrence is not inferred from one pass."
note: "This is a solo-builder card, not an ai-epistemic-world: the public artifacts describe concrete agent-runtime, containment and security engineering, not a reconstructible AI-mediated belief, cosmology, identity, agency or meaning framework. AI participation is evidenced directly by the system's live Claude/Codex/other-agent runtime and evaluation paths; no claim of AI commit coauthorship is made. Comparison against all eleven operative solo-builder cards found AgentForge as the strongest complementary case: sanduk supplies the disposable, credential-separated and auditable execution boundary that an agentic foundry can use, while AgentForge has already learned the durable pre-execution reservation/dedup lesson that becomes relevant when scheduled assistants overlap. Beat The Scalper is a secondary method analogue because both keep authority-critical policy outside model interpretation. No public contact was made: the current sanduk blocker is boundary/security review, and no specific independent reviewer has yet been identified whose introduction would justify spending the initial-touch gate."
updated: 2026-09-22
---