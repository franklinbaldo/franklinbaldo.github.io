---
type: solo-builder
name: "Praeventio Guard"
public_handle: "mikesandoval10creator"
building: "An AI-assisted occupational-risk prevention platform for critical industries in Latin America, combining regulatory RAG, PPE/risk computer vision, emergency and crisis flows, ergonomics and predictive-risk engines, offline/mobile operation, sensor/mesh integrations, and a large evidence-first audit/test program."
domain: [occupational-safety, safety-critical-software, ai-agents, computer-vision, mobile, offline-first, field-validation]
reception:
  measured_at: "2026-09-22"
  scope: "primary repository accumulated public GitHub state"
  stars: 1
  forks: 0
  watchers: 1
  subscribers: 0
  external_issues: 0
  external_pull_requests: 0
  distinct_external_contributors: "not_measured"
  discussions: 0
  window: "Repository created 2026-03-20; accumulated repository API snapshot through 2026-09-22. Repository metadata reports one star, zero forks, one watcher and zero subscribers, with discussions disabled. Public GitHub searches excluding the owner found zero external issues and zero external pull requests; contributor identity was not measured, and account-wide isolation is not claimed."
blocking_constraint: "The immediate release boundary remains internal implementation, CI, security and deployment debt, but dependency risk narrowed again on 2026-09-23. PRs #1746 and #1747 merged the bounded linear email validator and fail-closed npm-audit gate; #1748 removed all high-severity production dependency findings; #1749 then pinned the remaining vulnerable transitive chain so npm audit reports 0 high and 0 critical findings, with only 2 moderate findings remaining. The README still explicitly blocks Android 1.0 on real TLS pinning, Android 14 critical-push wakeup behavior, a broad cross-tenant route audit, branch-protection hardening, missing mobile-release secrets and a failing deploy configuration. Those named internal gates remain earlier than independent physical-device field review."
missing_resource: none-apparent
confidence: high
source_label: "mikesandoval10creator/Guardian-Praeventio"
source_url: "https://github.com/mikesandoval10creator/Guardian-Praeventio"
source_urls:
  - "https://github.com/mikesandoval10creator/Guardian-Praeventio/blob/main/README.md"
  - "https://github.com/mikesandoval10creator/Guardian-Praeventio/blob/main/TODO.md"
  - "https://github.com/mikesandoval10creator/Guardian-Praeventio/pull/1744"
  - "https://github.com/mikesandoval10creator/Guardian-Praeventio/pull/1746"
  - "https://github.com/mikesandoval10creator/Guardian-Praeventio/pull/1747"
  - "https://github.com/mikesandoval10creator/Guardian-Praeventio/pull/1748"
  - "https://github.com/mikesandoval10creator/Guardian-Praeventio/pull/1749"
maturity: working
unlock: "Finish the explicitly enumerated internal release gates and produce a clean deploy/mobile release candidate: replace placeholder TLS pins with real SPKI pins, implement and verify the Android 14 critical-push path, complete the cross-tenant route audit, harden branch/release controls, supply the required mobile/deploy secrets, and restore the failing deploy path. Only then promote real-device validation to the immediate boundary and seek independent field review with frozen expected-versus-observed evidence."
synergy_candidates: [madaka17, forwaryan, darkphilosopher, shakfu]
trajectory:
  - "2026-03-20: Guardian-Praeventio repository created from the Google AI Studio application template and expanded into a broad occupational-safety platform."
  - "2026-05-19: the repository records an independent verification pass that re-runs tests, inspects safety-critical implementation, corrects earlier claims and preserves newly discovered blockers instead of treating the previous state as complete."
  - "2026-06-19 to 2026-07-13: deeper audits sharply revise real E2E coverage downward, while native proximity bridges are implemented; physical Android/iOS validation remains an explicit release gate."
  - "2026-09-21: safety-related fixes and integration work continue on main and in PRs; the examined commit is co-authored by the local Hermes agent, showing the AI-assisted production loop remains active."
  - "2026-09-22: a code-verified README rewrite explicitly blocks Android 1.0 on unresolved TLS pinning, critical-push, cross-tenant authorization, branch/workflow, credential and deploy gates, making those internal blockers prior to the still-valid downstream physical-validation gate."
  - "2026-09-22 late pass: PR #1744 lands firebase-admin v14, a real emulator integration test and 7/7 SOS idempotency; open P0 PRs #1746 and #1747 then target a reproducible ReDoS path and a false-green critical-CVE gate."
  - "2026-09-23: #1746 and #1747 merge; #1748 reduces npm-audit high findings from 22 to 10 DEV-only and production high vulnerabilities to 0; #1749 then removes the remaining high findings entirely, leaving npm audit at 0 high, 0 critical and 2 moderate while the README's mobile, tenant-isolation, branch and deploy gates remain explicit."
