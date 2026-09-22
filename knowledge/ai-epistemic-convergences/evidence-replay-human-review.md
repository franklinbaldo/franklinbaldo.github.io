---
type: ai-epistemic-convergence
name: "Evidence replay as the unit of independent review"
hypothesis_key: evidence-replay-human-review
summary: "Two AI-assisted public-facing systems independently preserve evidence around machine judgments but expose complementary validation machinery: Rumor Checking keeps claim/evidence/replay structure for factual verdicts, while the Bangkok CCTV platform archives the frame/crop/confidence behind helmet verdicts and stress-tests image-domain degradation. The useful bridge is to make those evidence bundles the unit of blinded external review rather than evaluating only aggregate internal metrics."
case_slugs: [forwaryan, madaka17]
overlap_dimensions: [method, provenance, evaluation, replay, human-review]
independence_status: not-established
evidence_quality: medium
testable_predictions:
  - "On a frozen sample of real Bangkok CCTV crops, blinded reviewer labels should reveal whether the degraded detector's 53%→72% synthetic-degraded mAP gain transfers to real camera evidence despite its 76.5%→73.7% clean-set tradeoff."
  - "For Rumor Checking, applying analogous controlled input degradation or ambiguity perturbations while preserving the evidence bundle should reveal whether deep-path/critic gains survive distribution shift rather than only the existing replay set."
cross_pollination_candidates:
  - "forwaryan -> madaka17: reuse explicit evidence/replay separation and frozen comparative evaluation to build an auditable reviewer loop over archived helmet crops."
  - "madaka17 -> forwaryan: reuse systematic input-degradation stress tests to probe whether evidence retrieval and verdict calibration remain stable under noisier or incomplete source material."
source_urls:
  - "https://github.com/forwaryan/rumor-checking"
  - "https://github.com/Madaka17/new_ccty_bangkok/blob/main/helmet_service.py"
  - "https://github.com/Madaka17/new_ccty_bangkok/commit/d919535f71fc06b890251b5c7ceb90c32c3918b1"
updated: 2026-09-22
---

The bridge is methodological, not evidence that either project's substantive outputs are correct. No observatory contact between these maintainers has occurred, so any later uptake after a future bridge must be marked as diffusion rather than independent convergence.
