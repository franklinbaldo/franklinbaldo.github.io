---
type: solo-builder
name: "Beat The Scalper"
public_handle: "leprekonsg"
building: "A local-first single-purchase assistant for scarce first-party retail drops: a deterministic controller owns observation, eligibility policy and execution boundaries, while Claude/Gemini interpret evidence under explicit provenance, abstention and human-handoff rules."
domain: [retail-assistance, browser-automation, agent-safety, evidence-provenance, local-first, human-in-the-loop]
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
  window: "Repository created 2026-09-18; accumulated API snapshot through 2026-09-24. Repository metadata reports zero stars, forks, watchers and subscribers; the complete public issue and pull-request collections are empty, and discussions are disabled. Contributor identity was not measured, and account-wide isolation is not claimed."
blocking_constraint: "The 2026-09-24 work materially closes the earlier instrumentation gap: the project corrected a mathematically invalid p95 reaction estimate, moved restock alerting ahead of model inference, added deterministic alert/retraction behavior, and instrumented in-stock detection, sell-out bounds, alert delivery and time-to-buy. The discriminating bottleneck is now the real operating regime those instruments have not yet measured. Roughly 70 live reads have still observed zero in-stock events; the one-minute sell-out duration is a user observation rather than a measured distribution; the 20-second time-to-buy assumption is unmeasured; Lazada-alert delivery latency is unknown; and polling alone is calculated not to reliably beat a one-minute sell-out at any cadence validated so far. The next useful evidence is therefore field measurement of the platform-specific observation/alert envelope rather than another controller feature."
missing_resource: knowledge
confidence: high
source_label: "leprekonsg/beat-the-scalper"
source_url: "https://github.com/leprekonsg/beat-the-scalper"
source_urls:
  - "https://github.com/leprekonsg/beat-the-scalper/blob/main/README.md"
  - "https://github.com/leprekonsg/beat-the-scalper/blob/main/docs/lazada-feasibility.md"
  - "https://github.com/leprekonsg/beat-the-scalper/blob/main/docs/evaluation-results.md"
  - "https://github.com/leprekonsg/beat-the-scalper/commit/6ceb66d0f66a85833ab70fa2faf5c3b38a830f91"
  - "https://github.com/leprekonsg/beat-the-scalper/commit/bde876fd40d46ea8a603dedb0adecc6bd045e10b"
  - "https://github.com/leprekonsg/beat-the-scalper/commit/3745b16495f820f5f5a22092ab9fe1dc4863717e"
maturity: testing
unlock: "Use the new instruments as a frozen operating-regime protocol rather than widening authority: collect approved in-stock observations, `restock.ended` min/max bounds across actual restocks, challenge/access-control incidence at each tested cadence/profile regime, and alert-drill delivery plus time-to-buy measurements. Keep the cadence and stopping rules fixed before each run and preserve negative/challenged runs. The useful result is a bounded catch-rate/operating envelope or a clear no-go result; either is more decision-relevant than optimizing against the current 60-second/20-second assumptions."
synergy_candidates: [forwaryan, madaka17, mikesandoval10creator]
trajectory:
  - "2026-09-18: repository created with 282 unit/integration tests, a Playwright e2e suite, a disabled live-retailer path and Claude Opus 5 explicitly credited as co-author."
  - "2026-09-19: supervised Lazada feasibility work records single reads, observe-only Gemini computer-use runs, repeated 120-second-cadence observations, a reCAPTCHA event and an unapproved accidental 404 access rather than omitting inconvenient evidence."
  - "2026-09-21: Claude-coauthored live parsing changes replace guessed selectors/fixed sleeps with a verified buy-box scope and decisive-state readiness; a three-read live run returns the expected UNAVAILABLE state on every read while the production live gate remains disabled."
  - "2026-09-24: a Claude-coauthored measurement pass corrects the reaction-statistic definition, raises deterministic restock alerts before model calls, and adds explicit instruments for live in-stock detection, sell-out duration, alert delivery and time-to-buy; the resulting evaluation states that polling alone cannot reliably beat a one-minute sell-out at any cadence validated so far."
ai_role: [implementation-collaborator, code-coauthor, evidence-interpreter]
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
  note: "The current merged solo-builder skill and queue script were read first. A durable GH-Archive refresh could not execute in this runtime because the connected compute path timed out, so no admission-band value or recurrence was manufactured. This pass used the documented longitudinal fallback: an already investigated card with material new direct GitHub evidence."
note: "This remains a solo-builder card, not an ai-epistemic-world: the public artifacts describe a bounded retail-assistance engineering system with explicit provenance and authority limits, not a reconstructible belief/cosmology/identity/meaning framework. Full relevant-corpus comparison keeps forwaryan/Rumor Checking as the strongest provenance/abstention method analogue and Madaka17 as the strongest field-validation analogue, with Guardian-Praeventio contributing release-gate discipline. None supplies the platform-specific operating-regime measurements now missing. The bridge is therefore plausible rather than actionable: the repository already built the relevant instruments, and no external resource was found that closes the unknown Lazada alert/cadence/challenge envelope. No public contact was made; the account-level initial-touch gate remains unused."
updated: 2026-09-24
---

## Observatory state — 2026-09-24

- `mode`: `discovery`
- `missing_resource_subtype`: `operating-regime`
- `resource_found`: `partial-internal-instrumentation` — the repository now has instruments for in-stock detection, sell-out bounds, alert delivery and time-to-buy, but the decisive live measurements remain absent.
- `match_quality`: `plausible`
- `recurrence`: unchanged at one sampled day because the queue refresh failed before GH-Archive sampling; persistence is not claimed.
- `strongest_comparisons`: Rumor Checking for provenance/abstention invariants; Madaka17 for separating upstream field evidence from model error; Guardian-Praeventio for evidence-backed release gates. None closes the platform-specific operating regime.
- `contact`: `none`; the initial-touch gate remains unused because no specific non-obvious external transfer improves on the instruments already added by the repository.