ai_role: [implementation-collaborator, code-coauthor, audit-collaborator]
queue_provenance:
  criteria_version: "2026-09-21"
  first_sampled: "2026-09-22"
  times_sampled: 1
  collection_mode: "manual-fallback"
  event_count: "not_measured"
  distinct_repos: 3
  own_repo_event_share: "not_measured"
  distinct_event_kinds: "not_measured"
  other_actors_in_sample_window: "not_measured"
  note: "The canonical GH-Archive queue refresh was attempted first in the current run under criteria version 2026-09-21, but the connected Jatobá compute endpoint timed out before sampling. This material-update pass therefore does not increment times_sampled or claim recurrence. Direct current GitHub repository, pull-request and corpus evidence was used for the longitudinal update."
note: "This remains a solo-builder card, not an ai-epistemic-world: the public artifacts are a concrete safety software/product and validation program, not a reconstructible AI-mediated belief, cosmology, identity, agency or meaning system. Comparison against the full relevant corpus still leaves shakfu/sanduk as the nearest security-boundary analogue, but sanduk itself needs independent security review and does not supply a concrete resource that resolves Praeventio's remaining internal gates. forwaryan's evidence/replay discipline overlaps with practices Praeventio is already applying through emulator tests and fail-closed gates, while Madaka17 and DarkPhilosopher remain downstream field-validation analogues and smirre111 remains a measurement-at-the-hardware-boundary analogue. The strongest current bridge remains weak because the immediate blockers are still explicit owner-side implementation/release work, so no public contact is justified and the account-level initial touch remains unused."
updated: 2026-09-23
---

## Longitudinal update — 2026-09-22

- `previous_missing_resource`: `reviewer` (`field-validation` interpretation).
- `current_missing_resource`: `none-apparent`.
- `reason`: the current README and subsequent P0 work place several known internal shippability/security/deployment gates earlier than the preserved physical-device validation gate.
- `later_gate`: independent real-device field review remains valid after those internal blockers close; this update changes sequencing, not the value of that validation method.
- `match_quality_for_current_blocker`: `weak` across the corpus because no external introduction resolves the immediate enumerated work.
- `contact_gate`: no contact justified for the current blocker.

## Material progress — 2026-09-22 late pass

- `resource_state`: `none-apparent` remains correct; the owner is actively closing the current internal gates rather than waiting on an external resource.
- `closed_or_narrowed`: firebase-admin v14 migration; real Firestore-emulator coverage for health-vault; SOS idempotency 0/7 → 7/7; critical npm-audit gate false-green reproduced and patched in #1747; polynomial email-validation path replaced and adversarially tested in #1746.
- `remaining_internal_debt`: roughly fifty sibling firebase-admin mock failures, 22 high dependency vulnerabilities, plus the earlier mobile/release/configuration gates.
- `reception_refresh`: 1 star, 0 forks, 1 watcher, 0 subscribers, 0 external issues and 0 external PRs in the accumulated primary-repository snapshot.
- `match_quality`: `weak`; current corpus methods are informative analogues but do not add a non-obvious external unblocker beyond work already explicit in the repository.
- `contact_channel`: `none`; initial touch remains unused.

## Material progress — 2026-09-23

- `merged_security_work`: #1746, #1747 and #1748 are merged.
- `dependency_result`: npm audit high findings 22 → 10, with #1748 documenting all remaining highs as DEV-only and production high vulnerabilities at 0; critical remains 0.
- `remaining_internal_debt`: real TLS pinning, Android 14 critical-push wakeup, broad cross-tenant authorization audit, branch-protection hardening, mobile-release credentials and a failing deploy configuration remain explicit in README, alongside lower-severity dependency work.
- `resource_state`: `none-apparent`; the current bottleneck is still enumerated internal work, not an absent external reviewer/user/tool/peer/knowledge source.
- `corpus_comparison`: sanduk is the closest security-boundary analogue but is itself reviewer-constrained; forwaryan contributes evidence discipline already substantially mirrored here; Madaka17 and DarkPhilosopher remain later-stage field-validation analogues.
- `match_quality`: `weak`.
- `contact_channel`: `none`; account-level initial touch remains unused.

## Material progress — 2026-09-23 dependency closure

- `merged_security_work`: #1749 merged at 2026-09-23T19:55:16Z after pinning fifteen semver-safe dependency overrides and the remaining Puppeteer transitive chain.
- `dependency_result`: the PR reports `npm audit` moving from 10 high / 15 moderate / 2 low before the final dependency pass to 0 high / 0 critical / 2 moderate after the pinned tree; the repository still reports 1 star, 0 forks and 1 watcher in the current API snapshot.
- `remaining_internal_debt`: the current README still names real TLS pinning, Android 14 full-screen critical push, the route-by-route cross-tenant authorization audit, branch-protection hardening, mobile-release credentials and the failing deploy path as release blockers.
- `resource_state`: `none-apparent`; dependency cleanup materially narrows the internal queue but does not yet move the bottleneck to an absent external resource.
- `corpus_comparison`: the existing field-validation convergence remains correctly downstream for Praeventio; sanduk, forwaryan, Madaka17, DarkPhilosopher and smirre111 supply useful methods or analogues, but none closes the present owner-side release work.
- `match_quality`: `weak`.
- `contact_channel`: `none`; the account-level initial touch remains unused.
