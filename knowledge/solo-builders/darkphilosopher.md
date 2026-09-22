---
type: solo-builder
name: "Spark"
public_handle: "DarkPhilosopher"
building: "A phone-first, local-first no-code game creation engine for Termux and the browser: games are assembled from reusable WHEN/DO tiles, run in mirrored Python and JavaScript/WebGL engines, and can be edited, played, shared and hosted from the same project files, with sustained implementation work carried out with Claude."
domain: [game-development, no-code, termux, browser-games, webgl, local-first, ai-assisted-development]
reception:
  measured_at: "2026-09-22"
  scope: "primary repository accumulated public GitHub state"
  stars: 0
  forks: 0
  watchers: 0
  subscribers: 0
  external_issues: 0
  external_pull_requests: "not_measured"
  distinct_external_contributors: "not_measured"
  discussions: 0
  window: "Repository created 2026-08-09; accumulated repository API snapshot through 2026-09-22. Repository metadata reports zero stars, forks, watchers, subscribers and open issues; a public issue search excluding the owner found no external issues. Discussions are disabled. External pull requests could not be measured exhaustively because GitHub secondary rate limiting interrupted that query, so they remain not_measured. Account-wide isolation is not claimed."
blocking_constraint: "Spark already has unusually strong internal correctness checks for a solo interactive project: cross-engine parity traces, PTY-driven terminal tests, syntax/documentation checks and task notes that explicitly record and discard disproven implementation theories. The same task history repeatedly marks substantial UI/gameplay changes as not yet seen on a real device or screen; when an on-device screenshot was eventually used on one layout change, it exposed two concrete layout bugs. The visible next constraint is therefore independent real-device/visual interaction review across the phone-first creation/play surfaces rather than another obvious missing engine primitive."
missing_resource: reviewer
confidence: high
source_label: "DarkPhilosopher/spark"
source_url: "https://github.com/DarkPhilosopher/spark"
source_urls:
  - "https://github.com/DarkPhilosopher/PROJECTS-INDEX"
  - "https://github.com/DarkPhilosopher/spark/blob/main/README.md"
  - "https://github.com/DarkPhilosopher/spark/blob/main/CLAUDE.md"
  - "https://github.com/DarkPhilosopher/spark/commit/1910af44e71f096528eabde5f07af1daaf80d2a8"
maturity: working
unlock: "Freeze a short on-device review script covering portrait/landscape, first-time tutorial, create-edit-play, 3D world interaction and one sharing/hosting path; have someone other than the author run it on at least two real Android devices while preserving screenshots/video and expected-versus-observed notes. That would complement the existing parity/regression suite with the visual/device evidence the task log repeatedly identifies as missing."
synergy_candidates: [gigglesquid19, adriaanm, mikesandoval10creator]
trajectory:
  - "2026-08-09: public Spark repository created as a Termux/browser game-creation engine organized around composable WHEN/DO tiles."
  - "2026-09-02 to 2026-09-03: major 3D-editor and modal-layout work is verified by parser/unit tests but explicitly recorded as not yet seen on a real screen; a later on-device screenshot catches two concrete responsive-layout bugs and drives fixes."
  - "2026-09-09 to 2026-09-11: the Outpost RTS/gameplay thread adds reusable tiles, commands and extensive Python/JS parity and PTY tests while repeatedly noting that the changes have not been observed on an actual device."
  - "2026-09-18 to 2026-09-20: Claude Sonnet 5 is explicitly credited as co-author on terrain, ray-cast, spatial targeting and browser-launch work; the latest examined commit again records an end-to-end Termux integration path as unverified because the sandbox cannot exercise the real device boundary."
ai_role: [implementation-collaborator, code-coauthor, test-and-debug-collaborator]
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
  note: "The canonical GH-Archive queue refresh could not complete in this execution environment: the network path to the archive/compute endpoint timed out. Direct public GitHub discovery was used as the skill's manual fallback. Admission-band values that could not be reconstructed are preserved as not_measured, and recurrence is not inferred from one pass."
note: "This is a solo-builder card, not an ai-epistemic-world: the public artifacts describe a concrete game-engine/tooling project and an unusually explicit engineering provenance log, not a reconstructible AI-mediated belief, cosmology, identity, agency or meaning system. SharksVsDolphins remains useful historical tester-telemetry evidence but is no longer a live introduction target after its repository became unavailable. The strongest live resource match is now Guardian-Praeventio: its frozen field-scenario discipline, preregistered pass/fail criteria, expected-versus-observed logs and retained negative results transfer directly to Spark's explicitly unmeasured Termux/browser/device boundary. Wata remains a plausible secondary method analogue. An initial issue carrying the Guardian-Praeventio protocol was attempted after confirming no canonical prior DarkPhilosopher intervention, but GitHub returned 403 Resource not accessible by integration; no public touch occurred and the account-level initial-touch gate remains unused."
updated: 2026-09-22
---

## Harvest state — 2026-09-22

- `missing_resource_subtype`: `field-validation`
- `resource_found`: `mikesandoval10creator / Guardian-Praeventio` — a concrete frozen real-device scenario protocol with preregistered pass/fail, device/environment capture, expected-versus-observed logs and retained negative results.
- `match_quality`: `actionable` — the source project is named, the transfer is concrete, and the immediate Spark test is five frozen scenarios on two real Android devices, including the `spark browser` Termux boundary that commit `1910af44e71f096528eabde5f07af1daaf80d2a8` explicitly leaves unverified end to end.
- `contact_gate`: initial touch remains eligible. A posting attempt in this harvest pass failed with GitHub `403 Resource not accessible by integration`, so there is no intervention, no contamination, and no uptake to measure yet.
