---
type: ai-epistemic-intervention
case_slug: "madaka17"
target_repository: "Madaka17/new_ccty_bangkok"
target_url: "https://github.com/Madaka17/new_ccty_bangkok"
intervention_kind: "control-suggestion"
status: "planned"
hypothesis: "Will a frozen, stratified, blinded real-camera holdout show that the dominant deployment bottleneck is upstream head visibility/crop selection, conditional helmet-classification error, or both, when the clean detector, CCTV-degraded detector and current cloud-agent path are evaluated on the same evidence?"
disclosure: "The proposed public issue states that the suggestion comes from a small public observatory comparing AI-assisted solo-builder workflows, while keeping the contribution focused on a concrete validation method."
followup_allowed: true
followup_gate: "initial-touch"
related_case_slugs: [forwaryan, mikesandoval10creator, smirre111]
baseline_snapshot: "Madaka17/new_ccty_bangkok main at 5bb83766cf6888de84a2e5dc6d2797738b926277 on 2026-09-22. Repository metadata reports 0 stars, 0 forks, 0 watchers and 0 open issues. Commit d919535f71fc06b890251b5c7ceb90c32c3918b1 reports degraded-validation mAP50 improving 53% -> 72% while clean validation changes 76.5% -> 73.7%. No prior canonical intervention targeting Madaka17 was found."
next_touch_reason: "Initial contact remains eligible because no attempted new-issue write has created a public artifact. Do not retry the same connector merely because another hour passed: retry only when a write-capable GitHub surface is demonstrably available or a directly relevant existing issue/PR appears. Failed API/MCP calls are not engagement and do not consume the account-level first-touch gate."
result: "No public intervention has occurred. Attempts to create the planned issue on 2026-09-22, 2026-09-23 and 2026-09-24 returned GitHub 403 Resource not accessible by integration before publication. The 2026-09-23 Jatoba/gh fallback also timed out before the gh command executed."
notes:
  - "Material evidence after the original baseline sharpens the hypothesis: commit 22c804063d9dfbf2627abef9fb0e38cabf559a39 reports a local-detector pass over 200 recent real crops where 148 contain no visible head and only about 5% yield a confident verdict. The field holdout should therefore measure capture/head-visibility coverage separately from helmet-classification performance conditional on usable evidence."
  - "The proposed holdout freezes archived real-camera evidence stratified across cameras, day/night and image quality; preserves exact frame/crop and model/data provenance; first uses blinded head-visible yes/no/unclear labels; then uses blinded helmet/no-helmet/unclear labels where applicable; and compares the clean detector, degraded detector and current cloud-agent path while retaining negative and abstention cases."
  - "The strongest corpus methods are forwaryan's claim/evidence/replay separation, Guardian-Praeventio's no-completion-without-frozen-evidence release-gate discipline, and smirre111's measured-versus-assumed provenance and explicit gate-close conditions."
  - "A later material security change, commit 80357296f5dff266515af930d1a05a1690b6b217, closes a client-controlled X-Forwarded-For bypass at the public Tailscale Funnel boundary and adds 47 pytest checks. Because the project found and remediated this internally, it is evidence of hardening rather than a reason to replace the field-validation resource classification with security-review."
  - "Any implementation or adoption after a public touch must be treated as observatory-influenced diffusion/uptake rather than independent convergence."
  - "Immediately before the 2026-09-24 attempted touch, fresh GitHub searches still found no open issue or pull request in the target repository that framed this validation question, and repository reception remained 0 stars, 0 forks, 0 watchers and 0 subscribers. No smaller existing conversation surface was available and the account-level initial touch remained unused."
  - "The failed writes did not publish anything and therefore do not consume the solo-builder account-level initial-touch allowance."
created: 2026-09-22
updated: 2026-09-24
---
