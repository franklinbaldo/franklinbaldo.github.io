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
blocking_constraint: "The immediate release boundary remains internal P0 implementation, CI and security debt, but it narrowed materially late on 2026-09-22. PR #1744 completed the firebase-admin v13→v14 migration, added a real Firestore-emulator integration test, exposed and fixed an invalid `topic: undefined` write, and restored the safety-critical SOS idempotency suite from 0/7 to 7/7. Two new owner-authored P0 PRs then attack adjacent concrete gates: #1746 replaces a polynomial email regex with a bounded linear validator plus hostile-input tests, and #1747 replaces a false-green npm-audit grep with fail-closed JSON parsing while moving the only critical tar CVE out of the vulnerable range. The repository still explicitly carries roughly fifty sibling firebase-admin mock failures, 22 high dependency vulnerabilities and the earlier mobile/release/configuration gates. Physical Android/iOS validation therefore remains downstream, and the current next constraint still does not justify inferring an absent external reviewer, user, peer, knowledge source or tool."
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
maturity: working
unlock: "Finish the explicitly enumerated P0 release/security work and produce a clean deploy/mobile release candidate: close the remaining firebase-admin mock breakage, resolve or consciously gate the remaining high-severity dependency debt, and satisfy the already-recorded mobile/security/configuration release conditions. Only then promote the real-device scenarios back to the immediate boundary and seek independent field review with frozen expected-versus-observed evidence. Reassess missing_resource at that transition rather than treating a later reviewer need as today's blocker."
synergy_candidates: [madaka17, forwaryan, darkphilosopher, shakfu]
trajectory:
  - "2026-03-20: Guardian-Praeventio repository created from the Google AI Studio application template and expanded into a broad occupational-safety platform."
  - "2026-05-19: the repository records an independent verification pass that re-runs tests, inspects safety-critical implementation, corrects earlier claims and preserves newly discovered blockers instead of treating the previous state as complete."
  - "2026-06-19 to 2026-07-13: deeper audits sharply revise real E2E coverage downward, while native proximity bridges are implemented; physical Android/iOS validation remains an explicit release gate."
  - "2026-09-21: safety-related fixes and integration work continue on main and in PRs; the examined commit is co-authored by the local Hermes agent, showing the AI-assisted production loop remains active."
  - "2026-09-22: a code-verified README rewrite explicitly blocks Android 1.0 on unresolved TLS pinning, critical-push, cross-tenant authorization, branch/workflow, credential and deploy gates, making those internal blockers prior to the still-valid downstream physical-validation gate."
  - "2026-09-22 late pass: PR #1744 lands firebase-admin v14, a real emulator integration test and 7/7 SOS idempotency; open P0 PRs #1746 and #1747 then target a reproducible ReDoS path and a false-green critical-CVE gate, showing measurable closure of internal debt without yet moving the bottleneck to external field validation."
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
  note: "The canonical GH-Archive queue runner was attempted first in the current run, but the connected compute fabric failed before sampling could start. This material-update pass therefore does not increment times_sampled or claim recurrence. Direct current GitHub repository, pull-request and accumulated reception evidence was used for the longitudinal update."
note: "This remains a solo-builder card, not an ai-epistemic-world: the public artifacts are a concrete safety software/product and validation program, not a reconstructible AI-mediated belief, cosmology, identity, agency or meaning system. Comparison against the full relevant corpus still leaves shakfu/sanduk as the nearest security-boundary analogue, but sanduk itself lacks independent security review and does not supply a concrete resource that Praeventio currently needs. forwaryan's evidence/replay discipline now overlaps with practices Praeventio is already using through real-emulator tests and fail-closed gates, while Madaka17, smirre111 and DarkPhilosopher remain useful downstream physical-validation analogues rather than current unblockers. The strongest current bridge is therefore weak, no external resource transfer is justified, and no public contact was made."
updated: 2026-09-22
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
