---
type: solo-builder
name: "Bangkok CCTV + AI traffic/helmet platform"
public_handle: "Madaka17"
building: "A self-hosted Bangkok metropolitan sensing and operations dashboard that combines public CCTV feeds, YOLO vehicle counting, traffic maps, incident and environmental data, route-dispersal guidance, and an AI-assisted motorcycle-helmet review pipeline, with substantial implementation coauthored with Claude."
domain: [civic-tech, computer-vision, traffic, cctv, urban-sensing, ai-agents, evidence-review]
reception:
  measured_at: "2026-09-23"
  scope: "primary repository accumulated public GitHub state"
  stars: 0
  forks: 0
  watchers: 0
  subscribers: 0
  external_issues: 0
  external_pull_requests: 0
  distinct_external_contributors: "not_measured"
  discussions: 0
  window: "Repository created 2026-09-12; accumulated API snapshot through 2026-09-23. Repository metadata reports zero stars, forks, watchers and subscribers; fresh issue and pull-request searches found no public issues or PRs, and discussions are disabled. Contributor identity was not measured, and account-wide isolation is not claimed. Two observatory issue-write attempts returned 403 before publication and therefore do not count as external reception."
blocking_constraint: "The field-validation bottleneck is now more specific than the synthetic-versus-clean detector tradeoff alone. The degraded detector improves degraded-validation mAP50 from 53% to 72% while clean validation moves from 76.5% to 73.7%, but a later run over 200 recent real crops reports that 148/200 contain no visible head and only about 5% receive a confident local verdict. The next discriminating evidence must therefore separate upstream capture/crop visibility from conditional helmet-classification accuracy on a fixed real BMA-camera holdout, rather than treating every unclear result as a classifier failure."
missing_resource: reviewer
confidence: high
source_label: "Madaka17/new_ccty_bangkok"
source_url: "https://github.com/Madaka17/new_ccty_bangkok"
source_urls:
  - "https://github.com/Madaka17/new_ccty_bangkok/blob/main/README.md"
  - "https://github.com/Madaka17/new_ccty_bangkok/blob/main/helmet_service.py"
  - "https://github.com/Madaka17/new_ccty_bangkok/commit/d919535f71fc06b890251b5c7ceb90c32c3918b1"
  - "https://github.com/Madaka17/new_ccty_bangkok/commit/22c804063d9dfbf2627abef9fb0e38cabf559a39"
maturity: working
unlock: "Freeze a stratified sample of archived real-camera evidence across cameras, daylight/night and image quality. Have an independent reviewer label head-visible yes/no/unclear first, then helmet/no-helmet/unclear only where a head is usable. Run the clean detector, degraded detector and cloud-agent path on exactly that frozen set, reporting capture coverage separately from conditional helmet precision/recall, calibration and abstention."
synergy_candidates: [forwaryan, mikesandoval10creator, smirre111]
trajectory:
  - "2026-09-12: the public repository begins as a Bangkok/metropolitan CCTV and vehicle-detection dashboard."
  - "By 2026-09-22: the system spans BMA camera scanning, traffic and incident data, PM2.5/water/wind context, corridor guidance, a public Tailscale-facing dashboard, watchdog/backup paths and helmet-compliance evidence capture."
  - "2026-09-22: a Claude-coauthored stage-2 helmet-detector pass creates CCTV-like degraded training/validation inputs; degraded-set mAP50 rises from 53% to 72% while clean-set mAP50 moves from 76.5% to 73.7%, making real-camera external review the next discriminating evidence rather than another obvious feature."
  - "2026-09-23: a public Claude-coauthored real-crop check measures 200 recent captures and reports that 148 contain no visible head while only about 5% produce a confident local verdict, splitting the field blocker into capture/crop visibility and conditional helmet classification."
ai_role: [implementation-collaborator, code-coauthor, vision-provider-fallback]
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
  note: "The current merged solo-builder skill and queue runner were read first. A canonical GH-Archive refresh for 2026-09-22 was attempted on 2026-09-23 through the connected compute fabric, but the Jatoba MCP endpoint timed out before sampling; no admission-band values or recurrence were inferred. Direct public GitHub evidence was used for this harvest pass, and recurrence remains unestablished."
note: "This remains a solo-builder card, not an ai-epistemic-world: the public artifacts are a concrete civic-sensing and computer-vision engineering system, with no reconstructible AI-mediated belief/cosmology/identity/meaning framework. Full relevant-corpus comparison still yields an actionable method transfer: forwaryan contributes claim/evidence/replay and blinded-comparison discipline; Guardian-Praeventio contributes frozen evidence and explicit release-gate closure; smirre111 contributes measured-versus-assumed provenance and per-gate close conditions. The new real-crop measurement makes the transfer more precise by requiring the frozen holdout to report upstream head visibility separately from downstream helmet classification. No public observatory intervention has been created: GitHub write attempts on 2026-09-22 and 2026-09-23 both failed with 403 before publication, and the Jatoba gh fallback timed out before command execution."
updated: 2026-09-23
---

## Harvest state — 2026-09-23

- `missing_resource_subtype`: `field-validation`
- `resource_found`: `forwaryan / Rumor Checking` evidence/replay and blinded-comparison discipline + `mikesandoval10creator / Guardian-Praeventio` frozen-evidence release-gate discipline + `smirre111 / ESPHome LoRa blinds protocol` measured-versus-assumed provenance and explicit gate-close conditions.
- `match_quality`: `actionable` — the concrete transfer is now a two-stage frozen real-camera holdout: first measure whether the archived candidate crop contains a usable head, then compare clean detector, degraded detector and cloud-agent helmet decisions only on the same visibility-labeled evidence while retaining all negative/unclear cases.
- `contact_channel`: `new issue`, because no existing issue or PR frames the validation question.
- `contact_gate`: initial touch remains eligible. The 2026-09-23 connector write again returned 403 before creating an issue, and the Jatoba/gh fallback timed out before execution; neither failure is a public touch or engagement.
- `uptake`: none; there is still no public intervention artifact to acknowledge or adopt.
