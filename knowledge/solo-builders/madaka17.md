---
type: solo-builder
name: "Bangkok CCTV + AI traffic/helmet platform"
public_handle: "Madaka17"
building: "A self-hosted Bangkok metropolitan sensing and operations dashboard that combines public CCTV feeds, YOLO vehicle counting, traffic maps, incident and environmental data, route-dispersal guidance, and an AI-assisted motorcycle-helmet review pipeline, with substantial implementation coauthored with Claude."
domain: [civic-tech, computer-vision, traffic, cctv, urban-sensing, ai-agents, evidence-review]
reception:
  measured_at: "2026-09-22"
  scope: "primary repository accumulated public GitHub state"
  stars: 0
  forks: 0
  watchers: 0
  external_issues: 0
  external_pull_requests: 0
  distinct_external_contributors: "not_measured"
  discussions: 0
  window: "Repository created 2026-09-12; accumulated API snapshot through 2026-09-22. Repository metadata reports zero stars/forks/watchers and discussions disabled; issue and pull-request searches excluding the owner found no public external issues or PRs. Contributor identity was not measured, and account-wide isolation is not claimed."
blocking_constraint: "The project has moved beyond basic feature coverage into operational judgments over real CCTV: the helmet patrol explicitly preserves confidence plus frame/crop evidence 'for a person to check', while the latest detector fine-tune improves mAP50 on a synthetic CCTV-degraded validation set from 53% to 72% but reduces clean validation from 76.5% to 73.7%. The repo therefore has a concrete validation bottleneck: the new field-oriented model and agent verdicts need independent human review on a fixed sample of real BMA-camera evidence before the system can know whether the domain-shift tradeoff is actually better in deployment."
missing_resource: reviewer
confidence: high
source_label: "Madaka17/new_ccty_bangkok"
source_url: "https://github.com/Madaka17/new_ccty_bangkok"
source_urls:
  - "https://github.com/Madaka17/new_ccty_bangkok/blob/main/README.md"
  - "https://github.com/Madaka17/new_ccty_bangkok/blob/main/helmet_service.py"
  - "https://github.com/Madaka17/new_ccty_bangkok/commit/d919535f71fc06b890251b5c7ceb90c32c3918b1"
maturity: working
unlock: "Freeze a stratified sample of archived real-camera crops across cameras, daylight/night and image quality, have an independent reviewer label helmet/no-helmet/unclear without seeing model identity, then compare the clean detector, degraded detector and cloud-agent path on precision, recall, calibration and abstention. The existing preserved crop/frame evidence already makes this relatively cheap."
synergy_candidates: [forwaryan, mikesandoval10creator, smirre111]
trajectory:
  - "2026-09-12: the public repository begins as a Bangkok/metropolitan CCTV and vehicle-detection dashboard."
  - "By 2026-09-22: the system spans BMA camera scanning, traffic and incident data, PM2.5/water/wind context, corridor guidance, a public Tailscale-facing dashboard, watchdog/backup paths and helmet-compliance evidence capture."
  - "2026-09-22: a Claude-coauthored stage-2 helmet-detector pass creates CCTV-like degraded training/validation inputs; degraded-set mAP50 rises from 53% to 72% while clean-set mAP50 moves from 76.5% to 73.7%, making real-camera external review the next discriminating evidence rather than another obvious feature."
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
  note: "The current merged solo-builder skill and queue runner were read first. A canonical GH-Archive refresh for 2026-09-21 was attempted through the connected compute fabric, but the compute path timed out before sampling; no admission-band values or recurrence were inferred. Direct public GitHub evidence was used for this harvest pass, and recurrence remains unestablished."
note: "This is a solo-builder card, not an ai-epistemic-world: the public artifacts are a concrete civic-sensing and computer-vision engineering system, with no reconstructible AI-mediated belief/cosmology/identity/meaning framework. Current direct repository inspection still supports the same field-validation blocker and accumulated reception snapshot. Full relevant-corpus comparison now yields an actionable method transfer rather than merely a thematic match: forwaryan contributes claim/evidence/replay and blinded-comparison discipline; Guardian-Praeventio contributes frozen evidence and explicit release-gate closure; smirre111 contributes measured-versus-assumed provenance and per-gate close conditions. Together they define a small frozen real-camera holdout that can test whether the synthetic degradation gain transfers to deployment evidence. No prior canonical Madaka17 intervention exists, and the target repository currently has no open issue or PR that frames this validation question, so a new issue is the smallest useful initial-contact surface."
updated: 2026-09-22
---

## Harvest state — 2026-09-22

- `missing_resource_subtype`: `field-validation`
- `resource_found`: `forwaryan / Rumor Checking` evidence/replay and blinded-comparison discipline + `mikesandoval10creator / Guardian-Praeventio` frozen-evidence release-gate discipline + `smirre111 / ESPHome LoRa blinds protocol` measured-versus-assumed provenance and explicit gate-close conditions.
- `match_quality`: `actionable` — a named, immediately testable transfer exists: freeze real BMA-camera crops stratified by camera/day-night/image quality, preserve exact data/model provenance, obtain blinded helmet/no-helmet/unclear labels, and compare the clean detector, degraded detector and cloud-agent path on the same fixed evidence while retaining negative and abstention cases.
- `contact_gate`: initial touch is eligible. No prior canonical Madaka17 intervention was found; because the target repository has no open issue or PR for this question, a new issue is the smallest useful surface.
