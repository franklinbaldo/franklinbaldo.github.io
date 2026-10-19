---
type: solo-builder
name: "sanduk + hilda"
public_handle: "shakfu"
building: "Two complementary local-first coding-agent runtimes: sanduk puts Claude Code, Codex and other agent CLIs inside disposable containers with host-side credential relays, sealed execution and audit/provenance; hilda is a small native Haskell coding agent that makes the model-to-machine effect boundary explicit through typed providers, a total authorization function, pure edit/render/config paths and ask/read-only/yolo permission modes."
domain: [agent-tools, sandboxing, containers, security, typed-effects, provenance, local-first, agent-orchestration]
reception:
  measured_at: "2026-09-24"
  scope: "sanduk and hilda accumulated public GitHub repository state"
  stars: 0
  forks: 0
  watchers: 0
  subscribers: 0
  external_issues: 0
  external_pull_requests: 0
  distinct_external_contributors: "not_measured"
  discussions: 0
  window: "Fresh accumulated API checks on 2026-09-24 found zero stars, forks, watchers/subscribers, public issues and public pull requests on both shakfu/sanduk and shakfu/hilda; discussions are disabled on both. sanduk was created 2026-09-07 and hilda 2026-09-23. Contributor identity was not measured, and account-wide isolation is not claimed."
blocking_constraint: "The account now has two concrete implementations of agent trust boundaries rather than one. sanduk still carries the unresolved content-integrity and real-engine review surface around image inputs and host-facing container paths. hilda v0.1.1 independently tightens a different boundary: authorization is a total Mode × Effect function; malformed model output is converted to typed errors; uncertain mid-stream failures are not retried when a completion may already be billed; edits preserve file modes and reject invalid UTF-8; ask-mode rendering escapes Unicode format characters such as bidi overrides; and kept reasoning is discarded when an upstream rejects provider-bound signatures. Those are meaningful self-discovered hardening results, but both projects are still being reviewed by their author. The discriminating missing resource remains independent adversarial security review of the shared model-output-to-host-effects invariants, not another agent implementation."
missing_resource: reviewer
confidence: high
source_label: "shakfu/sanduk + shakfu/hilda"
source_url: "https://github.com/shakfu/sanduk"
source_urls:
  - "https://github.com/shakfu/sanduk/blob/main/README.md"
  - "https://github.com/shakfu/sanduk/blob/main/TODO.md"
  - "https://github.com/shakfu/sanduk/blob/main/CHANGELOG.md"
  - "https://github.com/shakfu/sanduk/blob/main/docs/dev/microvms.md"
  - "https://github.com/shakfu/sanduk/commit/f2fc814ba4012260403f64fbb6d6bc3e1774cf48"
  - "https://github.com/shakfu/hilda"
  - "https://github.com/shakfu/hilda/blob/main/README.md"
  - "https://github.com/shakfu/hilda/commit/bba348fb95287f210bde92605f88229a45a39187"
  - "https://github.com/shakfu/hilda/commit/f5cbffe2b5241f08019a1c76d802e172a7743e2e"
maturity: working
unlock: "Freeze one cross-runtime adversarial boundary suite and have an independent reviewer attack it against both implementations. At minimum: model output must not widen authority; every side effect must map to an explicit allow/confirm/deny decision; confirmation rendering must be resistant to bidi/control-character deception; edits must preserve file permissions and bytes outside the intended change; credentials and audit artifacts must remain outside agent authority; container build inputs must be content-pinned; and network/provider failures with ambiguous external side effects must fail without unsafe replay. Counterexamples that break either runtime are more valuable than another feature pass."
synergy_candidates: [leprekonsg, madaka17, hidday]
trajectory:
  - "2026-09-07: sanduk is created around a disposable-container boundary for coding agents."
  - "By 0.3.0: sanduk has recipes/kits, multiple agent CLIs, host-side provider relays and live model-agent tests; the test-agents path proves code execution inside the container by requiring a model-driven agent to hash a random nonce."
  - "0.3.1: sanduk records and fixes several security/correctness defects found through its own audit, including agent-writable audit logs, unsafe sealed-network reuse, incomplete pre-launch cleanup and shared wakeup statistics."
  - "2026-09-20: sanduk's microVM investigation explicitly ranks the still-unpinned kit-copy input above adding another isolation boundary, and distinguishes measured gVisor behavior from unmeasured Kata assumptions."
  - "2026-09-23: hilda appears as a separate Haskell coding agent whose stated design goal is to make the untrusted-model-to-machine-effects boundary explicit in types: providers are abstracted behind a function type, permissions are a total function, and many transformations are pure/testable without IO."
  - "2026-09-24: hilda v0.1.1 hardens multiple concrete host/provider boundaries discovered in live development: no retry after ambiguous stream reset, file-mode preservation, invalid-UTF-8 refusal, Unicode-format escaping in confirmations, cost accounting across cancellation, and provider-bound reasoning-signature fallback."
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
  note: "The current merged solo-builder skill and queue runner were read first. A canonical GH-Archive refresh was attempted through the connected compute fabric, but the Jatoba MCP path timed out before workload execution. No admission-band values or recurrence were inferred. Per queue-resilience rules, this pass used an already investigated account with material new direct GitHub evidence rather than discovering an arbitrary new person."
note: "This remains a solo-builder card, not an ai-epistemic-world: sanduk and hilda are concrete agent-runtime, containment and effect-safety engineering systems, with no reconstructible AI-mediated belief, cosmology, identity or meaning framework. Full relevant-corpus comparison did not locate the missing independent security reviewer. Beat The Scalper is the strongest method analogue because it also keeps authority-critical decisions outside model interpretation in deterministic policy; Madaka17 supplies a concrete public-boundary regression pattern after its X-Forwarded-For trust failure; AgentForge is adjacent on deterministic agent orchestration but its live blocker is cross-run coordination rather than effect safety. These bridges are plausible method transfers, not a reviewer resource. No public contact was made: telling the author to reuse hilda's own typed-boundary discipline in sanduk would not add a sufficiently new external contribution, and the account-level initial-touch gate remains unused."
updated: 2026-09-24
---

## Observatory state — 2026-09-24

- `mode`: `discovery`
- `missing_resource_subtype`: `security-review`
- `resource_found`: `partial-internal-method` — hilda supplies a second concrete implementation of explicit effect authorization and several adversarial boundary regressions, but it is not independent review.
- `match_quality`: `plausible`
- `recurrence`: unchanged at one sampled day because the GH-Archive refresh failed before sampling; persistence is not claimed.
- `strongest_comparisons`: Beat The Scalper for deterministic authority outside model interpretation; Madaka17 for regression-testing a discovered public trust-boundary bypass; AgentForge for deterministic agent orchestration. None is an identified independent security reviewer.
- `contact`: `none`; the initial-touch gate remains unused because this pass found no specific external reviewer or non-obvious contribution that improves on the author's newly demonstrated boundary discipline.
